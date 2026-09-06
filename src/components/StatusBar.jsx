import { Link } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { getMaxTriviaScore } from '../game/gameUtils'

export default function StatusBar() {
  const { score, currentLevel } = useGame()

  return (
    <p>
      <Link to="/">Maestro Pizzero</Link>
      {' · '}
      Puntaje acumulado: {score} / {getMaxTriviaScore()}
      {' · '}
      Nivel actual: {Math.min(currentLevel, 8)} de 8
    </p>
  )
}
