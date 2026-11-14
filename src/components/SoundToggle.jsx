import { useSyncExternalStore } from 'react'
import { isMuted, isSoundEmbedded, setMuted, subscribeMuted } from '../game/sound'

export default function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, isMuted)
  if (isSoundEmbedded()) return null

  return (
    <button
      className="sound-toggle"
      type="button"
      data-sound="mute"
      aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
      aria-pressed={muted}
      onClick={() => setMuted(!muted)}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  )
}
