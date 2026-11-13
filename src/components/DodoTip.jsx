import { useId, useState } from 'react'
import chefHat from '../assets/gorro_chef.png'

export function DodoBubble({ children }) {
  return (
    <div className="dodo-bubble">
      <img src={chefHat} alt="" />
      <div className="dodo-bubble__content"><strong>Consejo de Dodo</strong><p>{children}</p></div>
    </div>
  )
}

export default function DodoTip({ children }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="order-result__tip">
      <button type="button" className="order-result__tip-button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        <img src={chefHat} alt="" /> Consejo de Dodo <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <div id={id} className={`order-result__tip-panel${open ? ' is-open' : ''}`} inert={!open}>
        <div><div className="dodo-bubble__content dodo-bubble__content--standalone"><p>{children}</p></div></div>
      </div>
    </div>
  )
}
