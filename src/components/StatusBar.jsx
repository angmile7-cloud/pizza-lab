import { Link, useLocation } from 'react-router-dom'
import { useGame } from '../game/useGame'
import { getMaxScore, LEVELS } from '../game/gameUtils'

const HIDDEN_ON = new Set(['/', '/registro', '/login', '/jugar', '/pedidos', '/recompensas', '/chat'])

export default function StatusBar() {
  const { pathname } = useLocation()
  const { totalScore, currentLevel } = useGame()

  if (HIDDEN_ON.has(pathname) || pathname.startsWith('/nivel/')) {
    return null
  }

  return (
    <p className="status-bar">
      <Link to="/jugar">Dodo&apos;s Pizza Lab</Link>
      {' · '}
      Puntos: {totalScore} / {getMaxScore()}
      {' · '}
      Nivel {Math.min(currentLevel, LEVELS.length)}/{LEVELS.length}
    </p>
  )
}
