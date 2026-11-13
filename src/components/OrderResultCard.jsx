import { useEffect, useState } from 'react'
import DodoTip from './DodoTip'
import ResultSeal from './ResultSeal'
import ResultStatus from './ResultStatus'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (event) => setReduced(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

export default function OrderResultCard({ state, points, items, tip, children }) {
  const reduced = useReducedMotion()
  const [shownPoints, setShownPoints] = useState(() => reduced || state !== 'success' ? points : 0)
  useEffect(() => {
    if (reduced || state !== 'success') return undefined
    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 600)
      setShownPoints(Math.round(points * progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [points, reduced, state])

  const title = state === 'success' ? '¡Pedido cumplido!'
    : state === 'timeout' ? 'Se acabó el tiempo' : 'Pedido incompleto'
  return (
    <article className={`order-result order-result--${state}`}>
      <header className="order-result__header" aria-live="polite">
        <ResultSeal state={state} />
        <div>
          <h2>{title}</h2>
          {state !== 'success' ? <p>{state === 'timeout' ? 'El pedido se perdió.' : 'El pedido quedó incompleto. No se suman puntos.'}</p> : null}
          <p className="order-result__points" aria-label={`${state === 'success' ? '+' : ''}${points} puntos`}>
            <span aria-hidden="true">{state === 'success' ? '+' : ''}{reduced ? points : shownPoints} puntos</span>
          </p>
        </div>
      </header>
      <ul className="order-result__list">
        {items.map((item, index) => (
          <li
            className={`order-result__chip ${item.met ? 'is-met' : 'is-pending'}${item.label.length > 23 || item.chosen ? ' is-wide' : ''}`}
            key={item.requirementId}
            style={{ '--chip-index': index }}
          >
            <ResultStatus met={item.met} />
            <span><span className="order-result__sr-only">{item.met ? 'Cumplido: ' : 'Pendiente: '}</span>{item.label}
              {item.chosen ? <small>Pusiste: {item.chosen}</small> : null}
            </span>
          </li>
        ))}
      </ul>
      {tip ? <DodoTip>{tip}</DodoTip> : null}
      {children}
    </article>
  )
}
