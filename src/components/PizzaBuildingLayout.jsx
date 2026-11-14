import { Link } from 'react-router-dom'
import LevelScene from './LevelScene'

export default function PizzaBuildingLayout({
  levelId,
  title,
  subtitle,
  top,
  actions,
  className = '',
  children,
}) {
  return (
    <LevelScene levelId={levelId}>
      <section className={`page level-page level-builder pizza-building scene-zones ${className}`}>
        <div className="orders-mode__body">
          <div className="orders-mode__fixed-top">
            <div className="pizza-building__heading pizza-building__copy">
              <h1 className="level-question__level orders-mode__tier">{title}</h1>
              {subtitle}
            </div>
            {top}
          </div>
          <div className="orders-mode__scroll scene-zones__scroll">
            {children}
          </div>
        </div>
        <div className="orders-mode__actions scene-zones__actions">
          {actions}
          <Link
            className="btn-yellow level-action level-action--home orders-mode__home orders-mode__action--wide"
            to="/jugar"
          >
            Inicio
          </Link>
        </div>
      </section>
    </LevelScene>
  )
}
