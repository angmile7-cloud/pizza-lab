import ChefLogo from './ChefLogo'

export function ScoreBadge({ score, maximum }) {
  return (
    <div className="level-score-badge" aria-live="polite" aria-label={`Puntos: ${score} de ${maximum}`}>
      <svg className="level-score-badge__coin" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M35.5 8.5 38 3l2.5 5.5L46 11l-5.5 2.5L38 19l-2.5-5.5L30 11zM10 31l2-4.5 2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2z" fill="currentColor" />
        <circle cx="23" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M18.5 29V15h6.2a5 5 0 0 1 0 10h-6.2m0-5h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
      <span className="level-score-badge__copy">
        <strong>{score}/{maximum}</strong>
        <span>Puntos</span>
      </span>
    </div>
  )
}

export default function LevelHeader({ levelId, levelCount }) {
  return (
    <header className="level-header">
      <ChefLogo className="level-header__logo" />
      <h1 className="level-header__title">
        DODO&apos;S PIZZA LAB - NIVEL {levelId}/{levelCount}
      </h1>
    </header>
  )
}