let ctx
let master
let muted = false
const listeners = new Set()
const sources = new Set()

function reportFailure(reason) {
  console.warn('No se pudo reproducir el sonido del juego.', reason)
}

export function isSoundEmbedded() {
  try {
    return typeof window !== 'undefined' && window.self !== window.top
  } catch (reason) {
    reportFailure(reason)
    return true
  }
}

function trackSource(source, gain) {
  sources.add(source)
  source.onended = () => {
    try {
      sources.delete(source)
      source.disconnect()
      gain?.disconnect()
    } catch (reason) {
      reportFailure(reason)
    }
  }
}

function unlockSound() {
  if (isSoundEmbedded()) return
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'
  } catch (reason) {
    reportFailure(reason)
  }
  try {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const context = new AudioContext()
      const gain = context.createGain()
      gain.gain.value = muted ? 0 : 0.35
      gain.connect(context.destination)
      ctx = context
      master = gain
    }
    ctx.resume().catch(reportFailure)
    const silent = ctx.createBufferSource()
    silent.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    silent.connect(master)
    trackSource(silent)
    silent.start()
  } catch (reason) {
    reportFailure(reason)
  }
}

function tone(freq, startTime, duration, type, volume, slideToFreq) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(freq, startTime)
  if (slideToFreq) {
    oscillator.frequency.exponentialRampToValueAtTime(slideToFreq, startTime + duration)
  }
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(master)
  trackSource(oscillator, gain)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

export function playSound(name) {
  try {
    if (muted || isSoundEmbedded() || !ctx || ctx.state === 'closed') return
    const t = ctx.currentTime
    switch (name) {
      case 'pop':
        tone(520, t, 0.11, 'sine', 0.22, 900)
        tone(1040, t, 0.06, 'triangle', 0.06)
        break
      case 'tick':
        tone(700, t, 0.05, 'triangle', 0.07)
        break
      case 'bell':
        tone(1318, t, 1.1, 'sine', 0.22)
        tone(1976, t, 0.9, 'sine', 0.1)
        tone(2637, t + 0.01, 0.6, 'sine', 0.05)
        break
      case 'oops':
        tone(220, t, 0.28, 'sawtooth', 0.09, 130)
        tone(165, t + 0.12, 0.3, 'sawtooth', 0.08, 95)
        break
      case 'win':
        ;[523, 659, 784, 1046].forEach((freq, index) => {
          tone(freq, t + index * 0.11, 0.45, 'triangle', 0.16)
        })
        break
      case 'lose':
        tone(392, t, 0.3, 'triangle', 0.13, 330)
        tone(311, t + 0.22, 0.5, 'triangle', 0.13, 220)
        break
      case 'fanfare':
        ;[523, 659, 784, 1046, 1318].forEach((freq, index) => {
          tone(freq, t + index * 0.12, 0.5, 'triangle', 0.16)
          tone(freq, t + 1.1, 0.9, 'triangle', 0.16)
        })
        break
      default:
        console.warn('Sonido del juego desconocido:', name)
    }
  } catch (reason) {
    reportFailure(reason)
  }
}

export function isMuted() {
  return muted
}

export function setMuted(value) {
  try {
    muted = Boolean(value)
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(muted ? 0 : 0.35, ctx.currentTime)
    }
    if (muted) {
      for (const source of sources) {
        try {
          source.stop()
        } catch (reason) {
          reportFailure(reason)
        }
      }
    }
  } catch (reason) {
    reportFailure(reason)
  }
  for (const listener of listeners) {
    try {
      listener()
    } catch (reason) {
      reportFailure(reason)
    }
  }
}

export function subscribeMuted(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

if (typeof document !== 'undefined') {
  try {
    for (const gesture of ['pointerdown', 'touchend', 'click']) {
      document.addEventListener(gesture, unlockSound, { capture: true, passive: true })
    }
    // Capture before React can replace a confirmation button with its next action.
    document.addEventListener('click', (event) => {
      try {
        const button = event.target.closest?.('button')
        if (!button || button.disabled || button.closest('[data-sound]')) return
        playSound('tick')
      } catch (reason) {
        reportFailure(reason)
      }
    }, true)
  } catch (reason) {
    reportFailure(reason)
  }
}
