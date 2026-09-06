import { Link } from 'react-router-dom'
import {
  GAME_TITLE,
  getLevel,
  getMaxTriviaScore,
  LEVELS,
  levelPath,
  MIN_CORRECT_TO_UNLOCK,
} from '../game/gameUtils'
import { useGame } from '../game/useGame'

export default function WelcomeScreen() {
  const { score, currentLevel, unlockedLevel, restartGame } = useGame()
  const continueLevel = getLevel(currentLevel)

  return (
    <section>
      <p>Juego educativo</p>
      <h1>{GAME_TITLE}</h1>
      <p>
        Trivia por niveles sobre cómo se hace una pizza, al estilo de Preguntados.
        Completa 7 niveles de preguntas y termina creando tu propia pizza.
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
        <Link to={levelPath(continueLevel)}>Continuar nivel {currentLevel}</Link>
        {' · '}
        <button type="button" onClick={restartGame}>
          Reiniciar partida
        </button>
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
