import orderPaper from '../assets/papel_pedido.png'

export default function OrderTicket({ customer, message, className = '', children }) {
  return (
    <article
      className={`orders-mode__ticket${message.length > 120 ? ' is-long' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--order-paper-image': `url("${orderPaper}")` }}
    >
      <h2 className="orders-mode__customer">Pedido de {customer}</h2>
      <p className="orders-mode__quote">“{message}”</p>
      {children}
    </article>
  )
}
