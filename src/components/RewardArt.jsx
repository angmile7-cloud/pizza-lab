export function RewardIcon({ icon, ...props }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {icon === 'chat' && <>
        <path d="M55 28c0 12-10 21-23 21h-7L12 57l3-15C5 34 7 18 17 12c17-10 38-1 38 16Z" fill="currentColor" />
        <path d="M21 28h.1M32 28h.1M43 28h.1" stroke="#fff" strokeWidth="7" />
      </>}
      {icon === 'book' && <>
        <path d="M32 15C23 9 13 9 5 13v38c9-4 18-3 27 2 9-5 18-6 27-2V13c-8-4-18-4-27 2v38Z" />
        <path d="M13 23h10m-10 9h10m18-9h10m-10 9h10" strokeWidth="2" />
      </>}
      {icon === 'restaurant' && <>
        <path d="M8 27 14 10h36l6 17M13 36v17h20M20 10l-3 17m15-17v17m12-17 3 17M8 27q4 9 9 0 7 9 15 0 8 9 15 0 5 9 9 0M40 55l16-20" />
        <circle cx="41" cy="38" r="4" /><circle cx="54" cy="53" r="4" />
      </>}
      {icon === 'monitor' && <>
        <rect x="6" y="10" width="52" height="36" rx="3" />
        <path d="m22 28 7 7 14-15M32 47v8m-13 1h26" />
      </>}
      {icon === 'dough' && <>
        <path d="M8 39c0-16 10-26 24-26s24 10 24 26c0 12-48 12-48 0Z" fill="#fff4d3" />
        <path d="m22 25-4 8m16-12-4 9m15-4-3 8" />
      </>}
      {icon === 'sauce' && <>
        <path d="M7 29h50c-2 17-11 24-25 24S9 46 7 29Z" fill="#f8c1b1" />
        <path d="M39 26 52 9M21 21c-5-6 5-6 0-12m11 12c-5-6 5-6 0-12" />
      </>}
      {icon === 'cheese' && <>
        <path d="m8 30 31-19 17 19v23H8Z" fill="#ffd54a" />
        <path d="M8 30h48" />
        <circle cx="22" cy="41" r="3" /><circle cx="43" cy="42" r="4" />
      </>}
      {icon === 'toppings' && <>
        <path d="M7 32c0-28 50-28 50 0Zm18 0-2 21h18l-2-21" fill="#fff4d3" />
        <path d="M18 22h.1M32 16h.1M45 23h.1" />
      </>}
      {icon === 'oven' && <>
        <rect x="8" y="8" width="48" height="48" rx="5" fill="#fff4d3" />
        <path d="M8 21h48M17 14h.1M26 14h.1M22 46c-7-9 3-10 2-17 9 5 3 8 9 10 3-3 4-5 3-9 10 9 10 14 5 17Z" />
      </>}
      {icon === 'hat' && <>
        <path d="M18 42V30c-19-5-9-28 5-18 2-11 20-11 20 0 14-10 24 13 5 18v12Zm0 8h30" fill="#fff4d3" />
      </>}
      {icon === 'history' && <>
        <circle cx="32" cy="32" r="24" fill="#fff4d3" />
        <path d="M32 17v16l11 7M10 12 7 24l12-2" />
      </>}
    </svg>
  )
}

export function RewardTicket({ reward, redemption }) {
  const words = reward.title.split(' ')
  const split = Math.ceil(words.length / 2)
  return (
    <svg className="reward-ticket" viewBox="0 0 300 205" role="img" aria-label={`${reward.title}, ${redemption.code}, canje ${redemption.index}. ${reward.voucher.caption}`}>
      <path d="M12 3H288v13q-14 8 0 16v16q-14 8 0 16v16q-14 8 0 16v16q-14 8 0 16v16q-14 8 0 16v16q-14 8 0 16v10H12v-10q14-8 0-16v-16q14-8 0-16v-16q14-8 0-16v-16q14-8 0-16V80q14-8 0-16V48q14-8 0-16V16Z" fill="#fff4d3" stroke="#7b493e" strokeWidth="2" />
      <path d="M31 151h238" stroke="#b48d65" strokeDasharray="4 5" />
      <RewardIcon icon={reward.icon} x="123" y="13" width="54" height="48" />
      <g fill="#321d13" textAnchor="middle" fontFamily="system-ui, sans-serif">
        <text x="150" y="83" fontSize="17" fontWeight="700">
          <tspan x="150">{words.slice(0, split).join(' ')}</tspan>
          <tspan x="150" dy="21">{words.slice(split).join(' ')}</tspan>
        </text>
        <text x="150" y="135" fontSize="23" fontWeight="800" letterSpacing="2">{redemption.code}</text>
        <text x="130" y="178" fontSize="11">{reward.voucher.stamp}</text>
        <text x="130" y="193" fontSize="10">#{redemption.index}</text>
      </g>
      <g transform="translate(244 178) rotate(-12)" stroke="#9f5b45" strokeWidth="1.5" fill="none">
        <circle r="19" strokeDasharray="2 2" />
        <path d="M-10 2V-3c-9-4-3-14 3-10 0-8 14-8 14 0 7-4 11 7 3 10v5Zm0 4h20" />
      </g>
    </svg>
  )
}
