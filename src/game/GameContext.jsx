import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import {
  clampScore,
  createInitialGameState,
  didPassLevel,
  getLevel,
  POINTS_PER_CORRECT,
  POINTS_PER_WRONG,
} from './gameUtils'

export const GameContext = createContext(null)

function answerKey(levelId, questionId) {
  return `${levelId}:${questionId}`
}

export function GameProvider({ children }) {
  const [score, setScore] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [unlockedLevel, setUnlockedLevel] = useState(1)
  const [answersByLevel, setAnswersByLevel] = useState({})
  const [createdPizza, setCreatedPizza] = useState(null)
  const scoredKeysRef = useRef(new Set())

  const recordAnswer = useCallback((levelId, question, selectedOptionId) => {
    const key = answerKey(levelId, question.id)
    const correct = selectedOptionId === question.correctOptionId
    const pointsDelta = correct ? POINTS_PER_CORRECT : -POINTS_PER_WRONG

    if (scoredKeysRef.current.has(key)) {
      const previous = answersByLevel[levelId]?.find(
        (answer) => answer.questionId === question.id,
      )
      return previous
    }

    scoredKeysRef.current.add(key)

    const appliedDelta = clampScore(score + pointsDelta) - score
    const entry = {
      questionId: question.id,
      prompt: question.prompt,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      correct,
      explanation: question.explanation,
      pointsDelta,
      appliedDelta,
    }

    setScore((currentScore) => clampScore(currentScore + pointsDelta))
    setAnswersByLevel((current) => {
      const previous = current[levelId] ?? []
      if (previous.some((answer) => answer.questionId === question.id)) {
        return current
      }
      return { ...current, [levelId]: [...previous, { ...entry }] }
    })

    return entry
  }, [answersByLevel, score])

  const resolveLevel = useCallback(
    (levelId) => {
      const level = getLevel(levelId)
      if (!level || level.type !== 'trivia') return false
      const answers = answersByLevel[level.id] ?? []
      const passed = didPassLevel(answers, level.questions.length)
      if (passed) {
        const nextId = Number(levelId) + 1
        setUnlockedLevel((current) => Math.max(current, nextId))
        setCurrentLevel((current) => Math.max(current, nextId))
      }
      return passed
    },
    [answersByLevel],
  )

  const retryLevel = useCallback((levelId) => {
    setAnswersByLevel((current) => {
      const answers = current[levelId] ?? current[Number(levelId)] ?? []
      answers.forEach((answer) => {
        scoredKeysRef.current.delete(answerKey(levelId, answer.questionId))
        scoredKeysRef.current.delete(answerKey(Number(levelId), answer.questionId))
      })
      const next = { ...current }
      delete next[Number(levelId)]
      delete next[levelId]
      return next
    })
  }, [])

  const savePizza = useCallback((pizza) => {
    setCreatedPizza(pizza)
    setUnlockedLevel((current) => Math.max(current, 9))
    setCurrentLevel(8)
  }, [])

  const restartGame = useCallback(() => {
    const initial = createInitialGameState()
    scoredKeysRef.current = new Set()
    setScore(initial.score)
    setCurrentLevel(initial.currentLevel)
    setUnlockedLevel(initial.unlockedLevel)
    setAnswersByLevel(initial.answersByLevel)
    setCreatedPizza(initial.createdPizza)
  }, [])

  const canAccessLevel = useCallback(
    (levelId) => {
      const level = getLevel(levelId)
      if (!level) return false
      return Number(levelId) <= unlockedLevel
    },
    [unlockedLevel],
  )

  const value = useMemo(
    () => ({
      score,
      currentLevel,
      unlockedLevel,
      answersByLevel,
      createdPizza,
      recordAnswer,
      resolveLevel,
      retryLevel,
      savePizza,
      restartGame,
      canAccessLevel,
    }),
    [
      score,
      currentLevel,
      unlockedLevel,
      answersByLevel,
      createdPizza,
      recordAnswer,
      resolveLevel,
      retryLevel,
      savePizza,
      restartGame,
      canAccessLevel,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
