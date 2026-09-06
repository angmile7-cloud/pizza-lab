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

export function getMaxTriviaScore() {
  return getTriviaLevels().reduce(
    (total, level) => total + level.questions.length * POINTS_PER_CORRECT,
    0,
  )
}

export function clampScore(value) {
  return Math.max(0, value)
}

export function createInitialGameState() {
  return {
    score: 0,
    currentLevel: 1,
    unlockedLevel: 1,
    answersByLevel: {},
    createdPizza: null,
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

export function levelPath(level) {
  if (!level) return '/'
  if (level.type === 'builder') return `/nivel/${level.id}/pizza`
  return `/nivel/${level.id}`
}
