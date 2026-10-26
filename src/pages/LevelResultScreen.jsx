import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import LevelScene from '../components/LevelScene'
import PizzaPreview from '../components/PizzaPreview'
import { useGame } from '../game/useGame'
import {
  correctCountFromAnswers,
  didPassOrderLevel,
  didPassLevel,
  getLevel,
  levelPath,
  MIN_CORRECT_TO_UNLOCK,
} from '../game/gameUtils'

const RESULT_ANIMATION_MS = {
  countDelay: 2300,
  countDuration: 700,
  sequenceDuration: 4600,
  answerDelay: 120,
  answerStartDelay: 3500,
  starDelay: 2750,
  starStagger: 250,
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (event) => setReduced(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

function useManagedTimeouts() {
  const idsRef = useRef(new Set())
  useEffect(
    () => () => {
      idsRef.current.forEach((id) => window.clearTimeout(id))
      idsRef.current.clear()
    },
    [],
  )
  return useCallback((fn, delay) => {
    const id = window.setTimeout(() => {
      idsRef.current.delete(id)
      fn()
    }, delay)
    idsRef.current.add(id)
    return id
  }, [])
}

function useCountUp(from, to, enabled, duration, reduced, jumped) {
  const [value, setValue] = useState((reduced && enabled) || jumped ? to : from)
  useEffect(() => {
    if (!enabled || reduced || jumped) return undefined
    let frameId
    const startedAt = performance.now()
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(from + (to - from) * eased))
      if (progress < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [duration, enabled, from, jumped, reduced, to])
  return reduced || jumped ? to : value
}

function OvenIllustration({ passed, perfect }) {
  return (
    <svg className="result-oven__art" viewBox="0 0 320 190" aria-hidden="true">
      <ellipse cx="160" cy="170" rx="116" ry="10" fill="rgba(42,25,13,.22)" />
      <path
        className="result-oven__body"
        d="M45 164V95a115 70 0 0 1 230 0v69z"
        fill="#a94f2f"
        stroke="#71361f"
        strokeWidth="7"
      />
      <path
        d="M76 164V98a84 53 0 0 1 168 0v66z"
        fill="#47271d"
        stroke="#e7a252"
        strokeWidth="8"
      />
      <path
        className="result-oven__glow"
        d="M89 162v-63a71 44 0 0 1 142 0v63z"
        fill="#f08a32"
      />
      <path d="M45 164h230v18H45z" fill="#754123" stroke="#71361f" strokeWidth="5" />
      <path d="M69 114h26v15H69zm156 0h26v15h-26zM69 143h26v15H69zm156 0h26v15h-26z" fill="#cf7545" />
      <g className={`result-oven__pizza${passed ? ' is-golden' : ' is-burnt'}${perfect ? ' is-perfect' : ''}`}>
        <path d="M125 143h83l-4 7h-84z" fill="#8b542c" />
        <path d="M126 144l-44 12" stroke="#8b542c" strokeWidth="5" strokeLinecap="round" />
        <svg x="130" y="81" width="72" height="72" viewBox="0 0 240 240">
          <PizzaPreview glow={perfect} doneness={passed ? 'golden' : 'burnt'} />
        </svg>
      </g>
      {!passed ? (
        <g className="result-oven__smoke" fill="#756a63">
          <circle cx="147" cy="77" r="8" /><circle cx="165" cy="68" r="6" /><circle cx="180" cy="78" r="8" />
        </g>
      ) : (
        <g className="result-oven__steam" fill="#fff" opacity=".68">
          <circle cx="148" cy="80" r="5" /><circle cx="164" cy="71" r="6" /><circle cx="180" cy="81" r="5" />
        </g>
      )}
      <g className="result-oven__ding">
        <path d="M238 42h62v31h-62z" rx="12" fill="#fff4d3" stroke="#71361f" strokeWidth="3" />
        <text x="269" y="63" textAnchor="middle" fontSize="15" fontWeight="700" fill="#71361f">{passed ? '¡Ding!' : '¡Uy!'}</text>
      </g>
      {!passed ? <path className="result-oven__sweat" d="M211 88c-11 15-9 22 0 22s11-7 0-22z" fill="#70b5df" /> : null}
    </svg>
  )
}

function Star({ lit, index }) {
  return (
    <svg
      className={`result-star${lit ? ' is-lit' : ''}`}
      style={{ '--star-delay': `${RESULT_ANIMATION_MS.starDelay + index * RESULT_ANIMATION_MS.starStagger}ms` }}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <path
        d="m32 4 7.2 20.3L61 25l-16.8 12.1 6.4 20.5L32 45 13.4 57.6l6.4-20.5L3 25l21.8-.7z"
        fill={lit ? '#ffd54a' : 'transparent'}
        stroke={lit ? '#a4671e' : '#74563a'}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ResultLayout({
  level,
  passed,
  perfect,
  correctCount,
  questionCount,
  appliedPoints,
  pointsLabel,
  totalScore,
  previousTotal,
  rows,
  summary,
  nextLevel,
  onRetry,
}) {
  const reduced = usePrefersReducedMotion()
  const [skipped, setSkipped] = useState(reduced)
  const [countsStarted, setCountsStarted] = useState(reduced)
  const [jumped, setJumped] = useState(reduced)
  const [primaryTapped, setPrimaryTapped] = useState(false)
  const scheduleTimeout = useManagedTimeouts()
  const pointsDisplay = useCountUp(
    0,
    appliedPoints,
    countsStarted,
    RESULT_ANIMATION_MS.countDuration,
    reduced,
    jumped,
  )
  const totalDisplay = useCountUp(
    previousTotal,
    totalScore,
    countsStarted,
    RESULT_ANIMATION_MS.countDuration,
    reduced,
    jumped,
  )

  useEffect(() => {
    if (reduced) return undefined
    const countId = scheduleTimeout(
      () => setCountsStarted(true),
      RESULT_ANIMATION_MS.countDelay,
    )
    const sequenceId = scheduleTimeout(
      () => setSkipped(true),
      RESULT_ANIMATION_MS.sequenceDuration,
    )
    return () => {
      window.clearTimeout(countId)
      window.clearTimeout(sequenceId)
    }
  }, [reduced, scheduleTimeout])

  const skipAnimation = useCallback(() => {
    setSkipped(true)
    setCountsStarted(true)
    setJumped(true)
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') skipAnimation()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [skipAnimation])

  const litStars = questionCount
    ? Math.round((correctCount / questionCount) * 3)
    : 0
  const headline = passed
    ? perfect
      ? '¡Nivel perfecto!'
      : '¡Nivel superado!'
    : '¡Casi lo logras!'

  return (
    <LevelScene
      levelId={level.id}
      scoreDisplay={totalDisplay}
      scoreBounceKey={countsStarted && !reduced && !skipped ? 'result-score' : undefined}
    >
      <section
        className={[
          'scene-zones',
          'level-result-layout',
          passed ? 'level-result-layout--passed' : 'level-result-layout--failed',
          perfect ? 'level-result-layout--perfect' : '',
          skipped ? 'is-static' : '',
          reduced ? 'is-reduced-motion is-static' : '',
          primaryTapped ? 'is-primary-tapped' : '',
        ].filter(Boolean).join(' ')}
      >
        <div className="level-result-layout__scroll scene-zones__scroll">
          <div className="level-result level-result__content">
            <h1 className="level-question__level">Resultado · Nivel {level.id}</h1>
            <h2 className="level-result__title">{level.title}</h2>
            <p className="level-result__headline" aria-hidden="true">{headline}</p>
            <button
              className="result-oven__stage"
              type="button"
              onClick={skipAnimation}
              aria-label="Saltar animación y mostrar el resultado"
              title="Toca para saltar la animación"
            >
              <span className="result-oven__banner">{headline}</span>
              <span className="result-oven__art-wrap">
                <OvenIllustration passed={passed} perfect={perfect} />
              </span>
              <span className="result-stars" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={`result-star-wrap${perfect && index === 2 && litStars === 3 ? ' result-star-wrap--perfect' : ''}`}
                  >
                    <Star index={index} lit={index < litStars} />
                  </span>
                ))}
              </span>
            </button>
            <p className="level-result__star-count">
              Estrellas: {litStars} de 3 · Aciertos: {correctCount} de {questionCount}
            </p>
            <p className="level-result__live" aria-live="polite" aria-atomic="true">
              {passed ? 'Nivel superado' : 'Nivel no superado'}, {correctCount} de {questionCount} aciertos
            </p>
            <div className="level-result__scores">
              <p>{pointsLabel}: <strong>{pointsDisplay}</strong></p>
              <p>Total ganado: <strong>{totalDisplay}</strong></p>
            </div>
            {summary}
            <ul className="level-result__answers">
              {rows.map((row, index) => (
                <li
                  key={row.id}
                  className={row.correct ? 'is-correct' : 'is-incorrect'}
                  style={{ '--result-answer-delay': `${RESULT_ANIMATION_MS.answerStartDelay + index * RESULT_ANIMATION_MS.answerDelay}ms` }}
                >
                  <strong>
                    <span className="level-result__mark" aria-hidden="true">
                      {row.correct ? '✓' : '✗'}
                    </span>{' '}
                    {row.label}
                  </strong>{' '}
                  {row.text}
                  {row.explanation ? <p className="level-result__explanation">{row.explanation}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <footer className="level-result__actions scene-zones__actions">
          {passed ? (
            nextLevel ? (
              <Link
                className="level-action level-action--confirm level-result__primary"
                to={levelPath(nextLevel)}
                onClick={() => setPrimaryTapped(true)}
              >
                <span>Siguiente: Nivel {nextLevel.id}</span>
                <small>{nextLevel.title}</small>
              </Link>
            ) : (
              <Link
                className="level-action level-action--confirm level-result__primary"
                to="/jugar"
                onClick={() => setPrimaryTapped(true)}
              >
                Volver al inicio
              </Link>
            )
          ) : (
            <button
              className="level-action level-action--confirm level-result__primary"
              type="button"
              onClick={() => {
                setPrimaryTapped(true)
                onRetry()
              }}
            >
              Reintentar nivel {level.id}
            </button>
          )}
          <Link className="level-action level-action--home level-result__home" to="/jugar">
            INICIO
          </Link>
        </footer>
      </section>
    </LevelScene>
  )
}

export default function LevelResultScreen() {
  const { levelId } = useParams()
  const navigate = useNavigate()
  const {
    answersByLevel,
    orderResultsByLevel,
    canAccessLevel,
    resolveLevel,
    retryLevel,
    retryOrderLevel,
    totalScore,
  } = useGame()
  const level = getLevel(levelId)

  useEffect(() => {
    if (level?.type === 'trivia' || level?.type === 'order') resolveLevel(level.id)
  }, [level, resolveLevel])

  if (!level || (level.type !== 'trivia' && level.type !== 'order')) {
    return <Navigate to="/" replace />
  }
  if (!canAccessLevel(level.id)) return <Navigate to="/" replace />

  const nextLevel = getLevel(level.id + 1)
  if (level.type === 'order') {
    const results = orderResultsByLevel[level.id] ?? []
    if (results.length < level.orders.length) {
      return <Navigate to={`/nivel/${level.id}/pedido`} replace />
    }
    const passed = didPassOrderLevel(level, results)
    const satisfiedCount = results.filter((result) => result.satisfied).length
    const pointsApplied = results.reduce((total, result) => total + result.pointsAwarded, 0)
    const previousTotal = totalScore - pointsApplied
    const rows = results.map((result) => ({
      id: result.orderId,
      correct: result.satisfied,
      label: result.satisfied ? 'Cumplido' : 'Incompleto',
      text: `Pedido de ${result.customerName} (+${result.pointsAwarded})`,
    }))
    const handleRetry = () => {
      retryOrderLevel(level.id)
      navigate(`/nivel/${level.id}/pedido`)
    }
    return (
      <ResultLayout
        level={level}
        passed={passed}
        perfect={satisfiedCount === level.orders.length}
        correctCount={satisfiedCount}
        questionCount={level.orders.length}
        appliedPoints={pointsApplied}
        pointsLabel="Puntos aplicados en este nivel"
        totalScore={totalScore}
        previousTotal={previousTotal}
        rows={rows}
        summary={(
          <>
            <p className="level-result__stat">
              Pedidos cumplidos: {satisfiedCount} / {level.orders.length} (necesitas{' '}
              {level.scoring.minimumSatisfiedOrders} para avanzar)
            </p>
            {!passed ? (
              <p className="level-result__stat">
                No alcanzaste el mínimo de pedidos. Puedes reintentar; se recalcularán los puntos de este nivel.
              </p>
            ) : null}
          </>
        )}
        nextLevel={nextLevel}
        onRetry={handleRetry}
      />
    )
  }

  const answers = answersByLevel[level.id] ?? []
  const expected = level.questions.length
  if (answers.length < expected) return <Navigate to={`/nivel/${level.id}`} replace />

  const passed = didPassLevel(answers, expected)
  const correctCount = correctCountFromAnswers(answers)
  const pointsApplied = answers.reduce((total, answer) => total + answer.appliedDelta, 0)
  const previousTotal = totalScore - pointsApplied
  const rows = answers.map((answer, index) => ({
    id: answer.questionId,
    correct: answer.correct,
    label: `${index + 1}. ${answer.correct ? 'Bien' : 'Mal'} (${answer.appliedDelta > 0 ? '+' : ''}${answer.appliedDelta})`,
    text: answer.prompt,
    explanation: answer.explanation,
  }))
  const handleRetry = () => {
    retryLevel(level.id)
    navigate(`/nivel/${level.id}`)
  }
  return (
    <ResultLayout
      level={level}
      passed={passed}
      perfect={correctCount === expected}
      correctCount={correctCount}
      questionCount={expected}
      appliedPoints={pointsApplied}
      pointsLabel="Puntos aplicados en este intento"
      totalScore={totalScore}
      previousTotal={previousTotal}
      rows={rows}
      summary={(
        <>
          <p className="level-result__stat">
            Aciertos: {correctCount} / {expected} (necesitas {MIN_CORRECT_TO_UNLOCK} para avanzar)
          </p>
          {!passed ? (
            <p className="level-result__stat">
              No alcanzaste el mínimo. Puedes reintentar este nivel. El puntaje acumulado se mantiene.
            </p>
          ) : null}
        </>
      )}
      nextLevel={nextLevel}
      onRetry={handleRetry}
    />
  )
}
