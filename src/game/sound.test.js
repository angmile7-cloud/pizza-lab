import assert from 'node:assert/strict'
import { test } from 'node:test'

let moduleId = 0

async function setup(t, { embedded = false, supported = true, webkit = false } = {}) {
  const gestures = new Map()
  const contexts = []
  const warnings = []
  const param = () => ({
    value: 0,
    events: [],
    setValueAtTime(...args) { this.events.push(['set', ...args]) },
    linearRampToValueAtTime(...args) { this.events.push(['linear', ...args]) },
    exponentialRampToValueAtTime(...args) { this.events.push(['exponential', ...args]) },
    cancelScheduledValues(...args) { this.events.push(['cancel', ...args]) },
  })
  const source = () => ({
    frequency: param(),
    connect() {},
    disconnect() { this.disconnected = true },
    start(at) { this.startedAt = at },
    stop(at) { this.stops.push(at) },
    stops: [],
  })
  class AudioContext {
    constructor() {
      this.currentTime = 2
      this.sampleRate = 48000
      this.state = 'running'
      this.oscillators = []
      this.gains = []
      this.buffers = []
      this.silentSources = []
      this.resumes = 0
      contexts.push(this)
    }
    resume() { this.resumes++; return Promise.resolve() }
    createGain() {
      const gain = { gain: param(), connect() {}, disconnect() {} }
      this.gains.push(gain)
      return gain
    }
    createOscillator() {
      const oscillator = source()
      this.oscillators.push(oscillator)
      return oscillator
    }
    createBuffer(...args) { this.buffers.push(args); return args }
    createBufferSource() {
      const silent = source()
      this.silentSources.push(silent)
      return silent
    }
  }
  const window = {}
  window.self = window
  window.top = embedded ? {} : window
  if (supported) window[webkit ? 'webkitAudioContext' : 'AudioContext'] = AudioContext
  for (const [name, value] of Object.entries({
    window,
    document: {
      addEventListener(name, callback, options) {
        const entries = gestures.get(name) ?? []
        entries.push({ callback, options })
        gestures.set(name, entries)
      },
    },
    navigator: { audioSession: {} },
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
    Object.defineProperty(globalThis, name, { configurable: true, value })
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else delete globalThis[name]
    })
  }
  const warn = console.warn
  console.warn = (...args) => warnings.push(args)
  t.after(() => { console.warn = warn })
  const sound = await import(`./sound.js?test=${moduleId++}`)
  const gesture = (name = 'pointerdown', button = null) => {
    for (const { callback } of gestures.get(name) ?? []) {
      callback({ target: { closest: () => button } })
    }
  }
  return { sound, contexts, gestures, gesture, warnings }
}

test('sound unlocks lazily once and resumes with one silent sample on every gesture', async (t) => {
  const { sound, contexts, gestures, gesture } = await setup(t, { webkit: true })
  assert.equal(sound.isMuted(), false)
  sound.playSound('bell')
  assert.equal(contexts.length, 0)
  for (const name of ['pointerdown', 'touchend', 'click']) gesture(name)
  assert.equal(contexts.length, 1)
  assert.equal(contexts[0].resumes, 3)
  assert.deepEqual(contexts[0].buffers, Array(3).fill([1, 1, 48000]))
  assert.equal(navigator.audioSession.type, 'playback')
  assert.equal(gestures.get('click').length, 2)
  assert.equal(gestures.get('pointerdown')[0].options.capture, true)
})

test('all synthesized effects have the exact notes, slides, timing and envelopes', async (t) => {
  const { sound, contexts, gesture } = await setup(t)
  gesture()
  const ctx = contexts[0]
  const expected = {
    pop: [[520, 0, 0.11, 'sine', 0.22, 900], [1040, 0, 0.06, 'triangle', 0.06]],
    tick: [[700, 0, 0.05, 'triangle', 0.07]],
    bell: [[1318, 0, 1.1, 'sine', 0.22], [1976, 0, 0.9, 'sine', 0.1], [2637, 0.01, 0.6, 'sine', 0.05]],
    oops: [[220, 0, 0.28, 'sawtooth', 0.09, 130], [165, 0.12, 0.3, 'sawtooth', 0.08, 95]],
    win: [523, 659, 784, 1046].map((freq, index) => [freq, index * 0.11, 0.45, 'triangle', 0.16]),
    lose: [[392, 0, 0.3, 'triangle', 0.13, 330], [311, 0.22, 0.5, 'triangle', 0.13, 220]],
    fanfare: [523, 659, 784, 1046, 1318].flatMap((freq, index) => [
      [freq, index * 0.12, 0.5, 'triangle', 0.16],
      [freq, 1.1, 0.9, 'triangle', 0.16],
    ]),
  }
  for (const [name, notes] of Object.entries(expected)) {
    ctx.oscillators = []
    ctx.gains = [ctx.gains[0]]
    sound.playSound(name)
    assert.equal(ctx.oscillators.length, notes.length, name)
    notes.forEach(([freq, offset, duration, type, volume, slide], index) => {
      const oscillator = ctx.oscillators[index]
      const start = ctx.currentTime + offset
      const end = start + duration
      assert.equal(oscillator.type, type)
      assert.equal(oscillator.startedAt, start)
      assert.deepEqual(oscillator.stops, [end])
      assert.deepEqual(oscillator.frequency.events, [
        ['set', freq, start],
        ...(slide ? [['exponential', slide, end]] : []),
      ])
      assert.deepEqual(ctx.gains[index + 1].gain.events, [
        ['set', 0.0001, start],
        ['linear', volume, start + 0.01],
        ['exponential', 0.0001, end],
      ])
    })
  }
})

test('mute silences the master, stops scheduled notes and notifies subscribers', async (t) => {
  const { sound, contexts, gesture } = await setup(t)
  let notifications = 0
  const unsubscribe = sound.subscribeMuted(() => notifications++)
  gesture()
  sound.playSound('win')
  const ctx = contexts[0]
  sound.setMuted(true)
  assert.equal(sound.isMuted(), true)
  assert.equal(ctx.gains[0].gain.events.at(-1)[1], 0)
  assert.ok(ctx.oscillators.every((node) => node.stops.at(-1) === undefined))
  sound.playSound('fanfare')
  assert.equal(ctx.oscillators.length, 4)
  sound.setMuted(false)
  assert.equal(notifications, 2)
  assert.equal(ctx.gains[0].gain.events.at(-1)[1], 0.35)
  sound.playSound('tick')
  assert.equal(ctx.oscillators.length, 5)
  ctx.oscillators[0].onended()
  assert.equal(ctx.oscillators[0].disconnected, true)
  unsubscribe()
  sound.setMuted(true)
  assert.equal(notifications, 2)
})

test('delegated clicks tick once, excluding specific-sound and disabled buttons', async (t) => {
  const { contexts, gesture } = await setup(t)
  const button = { disabled: false, closest: () => null }
  gesture('click', button)
  assert.equal(contexts[0].oscillators.length, 1)
  gesture('click', { disabled: false, closest: () => ({}) })
  gesture('click', { disabled: true, closest: () => null })
  gesture('click')
  assert.equal(contexts[0].oscillators.length, 1)
})

test('muting a fanfare stops its rising notes and scheduled final chord', async (t) => {
  const { sound, contexts, gesture } = await setup(t)
  gesture()
  sound.playSound('fanfare')
  const ctx = contexts[0]
  assert.equal(ctx.oscillators.length, 10)
  sound.setMuted(true)
  assert.ok(ctx.oscillators.every((node) => node.stops.at(-1) === undefined))
  sound.playSound('fanfare')
  assert.equal(ctx.oscillators.length, 10)
})

test('embedded games never create a context or play an effect', async (t) => {
  const { sound, contexts, gesture } = await setup(t, { embedded: true })
  assert.equal(sound.isSoundEmbedded(), true)
  gesture()
  gesture('click', { closest: () => null })
  sound.playSound('win')
  assert.equal(contexts.length, 0)
})

test('unsupported audio and playback-session errors cannot break play', async (t) => {
  const { sound, contexts, gesture, warnings } = await setup(t, { supported: false })
  assert.doesNotThrow(() => gesture())
  assert.doesNotThrow(() => sound.playSound('bell'))
  assert.equal(contexts.length, 0)
  window.AudioContext = class {
    constructor() { throw new Error('Audio unavailable') }
  }
  Object.defineProperty(navigator.audioSession, 'type', {
    set() { throw new Error('Playback session unavailable') },
  })
  assert.doesNotThrow(() => gesture())
  assert.equal(warnings.length, 2)
})

test('playback and async resume errors are reported without escaping', async (t) => {
  const { sound, contexts, gesture, warnings } = await setup(t)
  gesture()
  contexts[0].resume = () => Promise.reject(new Error('Resume blocked'))
  gesture()
  await Promise.resolve()
  contexts[0].createOscillator = () => { throw new Error('Playback blocked') }
  assert.doesNotThrow(() => sound.playSound('pop'))
  assert.equal(warnings.length, 2)
})
