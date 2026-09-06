import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { getLevel } from '../game/gameUtils'

function emptySelection(slots) {
  return Object.fromEntries(
    slots.map((slot) => [slot.id, slot.multiple ? [] : '']),
  )
}

const EMPTY_SLOTS = []

export default function PizzaBuilderScreen() {
  const { levelId } = useParams()
  const level = getLevel(levelId)
  const { canAccessLevel, createdPizza, savePizza, score } = useGame()
  const slots = level?.builder?.slots ?? EMPTY_SLOTS
  const [selection, setSelection] = useState(() => emptySelection(slots))
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

  function handleSingle(slotId, choiceId) {
    setSelection((current) => ({ ...current, [slotId]: choiceId }))
  }

  function handleMultiple(slot, choiceId) {
    setSelection((current) => {
      const list = current[slot.id] ?? []
      const exists = list.includes(choiceId)
      let next = exists ? list.filter((id) => id !== choiceId) : [...list, choiceId]
      if (!exists && slot.maxSelections && next.length > slot.maxSelections) {
        next = next.slice(0, slot.maxSelections)
      }
      return { ...current, [slot.id]: next }
    })
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
      <section className="page">
        <p>
          <Link to="/jugar">Inicio</Link>
        </p>
        <h1>¡Pizza lista!</h1>
        <p>Nivel 8 · {level.title}</p>
        <p>Puntuación de trivia: {score}</p>
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
          Completaste Maestro Pizzero. Ya puedes explicar el proceso: ingredientes,
          masa, salsa, queso, toppings, armado y cocción.
        </p>
        <p>
          <Link to="/jugar">Volver al inicio</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="page">
      <p>
        <Link to="/jugar">Inicio</Link>
      </p>
      <h1>
        Nivel {level.id}: {level.title}
      </h1>
      <p>{level.description}</p>
      {slots.map((slot) => (
        <fieldset key={slot.id}>
          <legend>{slot.label}</legend>
          {slot.choices.map((choice) => {
            const inputId = `${slot.id}-${choice.id}`
            if (slot.multiple) {
              return (
                <div key={choice.id}>
                  <label htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={(selection[slot.id] ?? []).includes(choice.id)}
                      onChange={() => handleMultiple(slot, choice.id)}
                    />{' '}
                    {choice.name}
                  </label>
                </div>
              )
            }
            return (
              <div key={choice.id}>
                <label htmlFor={inputId}>
                  <input
                    id={inputId}
                    type="radio"
                    name={slot.id}
                    checked={selection[slot.id] === choice.id}
                    onChange={() => handleSingle(slot.id, choice.id)}
                  />{' '}
                  {choice.name}
                </label>
              </div>
            )
          })}
        </fieldset>
      ))}
      <p>
        <button type="button" onClick={handleSave} disabled={!ready}>
          Hornear pizza
        </button>
      </p>
    </section>
  )
}
