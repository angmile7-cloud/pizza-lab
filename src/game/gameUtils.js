import levelsData from '../data/levels.json'

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
  return triviaMaximum + orderMaximum
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
    score: 0,
    currentLevel: 1,
    unlockedLevel: 1,
    answersByLevel: {},
    orderResultsByLevel: {},
    createdPizza: null,
    gameCompleted: false,
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
  const requirements = order.requirements.map((requirement) => {
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
    } else if (requirement.type === 'maxToppings') {
      met = selectedChoices.length <= requirement.max
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
