function joinNames(names) {
  if (names.length < 2) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
}

function choiceName(slots, slotId, id) {
  const name = slots.find((slot) => slot.id === slotId)?.choices.find((choice) => choice.id === id)?.name
  return name?.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
}

function choiceNames(slots, slotId, ids) {
  const names = ids.map((id) => choiceName(slots, slotId, id))
  return names.every(Boolean) ? names : null
}

function requirementLabel(requirement, slots, fallback) {
  const { type, slot } = requirement
  if (type === 'exactToppings') return 'Solo los toppings pedidos'
  if (type === 'maxToppings') return `Hasta ${requirement.max} toppings`

  const ids = type === 'slotIs' ? [requirement.value]
    : type === 'slotNotIn' ? requirement.values
      : type === 'toppingIncluded' ? [requirement.id]
        : type === 'toppingPick' ? requirement.ids
          : requirement.choiceIds
  const slotId = type === 'toppingIncluded' || type === 'toppingPick' ? 'toppings' : slot
  if (!ids?.length) return fallback
  const names = choiceNames(slots, slotId, ids)
  if (!names) return fallback

  if (type === 'slotNotIn' || type === 'mustNotInclude') {
    if (slotId === 'queso' && ids.length === 1 && ids[0] === 'sin-queso') return 'Con queso'
    if (slotId === 'masa') return `Sin masa ${joinNames(names)}`
    if (slotId === 'salsa') return `Sin salsa ${joinNames(names)}`
    return `Sin ${joinNames(names)}`
  }
  if (type === 'toppingPick') {
    const count = requirement.min === requirement.max ? `${requirement.min}`
      : requirement.min === 0 ? `Hasta ${requirement.max}`
        : `${requirement.min}–${requirement.max}`
    return `${count}: ${joinNames(names)}`
  }
  if (!['slotIs', 'toppingIncluded', 'mustInclude'].includes(type)) return fallback
  if (slotId === 'toppings') return `Con ${joinNames(names)}`
  if (slotId === 'queso') return names[0] === 'sin queso' ? 'Sin queso' : `Queso: ${joinNames(names)}`
  if (slotId === 'masa') return `Masa ${joinNames(names)}`
  if (slotId === 'salsa') {
    const sauces = { tomate: 'Salsa de tomate', bianca: 'Salsa blanca', pesto: 'Salsa pesto' }
    return ids.length === 1 ? sauces[ids[0]] ?? fallback : fallback
  }
  return fallback
}

export function getOrderRequirementItems(order, evaluation, selection, slots, expired = false) {
  return evaluation.map((item) => {
    const requirement = item.requirementId === 'exact-toppings'
      ? { type: 'exactToppings', slot: 'toppings' }
      : order.requirements.find((entry) => entry.id === item.requirementId)
    if (!requirement) return { ...item, met: !expired && item.met, label: item.feedback }

    const met = !expired && item.met
    let chosen
    if (!met && !expired) {
      const slot = requirement.slot ?? (requirement.type === 'toppingPick' ? 'toppings' : undefined)
      const selected = selection[slot]
      if (Array.isArray(selected)) {
        let ids = selected
        if (requirement.type === 'exactToppings') {
          const allowed = order.requirements.flatMap((entry) =>
            entry.slot === 'toppings' && entry.type === 'mustInclude' ? entry.choiceIds
              : entry.type === 'toppingIncluded' ? [entry.id]
              : entry.type === 'toppingPick' ? entry.ids : [],
          )
          ids = selected.filter((id) => ![...allowed, ...(order.allowedExtras ?? [])].includes(id))
        }
        const names = choiceNames(slots, slot, ids)
        if (names) chosen = names.length ? joinNames(names) : 'ninguno'
      } else if (typeof selected === 'string') {
        chosen = selected ? choiceName(slots, slot, selected) : 'ninguno'
      }
    }
    return { ...item, met, label: requirementLabel(requirement, slots, item.feedback), chosen }
  })
}
