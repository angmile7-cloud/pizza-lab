export default function PizzaBuilderControls({
  slots,
  selection,
  setSelection,
}) {
  function handleSingle(slotId, choiceId) {
    setSelection((current) => ({ ...current, [slotId]: choiceId }))
  }

  function handleMultiple(slot, choiceId) {
    setSelection((current) => {
      const list = current[slot.id] ?? []
      const exists = list.includes(choiceId)
      let next = exists
        ? list.filter((id) => id !== choiceId)
        : [...list, choiceId]
      if (!exists && slot.maxSelections && next.length > slot.maxSelections) {
        next = next.slice(0, slot.maxSelections)
      }
      return { ...current, [slot.id]: next }
    })
  }

  return slots.map((slot) => (
    <fieldset key={slot.id}>
      <legend>{slot.label}</legend>
      {slot.choices.map((choice) => {
        const inputId = `${slot.id}-${choice.id}`
        if (slot.multiple) {
          return (
            <div className="level-builder__choice" key={choice.id}>
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
          <div className="level-builder__choice" key={choice.id}>
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
  ))
}
