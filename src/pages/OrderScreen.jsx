import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import LevelScene from '../components/LevelScene'
import PizzaBuilderControls from '../components/PizzaBuilderControls'
import { useGame } from '../game/useGame'
import { createEmptySelection, getLevel } from '../game/gameUtils'

const EMPTY_SLOTS = []

export default function OrderScreen() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const level = getLevel(levelId)
  const {
    canAccessLevel,
    orderResultsByLevel,
    recordOrderResult,
  } = useGame()
  const orders = level?.orders ?? []
  const slots = getLevel(8)?.builder?.slots ?? EMPTY_SLOTS
  const savedResults = orderResultsByLevel[Number(levelId)] ?? []
  const [orderIndex, setOrderIndex] = useState(savedResults.length)
  const [selection, setSelection] = useState(() => createEmptySelection(slots))
  const [feedback, setFeedback] = useState(null)

  if (!level || level.type !== 'order') {
    return <Navigate to="/" replace />
  }

  if (!canAccessLevel(level.id)) {
    return <Navigate to="/" replace />
  }

  if (orderIndex >= orders.length) {
    return <Navigate to={`/nivel/${level.id}/resultado`} replace />
  }

  const order = orders[orderIndex]
  const ready = slots.every((slot) => {
    if (slot.multiple) return true
    return Boolean(selection[slot.id])
  })

  function handleSubmit() {
    if (!ready || feedback) return
    setFeedback(recordOrderResult(level.id, order, selection))
  }

  function handleNext() {
    const nextIndex = orderIndex + 1
    if (nextIndex >= orders.length) {
      navigate(`/nivel/${level.id}/resultado`)
      return
    }
    setOrderIndex(nextIndex)
    setSelection(createEmptySelection(slots))
    setFeedback(null)
  }

  return (
    <LevelScene levelId={level.id}>
      <section className="page level-page level-builder level-order">
        <p className="level-nav">
          <Link to="/jugar">Inicio</Link>
        </p>
        <h1>
          Nivel {level.id}: {level.title}
        </h1>
        <p className="level-progress">
          Pedido {orderIndex + 1} de {orders.length}
        </p>
        <article className="level-order__customer">
          <h2>Pedido de {order.customerName}</h2>
          <p>“{order.message}”</p>
        </article>
        {!feedback ? (
          <>
            <p>Elige los ingredientes para preparar su pizza.</p>
            <PizzaBuilderControls
              slots={slots}
              selection={selection}
              setSelection={setSelection}
            />
            <button
              className="btn-yellow level-action level-action--confirm"
              type="button"
              onClick={handleSubmit}
              disabled={!ready}
            >
              ENTREGAR PEDIDO
            </button>
          </>
        ) : (
          <div
            className={`level-feedback ${feedback.satisfied ? 'is-correct' : 'is-incorrect'}`}
            aria-live="polite"
          >
            <p className="level-feedback__result">
              {feedback.satisfied
                ? `¡Pedido cumplido! +${feedback.pointsAwarded} puntos`
                : 'El pedido quedó incompleto. No se suman puntos.'}
            </p>
            <ul className="level-order__requirements">
              {feedback.requirements.map((requirement) => (
                <li
                  className={requirement.met ? 'is-correct' : 'is-incorrect'}
                  key={requirement.requirementId}
                >
                  <strong>{requirement.met ? 'Cumplido' : 'Pendiente'}:</strong>{' '}
                  {requirement.feedback}
                </li>
              ))}
            </ul>
            <button
              className="btn-yellow level-action"
              type="button"
              onClick={handleNext}
            >
              {orderIndex + 1 >= orders.length ? 'Ver resultado del nivel' : 'Siguiente pedido'}
            </button>
          </div>
        )}
      </section>
    </LevelScene>
  )
}
