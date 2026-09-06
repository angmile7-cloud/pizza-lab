import { Link, useLocation } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { getMaxTriviaScore } from '../game/gameUtils'

const HIDDEN_ON = new Set(['/', '/registro', '/login'])

export default function StatusBar() {
  const { pathname } = useLocation()
  const { score, currentLevel } = useGame()

  if (HIDDEN_ON.has(pathname)) {
    return null
  }

  return (
    <p className="status-bar">
      <Link to="/jugar">Dodo&apos;s Pizza Lab</Link>
      {' · '}
      Puntos: {score} / {getMaxTriviaScore()}
      {' · '}
      Nivel {Math.min(currentLevel, 8)}/8
    </p>
  )
}
