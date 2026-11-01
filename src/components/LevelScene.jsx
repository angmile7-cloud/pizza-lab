import levelKitchen from '../assets/Niveles/fondo_cocina.webp'
import { useGame } from '../game/useGame'
import { LEVELS } from '../game/gameUtils'
import LevelHeader, { ScoreBadge } from './LevelHeader'

export default function LevelScene({
  levelId,
  children,
  title,
  scoreDisplay,
  scoreBounceKey,
}) {
  const { totalScore } = useGame()

  return (
    <div
      className="level-scene"
      style={{ '--level-scene-image': `url("${levelKitchen}")` }}
    >
      <LevelHeader levelId={levelId} levelCount={LEVELS.length} title={title} />
      <ScoreBadge
        totalScore={scoreDisplay ?? totalScore}
        bounceKey={scoreBounceKey}
      />
      <div className="level-scene__content">{children}</div>
    </div>
  )
}