import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import LevelScene from '../components/LevelScene'
import PizzaBuilderControls from '../components/PizzaBuilderControls'
import orderPaper from '../assets/papel_pedido.png'
import { useGame } from '../game/useGame'
import {
  createEmptySelection,
  evaluateOrder,
  getLevel,
} from '../game/gameUtils'
import {
  createOrdersRound,
  getOrdersModeTier,
  getPassedLevelIds,
  getPassedOrderTopics,
  getTierById,
} from '../game/ordersModeUtils'

const EMPTY_SLOTS = []
const ROUND_SIZE = 5
const TIME_BONUS_MAX = 10
let nextRoundId = 0

// Animation durations in ms. Keep these in sync with the --om-dur-* CSS
// variables in src/index.css so JS timers and CSS transitions line up.
const ANIM_MS = {
  exit: 400, // correct delivery: paper flies off
  crumple: 520, // time out: paper crumples away
  shake: 350, // wrong delivery: card shake
  float: 800, // floating "+points"
  score: 600, // badge count-up
}

// Timer bar color thresholds, in absolute seconds remaining (not percentage
// of total time). Visual only: does not affect how time is counted.
const TIMER_COLOR_THRESHOLDS = {
  amberAtSeconds: 35, // bar turns amber at or below this many seconds left
  redAtSeconds: 10, // bar turns red at or below this many seconds left
  // For orders whose total time is at or below amberAtSeconds, the bar would
  // start already amber. Instead, amber kicks in at this fraction of the
  // order's own total time (so it always starts green). If the total time is
  // at or below shortOrderNoAmberSeconds, skip amber entirely (green -> red).
  shortOrderAmberRatio: 0.6,
  shortOrderNoAmberSeconds: 20,
}

// Returns 'normal' | 'amber' | 'red' for the timer bar/seconds text, using
// absolute seconds remaining and the order's own total duration.
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

function reducedAnimMs(key, prefersReducedMotion) {
  return prefersReducedMotion ? 0 : ANIM_MS[key]
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event) => setReduced(event.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

// Tracks setTimeout ids so every pending timer is cleared if the screen
// unmounts mid-animation (avoids state updates after unmount / stuck state).
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

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3
}

function joinTopicNames(topics) {
  const names = topics.map((topic) => topic.label)
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
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

export default function OrdersModeScreen() {
  const {
    answersByLevel,
    orderResultsByLevel,
    createdPizza,
    totalScore,
    addOrderPoints,
  } = useGame()
  const passedLevelIds = getPassedLevelIds({
    answersByLevel,
    orderResultsByLevel,
    createdPizza,
  })
  const currentTier = getOrdersModeTier(passedLevelIds)
  const topics = getPassedOrderTopics(passedLevelIds)
  const slots = getLevel(8)?.builder?.slots ?? EMPTY_SLOTS
  const [phase, setPhase] = useState('intro')
  const [roundOrders, setRoundOrders] = useState([])
  const [roundId, setRoundId] = useState(0)
  const [orderIndex, setOrderIndex] = useState(0)
  const [selection, setSelection] = useState(() => createEmptySelection(slots))
  const [orderResult, setOrderResult] = useState(null)
  const [roundResults, setRoundResults] = useState([])
  const [roundScore, setRoundScore] = useState(0)
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
  const deadlineRef = useRef(0)
  const intervalRef = useRef(null)
  const selectionRef = useRef(selection)
  const resolvedRef = useRef(false)
  const announcedTenSecondsRef = useRef(false)
  const prevTotalScoreRef = useRef(totalScore)
  const prefersReducedMotion = usePrefersReducedMotion()
  const scheduleTimeout = useManagedTimeouts()

  const currentOrder = roundOrders[orderIndex]
  const durationMs = (currentOrder?.timeSeconds ?? 0) * 1000
  const ready = slots.every((slot) => {
    if (slot.multiple) return true
    return Boolean(selection[slot.id])
  })
  const finishOrder = useCallback(
    (expired, timeLeftMs) => {
      if (!currentOrder || resolvedRef.current) return
      resolvedRef.current = true

      const evaluation = evaluateOrder(currentOrder, selectionRef.current)
      const remaining = Math.max(0, Math.min(durationMs, timeLeftMs))
      const satisfied = !expired && remaining > 0 && evaluation.satisfied
      const timeBonus = satisfied
        ? Math.floor((remaining / durationMs) * TIME_BONUS_MAX)
        : 0
      const pointsAwarded = satisfied
        ? getTierById(currentOrder.tier).basePoints + timeBonus
        : 0
      addOrderPoints(`${roundId}:${currentOrder.id}`, pointsAwarded)
      const result = {
        orderId: currentOrder.id,
        customerName: currentOrder.customer,
        evaluation,
        satisfied,
        expired,
        pointsAwarded,
      }

      setOrderResult(result)
      setRoundResults((previous) => [...previous, result])
      setRoundScore((previous) => previous + pointsAwarded)
      setRemainingMs(remaining)
      setAnnouncement(
        expired
          ? 'Se acabó el tiempo. El pedido se perdió.'
          : satisfied
            ? `Pedido cumplido. Sumaste ${pointsAwarded} puntos.`
            : 'El pedido no cumplió todos los requisitos.',
      )

      // Decoration only: these flags drive CSS animation classes and never
      // delay the scoring above, which already happened synchronously.
      if (satisfied) {
        setCardPhase('correct')
        setExiting(true)
        setScoreFloat(pointsAwarded)
        setScoreFloatTick((tick) => tick + 1)
        scheduleTimeout(
          () => setExiting(false),
          reducedAnimMs('exit', prefersReducedMotion),
        )
        scheduleTimeout(
          () => setScoreFloat(null),
          reducedAnimMs('float', prefersReducedMotion),
        )
      } else if (expired) {
        setCardPhase('timeout')
        setExiting(true)
        scheduleTimeout(
          () => setExiting(false),
          reducedAnimMs('crumple', prefersReducedMotion),
        )
      } else {
        setCardPhase('wrong')
        scheduleTimeout(
          () => setCardPhase('idle'),
          reducedAnimMs('shake', prefersReducedMotion),
        )
      }
    },
    [
      addOrderPoints,
      currentOrder,
      durationMs,
      prefersReducedMotion,
      roundId,
      scheduleTimeout,
    ],
  )

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

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
  }, [
    currentOrder,
    durationMs,
    finishOrder,
    orderResult,
    phase,
  ])

  useEffect(
    () => () => {
      window.clearInterval(intervalRef.current)
    },
    [],
  )

  // Animates the score badge from its old value to the new total whenever
  // addOrderPoints updates totalScore (decoration only; totalScore itself
  // already holds the real, final value at all times).
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
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }
    frameId = requestAnimationFrame(step)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [totalScore, prefersReducedMotion])

  // Counts the round's points up from 0 once the summary screen appears.
  useEffect(() => {
    if (phase !== 'summary') return undefined

    if (prefersReducedMotion) {
      setSummaryScoreDisplay(roundScore)
      return undefined
    }

    let frameId
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min(1, (now - start) / ANIM_MS.score)
      setSummaryScoreDisplay(Math.round(roundScore * easeOutCubic(progress)))
      if (progress < 1) {
        frameId = requestAnimationFrame(step)
      }
    }
    frameId = requestAnimationFrame(step)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [phase, roundScore, prefersReducedMotion])

  // Lightweight CSS-only confetti when more than half the round was served.
  useEffect(() => {
    if (phase !== 'summary' || prefersReducedMotion) return undefined
    if (roundResults.length === 0) return undefined

    const served = roundResults.filter((result) => result.satisfied).length
    if (served <= roundResults.length / 2) return undefined

    const colors = ['#ffd54f', '#4f9e6a', '#e85d4c', '#4a90d9']
    const count = 12 + Math.floor(Math.random() * 9)
    setConfetti(
      Array.from({ length: count }, (_, index) => ({
        id: `${roundId}-${index}`,
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
  }, [phase, roundResults, roundId, prefersReducedMotion])

  if (!passedLevelIds.includes(1)) {
    return <Navigate to="/jugar" replace />
  }

  function startRound() {
    const nextRoundIdValue = ++nextRoundId
    setRoundId(nextRoundIdValue)
    const nextOrders = createOrdersRound(passedLevelIds)
    setRoundOrders(nextOrders)
    setOrderIndex(0)
    setSelection(createEmptySelection(slots))
    setOrderResult(null)
    setRoundResults([])
    setRoundScore(0)
    setRemainingMs(nextOrders[0].timeSeconds * 1000)
    resolvedRef.current = false
    setCardPhase('idle')
    setExiting(false)
    setScoreFloat(null)
    setAnnouncement(
      `Pedido 1 de ${ROUND_SIZE}. Tienes ${nextOrders[0].timeSeconds} segundos.`,
    )
    setPhase('play')
  }

  function deliverOrder() {
    const remaining = Math.max(0, deadlineRef.current - Date.now())
    finishOrder(remaining === 0, remaining)
  }

  function advanceOrder() {
    if (orderIndex + 1 === roundOrders.length) {
      setPhase('summary')
      return
    }
    resolvedRef.current = false
    setCardPhase('idle')
    setExiting(false)
    setScoreFloat(null)
    setRemainingMs(roundOrders[orderIndex + 1].timeSeconds * 1000)
    setAnnouncement(
      `Pedido ${orderIndex + 2} de ${ROUND_SIZE}. Tienes ${roundOrders[orderIndex + 1].timeSeconds} segundos.`,
    )
    setOrderIndex((current) => current + 1)
    setSelection(createEmptySelection(slots))
    setOrderResult(null)
  }

  function playAgain() {
    setRoundOrders([])
    setOrderIndex(0)
    setSelection(createEmptySelection(slots))
    setOrderResult(null)
    setRoundResults([])
    setRoundScore(0)
    setRemainingMs(0)
    resolvedRef.current = false
    setCardPhase('idle')
    setExiting(false)
    setScoreFloat(null)
    setSummaryScoreDisplay(0)
    setConfetti([])
    setAnnouncement('')
    setPhase('intro')
  }

  const ordersServed = roundResults.filter((result) => result.satisfied).length
  const ordersFailed = roundResults.length - ordersServed
  const timerUrgency = getTimerUrgency(remainingMs, durationMs)

  return (
    <LevelScene
      levelId={currentTier.minPassedLevels}
      scoreDisplay={scoreDisplay}
      scoreBounceKey={scoreBounceTick || undefined}
    >
      <section className="page level-page level-builder orders-mode">
        <div className="orders-mode__fixed-top">
          <h1 className="level-question__level orders-mode__tier">
            Nivel: {currentTier.name}
          </h1>

          {phase === 'play' && currentOrder ? (
            <>
              <p className="level-progress">
                Pedido {orderIndex + 1} de {roundOrders.length}
                <span className="orders-mode__sr-only">
                  {' '}
                  Puntaje del turno: {roundScore}
                </span>
              </p>
              <article
                key={`${roundId}-${orderIndex}`}
                className={[
                  'orders-mode__ticket',
                  currentOrder.text.length > 120 ? 'is-long' : '',
                  cardPhase === 'correct' ? 'is-correct' : '',
                  cardPhase === 'timeout' ? 'is-timeout' : '',
                  cardPhase === 'wrong' ? 'is-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--order-paper-image': `url("${orderPaper}")` }}
              >
                <h2 className="orders-mode__customer">
                  Pedido de {currentOrder.customer}
                </h2>
                <p className="orders-mode__quote">
                  “{currentOrder.text}”
                </p>
                <p className="orders-mode__topics orders-mode__sr-only">
                  {currentOrder.topics
                    .map((topic) => ORDER_TOPIC_LABELS[topic] ?? topic)
                    .join(' · ')}
                </p>
              </article>
              <div className="orders-mode__timer-hint">
                <div className="orders-mode__timer" aria-hidden="true">
                  <div className="orders-mode__timer-label">
                    <span>Tiempo</span>
                    <span
                      className={[
                        'orders-mode__timer-seconds',
                        timerUrgency === 'red' ? 'is-urgent' : '',
                        timerUrgency === 'amber' ? 'is-urgent-soft' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {Math.ceil(remainingMs / 1000)} s
                    </span>
                  </div>
                  <div className="orders-mode__timer-track">
                    <div
                      className={`orders-mode__timer-fill${timerUrgency !== 'normal' ? ` is-${timerUrgency}` : ''}`}
                      style={{
                        '--timer-progress': Math.max(
                          0,
                          Math.min(1, remainingMs / durationMs),
                        ),
                      }}
                    />
                  </div>
                </div>
                <p className="orders-mode__hint">
                  Elige los ingredientes para preparar la pizza
                </p>
              </div>
              <p
                className="orders-mode__sr-only"
                aria-live="polite"
                aria-atomic="true"
              >
                {announcement}
              </p>
            </>
          ) : null}
        </div>

        <div className="orders-mode__scroll">
          {phase === 'intro' ? (
            <article className="orders-mode__intro">
              <p>
                <strong>Este turno evalúa: {joinTopicNames(topics)}</strong>
              </p>
              <p>
                Prepara {ROUND_SIZE} pedidos antes de que se acabe el tiempo.
                Cada pedido tiene su propio reloj.
              </p>
            </article>
          ) : null}

          {phase === 'play' && currentOrder && !orderResult ? (
            <div
              className="orders-mode__options"
              key={`options-${roundId}-${orderIndex}`}
            >
              <PizzaBuilderControls
                slots={slots}
                selection={selection}
                setSelection={setSelection}
                orderMode
              />
            </div>
          ) : null}

          {phase === 'play' && currentOrder && orderResult ? (
            <div
              className={`level-feedback ${orderResult.satisfied ? 'is-correct' : 'is-incorrect'}`}
            >
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
              <p className="orders-mode__tip">
                <strong>Consejo:</strong> {currentOrder.tip}
              </p>
            </div>
          ) : null}

          {phase === 'summary' ? (
            <article className="orders-mode__summary">
              <h2 className="level-question__prompt">Fin del turno</h2>
              <ul>
                <li>Pedidos atendidos: {ordersServed}</li>
                <li>Pedidos fallidos: {ordersFailed}</li>
                <li>Puntaje del turno: {summaryScoreDisplay}</li>
                <li>Puntaje acumulado: {totalScore}</li>
                <li>Tier jugado: {currentTier.name}</li>
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

        <div className="orders-mode__actions">
          {phase === 'intro' ? (
            <button
              className="level-action level-action--confirm orders-mode__start-button"
              type="button"
              onClick={startRound}
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
              {orderIndex + 1 === roundOrders.length
                ? 'Ver resumen'
                : 'Siguiente pedido'}
            </button>
          ) : null}

          {phase === 'summary' ? (
            <button
              className="level-action level-action--confirm orders-mode__action--wide"
              type="button"
              onClick={playAgain}
            >
              Jugar otra ronda
            </button>
          ) : null}

          {scoreFloat != null ? (
            <span
              key={scoreFloatTick}
              className="orders-mode__score-float"
              aria-hidden="true"
            >
              +{scoreFloat}
            </span>
          ) : null}

          {phase === 'play' ? (
            <Link
              className="level-action level-action--home orders-mode__home"
              to="/jugar"
            >
              INICIO
            </Link>
          ) : phase === 'summary' ? (
            <Link
              className="level-action level-action--home orders-mode__home orders-mode__action--wide"
              to="/jugar"
            >
              Volver al mapa
            </Link>
          ) : (
            <Link
              className="level-action level-action--home orders-mode__home orders-mode__action--wide"
              to="/jugar"
            >
              Volver al mapa
            </Link>
          )}
        </div>
      </section>
    </LevelScene>
  )
}
