import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import {
  clampScore,
  createInitialGameState,
  didPassOrderLevel,
  didPassLevel,
  evaluateOrder,
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
  const {
    score,
    currentLevel,
    unlockedLevel,
    answersByLevel,
    orderResultsByLevel,
    createdPizza,
    gameCompleted,
  } = gameState
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
      if (!level) return false
      const passed =
        level.type === 'trivia'
          ? didPassLevel(
              answersByLevel[level.id] ?? [],
              level.questions.length,
            )
          : level.type === 'order'
            ? didPassOrderLevel(
                level,
                orderResultsByLevel[level.id] ?? [],
              )
            : false
      if (passed) {
        setGameState((current) => ({
          ...current,
          unlockedLevel: Math.max(
            current.unlockedLevel,
            Math.min(level.id + 1, getLevel(level.id + 1)?.id ?? level.id),
          ),
          currentLevel:
            level.type === 'order'
              ? level.id
              : Math.max(current.currentLevel, level.id + 1),
          gameCompleted:
            level.type === 'order' ? passed : current.gameCompleted,
        }))
      }
      return passed
    },
    [answersByLevel, orderResultsByLevel],
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
      currentLevel: 9,
    }))
  }, [])

  const recordOrderResult = useCallback(
    (levelId, order, selection) => {
      const previous = orderResultsByLevel[levelId]?.find(
        (result) => result.orderId === order.id,
      )
      if (previous) return previous

      const evaluation = evaluateOrder(order, selection)
      const level = getLevel(levelId)
      const pointsAwarded = evaluation.satisfied
        ? level.scoring.pointsPerSatisfiedOrder
        : 0
      const entry = {
        orderId: order.id,
        customerName: order.customerName,
        message: order.message,
        satisfied: evaluation.satisfied,
        requirements: evaluation.requirements,
        pointsAwarded,
      }

      setGameState((current) => {
        const previousResults = current.orderResultsByLevel[levelId] ?? []
        if (previousResults.some((result) => result.orderId === order.id)) {
          return current
        }
        return {
          ...current,
          score: clampScore(current.score + pointsAwarded),
          orderResultsByLevel: {
            ...current.orderResultsByLevel,
            [levelId]: [...previousResults, entry],
          },
        }
      })
      return entry
    },
    [orderResultsByLevel],
  )

  const retryOrderLevel = useCallback((levelId) => {
    setGameState((current) => {
      const previous = current.orderResultsByLevel[levelId] ?? []
      const awarded = previous.reduce(
        (total, result) => total + result.pointsAwarded,
        0,
      )
      const next = { ...current.orderResultsByLevel }
      delete next[levelId]
      return {
        ...current,
        score: clampScore(current.score - awarded),
        orderResultsByLevel: next,
        currentLevel: Number(levelId),
        gameCompleted: false,
      }
    })
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
      orderResultsByLevel,
      createdPizza,
      gameCompleted,
      recordAnswer,
      recordOrderResult,
      resolveLevel,
      retryLevel,
      retryOrderLevel,
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
      orderResultsByLevel,
      createdPizza,
      gameCompleted,
      recordAnswer,
      recordOrderResult,
      resolveLevel,
      retryLevel,
      retryOrderLevel,
      savePizza,
      restartGame,
      canAccessLevel,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
