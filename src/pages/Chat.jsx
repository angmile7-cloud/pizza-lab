import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RewardDialog, RewardHeader } from '../components/RewardUI'
import { RewardIcon } from '../components/RewardArt'
import rewardsData from '../data/rewards.json'
import { useGame } from '../game/useGame'
import { chefQuestions, rewardError, rewardText } from '../game/rewardsUtils'

const chatReward = rewardsData.rewards.find((reward) => reward.id === 'pregunta-chef')

export default function Chat() {
  const {
    availablePoints, totalScore, rewardsUnlocked, redemptions,
    answeredQuestionIds, redeemReward,
  } = useGame()
  const [topicId, setTopicId] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [activeQuestionId, setActiveQuestionId] = useState(null)
  const confirmingRef = useRef(false)
  const headingRef = useRef(null)
  const topic = rewardsData.chefTopics.find((item) => item.id === topicId)
  const closeDialog = useCallback(() => setDialog(null), [])
  const conversation = redemptions.filter((item) => item.rewardId === chatReward.id)

  useEffect(() => {
    if (!activeQuestionId) return
    const answer = document.getElementById(`answer-${activeQuestionId}`)
    answer?.focus({ preventScroll: true })
    answer?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [activeQuestionId])

  function chooseTopic(id) {
    setTopicId(id)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function showAnswer(questionId) {
    setActiveQuestionId(questionId)
    // Reopening the active answer must also bring it back into view.
    requestAnimationFrame(() => {
      const answer = document.getElementById(`answer-${questionId}`)
      answer?.focus({ preventScroll: true })
      answer?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    })
  }

  function chooseQuestion(question) {
    if (answeredQuestionIds.includes(question.id)) {
      showAnswer(question.id)
      return
    }
    confirmingRef.current = false
    setDialog({ question, requestId: crypto.randomUUID() })
  }

  function confirmQuestion() {
    if (confirmingRef.current) return
    confirmingRef.current = true
    const result = redeemReward(chatReward.id, dialog.question.id, dialog.requestId)
    if (result.error) {
      setDialog({ ...dialog, error: result.error })
      return
    }
    setAnnouncement(rewardText('answerReady'))
    setDialog(null)
    showAnswer(dialog.question.id)
  }

  return (
    <section className="rewards-screen chef-chat">
      <div className="rewards-layout" inert={Boolean(dialog)}>
        <RewardHeader availablePoints={availablePoints} totalScore={totalScore} />
        <div className="rewards-scroll chef-chat__scroll">
          <h2>{rewardText('chatTitle')}</h2>
          <p className="chef-chat__intro">{rewardText('chatIntro')}</p>
          {topic && <button className="rewards-cancel chef-chat__back" type="button" onClick={() => chooseTopic(null)}>
            {rewardText('backTopics')}
          </button>}
          <h3 ref={headingRef} tabIndex={-1}>{topic?.title ?? rewardText('topics')}</h3>
          {!topic ? <div className="chef-topics">
            {rewardsData.chefTopics.map((item) => (
              <button type="button" key={item.id} className="chef-topic" onClick={() => chooseTopic(item.id)}>
                <RewardIcon icon={item.icon} /><span>{item.title}</span>
              </button>
            ))}
          </div> : <ul className="chef-questions">
            {topic.questions.map((question) => {
              const answered = answeredQuestionIds.includes(question.id)
              const error = rewardError(chatReward, rewardsUnlocked, availablePoints, redemptions, question.id)
              const disabled = !rewardsUnlocked || (!answered && Boolean(error))
              return <li key={question.id}>
                <button type="button" className="recipe-option" disabled={disabled} onClick={() => chooseQuestion(question)}>
                  <span>{question.text}
                    <small>{!rewardsUnlocked ? error : answered ? rewardText('answered') : error ?? rewardText('optionCost', { cost: chatReward.cost })}</small>
                  </span>
                </button>
              </li>
            })}
          </ul>}
          <section className="chef-conversation" aria-live="polite" aria-label={rewardText('conversation')}>
            {conversation.map((redemption) => {
              const question = chefQuestions.find((item) => item.id === redemption.optionId)
              return <article key={redemption.index} id={`answer-${question.id}`} tabIndex={-1} className={activeQuestionId === question.id ? 'chef-answer chef-answer--active' : 'chef-answer'}>
                <div className="chef-bubble chef-bubble--user"><strong>{rewardText('player')}</strong><p>{question.text}</p></div>
                <div className="chef-bubble"><strong>{rewardText('chef')}</strong><p>{question.answer}</p></div>
              </article>
            })}
          </section>
        </div>
        <footer className="rewards-footer chef-chat__footer">
          <Link className="btn-yellow" to="/jugar">{rewardText('backGame')}</Link>
          <Link className="btn-yellow" to="/recompensas">{rewardText('backRewards')}</Link>
        </footer>
      </div>
      <div role="status" className="rewards-announcement">{announcement}</div>
      {dialog && <RewardDialog title={rewardText('confirmQuestion', { cost: chatReward.cost })} onClose={closeDialog}>
        <p>{dialog.question.text}</p>
        {dialog.error && <p role="alert">{dialog.error}</p>}
        <div className="rewards-dialog__actions">
          <button className="rewards-cancel" type="button" onClick={closeDialog}>{rewardText('cancel')}</button>
          <button className="btn-yellow" type="button" disabled={Boolean(dialog.error)} onClick={confirmQuestion}>{rewardText('ask')}</button>
        </div>
      </RewardDialog>}
    </section>
  )
}
