export default function PizzaBuilderControls({
  slots,
  selection,
  setSelection,
  orderMode = false,
}) {
  function handleOptionFocus(event) {
    if (orderMode) event.currentTarget.scrollIntoView({ block: 'nearest' })
  }

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
          const checked = (selection[slot.id] ?? []).includes(choice.id)
          return (
            <div className="level-builder__choice" key={choice.id}>
              <label
                className={
                  orderMode
                    ? `level-option orders-mode__option${checked ? ' is-selected' : ''}`
                    : undefined
                }
                htmlFor={inputId}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onFocus={orderMode ? handleOptionFocus : undefined}
                  onChange={() => handleMultiple(slot, choice.id)}
                />
                {orderMode ? (
                  <>
                    <span
                      className="level-option__dot orders-mode__radio"
                      aria-hidden="true"
                    />
                    <span
                      className={`orders-mode__option-label${choice.name.length > 25 ? ' is-long' : ''}`}
                    >
                      {choice.name}
                    </span>
                  </>
                ) : (
                  <> {choice.name}</>
                )}
              </label>
            </div>
          )
        }
        const checked = selection[slot.id] === choice.id
        return (
          <div className="level-builder__choice" key={choice.id}>
            <label
              className={
                orderMode
                  ? `level-option orders-mode__option${checked ? ' is-selected' : ''}`
                  : undefined
              }
              htmlFor={inputId}
            >
              <input
                id={inputId}
                type="radio"
                name={slot.id}
                checked={checked}
                onFocus={orderMode ? handleOptionFocus : undefined}
                onChange={() => handleSingle(slot.id, choice.id)}
              />
              {orderMode ? (
                <>
                  <span
                    className="level-option__dot orders-mode__radio"
                    aria-hidden="true"
                  />
                  <span
                    className={`orders-mode__option-label${choice.name.length > 25 ? ' is-long' : ''}`}
                  >
                    {choice.name}
                  </span>
                </>
              ) : (
                <> {choice.name}</>
              )}
            </label>
          </div>
        )
      })}
    </fieldset>
  ))
}
