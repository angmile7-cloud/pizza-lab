import levelKitchen from '../assets/Niveles/fondo_cocina.png'
import { useGame } from '../game/useGame'
import { getMaxScore, LEVELS } from '../game/gameUtils'
import LevelHeader, { ScoreBadge } from './LevelHeader'

export default function LevelScene({
  levelId,
  children,
  title,
  maximum: maximumOverride,
}) {
  const { totalScore } = useGame()

  return (
    <div
      className="level-scene"
      style={{ '--level-scene-image': `url("${levelKitchen}")` }}
    >
      <LevelHeader levelId={levelId} levelCount={LEVELS.length} title={title} />
      <ScoreBadge
        totalScore={totalScore}
        maximum={maximumOverride ?? getMaxScore()}
      />
      <div className="level-scene__content">{children}</div>
    </div>
  )
}