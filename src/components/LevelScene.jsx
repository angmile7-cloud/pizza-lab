import levelKitchen from '../assets/Niveles/fondo_cocina.png'
import { useGame } from '../game/useGame'
import { getMaxTriviaScore, LEVELS } from '../game/gameUtils'
import LevelHeader, { ScoreBadge } from './LevelHeader'

export default function LevelScene({ levelId, children }) {
  const { score } = useGame()

  return (
    <div
      className="level-scene"
      style={{ '--level-scene-image': `url("${levelKitchen}")` }}
    >
      <LevelHeader levelId={levelId} levelCount={LEVELS.length} />
      <ScoreBadge score={score} maximum={getMaxTriviaScore()} />
      <div className="level-scene__content">{children}</div>
    </div>
  )
}