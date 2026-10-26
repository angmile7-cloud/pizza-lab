import rewardsData from '../data/rewards.json'
import { getPassedLevelIds } from './ordersModeUtils'

export function rewardText(key, values = {}) {
  return rewardsData.labels[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name]))
}

export const chefQuestions = rewardsData.chefTopics.flatMap((topic) => topic.questions)

export function getRewardOption(reward, optionId) {
  if (reward?.type === 'content') return rewardsData.secretRecipes.find((recipe) => recipe.id === optionId)
  if (reward?.type === 'chat') return chefQuestions.find((question) => question.id === optionId)
  return null
}

export function areRewardsUnlocked(state) {
  return getPassedLevelIds(state).includes(rewardsData.unlockAfterLevel)
}

export function rewardError(reward, unlocked, availablePoints, redemptions, optionId) {
  if (!reward) return rewardText('unknownReward')
  if (!unlocked) {
    return rewardText('locked', { level: rewardsData.unlockAfterLevel })
  }
  if (optionId !== undefined) {
    if (!getRewardOption(reward, optionId)) return rewardText('invalidOption')
    if (redemptions.some((item) => item.rewardId === reward.id && item.optionId === optionId)) {
      return rewardText(reward.type === 'chat' ? 'answered' : 'alreadyBought')
    }
  }
  if (redemptions.filter((item) => item.rewardId === reward.id).length >= reward.maxRedeems) {
    return rewardText(reward.type === 'content' ? 'complete' : 'alreadyRedeemed')
  }
  if (availablePoints < reward.cost) {
    return rewardText('missingPoints', { missing: reward.cost - availablePoints })
  }
  return null
}

export function createVoucherCode(redemptions) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(4))
    code = `PIZZA-${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')}`
  } while (redemptions.some((item) => item.code === code))
  return code
}
