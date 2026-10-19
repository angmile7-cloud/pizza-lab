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
  const [orderIndex, setOrderIndex] = useState(0)
  const [selection, setSelection] = useState(() => createEmptySelection(slots))
  const [orderResult, setOrderResult] = useState(null)
  const [roundResults, setRoundResults] = useState([])
  const [roundScore, setRoundScore] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const deadlineRef = useRef(0)
  const intervalRef = useRef(null)
  const selectionRef = useRef(selection)
  const resolvedRef = useRef(false)
  const announcedTenSecondsRef = useRef(false)
  const roundIdRef = useRef(0)

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
      addOrderPoints(`${roundIdRef.current}:${currentOrder.id}`, pointsAwarded)
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
    },
    [addOrderPoints, currentOrder, durationMs],
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

  if (!passedLevelIds.includes(1)) {
    return <Navigate to="/jugar" replace />
  }

  function startRound() {
    roundIdRef.current = ++nextRoundId
    const nextOrders = createOrdersRound(passedLevelIds)
    setRoundOrders(nextOrders)
    setOrderIndex(0)
    setSelection(createEmptySelection(slots))
    setOrderResult(null)
    setRoundResults([])
    setRoundScore(0)
    setRemainingMs(nextOrders[0].timeSeconds * 1000)
    resolvedRef.current = false
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
    setAnnouncement('')
    setPhase('intro')
  }

  const ordersServed = roundResults.filter((result) => result.satisfied).length
  const ordersFailed = roundResults.length - ordersServed

  return (
    <LevelScene levelId={currentTier.minPassedLevels}>
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
                className={`orders-mode__ticket${currentOrder.text.length > 120 ? ' is-long' : ''}`}
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
                    <span>{Math.ceil(remainingMs / 1000)} s</span>
                  </div>
                  <div className="orders-mode__timer-track">
                    <div
                      className={`orders-mode__timer-fill${remainingMs <= 10_000 ? ' is-low' : ''}`}
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
            <div className="orders-mode__options">
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
                <li>Puntaje del turno: {roundScore}</li>
                <li>Puntaje acumulado: {totalScore}</li>
                <li>Tier jugado: {currentTier.name}</li>
              </ul>
            </article>
          ) : null}
        </div>

        <div className="orders-mode__actions">
          {phase === 'intro' ? (
            <button
              className="level-action level-action--confirm"
              type="button"
              onClick={startRound}
            >
              Empezar
            </button>
          ) : null}

          {phase === 'play' && currentOrder && !orderResult ? (
            <button
              className="level-action level-action--confirm"
              type="button"
              onClick={deliverOrder}
              disabled={!ready}
            >
              ENTREGAR
            </button>
          ) : null}

          {phase === 'play' && currentOrder && orderResult ? (
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
