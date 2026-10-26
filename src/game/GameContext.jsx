import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import {
  clampScore,
  createInitialGameState,
  didPassOrderLevel,
  didPassLevel,
  evaluateOrder,
  getLevel,
  LEVELS,
  POINTS_PER_CORRECT,
  POINTS_PER_WRONG,
} from './gameUtils'
import {
  createOrdersShift,
  getConsecutivePassedLevelCount,
  getPassedLevelIds,
} from './ordersModeUtils'
import rewardsData from '../data/rewards.json'
import { areRewardsUnlocked, createVoucherCode, getRewardOption, rewardError, rewardText } from './rewardsUtils'

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
    levelScore,
    orderScore,
    currentLevel,
    unlockedLevel,
    answersByLevel,
    orderResultsByLevel,
    createdPizza,
    gameCompleted,
    ordersMode,
    spentPoints,
    redemptions,
  } = gameState
  // Reserve spending synchronously; React may batch updates or replay updaters.
  const rewardLedgerRef = useRef({ spentPoints: 0, redemptions: [], requests: new Map() })
  const scoredKeysRef = useRef(new Set())
  const scoredOrderKeysRef = useRef(new Set())
  const totalScore = levelScore + orderScore
  const availablePoints = Math.max(0, totalScore - spentPoints)
  const rewardsUnlocked = areRewardsUnlocked(gameState)
  const unlockedRecipeIds = useMemo(() => redemptions
    .filter((item) => item.rewardId === 'recetas-secretas')
    .map((item) => item.optionId), [redemptions])
  const answeredQuestionIds = useMemo(() => redemptions
    .filter((item) => item.rewardId === 'pregunta-chef')
    .map((item) => item.optionId), [redemptions])
  const passedLevelIds = getPassedLevelIds({
    answersByLevel,
    orderResultsByLevel,
    createdPizza,
  })
  const unlockedStage = Math.min(
    LEVELS.length,
    getConsecutivePassedLevelCount(passedLevelIds),
  )

  const resetProgress = useCallback(() => {
    setGameState(createInitialGameState())
    scoredKeysRef.current = new Set()
    scoredOrderKeysRef.current = new Set()
    rewardLedgerRef.current = { spentPoints: 0, redemptions: [], requests: new Map() }
  }, [])

  const redeemReward = useCallback((rewardId, optionId, requestId) => {
    const ledger = rewardLedgerRef.current
    const requestKey = requestId ? `${rewardId}:${optionId ?? ''}:${requestId}` : null
    if (requestKey && ledger.requests.has(requestKey)) {
      return ledger.requests.get(requestKey)
    }
    // Calls before the first state commit belong to the same pending tap.
    const pending = ledger.redemptions.find(
      (item) => item.rewardId === rewardId && item.optionId === optionId && !redemptions.includes(item),
    )
    if (pending) {
      const result = { redemption: pending }
      if (requestKey) ledger.requests.set(requestKey, result)
      return result
    }
    const reward = rewardsData.rewards.find((item) => item.id === rewardId)
    if (reward && reward.type !== 'voucher' && !getRewardOption(reward, optionId)) {
      return { error: rewardText('invalidOption') }
    }
    const error = rewardError(
      reward, rewardsUnlocked, Math.max(0, totalScore - ledger.spentPoints), ledger.redemptions, optionId,
    )
    if (error) return { error }
    const redemption = {
      rewardId,
      optionId,
      code: reward.type === 'voucher' ? createVoucherCode(ledger.redemptions) : null,
      cost: reward.cost,
      index: ledger.redemptions.length + 1,
    }
    const nextSpent = ledger.spentPoints + reward.cost
    const nextRedemptions = [...ledger.redemptions, redemption]
    const result = { redemption }
    ledger.spentPoints = nextSpent
    ledger.redemptions = nextRedemptions
    if (requestKey) ledger.requests.set(requestKey, result)
    setGameState((current) => ({
      ...current, spentPoints: nextSpent, redemptions: nextRedemptions,
    }))
    return result
  }, [redemptions, rewardsUnlocked, totalScore])

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

    const appliedDelta = clampScore(levelScore + pointsDelta) - levelScore
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
        levelScore: clampScore(current.levelScore + pointsDelta),
        answersByLevel: {
          ...current.answersByLevel,
          [levelId]: [...previous, { ...entry }],
        },
      }
    })

    return entry
  }, [answersByLevel, levelScore])

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
          levelScore: clampScore(current.levelScore + pointsAwarded),
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

  const addOrderPoints = useCallback((orderKey, points) => {
    if (typeof orderKey !== 'string' || !orderKey) {
      throw new Error('Se necesita una clave de pedido para sumar puntos')
    }
    if (!Number.isFinite(points) || points < 0) {
      throw new Error('Los puntos de pedidos deben ser un número no negativo')
    }
    if (scoredOrderKeysRef.current.has(orderKey)) return

    scoredOrderKeysRef.current.add(orderKey)
    setGameState((current) => ({
      ...current,
      orderScore: current.orderScore + points,
    }))
  }, [])

  const startShift = useCallback((stage) => {
    const numericStage = Number(stage)
    if (
      !Number.isInteger(numericStage) ||
      numericStage < 1 ||
      numericStage > unlockedStage
    ) {
      return null
    }
    const existing = ordersMode.shifts[numericStage]
    if (existing) return existing.status === 'completed' ? null : existing

    const shift = {
      stage: numericStage,
      orderIds: createOrdersShift(numericStage),
      results: [],
      status: 'inProgress',
      score: 0,
    }
    setGameState((current) => {
      if (current.ordersMode.shifts[numericStage]) return current
      return {
        ...current,
        ordersMode: {
          ...current.ordersMode,
          shifts: {
            ...current.ordersMode.shifts,
            [numericStage]: shift,
          },
        },
      }
    })
    return shift
  }, [ordersMode.shifts, unlockedStage])

  const recordShiftOrderResult = useCallback((stage, result) => {
    setGameState((current) => {
      const shift = current.ordersMode.shifts[stage]
      if (
        !shift ||
        !shift.orderIds.includes(result.orderId) ||
        shift.results.some((item) => item.orderId === result.orderId)
      ) {
        return current
      }
      const results = [...shift.results, result]
      const completed = shift.orderIds.every((orderId) =>
        results.some((item) => item.orderId === orderId),
      )
      return {
        ...current,
        ordersMode: {
          ...current.ordersMode,
          shifts: {
            ...current.ordersMode.shifts,
            [stage]: {
              ...shift,
              results,
              status: completed ? 'completed' : 'inProgress',
              score: shift.score + (result.pointsAwarded ?? 0),
            },
          },
          activeOrder:
            current.ordersMode.activeOrder?.stage === Number(stage) &&
            current.ordersMode.activeOrder?.orderId === result.orderId
              ? null
              : current.ordersMode.activeOrder,
        },
      }
    })
  }, [])

  const markActiveOrder = useCallback((stage, orderId) => {
    setGameState((current) => ({
      ...current,
      ordersMode: {
        ...current.ordersMode,
        activeOrder: { stage: Number(stage), orderId },
      },
    }))
  }, [])

  const clearActiveOrder = useCallback(() => {
    setGameState((current) => ({
      ...current,
      ordersMode: { ...current.ordersMode, activeOrder: null },
    }))
  }, [])

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
        levelScore: clampScore(current.levelScore - awarded),
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
      levelScore,
      orderScore,
      totalScore,
      spentPoints,
      redemptions,
      availablePoints,
      rewardsUnlocked,
      redeemReward,
      unlockedRecipeIds,
      answeredQuestionIds,
      currentLevel,
      unlockedLevel,
      answersByLevel,
      orderResultsByLevel,
      createdPizza,
      gameCompleted,
      ordersMode,
      unlockedStage,
      recordAnswer,
      recordOrderResult,
      addOrderPoints,
      startShift,
      recordShiftOrderResult,
      markActiveOrder,
      clearActiveOrder,
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
      levelScore,
      orderScore,
      totalScore,
      spentPoints,
      redemptions,
      availablePoints,
      rewardsUnlocked,
      redeemReward,
      unlockedRecipeIds,
      answeredQuestionIds,
      currentLevel,
      unlockedLevel,
      answersByLevel,
      orderResultsByLevel,
      createdPizza,
      gameCompleted,
      ordersMode,
      unlockedStage,
      recordAnswer,
      recordOrderResult,
      addOrderPoints,
      startShift,
      recordShiftOrderResult,
      markActiveOrder,
      clearActiveOrder,
      resolveLevel,
      retryLevel,
      retryOrderLevel,
      savePizza,
      restartGame,
      canAccessLevel,
    ],
  )

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}
