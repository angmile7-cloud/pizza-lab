import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PizzaBuildingLayout from '../components/PizzaBuildingLayout'
import OrderTicket from '../components/OrderTicket'
import PizzaPreview from '../components/PizzaPreview'
import OrderResultCard from '../components/OrderResultCard'
import PizzaBuilderControls from '../components/PizzaBuilderControls'
import { useGame } from '../game/useGame'
import { createEmptySelection, getLevel } from '../game/gameUtils'
import { getOrderRequirementItems } from '../game/orderResultLabels'
import { playSound } from '../game/sound'

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
    const result = recordOrderResult(level.id, order, selection)
    playSound(result.satisfied ? 'bell' : 'oops')
    setFeedback(result)
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
    <PizzaBuildingLayout
      levelId={level.id}
      className="level-order"
      title={`Nivel ${level.id}: ${level.title}`}
      subtitle={
        <p className="level-progress">
          Pedido {orderIndex + 1} de {orders.length}
        </p>
      }
      top={
        <>
          <div className="orders-mode__order-row">
            <div className="orders-mode__ticket-slot">
              <OrderTicket customer={order.customerName} message={order.message} />
            </div>
            <div className="orders-mode__preview-slot" aria-hidden="true">
              <div className="orders-mode__pizza-stage">
                <PizzaPreview
                  className="orders-mode__pizza-art"
                  selection={selection}
                  glow={Boolean(feedback?.satisfied)}
                  cutLines={Boolean(feedback?.satisfied)}
                />
              </div>
            </div>
          </div>
          {!feedback ? (
            <p className="pizza-building__copy pizza-building__hint">
              Elige los ingredientes para preparar su pizza.
            </p>
          ) : null}
        </>
      }
      actions={
        !feedback ? (
          <button
            className="btn-yellow level-action level-action--confirm orders-mode__action--wide"
            type="button"
            onClick={handleSubmit}
            data-sound="order"
            disabled={!ready}
          >
            ENTREGAR PEDIDO
          </button>
        ) : (
          <button
            className="btn-yellow level-action level-action--confirm orders-mode__action--wide"
            type="button"
            onClick={handleNext}
          >
            {orderIndex + 1 >= orders.length ? 'Ver resultado del nivel' : 'Siguiente pedido'}
          </button>
        )
      }
    >
      {!feedback ? (
        <div className="orders-mode__options">
          <PizzaBuilderControls
            slots={slots}
            selection={selection}
            setSelection={setSelection}
            orderMode
          />
        </div>
      ) : (
        <OrderResultCard
          key={order.id}
          state={feedback.satisfied ? 'success' : 'incomplete'}
          points={feedback.pointsAwarded}
          items={getOrderRequirementItems(order, feedback.requirements, selection, slots)}
        />
      )}
    </PizzaBuildingLayout>
  )
}
