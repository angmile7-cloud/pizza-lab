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
const USER_NAME_KEY = 'pizza-lab:userName'

function readUserName() {
  try {
    return window.localStorage.getItem(USER_NAME_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

function answerKey(levelId, questionId) {
  return `${levelId}:${questionId}`
}

export function GameProvider({ children }) {
  const [userName, setUserNameState] = useState(readUserName)
  const [gameState, setGameState] = useState(createInitialGameState)
  const { score, currentLevel, unlockedLevel, answersByLevel, createdPizza } =
    gameState
  const scoredKeysRef = useRef(new Set())

  const resetProgress = useCallback(() => {
    setGameState(createInitialGameState())
    scoredKeysRef.current = new Set()
  }, [])

  const setUserName = useCallback((name) => {
    const nextName = typeof name === 'string' ? name.trim() : ''
    setUserNameState(nextName)
    try {
      window.localStorage.setItem(USER_NAME_KEY, nextName)
    } catch {
      // Keep the in-memory name if storage is unavailable.
    }
  }, [])

  const startNewGame = useCallback((name) => {
    resetProgress()
    const nextName = typeof name === 'string' ? name.trim() : ''
    setUserNameState(nextName)
    try {
      window.localStorage.setItem(USER_NAME_KEY, nextName)
    } catch {
      // Keep the in-memory name if storage is unavailable.
    }
  }, [resetProgress])

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

    setGameState((current) => {
      const previous = current.answersByLevel[levelId] ?? []
      if (previous.some((answer) => answer.questionId === question.id)) {
        return current
      }
      return {
        ...current,
        score: clampScore(current.score + pointsDelta),
        answersByLevel: {
          ...current.answersByLevel,
          [levelId]: [...previous, { ...entry }],
        },
      }
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
        setGameState((current) => ({
          ...current,
          unlockedLevel: Math.max(current.unlockedLevel, nextId),
          currentLevel: Math.max(current.currentLevel, nextId),
        }))
      }
      return passed
    },
    [answersByLevel],
  )

  const retryLevel = useCallback((levelId) => {
    setGameState((current) => {
      const answers = current.answersByLevel[levelId] ?? current.answersByLevel[Number(levelId)] ?? []
      answers.forEach((answer) => {
        scoredKeysRef.current.delete(answerKey(levelId, answer.questionId))
        scoredKeysRef.current.delete(answerKey(Number(levelId), answer.questionId))
      })
      const next = { ...current.answersByLevel }
      delete next[Number(levelId)]
      delete next[levelId]
      return { ...current, answersByLevel: next }
    })
  }, [])

  const savePizza = useCallback((pizza) => {
    setGameState((current) => ({
      ...current,
      createdPizza: pizza,
      unlockedLevel: Math.max(current.unlockedLevel, 9),
      currentLevel: 8,
    }))
  }, [])

  const restartGame = resetProgress

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
      userName,
      setUserName,
      startNewGame,
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
      userName,
      setUserName,
      startNewGame,
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
