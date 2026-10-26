import chefHat from '../assets/gorro_chef.png'

export default function ChefLogo({ className }) {
  return (
    <img
      className={className}
      src={chefHat}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
    />
  )
}