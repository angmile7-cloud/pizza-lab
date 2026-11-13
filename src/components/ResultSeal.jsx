export default function ResultSeal({ state, className = '' }) {
  return (
    <svg className={`order-result__seal ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="currentColor" className="order-result__seal-circle" />
      {state === 'success' ? (
        <path d="m13 24 7 7 15-16" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ) : state === 'timeout' ? (
        <><circle cx="24" cy="24" r="13" fill="none" stroke="white" strokeWidth="3" /><path d="M24 16v9l6 4" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>
      ) : (
        <path d="m16 16 16 16m0-16L16 32" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
      )}
    </svg>
  )
}
