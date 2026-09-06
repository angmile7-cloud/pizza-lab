import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function AuthScreen({ mode }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    navigate('/jugar')
  }

  return (
    <section className="page">
      <p>
        <Link className="auth-back" to="/">
          ← Volver
        </Link>
      </p>
      <h1>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegister ? (
          <input
            type="text"
            name="name"
            placeholder="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        ) : null}
        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <button className="btn-yellow" type="submit">
          {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
    </section>
  )
}
