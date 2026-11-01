export default function ChefAvatar({ id, className }) {
  const ink = '#432d35'
  const eyes = <><circle cx="43" cy="57" r="3" /><circle cx="65" cy="57" r="3" /></>
  const grin = <path d="M45 70q10 9 20-2" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
  const art = {
    'pepperoni-pirata': <>
      <circle cx="54" cy="62" r="34" fill="#d96556" />
      <g fill="#f5b48d"><circle cx="31" cy="60" r="5" /><circle cx="71" cy="79" r="6" /><circle cx="39" cy="84" r="4" /></g>
      <path d="M24 42 31 19q23 14 46 0l8 23Z" fill={ink} />
      <path d="M20 42h68" stroke={ink} strokeWidth="7" strokeLinecap="round" />
      <path d="m48 28 12 7m-12 0 12-7" stroke="#fff4d3" strokeWidth="3" />
      <path d="m24 49 54 13" stroke={ink} strokeWidth="3" />
      <path d="M35 52h17v10q-9 12-17-1Z" fill={ink} />
      <circle cx="67" cy="58" r="3" fill={ink} />{grin}
    </>,
    'aceituna-elegante': <>
      <ellipse cx="54" cy="62" rx="29" ry="36" fill="#719367" />
      <ellipse cx="44" cy="36" rx="10" ry="5" fill="#aac88c" />
      <path d="m49 24 5-10 6 10" stroke={ink} strokeWidth="3" fill="none" />
      {eyes}
      <circle cx="65" cy="57" r="11" fill="none" stroke="#ffd54a" strokeWidth="3" />
      <path d="M76 58q8 16 3 29" fill="none" stroke="#ffd54a" strokeWidth="2" />
      <path d="M54 68q-8-7-15 1m15-1q8-7 15 1" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <path d="M48 79q7 5 13-2" fill="none" stroke={ink} strokeWidth="2" />
      <path d="m45 91 9-5 9 5-9 6Z" fill="#e799ac" />
    </>,
    'champinon-ninja': <>
      <path d="M38 47h32l6 43q-22 13-44 0Z" fill="#fff4d3" />
      <path d="M15 49q2-35 39-35t39 35q-38 14-78 0" fill="#be7895" />
      <g fill="#f3d5c4"><circle cx="37" cy="31" r="6" /><circle cx="68" cy="28" r="5" /></g>
      <path d="M31 52h46v16H31Z" fill={ink} />
      <path d="m76 54 21-9-9 17 12 8-25-6" fill={ink} />
      <path d="m39 59 10 2m11 0 10-3" stroke="#ffd54a" strokeWidth="3" />
      {grin}<path d="m35 85 35 1" stroke="#be7895" strokeWidth="4" />
    </>,
    'tomate-timido': <>
      <path d="M52 32C7 16 11 91 51 96c44 7 58-77 6-64" fill="#df695f" />
      <path d="M55 35 32 15l6 21-22 2 25 11 14-14 17 13 19-14-27 1 11-22Z" fill="#719367" />
      {eyes}<g fill="#f3a0a2"><ellipse cx="34" cy="67" rx="8" ry="5" /><ellipse cx="76" cy="66" rx="8" ry="5" /></g>
      <path d="M51 72q6 4 9-2" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M27 83q19-38 45-3-24 26-45 3" fill="#91b577" />
      <path d="m33 87 27-7" stroke="#52734a" strokeWidth="2" />
      <ellipse cx="30" cy="78" rx="5" ry="8" fill="#df695f" />
    </>,
    'queso-cool': <>
      <path d="M23 39q20-26 49-12t17 50q-9 27-40 21T23 39" fill="#fff4d3" />
      <path d="M28 42q3-12 16-15" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="m23 52 65-4" stroke={ink} strokeWidth="4" />
      <path d="M30 49h21v15q-14 10-20-3Zm29 0h21l-2 13q-11 10-19 0Z" fill={ink} />
      <path d="m35 54 8 5m21-5 8 5" stroke="#91b9b5" strokeWidth="3" />
      {grin}<path d="m76 85 11-6" stroke="#e6c980" strokeWidth="3" />
    </>,
    'albahaca-aventurera': <>
      <path d="M53 100C4 81 21 33 58 20c38 27 42 61-5 80" fill="#719367" />
      <path d="M54 91V43m0 40L34 72m20 2 22-12" stroke="#a6c68a" strokeWidth="3" fill="none" />
      <path d="M30 39 37 17h33l8 22" fill="#cba16f" />
      <path d="M35 31h38" stroke={ink} strokeWidth="5" />
      <ellipse cx="54" cy="40" rx="36" ry="7" fill="#e7c48d" />
      {eyes}{grin}<path d="m76 77 7 8" stroke="#e7c48d" strokeWidth="5" />
    </>,
    'rodillo-rebelde': <>
      <path d="M35 42 9 90l43-6 39 12-16-55Z" fill="#be7895" />
      <path d="m22 26 11 8m43 48 11 8" stroke={ink} strokeWidth="12" strokeLinecap="round" />
      <path d="M25 43 43 25l41 42-18 18Z" fill="#e7c48d" stroke="#cba16f" strokeWidth="3" strokeLinejoin="round" />
      <path d="m40 37 12 12m15 20 8 8" stroke="#cba16f" strokeWidth="2" />
      <path d="m41 49 10 2m10 9 3 9" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M44 62q3 15 15 14" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="m24 80 11 3" stroke="#ffd54a" strokeWidth="3" />
    </>,
    'pina-polemica': <>
      <path d="M18 28h72l-7 62q-29 19-58 0Z" fill="#d7aa54" />
      <path d="M24 33h60l-7 53q-23 15-46 0Z" fill="#ffd54a" />
      <g stroke="#e6bb56" strokeWidth="2"><path d="m27 43 49 39M26 61l32 29m26-48L34 83m47-22L57 91" /></g>
      <path d="m46 27-9-17 16 9 13-10-3 18" fill="#719367" />
      <path d="m34 50 13-3m13-1 13 5" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx="45" cy="57" r="3" /><circle cx="68" cy="58" r="3" />
      <path d="m46 74 17-3-3 6" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M85 44q9 13 0 14-8-1 0-14" fill="#91b9b5" />
    </>,
  }
  return <svg className={className} viewBox="0 0 108 108" fill={ink}
    aria-hidden="true" focusable="false">
    <circle cx="54" cy="54" r="53" fill="#f7e2dc" />
    {art[id]}
  </svg>
}
