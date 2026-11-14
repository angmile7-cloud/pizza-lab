import { useEffect, useId, useRef } from 'react'
import InvitationDialog from './InvitationDialog'
import AvatarReaction from './AvatarReaction'
import { ScoreBadge } from './LevelHeader'
import { useGame } from '../game/useGame'
import { playSound } from '../game/sound'

export default function GameCompletedDialog({ onClose, staticMotion }) {
  const { userName, avatarId, totalScore } = useGame()
  const trophyId = useId()
  const soundPlayed = useRef(false)

  useEffect(() => {
    if (soundPlayed.current) return
    soundPlayed.current = true
    playSound('fanfare')
  }, [])

  return (
    <InvitationDialog
      className="game-completed-dialog"
      staticMotion={staticMotion}
      title={`¡Felicidades, ${userName}!`}
      body="Completaste los 10 niveles de Dodo's Pizza Lab"
      primaryAction={{ label: '¡Genial!', onClick: onClose }}
      onClose={onClose}
      artwork={
        <div className="game-completed-dialog__art" aria-hidden="true">
          <div className="game-completed-dialog__trophy-wrap">
            <svg className="game-completed-dialog__trophy" viewBox="0 0 120 120" focusable="false">
              <defs>
                <linearGradient id={`${trophyId}-gold`} x2="1" y2="1">
                  <stop stopColor="#fff0a5" /><stop offset=".5" stopColor="#ffd54a" /><stop offset="1" stopColor="#c88b24" />
                </linearGradient>
                <clipPath id={`${trophyId}-clip`}>
                  <path d="M34 14h52v27c0 20-10 31-26 31S34 61 34 41Z" />
                </clipPath>
              </defs>
              <g fill={`url(#${trophyId}-gold)`} stroke="#a47b20" strokeWidth="4" strokeLinejoin="round">
                <path d="M34 23H17v13c0 18 10 26 26 26v-12c-9 0-14-5-14-14h5Zm52 0h17v13c0 18-10 26-26 26v-12c9 0 14-5 14-14h-5Z" />
                <path d="M34 14h52v27c0 20-10 31-26 31S34 61 34 41Z" />
                <path d="M55 71h10v22h17v13H38V93h17Z" />
              </g>
              <path d="m60 26 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#fff4d3" />
              <g clipPath={`url(#${trophyId}-clip)`}>
                <path className="game-completed-dialog__shine" d="m18 0 18 0 40 90H58Z" fill="#fffdf3" opacity=".65" />
              </g>
            </svg>
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="game-completed-dialog__sparkle" style={{
                '--sparkle-index': index,
                '--sparkle-x': `${index % 2 ? 93 : -5}%`,
              }}>✦</span>
            ))}
          </div>
          <AvatarReaction avatarId={avatarId} state="perfect" />
        </div>
      }
    >
      <div className="game-completed-dialog__confetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => (
          <span key={index} style={{
            '--confetti-x': `${(index * 37) % 100}%`,
            '--confetti-static-x': `${index % 2 ? 95 : 2}%`,
            '--confetti-y': `${(index * 53) % 96}%`,
            '--confetti-delay': `${-(index % 10) * 0.08}s`,
            '--confetti-color': ['#e75b56', '#ffd54a', '#79b981', '#fff4d3'][index % 4],
            '--confetti-turn': `${index % 2 ? 240 : -240}deg`,
          }} />
        ))}
      </div>
      <ScoreBadge totalScore={totalScore} />
      <p className="game-completed-dialog__dodo">¡Ya eres todo un maestro pizzero!</p>
    </InvitationDialog>
  )
}
