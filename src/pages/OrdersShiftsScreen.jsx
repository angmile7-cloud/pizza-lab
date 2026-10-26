import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import LevelScene from '../components/LevelScene'
import lockImage from '../assets/Niveles/candado.png'
import { LEVELS } from '../game/gameUtils'
import { useGame } from '../game/useGame'
import {
  getOrderTopicsForStage,
  getShiftSize,
  getTierForStage,
} from '../game/ordersModeUtils'

function topicNames(stage) {
  return getOrderTopicsForStage(stage)
    .map((topic) => topic.label)
    .join(', ')
}

export default function OrdersShiftsScreen() {
  const {
    ordersMode,
    unlockedStage,
    recordShiftOrderResult,
  } = useGame()

  useEffect(() => {
    const active = ordersMode.activeOrder
    if (!active) return
    const shift = ordersMode.shifts[active.stage]
    const alreadyResolved = shift?.results.some(
      (result) => result.orderId === active.orderId,
    )
    if (shift && !alreadyResolved) {
      recordShiftOrderResult(active.stage, {
        orderId: active.orderId,
        satisfied: false,
        pointsAwarded: 0,
        lost: true,
      })
    }
  }, [ordersMode, recordShiftOrderResult])

  if (unlockedStage === 0) return <Navigate to="/jugar" replace />

  const rows = Array.from({ length: LEVELS.length }, (_, index) => index + 1)
  const suggestedStage = rows.find(
    (stage) =>
      stage <= unlockedStage &&
      !ordersMode.shifts[stage],
  )

  return (
    <LevelScene levelId={unlockedStage || 1} title="TURNOS DE PEDIDOS">
      <section className="orders-shifts scene-zones">
        <header className="orders-shifts__header">
          <h1 className="level-question__level">Turnos de pedidos</h1>
          <p>Elige un turno pendiente. Cada uno se juega una sola vez.</p>
        </header>
        <div className="orders-shifts__scroll scene-zones__scroll">
          {rows.map((stage) => {
            const shift = ordersMode.shifts[stage]
            const locked = stage > unlockedStage
            const tier = getTierForStage(stage)
            const size = getShiftSize(stage)
            const served = shift?.results.filter((result) => result.satisfied).length ?? 0
            const resolvedCount = shift?.results.length ?? 0
            const suggested = !locked && !shift && stage === suggestedStage
            const state = locked
              ? 'Bloqueado'
              : shift?.status === 'completed'
                ? 'Completado'
                : shift
                  ? 'En curso'
                  : 'Pendiente'
            const contents = (
              <>
                <span className="orders-shifts__stage">
                  {locked ? <img src={lockImage} alt="" aria-hidden="true" /> : null}
                  Etapa {stage}
                </span>
                <span className="orders-shifts__details">
                  <strong>{tier.name}</strong>
                  <span>{size} pedidos · {topicNames(stage)}</span>
                  {shift?.status === 'completed' ? (
                    <span>
                      Atendidos {served}/{size} · {shift.score} puntos
                    </span>
                  ) : shift ? (
                    <span>
                      Resueltos {resolvedCount}/{size} · Atendidos {served} · {shift.score} puntos
                    </span>
                  ) : null}
                </span>
                <span className="orders-shifts__state">{state}</span>
                {suggested ? (
                  <span className="orders-shifts__suggested">Sugerido</span>
                ) : null}
              </>
            )

            return locked || shift?.status === 'completed' ? (
              <div
                className={[
                  'orders-shifts__row',
                  locked ? 'orders-shifts__row--locked' : 'orders-shifts__row--completed',
                ].join(' ')}
                key={stage}
                aria-disabled={locked ? 'true' : undefined}
              >
                {contents}
              </div>
            ) : (
              <Link
                className={[
                  'orders-shifts__row',
                  suggested ? 'orders-shifts__row--suggested' : '',
                  shift?.status === 'completed' ? 'orders-shifts__row--completed' : '',
                ].filter(Boolean).join(' ')}
                key={stage}
                to={`/pedidos/${stage}`}
              >
                {contents}
              </Link>
            )
          })}
        </div>
        <footer className="orders-shifts__actions scene-zones__actions">
          <Link className="level-action level-action--home orders-mode__home" to="/jugar">
            Volver al mapa
          </Link>
        </footer>
      </section>
    </LevelScene>
  )
}
