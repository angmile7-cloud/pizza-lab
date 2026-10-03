// Imports de React y React Router
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../game/useGame'

// Componente de pantalla de autenticación
export default function AuthScreen({ mode }) {
  const navigate = useNavigate()
  const { userName, setUserName } = useGame()
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Función para manejar el envío del formulario
  function handleSubmit(event) {
    event.preventDefault()
    setUserName(isRegister ? name.trim() : userName || email.split('@')[0])
    navigate('/jugar')
  }

  // Renderizado del componente
  return (
    // Sección de la página
    <section className="page">
      <p>
        <Link className="auth-back" to="/">
          ← Volver
        </Link>
      </p>
      <h1>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
      {/* Formulario de autenticación */}
      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Campo de nombre */}
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
        {/* Campo de correo electrónico */}
        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {/* Campo de contraseña */}
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
