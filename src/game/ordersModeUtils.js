import ordersData from '../data/orders.json'
import {
  didPassLevel,
  didPassOrderLevel,
  LEVELS,
} from './gameUtils'

export const ORDER_TOPICS = ordersData.topics
export const ORDER_TIERS = ordersData.tiers
export const ORDER_SHIFT_SIZES = ordersData.shiftSizes
export const ORDER_TIME_BONUS_MAX = ordersData.timeBonusMax

function mapPoolRequirement(order, requirement, index) {
  const id = `${order.id}-requirement-${index + 1}`
  if (requirement.type === 'slotIs') {
    return {
      id,
      type: 'mustInclude',
      slot: requirement.slot,
      choiceIds: [requirement.value],
      feedback: `El pedido requiere ${requirement.value} en ${requirement.slot}.`,
    }
  }
  if (requirement.type === 'slotNotIn') {
    return {
      id,
      type: 'slotNotIn',
      slot: requirement.slot,
      values: requirement.values,
      feedback: `El pedido no debe llevar ${requirement.values.join(' ni ')} en ${requirement.slot}.`,
    }
  }
  if (requirement.type === 'toppingIncluded') {
    return {
      id,
      type: 'mustInclude',
      slot: 'toppings',
      choiceIds: [requirement.id],
      feedback: `Incluye ${requirement.id} entre los toppings solicitados.`,
    }
  }
  if (requirement.type === 'toppingPick') {
    return {
      id,
      type: 'toppingPick',
      slot: 'toppings',
      ids: requirement.ids,
      min: requirement.min,
      max: requirement.max,
      feedback: `Elige de ${requirement.ids.join(' o ')}: entre ${requirement.min} y ${requirement.max}.`,
    }
  }
  throw new Error(`Tipo de requisito desconocido en ${order.id}: ${requirement.type}`)
}

export const ORDERS = ordersData.orders.map((order) => ({
  ...order,
  requirements: order.requirements.map((requirement, index) =>
    mapPoolRequirement(order, requirement, index),
  ),
}))

export function getConsecutivePassedLevelCount(passedLevelIds) {
  const passed = new Set(passedLevelIds)
  let count = 0
  while (passed.has(count + 1)) count += 1
  return count
}

export function getPassedLevelIds({
  answersByLevel = {},
  orderResultsByLevel = {},
  createdPizza,
}) {
  return LEVELS.filter((level) => {
    if (level.type === 'trivia') {
      return didPassLevel(
        answersByLevel[level.id] ?? answersByLevel[String(level.id)] ?? [],
        level.questions.length,
      )
    }
    if (level.type === 'builder') return Boolean(createdPizza)
    if (level.type === 'order') {
      return didPassOrderLevel(
        level,
        orderResultsByLevel[level.id] ??
          orderResultsByLevel[String(level.id)] ??
          [],
      )
    }
    return false
  }).map((level) => level.id)
}

export function getOrdersModeTier(passedLevelIds) {
  const consecutivePassedLevelCount =
    getConsecutivePassedLevelCount(passedLevelIds)
  const tier = [...ORDER_TIERS]
    .reverse()
    .find((item) => consecutivePassedLevelCount >= item.minPassedLevels)
  return tier ?? ORDER_TIERS[0]
}

export function getTierForStage(stage) {
  const validStage = Number(stage)
  return [...ORDER_TIERS]
    .reverse()
    .find((tier) => validStage >= tier.minPassedLevels) ?? ORDER_TIERS[0]
}

export function getShiftSize(stage) {
  const config = ORDER_SHIFT_SIZES.find(
    (item) => stage >= item.minStage && stage <= item.maxStage,
  )
  if (!config) {
    throw new Error(`No hay un tamaño de turno configurado para la etapa ${stage}`)
  }
  return config.size
}

export function getPassedOrderTopics(passedLevelIds) {
  const consecutivePassedLevelCount =
    getConsecutivePassedLevelCount(passedLevelIds)
  return ORDER_TOPICS.filter(
    (topic) => topic.level <= consecutivePassedLevelCount,
  )
}

export function getOrderTopicsForStage(stage) {
  return ORDER_TOPICS.filter((topic) => topic.level <= stage)
}

export function getTierById(tierId) {
  return ORDER_TIERS.find((tier) => tier.id === tierId)
}

export function createOrdersShift(stage) {
  const shiftSize = getShiftSize(stage)
  const candidates = ORDERS.filter((order) => order.stage === stage)
  if (candidates.length < shiftSize) {
    throw new Error(`Faltan pedidos para la etapa ${stage}`)
  }

  const shuffled = [...candidates]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const order = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = order
  }
  return shuffled
    .slice(0, shiftSize)
    .sort(
      (left, right) =>
        left.requirements.length - right.requirements.length ||
        ORDERS.indexOf(left) - ORDERS.indexOf(right),
    )
    .map((order) => order.id)
}
