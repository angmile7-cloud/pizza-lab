import { useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ChefLogo from './ChefLogo'

export default function InvitationDialog({ title, body, primaryAction, secondaryAction, onClose }) {
  const titleId = useId()
  const bodyId = useId()
  const dialogRef = useRef(null)
  const primaryRef = useRef(null)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const overlay = dialog.parentElement
    const previousFocus = document.activeElement
    const background = [...overlay.parentElement.children]
      .filter((element) => element !== overlay)
      .map((element) => ({ element, inert: element.inert }))
    background.forEach(({ element }) => { element.inert = true })
    primaryRef.current.focus()

    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        onClose()
      } else if (event.key === 'Tab') {
        const buttons = [...dialog.querySelectorAll('button:not(:disabled)')]
        const index = buttons.indexOf(document.activeElement)
        event.preventDefault()
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
      }
    }
    function keepFocusInside(event) {
      if (!dialog.contains(event.target)) primaryRef.current.focus()
    }
    document.addEventListener('keydown', handleKey, true)
    document.addEventListener('focusin', keepFocusInside)
    return () => {
      document.removeEventListener('keydown', handleKey, true)
      document.removeEventListener('focusin', keepFocusInside)
      background.forEach(({ element, inert }) => { element.inert = inert })
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="invitation-overlay" onClick={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        ref={dialogRef}
        className="invitation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <ChefLogo className="invitation-dialog__logo" />
        <h2 id={titleId}>{title}</h2>
        <p id={bodyId}>{body}</p>
        <div className="invitation-dialog__actions">
          <button ref={primaryRef} className="invitation-dialog__primary" type="button" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
          <button className="invitation-dialog__secondary" type="button" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('root'),
  )
}
