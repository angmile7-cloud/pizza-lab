import ordersData from '../data/orders.json'
import {
  didPassLevel,
  didPassOrderLevel,
  LEVELS,
} from './gameUtils'

export const ORDER_TOPICS = ordersData.topics
export const ORDER_TIERS = ordersData.tiers

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

function getConsecutivePassedLevelCount(passedLevelIds) {
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

export function getPassedOrderTopics(passedLevelIds) {
  const consecutivePassedLevelCount =
    getConsecutivePassedLevelCount(passedLevelIds)
  return ORDER_TOPICS.filter(
    (topic) => topic.level <= consecutivePassedLevelCount,
  )
}

export function getTierById(tierId) {
  return ORDER_TIERS.find((tier) => tier.id === tierId)
}

export function createOrdersRound(passedLevelIds) {
  const stage = getConsecutivePassedLevelCount(passedLevelIds)
  const currentTier = getOrdersModeTier(passedLevelIds)
  const passedTopics = getPassedOrderTopics(passedLevelIds)
  const latestTopic = passedTopics.at(-1)

  if (stage === 0 || !latestTopic) {
    throw new Error('Se necesita aprobar el nivel 1 para jugar pedidos')
  }

  const candidates = ORDERS.filter((order) => order.stage === stage)
  if (candidates.length < 5) {
    throw new Error(`Faltan pedidos para la etapa ${stage}`)
  }

  const shuffled = [...candidates]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const order = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = order
  }
  return shuffled.slice(0, 5).map((order) => ({
    ...order,
    tier: currentTier.id,
    timeSeconds: currentTier.timeSeconds,
  }))
}
