import { useState } from 'react'
import { Link } from 'react-router-dom'

const initialMessages = [
  {
    id: 1,
    author: 'Dodo',
    text: '¡Hola! Soy Dodo. ¿Qué consulta quieres realizar?',
    fromUser: false,
  },
]

export default function Chat() {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const text = draft.trim()

    if (!text) return

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: Date.now(), author: 'Tú', text, fromUser: true },
      {
        id: Date.now() + 1,
        author: 'Dodo',
        text: '¡Qué buena pregunta! Sigue explorando los niveles para descubrir más secretos pizzeros.',
        fromUser: false,
      },
    ])
    setDraft('')
  }

  return (
    <section className="page chat-page">
      <div className="chat-heading">
        <div>
          <h1>Chat del laboratorio</h1>
          <p>Habla con Dodo sobre el mundo de la pizza.</p>
        </div>
        <span className="chat-status">En línea</span>
      </div>

      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <article
            className={`chat-message ${message.fromUser ? 'chat-message-user' : ''}`}
            key={message.id}
          >
            <strong>{message.author}</strong>
            <p>{message.text}</p>
          </article>
        ))}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <label htmlFor="chat-message">Tu mensaje</label>
        <div className="chat-input-row">
          <input
            id="chat-message"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe aquí..."
            maxLength={160}
          />
          <button className="btn-yellow chat-send" type="submit" disabled={!draft.trim()}>
            Enviar
          </button>
        </div>
      </form>

      <Link className="auth-back chat-back" to="/jugar">
        Volver al juego
      </Link>
    </section>
  )
}
