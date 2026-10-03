import { Link } from 'react-router-dom'
import { LEVELS, getLevel, levelPath } from '../game/gameUtils'
import { useGame } from '../game/useGame'

const levelImages = import.meta.glob('../assets/Niveles/*.png', {
  eager: true,
  import: 'default',
})

const ROW_HEIGHT = 138
const SLICE_BOUNDS = {
  1: { width: 450, height: 381, viewBox: '150 24 140 172' },
  2: { width: 381, height: 450, viewBox: '38 56 159 165' },
  3: { width: 450, height: 381, viewBox: '228 134 172 137' },
  4: { width: 450, height: 381, viewBox: '218 188 145 174' },
  5: { width: 450, height: 381, viewBox: '104 190 137 172' },
  6: { width: 450, height: 381, viewBox: '56 164 172 131' },
  7: { width: 450, height: 381, viewBox: '61 46 170 157' },
  8: { width: 450, height: 381, viewBox: '150 24 140 172' },
  9: { width: 450, height: 381, viewBox: '150 24 140 172' },
  10: { width: 450, height: 381, viewBox: '150 24 140 172' },
}
// Measured alpha-silhouette tip angles aligned to level 1; corrections affect only slice art.
const SLICE_ORIENTATION = {
  1: { rotate: 0, scale: 1 },
  2: { rotate: 45, scale: 1 },
  3: { rotate: -90, scale: 1 },
  4: { rotate: -154.38, scale: 1 },
  5: { rotate: 150, scale: 1 },
  6: { rotate: 102.38, scale: 1 },
  7: { rotate: 49.95, scale: 1 },
  8: { rotate: 0, scale: 1 },
  9: { rotate: 0, scale: 1 },
  10: { rotate: 0, scale: 1 },
}
// Measured alpha>200 centroids after each slice's crop and on-screen transform.
const SLICE_ANCHOR = {
  1: { x: 52.6, y: 39.39 },
  2: { x: 50.16, y: 50.82 },
  3: { x: 49.61, y: 40.8 },
  4: { x: 57.25, y: 47.9 },
  5: { x: 37.27, y: 47.71 },
  6: { x: 57.11, y: 45.55 },
  7: { x: 45.55, y: 49.49 },
  8: { x: 53.17, y: 39.5 },
  9: { x: 52.63, y: 39.46 },
  10: { x: 52.75, y: 39.51 },
}

function getLevelImage(levelId) {
  const match = Object.entries(levelImages).find(([path]) => {
    const assetName = path.split('/').pop()
    const levelMatch = assetName.match(/^nivel\s*(\d+)\.png$/i)
    return Number(levelMatch?.[1]) === Number(levelId)
  })
  return match?.[1]
}

function makeProgressPath(rowCount, offset) {
  const rowPaths = []
  for (let row = 0; row < rowCount; row += 1) {
    const y = row * ROW_HEIGHT + 69 + offset
    rowPaths.push(`M 60 ${y} C 84 ${y - 8}, 94 ${y + 8}, 120 ${y}`)
    rowPaths.push(`C 146 ${y - 8}, 154 ${y + 8}, 180 ${y}`)
    rowPaths.push(`C 206 ${y - 8}, 214 ${y + 8}, 240 ${y}`)
    rowPaths.push(`C 266 ${y - 8}, 276 ${y + 8}, 300 ${y}`)
    if (row < rowCount - 1) {
      const nextY = (row + 1) * ROW_HEIGHT + 69 + offset
      rowPaths.push(
        `C 348 ${y}, 356 ${y + 42}, 330 ${y + 63}` +
          ` C 302 ${y + 88}, 246 ${y + 82}, 180 ${y + 83}` +
          ` C 116 ${y + 84}, 60 ${y + 80}, 34 ${y + 100}` +
          ` C 14 ${y + 116}, 20 ${nextY - 10}, 60 ${nextY}`,
      )
    }
  }
  return rowPaths.join(' ')
}

function ProgressPath({ rowCount, height }) {
  return (
    <svg
      className="progress-map__path"
      viewBox={`0 0 360 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {[-3, 3].map((offset, index) => (
        <path
          key={offset}
          d={makeProgressPath(rowCount, offset)}
          fill="none"
          stroke="#17110e"
          strokeWidth={index === 0 ? 1.7 : 1.35}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

function FinishIllustration() {
  return (
    <div className="progress-map__finish" aria-hidden="true">
      <svg className="progress-map__chef" viewBox="0 0 64 78">
        <path
          d="M12 42c-7-2-9-7-7-13 1-5 5-8 10-9C14 9 22 3 31 7c7-8 21-4 23 7 8 2 11 9 8 16-1 5-5 9-11 11v8H13z"
          fill="#fff"
        />
        <path d="M13 42h39v8H13z" fill="#fff" />
        <path
          d="M12 64c5 0 7 4 11 4 4 0 5-4 9-4s6 4 10 4c4 0 6-4 11-4v5c-5 0-7 5-11 5s-6-4-10-4-5 4-9 4-6-5-11-5z"
          fill="#29231e"
        />
      </svg>
      <svg className="progress-map__star" viewBox="0 0 64 64">
        <path
          d="m32 3 7.2 20.8L61 24l-17 12.7 6.2 21.1L32 45 13.8 57.8 20 36.7 3 24l21.8-.2z"
          fill="var(--progress-yellow)"
        />
      </svg>
    </div>
  )
}

export default function GameHubScreen() {
  const { score, currentLevel, unlockedLevel, createdPizza, userName, restartGame } = useGame()
  const currentLevelId = Math.min(Math.max(currentLevel, 1), LEVELS.length)
  const displayLevel = getLevel(currentLevelId)
  const mapLevels = Array.from({ length: Math.max(10, LEVELS.length) }, (_, index) => {
    const levelId = index + 1
    return getLevel(levelId) ?? { id: levelId, title: 'Próximamente' }
  })
  const rowCount = Math.ceil(mapLevels.length / 3)
  const mapHeight = rowCount * ROW_HEIGHT
  const lockImage = Object.entries(levelImages).find(([path]) =>
    /^candado\.png$/i.test(path.split('/').pop()),
  )?.[1]
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    mapLevels.slice(rowIndex * 3, rowIndex * 3 + 3),
  )

  return (
    <section className="progress-map">
      <header className="progress-map__header">
        <div className="progress-map__identity">
          <span>{userName || 'Chef'}</span>
          <span>Nivel {currentLevelId} - {displayLevel?.title}</span>
        </div>
        <div className="progress-map__score" aria-label={`Puntaje: ${score}`}>
          <strong>{score}</strong>
          <span>Puntaje</span>
        </div>
      </header>

      <h1 className="progress-map__title">TU PROGRESO</h1>

      <div className="progress-map__canvas" style={{ height: mapHeight }}>
        <ProgressPath rowCount={rowCount} height={mapHeight} />
        <div className="progress-map__rows">
          {rows.map((row, rowIndex) => (
            <div className="progress-map__row" key={rowIndex}>
              {row.map((level) => {
                const isCurrent = level.id === currentLevel && !(level.id === 8 && createdPizza)
                const placeholder = level.id > LEVELS.length
                const locked = placeholder || level.id > unlockedLevel
                const label = placeholder
                  ? `Nivel ${level.id}, próximamente`
                  : `Nivel ${level.id}: ${level.title}`
                const imageBounds = SLICE_BOUNDS[level.id]
                const imageSource = getLevelImage(level.id)
                const orientation = SLICE_ORIENTATION[level.id]
                const anchor = SLICE_ANCHOR[level.id]
                const [cropX, cropY, cropWidth, cropHeight] = imageBounds.viewBox
                  .split(' ')
                  .map(Number)
                const imageScale = Math.min(78 / cropWidth, 100 / cropHeight)
                const nodeContent = (
                  <>
                    <span
                      className="progress-map__slice-frame"
                      aria-hidden="true"
                      style={{
                        '--slice-anchor-x': `${anchor.x}%`,
                        '--slice-anchor-y': `${anchor.y}%`,
                      }}
                    >
                      <img
                        className="progress-map__slice"
                        src={imageSource}
                        alt=""
                        draggable="false"
                        style={{
                          '--slice-width': `${imageBounds.width * imageScale}px`,
                          '--slice-height': `${imageBounds.height * imageScale}px`,
                          '--slice-left': `${39 - (cropX + cropWidth / 2) * imageScale}px`,
                          '--slice-top': `${50 - (cropY + cropHeight / 2) * imageScale}px`,
                          '--slice-origin-x': `${((cropX + cropWidth / 2) / imageBounds.width) * 100}%`,
                          '--slice-origin-y': `${((cropY + cropHeight / 2) / imageBounds.height) * 100}%`,
                          '--slice-rotation': `${orientation.rotate}deg`,
                          '--slice-scale': orientation.scale,
                          '--slice-clip': `inset(${(cropY / imageBounds.height) * 100}% ${((imageBounds.width - cropX - cropWidth) / imageBounds.width) * 100}% ${((imageBounds.height - cropY - cropHeight) / imageBounds.height) * 100}% ${(cropX / imageBounds.width) * 100}%)`,
                        }}
                      />
                      {locked && lockImage ? (
                        <img className="progress-map__lock" src={lockImage} alt="" />
                      ) : null}
                      <span className="progress-map__number">{level.id}</span>
                    </span>
                  </>
                )

                return locked ? (
                  <span
                    className="progress-map__node progress-map__node--locked"
                    key={level.id}
                    role="img"
                    aria-disabled="true"
                    aria-label={placeholder ? label : `Nivel ${level.id} bloqueado`}
                  >
                    {nodeContent}
                  </span>
                ) : (
                  <Link
                    className={`progress-map__node${isCurrent ? ' progress-map__node--current' : ''}`}
                    key={level.id}
                    to={levelPath(level)}
                    aria-label={label}
                  >
                    {nodeContent}
                  </Link>
                )
              })}
              {rowIndex === rows.length - 1 && row.length < 3 ? (
                <FinishIllustration />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <footer className="progress-map__actions">
        <button type="button" onClick={restartGame}>Reiniciar partida</button>
        <Link to="/">Salir al menú</Link>
      </footer>
    </section>
  )
}
