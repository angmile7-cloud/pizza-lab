import { Link } from 'react-router-dom'

export default function WelcomeScreen() {
  return (
    <section className="menu">
      <div className="menu-top">
        <h1 className="menu-title">DODO&apos;S PIZZA LAB</h1>
        <p className="menu-welcome">¡Bienvenidos!</p>
      </div>
      <img
        className="menu-pizza"
        src="/welcome-pizza.png"
        alt="Pizza de Dodo's Pizza Lab"
      />
      <div className="menu-actions">
        <Link className="btn-yellow" to="/registro">
          Crear cuenta
        </Link>
        <Link className="btn-yellow" to="/login">
          Iniciar sesión
        </Link>
      </div>
    </section>
  )
}
