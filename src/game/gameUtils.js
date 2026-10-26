import levelsData from '../data/levels.json'
import ordersData from '../data/orders.json'

export const POINTS_PER_CORRECT = levelsData.pointsPerCorrect
export const POINTS_PER_WRONG = levelsData.pointsPerWrong
export const MIN_CORRECT_TO_UNLOCK = levelsData.minCorrectToUnlock
export const GAME_TITLE = levelsData.gameTitle
export const LEVELS = levelsData.levels

export function getLevel(levelId) {
  return LEVELS.find((level) => level.id === Number(levelId))
}

export function getTriviaLevels() {
  return LEVELS.filter((level) => level.type === 'trivia')
}

export function getMaxScore() {
  const triviaMaximum = getTriviaLevels().reduce(
    (total, level) => total + level.questions.length * POINTS_PER_CORRECT,
    0,
  )
  const orderMaximum = LEVELS.filter((level) => level.type === 'order').reduce(
    (total, level) =>
      total +
      level.orders.length * level.scoring.pointsPerSatisfiedOrder,
    0,
  )
  const ordersModeMaximum = LEVELS.reduce((total, level) => {
    const shiftSize = ordersData.shiftSizes.find(
      (item) => level.id >= item.minStage && level.id <= item.maxStage,
    )?.size
    const tier = [...ordersData.tiers]
      .reverse()
      .find((item) => level.id >= item.minPassedLevels)
    if (!shiftSize || !tier) return total
    return total + shiftSize * (tier.basePoints + ordersData.timeBonusMax)
  }, 0)
  return triviaMaximum + orderMaximum + ordersModeMaximum
}

export function clampScore(value) {
  return Math.max(0, value)
}

export function createEmptySelection(slots) {
  return Object.fromEntries(
    slots.map((slot) => [slot.id, slot.multiple ? [] : '']),
  )
}

export function createInitialGameState() {
  return {
    levelScore: 0,
    orderScore: 0,
    spentPoints: 0,
    redemptions: [],
    currentLevel: 1,
    unlockedLevel: 1,
    answersByLevel: {},
    orderResultsByLevel: {},
    createdPizza: null,
    gameCompleted: false,
    ordersMode: {
      shifts: {},
      activeOrder: null,
    },
  }
}

export function correctCountFromAnswers(answers) {
  if (!answers) return 0
  return answers.filter((answer) => answer.correct).length
}

export function scoreFromAnswers(answers) {
  if (!answers) return 0
  const correct = correctCountFromAnswers(answers)
  const wrong = answers.length - correct
  return correct * POINTS_PER_CORRECT - wrong * POINTS_PER_WRONG
}

export function didPassLevel(answers, questionCount) {
  if (!answers || answers.length < questionCount) return false
  return correctCountFromAnswers(answers) >= MIN_CORRECT_TO_UNLOCK
}

export function didPassOrderLevel(level, results) {
  if (!level || level.type !== 'order' || results.length < level.orders.length) {
    return false
  }
  const satisfiedCount = results.filter((result) => result.satisfied).length
  return satisfiedCount >= level.scoring.minimumSatisfiedOrders
}

export function evaluateOrder(order, selection) {
  const toppingRequirements = order.requirements.filter(
    (requirement) =>
      requirement.slot === 'toppings' && requirement.type === 'mustInclude',
  )
  const requestedToppings = toppingRequirements.flatMap(
    (requirement) => requirement.choiceIds,
  )
  const pickedToppings = order.requirements
    .filter(
      (requirement) =>
        requirement.type === 'toppingPick' &&
        (requirement.slot ?? 'toppings') === 'toppings',
    )
    .flatMap((requirement) => requirement.ids)
  const exactToppingsRequirement = {
    id: 'exact-toppings',
    type: 'exactToppings',
    slot: 'toppings',
    choiceIds: [
      ...new Set([
        ...requestedToppings,
        ...pickedToppings,
        ...(order.allowedExtras ?? []),
      ]),
    ],
    feedback: 'La pizza lleva solo los toppings solicitados o autorizados.',
  }
  const requirementsToEvaluate = [
    ...order.requirements,
    exactToppingsRequirement,
  ]

  const requirements = requirementsToEvaluate.map((requirement) => {
    const selected = selection?.[requirement.slot]
    const selectedChoices = Array.isArray(selected)
      ? selected
      : selected
        ? [selected]
        : []
    let met = false

    if (requirement.type === 'mustInclude') {
      met = requirement.choiceIds.every((choiceId) =>
        selectedChoices.includes(choiceId),
      )
    } else if (requirement.type === 'mustNotInclude') {
      met = requirement.choiceIds.every(
        (choiceId) => !selectedChoices.includes(choiceId),
      )
    } else if (requirement.type === 'slotNotIn') {
      met = selectedChoices.every(
        (choiceId) => !requirement.values.includes(choiceId),
      )
    } else if (requirement.type === 'toppingPick') {
      const toppingIds = requirement.ids
      const selectedCount = selectedChoices.filter((choiceId) =>
        toppingIds.includes(choiceId),
      ).length
      met =
        selectedCount >= requirement.min && selectedCount <= requirement.max
    } else if (requirement.type === 'maxToppings') {
      met = selectedChoices.length <= requirement.max
    } else if (requirement.type === 'exactToppings') {
      const extras = selectedChoices.filter(
        (choiceId) => !requirement.choiceIds.includes(choiceId),
      )
      met = extras.length === 0
      if (!met) {
        const toppingChoices =
          getLevel(8)?.builder?.slots.find(
            (slot) => slot.id === 'toppings',
          )?.choices ?? []
        const extraNames = extras.map(
          (choiceId) =>
            toppingChoices
              .find((choice) => choice.id === choiceId)
              ?.name.replace(/\s*\([^)]*\)\s*/g, '')
              .trim() ?? choiceId,
        )
        const formattedNames =
          extraNames.length < 2
            ? extraNames[0]
            : `${extraNames.slice(0, -1).join(', ')} y ${extraNames.at(-1)}`
        return {
          requirementId: requirement.id,
          type: requirement.type,
          met,
          feedback: `No pediste esto: ${formattedNames}. Agregar ingredientes que el cliente no pidió estropea el pedido.`,
        }
      }
    }

    return {
      requirementId: requirement.id,
      type: requirement.type,
      met,
      feedback: requirement.feedback,
    }
  })

  return {
    requirements,
    satisfied: requirements.every((requirement) => requirement.met),
  }
}

export function levelPath(level) {
  if (!level) return '/'
  if (level.type === 'builder') return `/nivel/${level.id}/pizza`
  if (level.type === 'order') return `/nivel/${level.id}/pedido`
  return `/nivel/${level.id}`
}
