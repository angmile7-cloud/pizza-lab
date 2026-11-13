export default function ResultStatus({ met }) {
  return <span className={`result-status${met ? '' : ' is-pending'}`} aria-hidden="true">{met ? '✓' : '✗'}</span>
}
