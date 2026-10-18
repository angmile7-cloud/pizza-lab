import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useGame } from '../game/useGame'
import {
  correctCountFromAnswers,
  didPassOrderLevel,
  didPassLevel,
  getLevel,
  levelPath,
  MIN_CORRECT_TO_UNLOCK,
} from '../game/gameUtils'
import LevelScene from '../components/LevelScene'

export default function LevelResultScreen() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const {
    answersByLevel,
    orderResultsByLevel,
    canAccessLevel,
    resolveLevel,
    retryLevel,
    retryOrderLevel,
    score,
  } = useGame()
  const level = getLevel(levelId)

  useEffect(() => {
    if (level?.type === 'trivia' || level?.type === 'order') {
      resolveLevel(level.id)
    }
  }, [level, resolveLevel])

  if (!level || (level.type !== 'trivia' && level.type !== 'order')) {
    return <Navigate to="/" replace />
  }

  if (!canAccessLevel(level.id)) {
    return <Navigate to="/" replace />
  }

  if (level.type === 'order') {
    const results = orderResultsByLevel[level.id] ?? []
    if (results.length < level.orders.length) {
      return <Navigate to={`/nivel/${level.id}/pedido`} replace />
    }

    const passed = didPassOrderLevel(level, results)
    const satisfiedCount = results.filter((result) => result.satisfied).length
    const pointsAwarded = results.reduce(
      (total, result) => total + result.pointsAwarded,
      0,
    )
    const nextLevel = getLevel(level.id + 1)

    function handleOrderRetry() {
      retryOrderLevel(level.id)
      navigate(`/nivel/${level.id}/pedido`)
    }

    return (
      <LevelScene levelId={level.id}>
        <section className="page level-page level-result">
          <p className="level-nav">
            <Link to="/jugar">Inicio</Link>
          </p>
          <h1>Resultado · Nivel {level.id}</h1>
          <h2>{level.title}</h2>
          <p>
            Pedidos cumplidos: {satisfiedCount} / {level.orders.length} (necesitas{' '}
            {level.scoring.minimumSatisfiedOrders} para avanzar)
          </p>
          <p>Puntos aplicados en este nivel: {pointsAwarded}</p>
          <p>Puntaje acumulado: {score}</p>
          <ul className="level-result__answers">
            {results.map((result) => (
              <li key={result.orderId}>
                <strong className={result.satisfied ? 'is-correct' : 'is-incorrect'}>
                  {result.satisfied ? 'Cumplido' : 'Incompleto'} (+{result.pointsAwarded})
                </strong>{' '}
                Pedido de {result.customerName}
              </li>
            ))}
          </ul>
          {passed ? (
            nextLevel ? (
              <p>
                <Link className="btn-yellow level-action" to={levelPath(nextLevel)}>
                  Siguiente: nivel {nextLevel.id} · {nextLevel.title}
                </Link>
              </p>
            ) : (
              <p>
                ¡Has completado Maestro Pizzero!
                <br />
                <Link className="btn-yellow level-action" to="/jugar">
                  Ver el mapa final
                </Link>
              </p>
            )
          ) : (
            <p>
              No alcanzaste el mínimo de pedidos. Puedes reintentar; se recalcularán
              los puntos de este nivel.
              <br />
              <button
                className="btn-yellow level-action"
                type="button"
                onClick={handleOrderRetry}
              >
                Reintentar nivel {level.id}
              </button>
            </p>
          )}
        </section>
      </LevelScene>
    )
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
    <LevelScene>
      <section className="page level-page level-result">
        <p className="level-nav">
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
        <ul className="level-result__answers">
          {answers.map((answer, index) => (
            <li key={answer.questionId}>
              <strong className={answer.correct ? 'is-correct' : 'is-incorrect'}>
                {index + 1}. {answer.correct ? 'Bien' : 'Mal'} (
                {answer.appliedDelta > 0 ? '+' : ''}
                {answer.appliedDelta})
              </strong>{' '}
              {answer.prompt}
            </li>
          ))}
        </ul>
        {passed ? (
          nextLevel ? (
            <p>
              <Link className="btn-yellow level-action" to={levelPath(nextLevel)}>
                Siguiente: nivel {nextLevel.id} · {nextLevel.title}
              </Link>
            </p>
          ) : (
            <p>
              <Link className="btn-yellow level-action" to="/jugar">Volver al inicio</Link>
            </p>
          )
        ) : (
          <p>
            No alcanzaste el mínimo. Puedes reintentar este nivel. El puntaje
            acumulado se mantiene.
            <br />
            <button className="btn-yellow level-action" type="button" onClick={handleRetry}>
              Reintentar nivel {level.id}
            </button>
          </p>
        )}
      </section>
    </LevelScene>
  )
}
