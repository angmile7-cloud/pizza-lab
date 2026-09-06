import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useGame } from '../game/useGame'
import {
  correctCountFromAnswers,
  didPassLevel,
  getLevel,
  levelPath,
  MIN_CORRECT_TO_UNLOCK,
} from '../game/gameUtils'

export default function LevelResultScreen() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const { answersByLevel, canAccessLevel, resolveLevel, retryLevel, score } =
    useGame()
  const level = getLevel(levelId)

  useEffect(() => {
    if (level?.type === 'trivia') {
      resolveLevel(level.id)
    }
  }, [level, resolveLevel])

  if (!level || level.type !== 'trivia') {
    return <Navigate to="/" replace />
  }

  if (!canAccessLevel(level.id)) {
    return <Navigate to="/" replace />
  }

  const answers = answersByLevel[level.id] ?? []
  const expected = level.questions.length

  if (answers.length < expected) {
    return <Navigate to={`/nivel/${level.id}`} replace />
  }

  const passed = didPassLevel(answers, expected)
  const correctCount = correctCountFromAnswers(answers)
  const nextLevel = getLevel(level.id + 1)

  function handleRetry() {
    retryLevel(level.id)
    navigate(`/nivel/${level.id}`)
  }

  return (
    <section className="page">
      <p>
        <Link to="/jugar">Inicio</Link>
      </p>
      <h1>Resultado · Nivel {level.id}</h1>
      <h2>{level.title}</h2>
      <p>
        Aciertos: {correctCount} / {expected} (necesitas {MIN_CORRECT_TO_UNLOCK}{' '}
        para avanzar)
      </p>
      <p>
        Puntos aplicados en este intento:{' '}
        {answers.reduce((total, answer) => total + answer.appliedDelta, 0)}
      </p>
      <p>Puntaje acumulado: {score}</p>
      <ul>
        {answers.map((answer, index) => (
          <li key={answer.questionId}>
            {index + 1}. {answer.correct ? 'Bien' : 'Mal'} (
            {answer.appliedDelta > 0 ? '+' : ''}
            {answer.appliedDelta}) — {answer.prompt}
          </li>
        ))}
      </ul>
      {passed ? (
        nextLevel ? (
          <p>
            <Link to={levelPath(nextLevel)}>
              Siguiente: nivel {nextLevel.id} · {nextLevel.title}
            </Link>
          </p>
        ) : (
          <p>
            <Link to="/jugar">Volver al inicio</Link>
          </p>
        )
      ) : (
        <p>
          No alcanzaste el mínimo. Puedes reintentar este nivel. El puntaje
          acumulado se mantiene.
          <br />
          <button type="button" onClick={handleRetry}>
            Reintentar nivel {level.id}
          </button>
        </p>
      )}
    </section>
  )
}
