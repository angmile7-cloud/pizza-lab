import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import LevelHeader from '../components/LevelHeader'
import ChefAvatar from '../components/ChefAvatar'
import PizzaPreview from '../components/PizzaPreview'
import { RewardDialog } from '../components/RewardUI'
import { useGame } from '../game/useGame'
import { getPassedLevelIds } from '../game/ordersModeUtils'
import { LEVELS } from '../game/gameUtils'
import { prepareCommunityPhoto } from '../game/communityPhoto'

function CommunityPhoto({ photo, pizzaName, onOpen, viewer = false }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const content = <>
    {photo && !failed
      ? <img src={photo} alt={pizzaName} loading={viewer ? 'eager' : 'lazy'} decoding="async"
        style={{ opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      : <div role="img" aria-label={`${pizzaName}, ilustración de pizza`}><PizzaPreview /></div>}
  </>
  return onOpen
    ? <button type="button" className="community-photo community-photo-button"
      aria-label={`Ampliar foto de ${pizzaName}`} onClick={onOpen}>{content}</button>
    : <div className="community-photo">{content}</div>
}

function HeartButton({ entry, onVote }) {
  return <button type="button" className="community-heart" aria-pressed={entry.voted}
    disabled={entry.own}
    aria-label={entry.own ? 'No puedes votar por tu propia pizza'
      : `${entry.voted ? 'Retirar voto de' : 'Votar por'} ${entry.pizzaName}, ${entry.hearts} votos`}
    onClick={() => onVote(entry.id)}>
    <svg key={String(entry.voted)} className={entry.voted ? 'community-heart--pop' : undefined}
      viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20 4.5 12.5C-1 7 6 0 12 6c6-6 13 1 7.5 6.5Z" />
    </svg>
  </button>
}

function VoteHint({ chosen }) {
  return <div className="community-vote-hint">
    <p>Tienes 1 voto por reto. Toca otro corazón para cambiarlo.</p>
    <p className="community-vote-choice">{chosen ? `Tu voto: ${chosen.pizzaName}` : '\u00a0'}</p>
  </div>
}

function CommunityAvatar({ entry }) {
  return <span className="community-avatar" style={{ background: entry.color }} aria-hidden="true">
    {entry.own ? <ChefAvatar id={entry.avatarId} /> : entry.initials}
  </span>
}

function EntryRow({ entry, rank, gallery, onVote, onOpen }) {
  return <li className={`community-entry${entry.own ? ' community-entry--own' : ''}${gallery ? ' community-entry--gallery' : ''}`}>
    <strong className="community-rank">{rank}.</strong>
    <CommunityPhoto key={entry.photo} photo={entry.photo} pizzaName={entry.pizzaName}
      onOpen={(event) => onOpen(entry.id, event.currentTarget)} />
    <div className="community-chef">
      <CommunityAvatar entry={entry} />
      <div>
        {gallery && <strong className="community-pizza-name">{entry.pizzaName}</strong>}
        <span className="community-handle">{entry.handle}</span>
        {entry.own && <small className="community-own-label">Tu pizza</small>}
        {gallery && <small className="community-bio">{entry.bio}</small>}
      </div>
    </div>
    <span className="community-count">{entry.hearts}</span>
    <HeartButton entry={entry} onVote={onVote} />
  </li>
}

function PhotoViewer({ entries, entryId, onChange, onVote, onClose, opener }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const touchRef = useRef(null)
  const index = entries.findIndex((entry) => entry.id === entryId)
  const entry = entries[index]
  const previous = entries[index - 1]
  const next = entries[index + 1]

  useEffect(() => {
    const dialog = dialogRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.querySelector('button').focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = overflow
      queueMicrotask(() => {
        if (!dialog.isConnected && opener?.isConnected) opener.focus({ preventScroll: true })
      })
    }
  }, [opener])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.contains(document.activeElement) || document.activeElement.matches(':disabled')) {
      dialog.querySelector('button').focus({ preventScroll: true })
    }
  }, [entryId, previous?.id, next?.id])

  function handleKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const target = event.key === 'ArrowLeft' ? previous : next
      if (target) onChange(target.id)
    } else if (event.key === 'Tab') {
      const buttons = [...dialogRef.current.querySelectorAll('button:not(:disabled)')]
      const first = buttons[0]
      const last = buttons.at(-1)
      if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !buttons.includes(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return <div className="community-viewer-overlay" onClick={(event) => {
    if (event.target === event.currentTarget) onClose()
  }}>
    <div ref={dialogRef} className="community-viewer-card" role="dialog" aria-modal="true"
      aria-labelledby={titleId} onKeyDown={handleKey}>
      <div className="community-viewer-toolbar">
        <button type="button" aria-label="Cerrar foto" onClick={onClose}>×</button>
      </div>
      <div className="community-viewer-image" onTouchStart={(event) => {
        const touch = event.touches[0]
        touchRef.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
      }} onTouchCancel={() => { touchRef.current = null }} onTouchEnd={(event) => {
        const start = touchRef.current
        touchRef.current = null
        if (!start) return
        const touch = event.changedTouches[0]
        const dx = touch.clientX - start.x
        const dy = touch.clientY - start.y
        if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return
        const target = dx > 0 ? previous : next
        if (target) onChange(target.id)
      }}>
        <CommunityPhoto key={`${entry.id}:${entry.photo}`} photo={entry.photo} pizzaName={entry.pizzaName} viewer />
      </div>
      <h2 id={titleId}>{entry.pizzaName}</h2>
      <div className="community-viewer-details">
        <div className="community-chef">
          <CommunityAvatar entry={entry} />
          <span className="community-handle">{entry.handle}</span>
        </div>
        <span className="community-count">{entry.hearts}</span>
        <HeartButton entry={entry} onVote={onVote} />
      </div>
      <nav className="community-viewer-navigation" aria-label="Fotos del reto">
        <button type="button" aria-label="Foto anterior" disabled={!previous}
          onClick={() => onChange(previous.id)}>‹</button>
        <span>{index + 1} / {entries.length}</span>
        <button type="button" aria-label="Foto siguiente" disabled={!next}
          onClick={() => onChange(next.id)}>›</button>
      </nav>
    </div>
  </div>
}

function UploadForm({ challenge, onPublish, onClose }) {
  const [photo, setPhoto] = useState('')
  const [pizzaName, setPizzaName] = useState('')
  const [error, setError] = useState('')
  const [preparing, setPreparing] = useState(false)
  const selectionRef = useRef(0)
  const decodeRef = useRef(null)
  const publishingRef = useRef(false)
  useEffect(() => () => {
    selectionRef.current += 1
    decodeRef.current?.abort()
  }, [])

  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const selection = ++selectionRef.current
    decodeRef.current?.abort()
    const controller = new AbortController()
    decodeRef.current = controller
    setError('')
    setPhoto('')
    setPreparing(true)
    try {
      const prepared = await prepareCommunityPhoto(file, controller.signal)
      if (selection === selectionRef.current) setPhoto(prepared)
    } catch (reason) {
      if (selection === selectionRef.current) setError(reason.message)
    } finally {
      if (selection === selectionRef.current) setPreparing(false)
      event.target.value = ''
    }
  }
  function submit(event) {
    event.preventDefault()
    if (publishingRef.current || preparing) return
    setError('')
    try {
      publishingRef.current = true
      onPublish({ photo, pizzaName: pizzaName.trim() })
    } catch (reason) {
      publishingRef.current = false
      setError(reason.message)
    }
  }
  return <form className="community-upload-form" onSubmit={submit}>
    <button type="button" className="rewards-cancel" onClick={onClose}>Cancelar</button>
    <p>{challenge.hint}</p>
    <label className="community-field">Subir foto
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-describedby="community-photo-note" />
    </label>
    <p id="community-photo-note">JPG, PNG o WebP · máximo 5 MB. Sube solo fotos de tu pizza.</p>
    <p>Tu foto se queda en tu dispositivo (demo)</p>
    {preparing && <p>Preparando tu foto…</p>}
    {photo && <div className="community-upload-preview"><CommunityPhoto key={photo} photo={photo} pizzaName={pizzaName.trim() || 'Tu pizza'} /></div>}
    <label className="community-field">Nombre de tu pizza
      <input type="text" maxLength={30} value={pizzaName} onChange={(event) => setPizzaName(event.target.value)}
        placeholder="Mi pizza favorita" autoComplete="off" />
    </label>
    {error && <p role="alert" className="community-error">{error}</p>}
    <button type="submit" className="btn-yellow" disabled={preparing}>Publicar</button>
  </form>
}

function useCommunityReactions(service) {
  useEffect(() => {
    let timer = null
    function syncTimer() {
      const shouldRun = document.visibilityState === 'visible' && service.hasPendingReactions()
      if (!shouldRun && timer !== null) {
        clearInterval(timer)
        timer = null
      } else if (shouldRun && timer === null) {
        timer = setInterval(() => service.advanceReactions(), 1000)
      }
    }
    const unsubscribe = service.subscribe(syncTimer)
    document.addEventListener('visibilitychange', syncTimer)
    syncTimer()
    return () => {
      clearInterval(timer)
      unsubscribe()
      document.removeEventListener('visibilitychange', syncTimer)
    }
  }, [service])
}

export default function CommunityScreen() {
  const { communityService: service, answersByLevel, orderResultsByLevel, createdPizza, userName, avatarId } = useGame()
  useSyncExternalStore(service.subscribe, service.getSnapshot)
  useCommunityReactions(service)
  const challenges = service.getChallenges()
  const [challengeId, setChallengeId] = useState('margherita')
  const [dialog, setDialog] = useState(null)
  const [viewer, setViewer] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [error, setError] = useState('')
  const closeDialog = useCallback(() => setDialog(null), [])
  function openViewer(entryId, opener) {
    setViewer({ entryId, opener })
  }
  const challenge = challenges.find((item) => item.id === challengeId)
  const entries = service.getEntries(challengeId)
  const own = entries.find((entry) => entry.own)
  const chosen = entries.find((entry) => entry.voted)
  const passed = new Set(getPassedLevelIds({ answersByLevel, orderResultsByLevel, createdPizza }))
  const unlockLevel = service.getPublishingUnlockLevel()
  const publishingUnlocked = passed.size >= unlockLevel && LEVELS.every((level) => passed.has(level.id))
  const credits = service.getCredits()
  function vote(id) {
    setError('')
    try {
      const pizzaName = service.toggleVote(id)
      setAnnouncement(pizzaName ? `Tu voto en este reto ahora es ${pizzaName}` : 'Quitaste tu voto')
    } catch (reason) { setError(reason.message) }
  }
  function remove() {
    setError('')
    try {
      service.removeEntry(challengeId)
      setAnnouncement('Pizza retirada')
    } catch (reason) { setError(reason.message) }
  }
  function publish(entry) {
    if (!publishingUnlocked) throw new Error(`Termina los ${unlockLevel} niveles para subir tu pizza`)
    service.publishEntry(challengeId, { ...entry, handle: userName, avatarId })
    setAnnouncement('Pizza publicada')
    closeDialog()
  }
  return <section className={`rewards-screen community-screen${viewer ? ' community-screen--viewing' : ''}`}>
    <div className="rewards-layout" inert={Boolean(dialog || viewer)}>
      <LevelHeader title="DODO'S PIZZA LAB" />
      <main className="community-scroll">
        <h2 className="community-title">Reto Semanal</h2>
        <h3 className="community-challenge-title">{challenge.title}</h3>
        <p className="community-description">{challenge.description}</p>
        <nav className="community-chips" aria-label="Retos de la Comunidad">
          {challenges.map((item) => <button type="button" key={item.id} className="community-chip"
            aria-pressed={item.id === challengeId} onClick={() => {
              setChallengeId(item.id)
              setAnnouncement('')
              setError('')
            }}>{item.title}</button>)}
        </nav>
        <section className="community-upload" aria-label="Tu pizza">
          <div className="community-upload-frame">
            {own
              ? <><CommunityPhoto key={own.photo} photo={own.photo} pizzaName={own.pizzaName}
                onOpen={(event) => openViewer(own.id, event.currentTarget)} />
                <span className="community-upload-hearts">{own.hearts} ♥ · Tu pizza</span></>
              : <span className="community-upload-placeholder" aria-hidden="true">{publishingUnlocked ? '📷' : '🔒'}</span>}
            <button type="button" className="btn-yellow" disabled={!own && !publishingUnlocked}
              aria-describedby={!own && !publishingUnlocked ? 'community-upload-lock' : undefined}
              onClick={() => {
                if (own) remove()
                else { setAnnouncement(''); setDialog({ type: 'upload' }) }
              }}>{own ? 'Retirar mi pizza' : 'Sube tu foto'}</button>
          </div>
          <div>
            <p>¡Sube tu pizza y comparte el resultado!</p>
            {!publishingUnlocked && <small id="community-upload-lock">Termina los {unlockLevel} niveles para subir tu pizza</small>}
            {own && <>
              <strong className="community-pizza-name">{own.pizzaName}</strong>
              <div className="community-chef"><CommunityAvatar entry={own} /><span className="community-handle">{own.handle}</span></div>
            </>}
          </div>
        </section>
        <section className="community-top">
          <h3>TOP PIZZAS</h3>
          <VoteHint chosen={chosen} />
          <ol className="community-entries">
            {entries.slice(0, 3).map((entry, index) => <EntryRow key={entry.id} entry={entry} rank={index + 1}
              onVote={vote} onOpen={openViewer} />)}
          </ol>
          <button type="button" className="btn-yellow" onClick={() => setDialog({ type: 'gallery' })}>Ver Todos</button>
        </section>
        <p className="community-winners">El chef Dodo elegirá a los ganadores</p>
        <div className="community-prizes">
          {['Clase Personalizada', 'Pregunta directa al chef', 'Premios Exclusivos'].map((title) =>
            <button type="button" key={title} className="btn-yellow" onClick={() => setDialog({ type: 'prize', title })}>{title}</button>)}
        </div>
        <p className="community-demo">Comunidad ficticia · demo educativa</p>
        <button type="button" className="community-credits" onClick={() => setDialog({ type: 'credits' })}>Créditos de las fotos</button>
      </main>
      <footer className="rewards-footer"><Link className="btn-yellow" to="/jugar">INICIO</Link></footer>
    </div>
    <p className="rewards-announcement" role="status" aria-atomic="true">{announcement}</p>
    {error && <p className="community-error community-screen-error" role="alert">{error}</p>}
    {dialog && <div inert={Boolean(viewer)}><RewardDialog title={dialog.type === 'upload' ? 'Publica tu pizza'
      : dialog.type === 'gallery' ? `${challenge.title} · Todas las pizzas`
        : dialog.type === 'credits' ? 'Créditos de las fotos' : dialog.title} onClose={closeDialog}>
      {dialog.type === 'upload'
        ? <UploadForm challenge={challenge} onPublish={publish} onClose={closeDialog} />
        : <><button type="button" className="rewards-cancel" onClick={closeDialog}>Cerrar</button>
          {dialog.type === 'gallery' && <>
            <VoteHint chosen={chosen} />
            <ol className="community-entries community-gallery">
              {entries.map((entry, index) => <EntryRow key={entry.id} entry={entry} rank={index + 1}
                gallery onVote={vote} onOpen={openViewer} />)}
            </ol>
          </>}
          {dialog.type === 'prize' && <p>Parte de la fantasía del juego: el chef Dodo las entrega dentro de Dodo's Pizza Lab. No son premios canjeables en el mundo real.</p>}
          {dialog.type === 'credits' && (credits.length
            ? <ul>{credits.map((credit) => <li key={credit.pizzaName}><strong>{credit.pizzaName}</strong>: {credit.credit}</li>)}</ul>
            : <p>Créditos de las fotos: pendientes de completar</p>)}
        </>}
    </RewardDialog></div>}
    {viewer && <PhotoViewer entries={entries} entryId={viewer.entryId} opener={viewer.opener}
      onChange={(entryId) => setViewer((current) => ({ ...current, entryId }))}
      onVote={vote} onClose={() => setViewer(null)} />}
  </section>
}
