import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import LevelScene from '../components/LevelScene'
import PizzaBuilderControls from '../components/PizzaBuilderControls'
import PizzaPreview from '../components/PizzaPreview'
import orderPaper from '../assets/papel_pedido.png'
import { useGame } from '../game/useGame'
import {
  createEmptySelection,
  evaluateOrder,
  LEVELS,
  getLevel,
} from '../game/gameUtils'
import {
  getOrderTopicsForStage,
  getTierForStage,
  ORDER_TIME_BONUS_MAX,
  ORDERS,
} from '../game/ordersModeUtils'

const EMPTY_SLOTS = []
const ANIM_MS = {
  exit: 400,
  crumple: 520,
  shake: 350,
  float: 800,
  score: 600,
}
const PIZZA_MS = {
  enter: 220,
  exit: 150,
  center: 300,
  baked: 800,
  verdict: 1300,
  hint: 1000,
  total: 2200,
  reduced: 1500,
  skipped: 350,
}
const DELICATE_LEAVES = ['albahaca', 'rucula']

function getPizzaMarks(order, result, selection) {
  const ghosts = new Set()
  const extras = new Set()
  const badLayers = new Set()
  if (!result || result.satisfied || result.expired) return { ghosts: [], extras: [], badLayers: [] }
  const selected = selection.toppings ?? []
  for (const evaluated of result.evaluation.requirements) {
    if (evaluated.met) continue
    if (evaluated.requirementId === 'exact-toppings') {
      const allowed = order.requirements.flatMap((requirement) =>
        requirement.slot === 'toppings'
          ? requirement.type === 'mustInclude' ? requirement.choiceIds : requirement.type === 'toppingPick' ? requirement.ids : []
          : [],
      )
      selected.filter((id) => ![...allowed, ...(order.allowedExtras ?? [])].includes(id)).forEach((id) => extras.add(id))
      continue
    }
    const requirement = order.requirements.find((item) => item.id === evaluated.requirementId)
    if (!requirement) continue
    if (['masa', 'salsa', 'queso'].includes(requirement.slot)) {
      badLayers.add(requirement.slot)
    } else if (requirement.slot === 'toppings') {
      if (requirement.type === 'mustInclude') {
        requirement.choiceIds.filter((id) => !selected.includes(id)).forEach((id) => ghosts.add(id))
      } else if (requirement.type === 'toppingPick') {
        const count = selected.filter((id) => requirement.ids.includes(id)).length
        if (count < requirement.min) requirement.ids.filter((id) => !selected.includes(id)).forEach((id) => ghosts.add(id))
        if (count > requirement.max) selected.filter((id) => requirement.ids.includes(id)).forEach((id) => extras.add(id))
      } else if (requirement.type === 'mustNotInclude') {
        selected.filter((id) => requirement.choiceIds.includes(id)).forEach((id) => extras.add(id))
      }
    }
  }
  return { ghosts: [...ghosts], extras: [...extras], badLayers: [...badLayers] }
}

function AnimatedOrderPizza({ selection, reduced, scheduleTimeout, stageActive, ...props }) {
  const containerRef = useRef(null)
  const previousRef = useRef(new Map())
  const animationsRef = useRef(new Set())
  const rectRef = useRef(null)
  const stageRef = useRef(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    const svg = container.querySelector('svg')
    const nodes = new Map([...svg.querySelectorAll('[data-pizza-element]')].map((node) => [node.dataset.pizzaElement, node]))
    const previous = previousRef.current
    if (reduced) {
      animationsRef.current.forEach((animation) => animation.cancel())
      animationsRef.current.clear()
    }
    const animate = (node, frames, duration) => {
      const animation = node.animate(frames, { duration, easing: 'ease-out' })
      animationsRef.current.add(animation)
      animation.onfinish = () => animationsRef.current.delete(animation)
    }
    if (!reduced) {
      for (const [key, node] of nodes) {
        if (!previous.has(key)) animate(node, [
          { opacity: 0, transform: 'translateY(-8px) scale(.6)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], PIZZA_MS.enter)
      }
      for (const [key, snapshot] of previous) {
        if (nodes.has(key)) continue
        const clone = snapshot.cloneNode(true)
        clone.removeAttribute('data-pizza-element')
        svg.append(clone)
        animate(clone, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6)' }], PIZZA_MS.exit)
        scheduleTimeout(() => clone.remove(), PIZZA_MS.exit)
      }
    }
    previousRef.current = new Map([...nodes].map(([key, node]) => [key, node.cloneNode(true)]))
    const rect = container.getBoundingClientRect()
    if (stageActive && !stageRef.current && rectRef.current && !reduced) {
      const from = rectRef.current
      animate(container, [
        { transform: `translate(${from.x + from.width / 2 - rect.x - rect.width / 2}px, ${from.y + from.height / 2 - rect.y - rect.height / 2}px) scale(${from.width / rect.width})` },
        { transform: 'translate(0, 0) scale(1)' },
      ], PIZZA_MS.center)
    }
    rectRef.current = rect
    stageRef.current = stageActive
  }, [selection, props.hold, reduced, scheduleTimeout, stageActive])

  useEffect(() => () => {
    animationsRef.current.forEach((animation) => animation.cancel())
    animationsRef.current.clear()
  }, [])

  return <div ref={containerRef} className="orders-mode__pizza-art"><PizzaPreview selection={selection} {...props} /></div>
}
const TIMER_COLOR_THRESHOLDS = {
  amberAtSeconds: 35,
  redAtSeconds: 10,
  shortOrderAmberRatio: 0.6,
  shortOrderNoAmberSeconds: 20,
}
const ORDER_TOPIC_LABELS = {
  armado: 'Armado',
  'armado-final': 'Armado final',
  coccion: 'Cocción',
  ingredientes: 'Ingredientes',
  masa: 'Masa',
  'pedido-cliente': 'Pedido del cliente',
  quesos: 'Quesos',
  salsas: 'Salsas',
  'tipos-del-mundo': 'Tipos de pizza del mundo',
  toppings: 'Toppings',
}

function getTimerUrgency(remainingMs, durationMs) {
  const remainingSeconds = remainingMs / 1000
  const totalSeconds = durationMs / 1000
  const { amberAtSeconds, redAtSeconds, shortOrderAmberRatio, shortOrderNoAmberSeconds } =
    TIMER_COLOR_THRESHOLDS
  if (remainingSeconds <= redAtSeconds) return 'red'
  if (totalSeconds <= shortOrderNoAmberSeconds) return 'normal'
  const amberThresholdSeconds =
    totalSeconds <= amberAtSeconds
      ? totalSeconds * shortOrderAmberRatio
      : amberAtSeconds
  return remainingSeconds <= amberThresholdSeconds ? 'amber' : 'normal'
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (event) => setReduced(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

function useManagedTimeouts() {
  const idsRef = useRef(new Set())
  useEffect(
    () => () => {
      idsRef.current.forEach((id) => window.clearTimeout(id))
      idsRef.current.clear()
    },
    [],
  )
  return useCallback((fn, ms) => {
    const id = window.setTimeout(() => {
      idsRef.current.delete(id)
      fn()
    }, ms)
    idsRef.current.add(id)
    return id
  }, [])
}

function reducedAnimMs(key, prefersReducedMotion) {
  return prefersReducedMotion ? 0 : ANIM_MS[key]
}

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3
}

function joinTopicNames(topics) {
  const names = topics.map((topic) => topic.label)
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
}

function findNextOrderIndex(shift) {
  if (!shift) return 0
  const delivered = new Set(shift.results.map((result) => result.orderId))
  const index = shift.orderIds.findIndex((orderId) => !delivered.has(orderId))
  return index < 0 ? shift.orderIds.length - 1 : index
}

export default function OrdersModeScreen() {
  const { stage: stageParam } = useParams()
  const stage = Number(stageParam)
  const navigate = useNavigate()
  const {
    ordersMode,
    unlockedStage,
    totalScore,
    addOrderPoints,
    startShift,
    recordShiftOrderResult,
    markActiveOrder,
  } = useGame()
  const validStage = Number.isInteger(stage) && stage >= 1 && stage <= LEVELS.length
  const shift = ordersMode.shifts[stage]
  const tier = getTierForStage(stage)
  const topics = getOrderTopicsForStage(stage)
  const slots = getLevel(8)?.builder?.slots ?? EMPTY_SLOTS
  const [phase, setPhase] = useState('intro')
  const [hasStarted, setHasStarted] = useState(false)
  const [orderIndex, setOrderIndex] = useState(() => findNextOrderIndex(shift))
  const [selection, setSelection] = useState(() => createEmptySelection(slots))
  const [orderResult, setOrderResult] = useState(null)
  const [remainingMs, setRemainingMs] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [cardPhase, setCardPhase] = useState('idle')
  const [exiting, setExiting] = useState(false)
  const [scoreFloat, setScoreFloat] = useState(null)
  const [scoreFloatTick, setScoreFloatTick] = useState(0)
  const [scoreDisplay, setScoreDisplay] = useState(totalScore)
  const [scoreBounceTick, setScoreBounceTick] = useState(0)
  const [summaryScoreDisplay, setSummaryScoreDisplay] = useState(0)
  const [confetti, setConfetti] = useState([])
  const [pizzaPhase, setPizzaPhase] = useState('idle')
  const [skipHint, setSkipHint] = useState(false)
  const [pizzaSkipped, setPizzaSkipped] = useState(false)
  const pizzaTimeoutsRef = useRef([])
  const floatShownRef = useRef(false)
  const deadlineRef = useRef(0)
  const intervalRef = useRef(null)
  const selectionRef = useRef(selection)
  const resolvedRef = useRef(false)
  const announcedTenSecondsRef = useRef(false)
  const prevTotalScoreRef = useRef(totalScore)
  const shiftCreationStartedRef = useRef(false)
  const [activeOnLoad] = useState(() => ({
    active: ordersMode.activeOrder,
    shifts: ordersMode.shifts,
  }))
  const prefersReducedMotion = usePrefersReducedMotion()
  const scheduleTimeout = useManagedTimeouts()
  const shiftOrderIds = shift?.orderIds ?? []
  const currentOrder = ORDERS.find(
    (order) => order.id === shiftOrderIds[orderIndex],
  )
  const durationMs = (currentOrder?.timeSeconds ?? tier.timeSeconds) * 1000
  const ready = slots.every((slot) => slot.multiple || Boolean(selection[slot.id]))
  const pizzaActive = pizzaPhase !== 'idle'

  const clearPizzaTimeouts = useCallback(() => {
    pizzaTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    pizzaTimeoutsRef.current = []
  }, [])
  const showVerdictPoints = useCallback((result) => {
    if (!result.satisfied || floatShownRef.current) return
    floatShownRef.current = true
    setScoreFloat(result.pointsAwarded)
    setScoreFloatTick((tick) => tick + 1)
    pizzaTimeoutsRef.current.push(scheduleTimeout(() => setScoreFloat(null), reducedAnimMs('float', prefersReducedMotion)))
  }, [prefersReducedMotion, scheduleTimeout])
  const endPizzaStage = useCallback(() => {
    setPizzaPhase('idle')
    setPizzaSkipped(false)
    setSkipHint(false)
    setExiting(false)
    setScoreFloat(null)
  }, [])
  const skipPizzaStage = useCallback(() => {
    if (!pizzaActive || !orderResult) return
    clearPizzaTimeouts()
    if (orderResult.satisfied) {
      showVerdictPoints(orderResult)
      endPizzaStage()
      return
    }
    setPizzaSkipped(true)
    setPizzaPhase('verdict')
    setSkipHint(false)
    showVerdictPoints(orderResult)
    pizzaTimeoutsRef.current.push(scheduleTimeout(endPizzaStage, PIZZA_MS.skipped))
  }, [clearPizzaTimeouts, endPizzaStage, orderResult, pizzaActive, scheduleTimeout, showVerdictPoints])

  useEffect(() => {
    if (!pizzaActive) return undefined
    const onKey = (event) => {
      if (!['Enter', ' ', 'Escape'].includes(event.key) || event.repeat) return
      if (event.target.closest?.('.orders-mode__home')) return
      event.preventDefault()
      skipPizzaStage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pizzaActive, skipPizzaStage])

  useEffect(() => {
    if (
      validStage &&
      unlockedStage > 0 &&
      stage <= unlockedStage &&
      !shift &&
      !shiftCreationStartedRef.current
    ) {
      shiftCreationStartedRef.current = true
      startShift(stage)
    }
  }, [stage, startShift, shift, unlockedStage, validStage])

  useEffect(() => {
    const active = activeOnLoad.active
    if (!active) return
    const activeShift = activeOnLoad.shifts[active.stage]
    if (
      activeShift &&
      !activeShift.results.some((result) => result.orderId === active.orderId)
    ) {
      addOrderPoints(`${active.stage}:${active.orderId}`, 0)
      recordShiftOrderResult(active.stage, {
        orderId: active.orderId,
        satisfied: false,
        pointsAwarded: 0,
        lost: true,
      })
    }
  }, [activeOnLoad, addOrderPoints, recordShiftOrderResult])

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  const finishOrder = useCallback(
    (expired, timeLeftMs) => {
      if (!currentOrder || resolvedRef.current || !shift) return
      resolvedRef.current = true
      const evaluation = evaluateOrder(currentOrder, selectionRef.current)
      const remaining = Math.max(0, Math.min(durationMs, timeLeftMs))
      const satisfied = !expired && remaining > 0 && evaluation.satisfied
      const timeBonus = satisfied
        ? Math.round((remaining / durationMs) * ORDER_TIME_BONUS_MAX)
        : 0
      const pointsAwarded = satisfied ? tier.basePoints + timeBonus : 0
      addOrderPoints(`${stage}:${currentOrder.id}`, pointsAwarded)
      const result = {
        orderId: currentOrder.id,
        customerName: currentOrder.customer,
        evaluation,
        satisfied,
        expired,
        pointsAwarded,
      }
      recordShiftOrderResult(stage, result)
      setOrderResult(result)
      setRemainingMs(remaining)
      setAnnouncement(
        expired
          ? 'Se acabó el tiempo. El pedido se perdió.'
          : satisfied
            ? `Pedido cumplido. Sumaste ${pointsAwarded} puntos.`
            : 'El pedido no cumplió todos los requisitos.',
      )
      if (expired) {
        setCardPhase('timeout')
        setExiting(true)
        scheduleTimeout(() => setExiting(false), reducedAnimMs('crumple', prefersReducedMotion))
      } else {
        setCardPhase(satisfied ? 'correct' : 'wrong')
        if (!satisfied) scheduleTimeout(() => setCardPhase('idle'), reducedAnimMs('shake', prefersReducedMotion))
        setExiting(true)
        setSkipHint(false)
        setPizzaSkipped(false)
        floatShownRef.current = false
        clearPizzaTimeouts()
        setPizzaPhase(prefersReducedMotion ? 'verdict' : 'oven')
        if (prefersReducedMotion) {
          showVerdictPoints(result)
        } else {
          pizzaTimeoutsRef.current.push(
            scheduleTimeout(() => setPizzaPhase('leaves'), PIZZA_MS.baked),
            scheduleTimeout(() => {
              setPizzaPhase('verdict')
              showVerdictPoints(result)
            }, PIZZA_MS.verdict),
          )
        }
        pizzaTimeoutsRef.current.push(
          scheduleTimeout(() => setSkipHint(true), PIZZA_MS.hint),
          scheduleTimeout(endPizzaStage, prefersReducedMotion ? PIZZA_MS.reduced : PIZZA_MS.total),
        )
      }
    },
    [
      addOrderPoints,
      currentOrder,
      durationMs,
      prefersReducedMotion,
      recordShiftOrderResult,
      scheduleTimeout,
      shift,
      stage,
      tier.basePoints,
      clearPizzaTimeouts,
      endPizzaStage,
      showVerdictPoints,
    ],
  )

  useEffect(() => {
    if (phase !== 'play' || !currentOrder || orderResult) return undefined
    const deadline = Date.now() + durationMs
    deadlineRef.current = deadline
    announcedTenSecondsRef.current = false
    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now())
      setRemainingMs(remaining)
      if (remaining <= 10_000 && remaining > 0 && !announcedTenSecondsRef.current) {
        announcedTenSecondsRef.current = true
        setAnnouncement('Quedan 10 segundos para entregar el pedido.')
      }
      if (remaining === 0) {
        window.clearInterval(intervalRef.current)
        finishOrder(true, 0)
      }
    }, 200)
    return () => {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [currentOrder, durationMs, finishOrder, orderResult, phase])

  useEffect(
    () => () => window.clearInterval(intervalRef.current),
    [],
  )

  useEffect(() => {
    if (totalScore === prevTotalScoreRef.current) return undefined
    const from = prevTotalScoreRef.current
    const to = totalScore
    prevTotalScoreRef.current = to
    setScoreBounceTick((tick) => tick + 1)
    if (prefersReducedMotion) {
      setScoreDisplay(to)
      return undefined
    }
    let frameId
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min(1, (now - start) / ANIM_MS.score)
      setScoreDisplay(Math.round(from + (to - from) * easeOutCubic(progress)))
      if (progress < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [prefersReducedMotion, totalScore])

  useEffect(() => {
    if (phase !== 'summary') return undefined
    if (prefersReducedMotion) {
      setSummaryScoreDisplay(shift?.score ?? 0)
      return undefined
    }
    let frameId
    const start = performance.now()
    const score = shift?.score ?? 0
    const step = (now) => {
      const progress = Math.min(1, (now - start) / ANIM_MS.score)
      setSummaryScoreDisplay(Math.round(score * easeOutCubic(progress)))
      if (progress < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [phase, prefersReducedMotion, shift?.score])

  useEffect(() => {
    if (phase !== 'summary' || prefersReducedMotion || !shift?.results.length) {
      return undefined
    }
    const served = shift.results.filter((result) => result.satisfied).length
    if (served <= shift.results.length / 2) return undefined
    const colors = ['#ffd54f', '#4f9e6a', '#e85d4c', '#4a90d9']
    const count = 12 + Math.floor(Math.random() * 9)
    setConfetti(
      Array.from({ length: count }, (_, index) => ({
        id: `${stage}-${index}`,
        left: Math.random() * 100,
        color: colors[index % colors.length],
        delay: Math.random() * 300,
        duration: 1200 + Math.random() * 400,
        drift: (Math.random() - 0.5) * 60,
        spin: 180 + Math.random() * 360,
      })),
    )
    const timeoutId = window.setTimeout(() => setConfetti([]), 1700)
    return () => window.clearTimeout(timeoutId)
  }, [phase, prefersReducedMotion, shift?.results, stage])

  if (!validStage || unlockedStage === 0) {
    return <Navigate to="/jugar" replace />
  }
  if (stage > unlockedStage) return <Navigate to="/pedidos" replace />
  if (!hasStarted && shift?.status === 'completed') {
    return <Navigate to="/pedidos" replace />
  }

  function startShiftPlay() {
    const nextShift = shift
    if (!nextShift) return
    setHasStarted(true)
    const nextIndex = findNextOrderIndex(nextShift)
    const nextOrder = ORDERS.find((order) => order.id === nextShift.orderIds[nextIndex])
    if (!nextOrder) {
      setPhase('summary')
      return
    }
    setOrderIndex(nextIndex)
    setSelection(createEmptySelection(slots))
    setOrderResult(null)
    setRemainingMs(tier.timeSeconds * 1000)
    resolvedRef.current = false
    setCardPhase('idle')
    setExiting(false)
    setScoreFloat(null)
    clearPizzaTimeouts()
    setPizzaPhase('idle')
    markActiveOrder(stage, nextOrder.id)
    setAnnouncement(
      `Pedido ${nextIndex + 1} de ${nextShift.orderIds.length}. Tienes ${tier.timeSeconds} segundos.`,
    )
    setPhase('play')
  }

  function deliverOrder() {
    const remaining = Math.max(0, deadlineRef.current - Date.now())
    finishOrder(remaining === 0, remaining)
  }

  function advanceOrder() {
    if (orderIndex + 1 >= shiftOrderIds.length) {
      setPhase('summary')
      return
    }
    const nextIndex = orderIndex + 1
    const nextOrder = ORDERS.find((order) => order.id === shiftOrderIds[nextIndex])
    if (!nextOrder) return
    resolvedRef.current = false
    setCardPhase('idle')
    setExiting(false)
    setScoreFloat(null)
    clearPizzaTimeouts()
    setPizzaPhase('idle')
    setRemainingMs(tier.timeSeconds * 1000)
    setAnnouncement(
      `Pedido ${nextIndex + 1} de ${shiftOrderIds.length}. Tienes ${tier.timeSeconds} segundos.`,
    )
    setOrderIndex(nextIndex)
    setSelection(createEmptySelection(slots))
    setOrderResult(null)
    markActiveOrder(stage, nextOrder.id)
  }

  function leaveShift() {
    if (phase === 'play' && currentOrder && !orderResult && !resolvedRef.current) {
      resolvedRef.current = true
      addOrderPoints(`${stage}:${currentOrder.id}`, 0)
      recordShiftOrderResult(stage, {
        orderId: currentOrder.id,
        customerName: currentOrder.customer,
        satisfied: false,
        pointsAwarded: 0,
        lost: true,
      })
    }
    navigate('/jugar')
  }

  const results = shift?.results ?? []
  const ordersServed = results.filter((result) => result.satisfied).length
  const ordersFailed = results.length - ordersServed
  const timerUrgency = getTimerUrgency(remainingMs, durationMs)
  const shiftSize = shift?.orderIds.length ?? 0
  const verdictVisible = pizzaActive && pizzaPhase === 'verdict'
  const ticketPizzaVisible = Boolean(orderResult?.satisfied) && !pizzaActive
  const pizzaMarks = orderResult && (!pizzaActive || verdictVisible)
    ? getPizzaMarks(currentOrder, orderResult, selection)
    : {}
  const heldLeaves = pizzaPhase === 'oven' ? DELICATE_LEAVES : EMPTY_SLOTS

  return (
    <LevelScene
      levelId={stage}
      scoreDisplay={scoreDisplay}
      scoreBounceKey={scoreBounceTick || undefined}
    >
      <section className="page level-page level-builder orders-mode scene-zones">
        <div className="orders-mode__fixed-top">
          <h1 className="level-question__level orders-mode__tier">
            Nivel: {tier.name}
          </h1>
          {phase === 'play' && currentOrder ? (
            <>
              <p className="level-progress">
                Pedido {orderIndex + 1} de {shiftSize}
                <span className="orders-mode__sr-only">
                  {' '}
                  Puntaje del turno: {shift?.score ?? 0}
                </span>
              </p>
              <div className={`orders-mode__ticket-slot${ticketPizzaVisible ? ' has-pizza' : ''}`} key={`${stage}-${orderIndex}`}>
              <article
                className={[
                  'orders-mode__ticket',
                  currentOrder.text.length > 120 ? 'is-long' : '',
                  cardPhase === 'correct' ? 'is-correct' : '',
                  cardPhase === 'timeout' && exiting ? 'is-timeout' : '',
                  orderResult && !orderResult.satisfied && (cardPhase === 'idle' || (cardPhase === 'timeout' && !exiting)) ? 'is-resolved' : '',
                  cardPhase === 'wrong' ? 'is-wrong' : '',
                ].filter(Boolean).join(' ')}
                style={{ '--order-paper-image': `url("${orderPaper}")` }}
              >
                <h2 className="orders-mode__customer">
                  Pedido de {currentOrder.customer}
                </h2>
                <p className="orders-mode__quote">“{currentOrder.text}”</p>
                <p className="orders-mode__topics orders-mode__sr-only">
                  {currentOrder.topics.map((topic) => ORDER_TOPIC_LABELS[topic] ?? topic).join(' · ')}
                </p>
              </article>
              {ticketPizzaVisible ? (
                <div className="orders-mode__ticket-pizza" aria-hidden="true">
                  <PizzaPreview selection={selection} glow cutLines face="happy" />
                </div>
              ) : null}
              </div>
              <div className="orders-mode__timer-hint">
                <div className="orders-mode__timer" aria-hidden="true">
                  <div className="orders-mode__timer-label">
                    <span>Tiempo</span>
                    <span
                      className={[
                        'orders-mode__timer-seconds',
                        timerUrgency === 'red' ? 'is-urgent' : '',
                        timerUrgency === 'amber' ? 'is-urgent-soft' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {Math.ceil(remainingMs / 1000)} s
                    </span>
                  </div>
                  <div className="orders-mode__timer-track">
                    <div
                      className={`orders-mode__timer-fill${timerUrgency !== 'normal' ? ` is-${timerUrgency}` : ''}`}
                      style={{ '--timer-progress': Math.max(0, Math.min(1, remainingMs / durationMs)) }}
                    />
                  </div>
                </div>
                <p className="orders-mode__hint">
                  Elige los ingredientes para preparar la pizza
                </p>
              </div>
                <div className="orders-mode__preview-slot" aria-hidden="true" style={ticketPizzaVisible ? { visibility: 'hidden' } : undefined}>
                  <div
                    className={`orders-mode__pizza-stage${pizzaActive ? ' is-active' : ''}${verdictVisible ? ` is-verdict ${orderResult.satisfied ? 'is-happy' : 'is-worried'}` : ''}${pizzaPhase === 'leaves' ? ' is-leaves' : ''}${pizzaSkipped ? ' is-skipped' : ''}`}
                    onClick={pizzaActive ? skipPizzaStage : undefined}
                  >
                    <AnimatedOrderPizza
                      key={currentOrder.id}
                      selection={selection}
                      reduced={prefersReducedMotion || pizzaSkipped}
                      scheduleTimeout={scheduleTimeout}
                      stageActive={pizzaActive}
                      face={verdictVisible ? orderResult.satisfied ? 'happy' : 'worried' : !orderResult && timerUrgency === 'red' ? 'nervous' : 'none'}
                      hold={heldLeaves}
                      glow={pizzaActive && (!verdictVisible || orderResult.satisfied)}
                      cutLines={verdictVisible && orderResult.satisfied}
                      sliceWiggle={verdictVisible && orderResult.satisfied && !prefersReducedMotion && !pizzaSkipped}
                      {...pizzaMarks}
                    />
                    {pizzaPhase === 'oven' ? <div className="orders-mode__baking"><i /><i /><i /><span>¡Ding!</span></div> : null}
                    {pizzaPhase === 'leaves' && selection.toppings.some((id) => DELICATE_LEAVES.includes(id)) ? <span className="orders-mode__leaf-sparkle">✦</span> : null}
                    {verdictVisible ? (
                      <div className="orders-mode__verdict-bubble">
                        {orderResult.satisfied ? `¡Gracias, ${currentOrder.customer}!` : 'Eso no es lo que pedí…'}
                        {pizzaMarks.extras?.length > 0 ? <small>× de más</small> : null}
                      </div>
                    ) : null}
                    {pizzaActive && skipHint ? <small className="orders-mode__skip-hint">Toca para saltar</small> : null}
                  </div>
                </div>
              <p className="orders-mode__sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
              </p>
            </>
          ) : (
            <p className="level-progress">Turno de {shiftSize} pedidos</p>
          )}
        </div>

        <div className="orders-mode__scroll scene-zones__scroll">
          {phase === 'intro' ? (
            <article className="orders-mode__intro">
              <h2>{tier.name} · Etapa {stage}</h2>
              <p><strong>Este turno evalúa: {joinTopicNames(topics)}</strong></p>
              <p>
                {shift?.results.length
                  ? `Continúas tu turno: ${shift.results.length} de ${shiftSize} pedidos ya resueltos.`
                  : `Prepara ${shiftSize} pedidos. Cada pedido tiene su propio reloj.`}
              </p>
              <p className="orders-mode__warning">
                Cada turno se juega una sola vez. No podrás repetirlo.
              </p>
            </article>
          ) : null}

          {phase === 'play' && currentOrder && !orderResult ? (
            <div className="orders-mode__options" key={`options-${stage}-${orderIndex}`}>
              <PizzaBuilderControls
                slots={slots}
                selection={selection}
                setSelection={setSelection}
                orderMode
              />
            </div>
          ) : null}

          {phase === 'play' && currentOrder && orderResult && !pizzaActive ? (
            <div className={`level-feedback ${orderResult.satisfied ? 'is-correct' : 'is-incorrect'}`}>
              <p className="level-feedback__result">
                {orderResult.expired
                  ? 'Se acabó el tiempo: el pedido se perdió. 0 puntos.'
                  : orderResult.satisfied
                    ? `¡Pedido cumplido! +${orderResult.pointsAwarded} puntos`
                    : 'El pedido quedó incompleto. No se suman puntos.'}
              </p>
              <ul className="level-order__requirements">
                {orderResult.evaluation.requirements.map((requirement) => (
                  <li
                    className={requirement.met ? 'is-correct' : 'is-incorrect'}
                    key={requirement.requirementId}
                  >
                    <strong>{requirement.met ? 'Cumplido' : 'Pendiente'}:</strong>{' '}
                    {requirement.feedback}
                  </li>
                ))}
              </ul>
              <p className="orders-mode__tip"><strong>Consejo:</strong> {currentOrder.tip}</p>
            </div>
          ) : null}

          {phase === 'summary' ? (
            <article className="orders-mode__summary">
              <h2 className="level-question__prompt">Fin del turno</h2>
              <ul>
                <li>Pedidos atendidos: {ordersServed}</li>
                <li>Pedidos fallidos: {ordersFailed}</li>
                <li>Puntaje del turno: {summaryScoreDisplay}</li>
                <li>Total ganado: {totalScore}</li>
              </ul>
              {confetti.length > 0 ? (
                <div className="orders-mode__confetti-layer" aria-hidden="true">
                  {confetti.map((piece) => (
                    <span
                      key={piece.id}
                      className="orders-mode__confetti"
                      style={{
                        '--confetti-left': `${piece.left}%`,
                        '--confetti-color': piece.color,
                        '--confetti-delay': `${piece.delay}ms`,
                        '--confetti-duration': `${piece.duration}ms`,
                        '--confetti-drift': `${piece.drift}px`,
                        '--confetti-spin': `${piece.spin}deg`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </article>
          ) : null}
        </div>

        <div className="orders-mode__actions scene-zones__actions">
          {phase === 'intro' ? (
            <button
              className="level-action level-action--confirm orders-mode__start-button orders-mode__action--wide"
              type="button"
              onClick={startShiftPlay}
              disabled={!shift}
            >
              Empezar
            </button>
          ) : null}
          {phase === 'play' && currentOrder && (!orderResult || exiting) ? (
            <button
              className="level-action level-action--confirm"
              type="button"
              onClick={deliverOrder}
              disabled={!ready || Boolean(orderResult)}
            >
              ENTREGAR
            </button>
          ) : null}
          {phase === 'play' && currentOrder && orderResult && !exiting ? (
            <button
              className="level-action level-action--confirm orders-mode__action--wide"
              type="button"
              onClick={advanceOrder}
            >
              {orderIndex + 1 === shiftSize ? 'Ver resumen' : 'Siguiente pedido'}
            </button>
          ) : null}
          {phase === 'summary' ? (
            <Link
              className="level-action level-action--confirm orders-mode__action--wide orders-mode__summary-action"
              to="/pedidos"
            >
              Volver a los turnos
            </Link>
          ) : null}
          {scoreFloat != null ? (
            <span key={scoreFloatTick} className="orders-mode__score-float" aria-hidden="true">
              +{scoreFloat}
            </span>
          ) : null}
          <button
            className="level-action level-action--home orders-mode__home orders-mode__action--wide"
            type="button"
            onClick={leaveShift}
          >
            INICIO
          </button>
        </div>
      </section>
    </LevelScene>
  )
}
