import { useContext } from 'react'
import { GameContext } from './GameContext'

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame debe usarse dentro de GameProvider')
  }
  return context
}
