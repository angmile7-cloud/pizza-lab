import { Link } from 'react-router-dom'
import {
  getLevel,
  getMaxTriviaScore,
  LEVELS,
  levelPath,
  MIN_CORRECT_TO_UNLOCK,
} from '../game/gameUtils'
import { useGame } from '../game/useGame'

export default function GameHubScreen() {
  const { score, currentLevel, unlockedLevel, restartGame } = useGame()
  const continueLevel = getLevel(currentLevel)

  return (
    <section className="page">
      <h1>Maestro Pizzero</h1>
      <p>
        Trivia por niveles sobre cómo se hace una pizza. Completa 7 niveles de
        preguntas y termina creando tu propia pizza.
      </p>
      <p>
        En cada nivel hay 3 preguntas: necesitas al menos {MIN_CORRECT_TO_UNLOCK}{' '}
        aciertos para desbloquear el siguiente. Si no llegas, reintenta el nivel.
        Un error resta puntos; el acumulado nunca baja de 0.
      </p>
      <p>
        Puntaje acumulado: {score} / {getMaxTriviaScore()} · Nivel actual:{' '}
        {Math.min(currentLevel, 8)} · Desbloqueado hasta:{' '}
        {Math.min(unlockedLevel, 8)}
      </p>
      <p>
        <Link className="btn-yellow" to={levelPath(continueLevel)}>
          Continuar nivel {currentLevel}
        </Link>
      </p>
      <p>
        <button type="button" onClick={restartGame}>
          Reiniciar partida
        </button>
        {' · '}
        <Link to="/">Salir al menú</Link>
      </p>
      <ol>
        {LEVELS.map((level) => {
          const locked = level.id > unlockedLevel
          return (
            <li key={level.id}>
              {locked ? (
                <span>
                  Nivel {level.id}: {level.title} (bloqueado)
                </span>
              ) : (
                <Link to={levelPath(level)}>
                  Nivel {level.id}: {level.title}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
