import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RecipeContent, RewardDialog, RewardHeader } from '../components/RewardUI'
import { RewardIcon, RewardTicket } from '../components/RewardArt'
import rewardsData from '../data/rewards.json'
import { useGame } from '../game/useGame'
import { chefQuestions, rewardError, rewardText } from '../game/rewardsUtils'

function VoucherResult({ reward, redemption }) {
  const [copyStatus, setCopyStatus] = useState('')
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])
  async function copyCode() {
    let copied = false
    try {
      await navigator.clipboard.writeText(redemption.code)
      copied = true
    } catch {
      // Older browsers and denied clipboard permission use the selected code.
      inputRef.current.focus()
      inputRef.current.select()
      try {
        copied = document.execCommand('copy')
      } catch {
        copied = false
      }
    }
    clearTimeout(timerRef.current)
    setCopyStatus(copied ? rewardsData.voucherLabels.copied : rewardsData.voucherLabels.copyError)
    if (copied) timerRef.current = setTimeout(() => setCopyStatus(''), 2000)
  }
  return <>
    <RewardTicket reward={reward} redemption={redemption} />
    <p>{reward.voucher.caption}</p>
    <p>{reward.voucher.instruction}</p>
    <p className="rewards-small">{reward.voucher.notice}</p>
    <label className="rewards-code-label">
      {rewardsData.voucherLabels.code}
      <input ref={inputRef} readOnly value={redemption.code} onFocus={(event) => event.target.select()} />
    </label>
    <button type="button" className="btn-yellow" onClick={copyCode}>{rewardsData.voucherLabels.copy}</button>
    <p role="status" className="rewards-copy-status">{copyStatus}</p>
  </>
}

export default function RewardsScreen() {
  const { availablePoints, totalScore, rewardsUnlocked, redemptions, redeemReward, unlockedRecipeIds } = useGame()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const confirmingRef = useRef(false)
  const resultTimer = useRef(null)
  const closeDialog = useCallback(() => {
    clearTimeout(resultTimer.current)
    setDialog(null)
  }, [])
  useEffect(() => () => clearTimeout(resultTimer.current), [])

  function openConfirmation(reward, recipe) {
    confirmingRef.current = false
    setDialog({ type: 'confirm', reward, recipe, requestId: crypto.randomUUID() })
  }

  function confirmRedemption() {
    if (confirmingRef.current || dialog.type !== 'confirm') return
    confirmingRef.current = true
    const { reward, recipe, requestId } = dialog
    const result = redeemReward(reward.id, recipe?.id, requestId)
    if (result.error) {
      setAnnouncement(result.error)
      setDialog({ type: 'error', message: result.error })
      return
    }
    const { redemption } = result
    setAnnouncement(rewardText('redeemed', { title: recipe?.title ?? reward.title, cost: reward.cost }))
    setDialog({ type: 'pending', reward })
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350
    resultTimer.current = setTimeout(() => {
      setDialog({ type: reward.type, reward, redemption, recipe })
    }, delay)
  }

  return (
    <section className="rewards-screen">
      <div className="rewards-layout" inert={Boolean(dialog)}>
        <RewardHeader availablePoints={availablePoints} totalScore={totalScore} />
        <div className="rewards-scroll">
          <h2>{rewardText('rewardsTitle')}</h2>
          <div className="rewards-grid">
            {rewardsData.rewards.map((reward) => {
              const error = rewardError(reward, rewardsUnlocked, availablePoints, redemptions)
              const browsing = reward.type === 'content' || reward.type === 'chat'
              return (
                <article key={reward.id} className="reward-card">
                  <RewardIcon icon={reward.icon} className="reward-card__icon" />
                  <h3>{reward.title}</h3>
                  <strong>{rewardText('points', { cost: reward.cost })}</strong>
                  <button type="button" className="btn-yellow" disabled={browsing ? !rewardsUnlocked : Boolean(error)} aria-label={rewardText('redeemLabel', reward)} aria-describedby={`${reward.id}-reason`} onClick={() => {
                    if (reward.type === 'chat') navigate('/chat')
                    else if (reward.type === 'content') setDialog({ type: 'picker', reward })
                    else openConfirmation(reward)
                  }}>
                    {!rewardsUnlocked && <span aria-hidden="true">🔒 </span>}{rewardText('redeem')}
                  </button>
                  <p id={`${reward.id}-reason`} className="reward-card__reason">{error}</p>
                </article>
              )
            })}
          </div>
          {unlockedRecipeIds.length > 0 && <section className="rewards-history">
            <h2>{rewardText('myRecipes')}</h2>
            <ul className="recipe-options">
              {rewardsData.secretRecipes.filter((recipe) => unlockedRecipeIds.includes(recipe.id)).map((recipe) =>
                <li key={recipe.id}>
                  <button type="button" className="recipe-option" onClick={() => setDialog({ type: 'content', recipe })}>
                    <RewardIcon icon="book" /><span>{recipe.title}<small>{rewardText('unlockedRecipe')}</small></span>
                  </button>
                </li>)}
            </ul>
          </section>}
          {redemptions.some((item) => item.rewardId !== 'recetas-secretas') && <section className="rewards-history">
            <h2>{rewardText('history')}</h2>
            <ol>
              {redemptions.filter((item) => item.rewardId !== 'recetas-secretas').map((redemption) => {
                const reward = rewardsData.rewards.find((item) => item.id === redemption.rewardId)
                const question = chefQuestions.find((item) => item.id === redemption.optionId)
                return <li key={redemption.index}>
                  <button
                    type="button"
                    className="rewards-history__open"
                    aria-label={rewardText('viewRedemption', { index: redemption.index, title: question?.text ?? reward.title })}
                    onClick={() => {
                      if (reward.type === 'chat') navigate('/chat')
                      else setDialog({ type: reward.type, reward, redemption })
                    }}
                  >
                    {reward.type === 'voucher'
                      ? <RewardTicket reward={reward} redemption={redemption} />
                      : <div className="rewards-history__entry">
                        <RewardIcon icon={reward.icon} />
                        <span>#{redemption.index} · {question?.text ?? reward.title}<small>{rewardText('points', { cost: redemption.cost })}</small></span>
                      </div>}
                  </button>
                </li>
              })}
            </ol>
          </section>}
        </div>
        <footer className="rewards-footer">
          <p>{rewardText('footer')}</p>
          <Link className="btn-yellow" to="/jugar">{rewardText('home')}</Link>
        </footer>
      </div>
      <div className="rewards-announcement" role="status" aria-live="polite">{announcement}</div>
      {dialog && <RewardDialog key={dialog.type} title={
        dialog.type === 'confirm' ? rewardText('confirmRecipe', { title: dialog.recipe?.title ?? dialog.reward.title, cost: dialog.reward.cost })
          : dialog.type === 'picker' ? rewardText('recipePicker')
          : dialog.type === 'error' ? rewardText('errorTitle')
            : dialog.type === 'pending' ? rewardText('preparing')
              : dialog.type === 'content' ? dialog.recipe.title : dialog.reward.title
      } onClose={closeDialog}>
        {dialog.type === 'confirm' ? <>
          <p>{dialog.reward.description}</p>
          <div className="rewards-dialog__actions">
            <button type="button" className="rewards-cancel" onClick={() => {
              if (dialog.recipe) setDialog({ type: 'picker', reward: dialog.reward })
              else closeDialog()
            }}>{rewardText('cancel')}</button>
            <button type="button" className="btn-yellow" onClick={confirmRedemption}>{rewardText('confirmRedeem')}</button>
          </div>
        </> : <>
          {dialog.type === 'error' && <p role="alert">{dialog.message}</p>}
          {dialog.type === 'picker' && <>
            <button type="button" className="rewards-cancel" onClick={closeDialog}>{rewardText('close')}</button>
            <ul className="recipe-options">
              {rewardsData.secretRecipes.map((recipe) => {
                const owned = unlockedRecipeIds.includes(recipe.id)
                const error = rewardError(dialog.reward, rewardsUnlocked, availablePoints, redemptions, recipe.id)
                return <li key={recipe.id}>
                  <button type="button" className="recipe-option" disabled={!owned && Boolean(error)} onClick={() => {
                    if (owned) setDialog({ type: 'content', recipe })
                    else openConfirmation(dialog.reward, recipe)
                  }}>
                    <RewardIcon icon="book" />
                    <span><strong>{recipe.title}</strong><small>{recipe.subtitle}</small>
                      <small>{owned ? rewardText('unlockedRecipe') : error ?? rewardText('optionCost', { cost: dialog.reward.cost })}</small>
                    </span>
                  </button>
                </li>
              })}
            </ul>
          </>}
          {dialog.type === 'content' && <RecipeContent recipe={dialog.recipe} />}
          {dialog.type === 'voucher' && <VoucherResult reward={dialog.reward} redemption={dialog.redemption} />}
          {dialog.type !== 'picker' && <button type="button" className="rewards-cancel" onClick={closeDialog}>{rewardText('close')}</button>}
        </>}
      </RewardDialog>}
    </section>
  )
}
