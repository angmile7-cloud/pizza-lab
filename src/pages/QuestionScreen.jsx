import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { getLevel, MIN_CORRECT_TO_UNLOCK } from '../game/gameUtils'
import LevelScene from '../components/LevelScene'

export default function QuestionScreen() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const { canAccessLevel, recordAnswer, answersByLevel } = useGame()
  const level = getLevel(levelId)
  const savedCount = answersByLevel[Number(levelId)]?.length ?? 0
  const [questionIndex, setQuestionIndex] = useState(savedCount)
  const [selectedOptionId, setSelectedOptionId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  if (!level) {
    return <Navigate to="/" replace />
  }

  if (level.type === 'builder') {
    return <Navigate to={`/nivel/${level.id}/pizza`} replace />
  }

  if (!canAccessLevel(level.id)) {
    return <Navigate to="/" replace />
  }

  const total = level.questions.length

  if (questionIndex >= total) {
    return <Navigate to={`/nivel/${level.id}/resultado`} replace />
  }

  const question = level.questions[questionIndex]

  function handleConfirm() {
    if (!selectedOptionId || feedback) return
    const result = recordAnswer(level.id, question, selectedOptionId)
    setFeedback(result)
  }

  function handleNext() {
    const nextIndex = questionIndex + 1
    setSelectedOptionId(null)
    setFeedback(null)
    if (nextIndex >= total) {
      navigate(`/nivel/${level.id}/resultado`)
      return
    }
    setQuestionIndex(nextIndex)
  }

  return (
    <LevelScene levelId={level.id}>
      <section className="page level-page level-question">
        <h1 className="level-question__level">{level.title}:</h1>
        <p className="level-progress">
          Pregunta {questionIndex + 1} de {total} (avanzas con al menos{' '}
          {MIN_CORRECT_TO_UNLOCK} aciertos)
        </p>
        <h2 className="level-question__prompt">{question.prompt}</h2>
        <ul className="level-options">
          {question.options.map((option) => (
            <li key={option.id}>
              <label
                className={`level-option${selectedOptionId === option.id ? ' is-selected' : ''}${feedback && option.id === question.correctOptionId ? ' is-correct' : ''}${feedback && selectedOptionId === option.id && !feedback.correct ? ' is-incorrect' : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  disabled={Boolean(feedback)}
                  onChange={() => setSelectedOptionId(option.id)}
                />{' '}
                <span className="level-option__dot" aria-hidden="true" />
                <span className="level-option__text">{option.text}</span>
              </label>
            </li>
          ))}
        </ul>
        {!feedback ? (
          <button
            className="level-action level-action--confirm"
            type="button"
            onClick={handleConfirm}
            disabled={!selectedOptionId}
          >
            Confirmar
          </button>
        ) : (
          <div className={`level-feedback ${feedback.correct ? 'is-correct' : 'is-incorrect'}`}>
            <p className="level-feedback__result">
              {feedback.correct
                ? `¡Correcto! +${feedback.appliedDelta} puntos`
                : feedback.appliedDelta === 0
                  ? 'Respuesta incorrecta. El puntaje no baja de 0.'
                  : `Respuesta incorrecta. ${feedback.appliedDelta} puntos.`}
            </p>
            <p>{question.explanation}</p>
            <button className="btn-yellow level-action" type="button" onClick={handleNext}>
              {questionIndex + 1 >= total ? 'Ver resultado del nivel' : 'Siguiente pregunta'}
            </button>
          </div>
        )}
        <Link className="level-action level-action--home" to="/jugar">
          Inicio
        </Link>
      </section>
    </LevelScene>
  )
}
