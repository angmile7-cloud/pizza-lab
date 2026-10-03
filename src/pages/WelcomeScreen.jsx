import { Link } from 'react-router-dom'
import welcomeImage from '../assets/Niveles/pizza pantalla  inicio.png'

export default function WelcomeScreen() {

  // Renderizado del componente
  return (
    <section className="menu">
      <div className="menu-top">
        <h1 className="menu-title">DODO&apos;S PIZZA LAB</h1>
        <p className="menu-welcome">¡Bienvenidos!</p>
      </div>
      <div className="menu-pizza-slot">
        <img
          className="menu-pizza"
          src={welcomeImage}
          alt="Pizza de Dodo's Pizza Lab"
        />
      </div>
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
