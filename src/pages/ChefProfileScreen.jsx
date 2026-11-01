import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ChefAvatar from '../components/ChefAvatar'
import LevelHeader from '../components/LevelHeader'
import { CHEF_AVATARS, nicknameError, normalizeNickname } from '../game/chefProfile'
import { useGame } from '../game/useGame'

export default function ChefProfileScreen() {
  const { userName, avatarId, startNewGame } = useGame()
  const navigate = useNavigate()
  const [name, setName] = useState(userName)
  const [selected, setSelected] = useState(avatarId)
  const [touched, setTouched] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const inputRef = useRef(null)
  const optionsRef = useRef([])
  const error = nicknameError(name)
  const shownError = submitError || (touched ? error : '')

  function submit(event) {
    event.preventDefault()
    setTouched(true)
    if (error) {
      inputRef.current.focus()
      return
    }
    try {
      startNewGame(name, selected)
      navigate('/jugar')
    } catch (reason) {
      setSubmitError(reason.message)
      inputRef.current.focus()
    }
  }

  function moveSelection(event, index) {
    const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (!(event.key in steps) && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? CHEF_AVATARS.length - 1
      : (index + steps[event.key] + CHEF_AVATARS.length) % CHEF_AVATARS.length
    setSelected(CHEF_AVATARS[next].id)
    optionsRef.current[next].focus()
  }

  return <section className="chef-profile">
    <LevelHeader title="DODO'S PIZZA LAB" />
    <form className="chef-profile-form" onSubmit={submit} noValidate>
      <div className="chef-profile-scroll">
        <h2>Crea tu chef</h2>
        <label className="chef-nickname-label" htmlFor="chef-nickname">Tu apodo</label>
        <input ref={inputRef} id="chef-nickname" name="nickname" type="text" autoComplete="off"
          placeholder="Chef Pizzolo" value={name} aria-invalid={Boolean(shownError)}
          aria-describedby="chef-nickname-help chef-nickname-error"
          onBlur={() => { setTouched(true); setName(normalizeNickname(name)) }}
          onChange={(event) => {
            setName(event.target.value)
            setTouched(true)
            setSubmitError('')
          }} />
        <p id="chef-nickname-help" className="chef-profile-help">Entre 2 y 16 caracteres. Letras, números, espacios, . _ -</p>
        <p id="chef-nickname-error" className="chef-profile-error" aria-live="polite" aria-atomic="true">{shownError}</p>
        <h3 id="chef-avatar-label">Elige tu avatar</h3>
        <div className="chef-avatar-grid" role="radiogroup" aria-labelledby="chef-avatar-label">
          {CHEF_AVATARS.map((avatar, index) => <button type="button" role="radio"
            key={avatar.id} ref={(node) => { optionsRef.current[index] = node }}
            tabIndex={selected === avatar.id ? 0 : -1} aria-checked={selected === avatar.id}
            aria-label={avatar.name} className="chef-avatar-option"
            onClick={() => setSelected(avatar.id)} onKeyDown={(event) => moveSelection(event, index)}>
            <ChefAvatar id={avatar.id} />
            <span>{avatar.name}</span>
            {selected === avatar.id && <span className="chef-avatar-check" aria-hidden="true">✓</span>}
          </button>)}
        </div>
        <div className="chef-name-tag" aria-label="Vista previa de tu chef">
          <ChefAvatar key={selected} id={selected} className="chef-avatar-preview" />
          <div><small>¡Este es tu chef!</small><strong>{normalizeNickname(name) || 'Chef sin nombre'}</strong></div>
        </div>
        <p className="chef-privacy-note">No guardamos tus datos. Tu apodo vive solo mientras juegas.</p>
      </div>
      <footer className="chef-profile-actions">
        <button type="submit" className="btn-yellow" disabled={Boolean(error)}>¡A jugar!</button>
        <Link to="/">← Volver</Link>
      </footer>
    </form>
  </section>
}
