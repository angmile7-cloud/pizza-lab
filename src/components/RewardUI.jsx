import { useEffect, useId, useRef, useState } from 'react'
import LevelHeader from './LevelHeader'
import { rewardText } from '../game/rewardsUtils'

function AnimatedPoints({ value }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  useEffect(() => {
    const from = previous.current
    previous.current = value
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame
    const start = performance.now()
    function tick(now) {
      const progress = reducedMotion ? 1 : Math.min(1, (now - start) / 320)
      setDisplay(Math.round(from + (value - from) * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <strong aria-hidden="true">{display}</strong>
}

export function RewardHeader({ availablePoints, totalScore }) {
  return <>
    <LevelHeader title={rewardText('brand')} />
    <div className="rewards-score">
      <div>
        <h1>{rewardText('scoreTitle')}</h1>
        <p>{rewardText('totalScore', { total: totalScore })}</p>
      </div>
      <div className="rewards-badge" aria-label={`${rewardText('availablePoints')}: ${availablePoints}`}>
        <span aria-hidden="true" className="rewards-coin">Ⓟ</span>
        <div><AnimatedPoints value={availablePoints} /><span>{rewardText('availablePoints')}</span></div>
      </div>
    </div>
  </>
}

export function RewardDialog({ title, onClose, children }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  useEffect(() => {
    if (!returnFocusRef.current) returnFocusRef.current = document.activeElement
    const dialog = dialogRef.current
    dialog.querySelector('button')?.focus()
    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key !== 'Tab') return
      const buttons = [...dialog.querySelectorAll('button:not(:disabled), input, [href]')]
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    dialog.addEventListener('keydown', handleKey)
    return () => {
      dialog.removeEventListener('keydown', handleKey)
      queueMicrotask(() => {
        if (!dialog.isConnected && returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
      })
    }
  }, [onClose])
  return (
    <div className="rewards-overlay" onClick={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div ref={dialogRef} className="rewards-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function RecipeContent({ recipe }) {
  return <>
    <p>{recipe.subtitle}</p>
    <p>{recipe.ingredients}</p>
    <ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    <p><strong>{rewardText('recipeTip')}</strong>{recipe.tip}</p>
  </>
}
