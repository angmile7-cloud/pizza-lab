import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { createEmptySelection, getLevel, levelPath } from '../game/gameUtils'
import LevelScene from '../components/LevelScene'
import PizzaBuilderControls from '../components/PizzaBuilderControls'

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
      <LevelScene levelId={level.id}>
        <section className="page level-page level-builder level-builder--complete">
          <p className="level-nav">
            <Link to="/jugar">Inicio</Link>
          </p>
          <h1>¡Pizza lista!</h1>
          <p>Nivel 8 · {level.title}</p>
          <p>Total ganado: {totalScore}</p>
          <ul>
            {slots.map((slot) => (
              <li key={slot.id}>
                <strong>{slot.label}:</strong>{' '}
                {slot.multiple
                  ? pizza[slot.id]?.length
                    ? pizza[slot.id].map((id) => choiceName(slot.id, id)).join(', ')
                    : 'Sin toppings extra'
                  : choiceName(slot.id, pizza[slot.id])}
              </li>
            ))}
          </ul>
          <p>
            Terminaste tu pizza y ya puedes aplicar lo aprendido sobre ingredientes,
            armado y cocción en los siguientes niveles.
          </p>
          <p>
            <Link className="btn-yellow level-action" to={levelPath(getLevel(9))}>
              Continuar al nivel 9
            </Link>
          </p>
        </section>
      </LevelScene>
    )
  }

  return (
    <LevelScene levelId={level.id}>
      <section className="page level-page level-builder">
        <p className="level-nav">
          <Link to="/jugar">Inicio</Link>
        </p>
        <h1>
          Nivel {level.id}: {level.title}
        </h1>
        <p>{level.description}</p>
        <PizzaBuilderControls
          slots={slots}
          selection={selection}
          setSelection={setSelection}
        />
        <p>
          <button className="btn-yellow level-action" type="button" onClick={handleSave} disabled={!ready}>
            Hornear pizza
          </button>
        </p>
      </section>
    </LevelScene>
  )
}
