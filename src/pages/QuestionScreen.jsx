import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { getLevel, MIN_CORRECT_TO_UNLOCK } from '../game/gameUtils'

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
    <section>
      <p>
        <Link to="/">Inicio</Link>
      </p>
      <h1>
        Nivel {level.id}: {level.title}
      </h1>
      <p>
        Pregunta {questionIndex + 1} de {total} · Avanzas con al menos{' '}
        {MIN_CORRECT_TO_UNLOCK} aciertos
      </p>
      <h2>{question.prompt}</h2>
      <ul>
        {question.options.map((option) => (
          <li key={option.id}>
            <label>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={selectedOptionId === option.id}
                disabled={Boolean(feedback)}
                onChange={() => setSelectedOptionId(option.id)}
              />{' '}
              {option.text}
            </label>
          </li>
        ))}
      </ul>
      {!feedback ? (
        <button type="button" onClick={handleConfirm} disabled={!selectedOptionId}>
          Confirmar
        </button>
      ) : (
        <div>
          <p>
            {feedback.correct
              ? `¡Correcto! +${feedback.appliedDelta} puntos`
              : feedback.appliedDelta === 0
                ? 'Respuesta incorrecta. El puntaje no baja de 0.'
                : `Respuesta incorrecta. ${feedback.appliedDelta} puntos.`}
          </p>
          <p>{question.explanation}</p>
          <button type="button" onClick={handleNext}>
            {questionIndex + 1 >= total ? 'Ver resultado del nivel' : 'Siguiente pregunta'}
          </button>
        </div>
      )}
    </section>
  )
}
