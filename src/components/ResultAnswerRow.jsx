import { useId, useState } from 'react'
import DodoTip, { DodoBubble } from './DodoTip'
import ResultStatus from './ResultStatus'

export default function ResultAnswerRow({ row, index, delay }) {
  const [open, setOpen] = useState(!row.correct)
  const id = useId()
  return (
    <li className={`result-answer ${row.correct ? 'is-correct' : 'is-incorrect'}`} style={{ '--result-answer-delay': delay }}>
      <button type="button" className="result-answer__toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)}>
        <span className="result-answer__number">{index + 1}</span>
        <ResultStatus met={row.correct} />
        <span className="order-result__sr-only">{row.statusLabel ?? (row.correct ? 'Bien' : 'Mal')}: </span>
        <strong className="result-answer__points">{row.points > 0 ? '+' : ''}{row.points}</strong>
        <span className="result-answer__text">{row.text}</span>
        {!row.correct ? <span className="result-answer__review">Repasa</span> : null}
        <span className="result-answer__chevron" aria-hidden="true">{open ? '⌃' : '⌄'}</span>
      </button>
      <div id={id} className={`result-answer__panel${open ? ' is-open' : ''}`} inert={!open}>
        <div><div className="result-answer__details">
          <p>{row.text}</p>
          {!row.correct && row.selectedAnswer ? <p><strong>Tu respuesta:</strong> {row.selectedAnswer}</p> : null}
          {!row.correct && row.correctAnswer ? <p><strong>Correcta:</strong> {row.correctAnswer}</p> : null}
          {row.requirements?.length ? (
            <ul className="result-answer__requirements">
              {row.requirements.map((requirement) => (
                <li key={requirement.requirementId}>
                  <ResultStatus met={requirement.met} />
                  <span><span className="order-result__sr-only">{requirement.met ? 'Cumplido: ' : 'Pendiente: '}</span>{requirement.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {row.explanation ? <DodoBubble>{row.explanation}</DodoBubble> : null}
          {row.tip ? <DodoTip>{row.tip}</DodoTip> : null}
        </div></div>
      </div>
    </li>
  )
}
