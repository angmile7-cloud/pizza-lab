import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { createEmptySelection, getLevel, levelPath } from '../game/gameUtils'
import PizzaBuildingLayout from '../components/PizzaBuildingLayout'
import PizzaPreview from '../components/PizzaPreview'
import PizzaBuilderControls from '../components/PizzaBuilderControls'
import ResultStatus from '../components/ResultStatus'

const EMPTY_SLOTS = []

export default function PizzaBuilderScreen() {
  const { levelId } = useParams()
  const level = getLevel(levelId)
  const { canAccessLevel, createdPizza, savePizza, totalScore } = useGame()
  const slots = level?.builder?.slots ?? EMPTY_SLOTS
  const [selection, setSelection] = useState(() => createEmptySelection(slots))
  const [submitted, setSubmitted] = useState(Boolean(createdPizza))

  const pizza = submitted ? createdPizza ?? selection : selection

  const ready = slots.every((slot) => {
    const value = selection[slot.id]
    if (slot.multiple) return true
    return Boolean(value)
  })

  if (!level || level.type !== 'builder') {
    return <Navigate to="/" replace />
  }

  if (!canAccessLevel(level.id)) {
    return <Navigate to="/" replace />
  }

  function handleSave() {
    if (!ready) return
    savePizza(selection)
    setSubmitted(true)
  }

  function choiceName(slotId, choiceId) {
    const slot = slots.find((item) => item.id === slotId)
    return slot?.choices.find((choice) => choice.id === choiceId)?.name ?? choiceId
  }

  if (submitted && pizza) {
    return (
      <PizzaBuildingLayout
        levelId={level.id}
        className="level-builder--complete"
        title="¡Pizza lista!"
        subtitle={<p>Nivel 8 · {level.title}</p>}
        top={
          <div className="orders-mode__order-row">
            <div className="builder-result__total">
              <strong>{totalScore}</strong> Total ganado
            </div>
            <div className="orders-mode__preview-slot" aria-hidden="true">
              <div className="orders-mode__pizza-stage">
                <PizzaPreview className="orders-mode__pizza-art" selection={pizza} glow cutLines />
              </div>
            </div>
          </div>
        }
        actions={
          <Link
            className="btn-yellow level-action level-action--confirm orders-mode__action--wide"
            to={levelPath(getLevel(9))}
          >
            Continuar al nivel 9
          </Link>
        }
      >
        <div className="pizza-building__result">
          <ul className="builder-result__list">
            {slots.map((slot) => (
              <li key={slot.id}>
                <ResultStatus met />
                <span><strong>{slot.label}:</strong>{' '}
                  {slot.multiple
                    ? pizza[slot.id]?.length
                      ? pizza[slot.id].map((id) => choiceName(slot.id, id)).join(', ')
                      : 'Sin toppings extra'
                    : choiceName(slot.id, pizza[slot.id])}
                </span>
              </li>
            ))}
          </ul>
          <p className="pizza-building__copy">
            Terminaste tu pizza y ya puedes aplicar lo aprendido sobre ingredientes,
            armado y cocción en los siguientes niveles.
          </p>
        </div>
      </PizzaBuildingLayout>
    )
  }

  return (
    <PizzaBuildingLayout
      levelId={level.id}
      title={`Nivel ${level.id}: ${level.title}`}
      top={
        <div className="orders-mode__order-row">
          <div className="pizza-building__copy">{level.description}</div>
          <div className="orders-mode__preview-slot" aria-hidden="true">
            <div className="orders-mode__pizza-stage">
              <PizzaPreview className="orders-mode__pizza-art" selection={selection} />
            </div>
          </div>
        </div>
      }
      actions={
        <button
          className="btn-yellow level-action level-action--confirm orders-mode__action--wide"
          type="button"
          onClick={handleSave}
          disabled={!ready}
        >
          Hornear pizza
        </button>
      }
    >
      <div className="orders-mode__options">
        <PizzaBuilderControls
          slots={slots}
          selection={selection}
          setSelection={setSelection}
          orderMode
        />
      </div>
    </PizzaBuildingLayout>
  )
}
