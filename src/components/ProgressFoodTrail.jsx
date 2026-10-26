import { useId, useLayoutEffect, useRef, useState } from 'react'

const INGREDIENTS = [
  'tomato', 'basil', 'mozzarella', 'oil', 'mushroom', 'pepperoni',
  'onion', 'cherry', 'parmesan', 'arugula', 'pepper-red', 'black-olive',
  'ham', 'pesto', 'garlic', 'pepper-yellow', 'oregano', 'green-olive',
  'sauce', 'cheese', 'pepper-green', 'strand', 'garlic-sauce', 'seasoning',
]
const START = ['flour', 'dough', 'garlic', 'flour', 'mozzarella', 'oregano']
const FINISH = ['pepperoni', 'basil', 'tomato', 'parmesan', 'pesto', 'ham', 'cherry', 'cheese']

function randomAt(index, salt) {
  let seed = Math.imul(index + 1, 374761393) ^ Math.imul(salt + 1, 668265263)
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177)
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967296
}

function ingredientSequence(pool, count) {
  return Array.from({ length: Math.ceil(count / pool.length) }, (_, batch) =>
    pool
      .map((ingredient, index) => ({ ingredient, rank: randomAt(index, batch + 13) }))
      .sort((a, b) => a.rank - b.rank)
      .map(({ ingredient }) => ingredient),
  ).flat()
}

export default function ProgressFoodTrail({ path, height }) {
  const instanceId = useId()
  const guideRef = useRef(null)
  const svgRef = useRef(null)
  const [pieces, setPieces] = useState([])
  const [scale, setScale] = useState({ x: 1, y: 1 })
  const id = (name) => `${instanceId}-trail-${name}`
  const paint = (name) => `url(#${id(`paint-${name}`)})`

  useLayoutEffect(() => {
    const guide = guideRef.current
    const length = guide.getTotalLength()
    const count = Math.min(120, Math.ceil(length / 18))
    const spacing = length / (count - 1)
    const sequence = ingredientSequence(INGREDIENTS, count)
    const finish = ingredientSequence(FINISH, count)
    setPieces(Array.from({ length: count }, (_, index) => {
      const distance = Math.max(0, Math.min(length,
        index * spacing + (index === 0 || index === count - 1 ? 0 : (randomAt(index, 1) - 0.5) * 2),
      ))
      const point = guide.getPointAtLength(distance)
      const before = guide.getPointAtLength(Math.max(0, distance - 1))
      const after = guide.getPointAtLength(Math.min(length, distance + 1))
      const angle = Math.atan2(after.y - before.y, after.x - before.x)
      const offset = (randomAt(index, 2) - 0.5) * 6
      return {
        x: point.x - Math.sin(angle) * offset,
        y: point.y + Math.cos(angle) * offset,
        angle,
        turn: (randomAt(index, 3) - 0.5) * 110,
        size: 21 * (0.85 + randomAt(index, 4) * 0.3),
        ingredient: index < START.length ? START[index] : index > count * 0.8 ? finish[index] : sequence[index - START.length],
      }
    }))
  }, [path])

  useLayoutEffect(() => {
    const svg = svgRef.current
    const measure = () => {
      const bounds = svg.getBoundingClientRect()
      if (bounds.width > 0 && bounds.height > 0) {
        setScale({ x: bounds.width / 360, y: bounds.height / height })
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [height])

  return (
    <svg
      ref={svgRef}
      className="progress-map__path"
      viewBox={`0 0 360 ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={id('paint-red')} cx=".28" cy=".22" r=".85">
          <stop stopColor="#ff9770" /><stop offset=".45" stopColor="#e34b32" /><stop offset="1" stopColor="#a62c23" />
        </radialGradient>
        <linearGradient id={id('paint-leaf')} x2=".9" y2="1">
          <stop stopColor="#9fc75d" /><stop offset=".5" stopColor="#4b913e" /><stop offset="1" stopColor="#285c32" />
        </linearGradient>
        <linearGradient id={id('paint-cream')} x2=".8" y2="1">
          <stop stopColor="#fffef0" /><stop offset=".55" stopColor="#f6e8be" /><stop offset="1" stopColor="#c9a36c" />
        </linearGradient>
        <linearGradient id={id('paint-mushroom')} x2=".7" y2="1">
          <stop stopColor="#f1dab5" /><stop offset=".55" stopColor="#c09570" /><stop offset="1" stopColor="#886044" />
        </linearGradient>
        <linearGradient id={id('paint-ham')} x2=".8" y2="1">
          <stop stopColor="#ffc5b5" /><stop offset=".5" stopColor="#e99291" /><stop offset="1" stopColor="#bb646e" />
        </linearGradient>
        <radialGradient id={id('paint-oil')} cx=".3" cy=".25" r=".8">
          <stop stopColor="#ffef9d" stopOpacity=".8" /><stop offset=".65" stopColor="#e9b738" stopOpacity=".7" /><stop offset="1" stopColor="#b98322" stopOpacity=".8" />
        </radialGradient>
        <radialGradient id={id('paint-olive')} cx=".3" cy=".25">
          <stop stopColor="#79786b" /><stop offset=".5" stopColor="#393b32" /><stop offset="1" stopColor="#20291f" />
        </radialGradient>
        <linearGradient id={id('paint-gold')} x2=".8" y2="1">
          <stop stopColor="#ffe99a" /><stop offset=".5" stopColor="#edc15a" /><stop offset="1" stopColor="#c08835" />
        </linearGradient>
        <filter id={id('shadow')} x="-5%" y="-3%" width="110%" height="106%" colorInterpolationFilters="sRGB">
          <feDropShadow dx=".3" dy=".8" stdDeviation=".55" floodColor="#694330" floodOpacity=".24" />
        </filter>
        <symbol id={id('tomato')} viewBox="-12 -12 24 24">
          <path d="M-10-2C-10-9-3-11 3-9C11-8 12 0 8 7C2 12-10 9-10-2Z" fill={paint('red')} stroke="#b23827" strokeWidth=".7" />
          <path d="M-7-2Q-5-8 0-6L-1-1ZM2-6Q9-4 7 1L2 1ZM-6 2L-1 2 0 7Q-6 8-6 2ZM3 3L7 3Q6 8 2 7Z" fill="#ee9b57" opacity=".8" />
          <path d="M-5-4l1-1M5-3l1 1M-4 4l1 1M4 5l1-1" stroke="#ffe6a2" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-7-3Q-5-8-1-8" fill="none" stroke="#ffd0a7" strokeWidth="1" strokeLinecap="round" />
        </symbol>
        <symbol id={id('cherry')} viewBox="-12 -12 24 24">
          <circle cy="1" r="8.5" fill={paint('red')} stroke="#a83825" strokeWidth=".6" />
          <path d="m0-6-5-3 3 5-4 2 5 1 2 4 1-5 5-2-5-1 1-5Z" fill={paint('leaf')} stroke="#43682e" strokeWidth=".45" />
          <path d="M-5-2Q-7 0-6 2" fill="none" stroke="#ffe1c8" strokeWidth="1.5" strokeLinecap="round" opacity=".85" />
          <path d="M1-6 3-10" stroke="#456a30" strokeWidth="1" />
        </symbol>
        <symbol id={id('basil')} viewBox="-12 -12 24 24">
          <path d="M-8 8C-12-1-4-12 7-9C12 2 5 10-8 8Z" fill={paint('leaf')} stroke="#326535" strokeWidth=".6" />
          <path d="m-9 10 15-18M-5 5-6-2M-2 1 5 2M1-3 1-7" fill="none" stroke="#c4d985" strokeWidth=".7" />
          <path d="M-7 2Q-6-5-1-7" fill="none" stroke="#d6e79b" strokeWidth=".7" opacity=".6" />
        </symbol>
        <symbol id={id('arugula')} viewBox="-12 -12 24 24">
          <path d="m-5 10 1-6-5-1 5-4-5-3 6-1-2-4 5 1 3-4 2 5 5 2-5 3 4 3-7 1 1 5-5-1Z" fill={paint('leaf')} stroke="#3b6d35" strokeWidth=".55" />
          <path d="M-5 11 3-10M-3 4 3 1M-2-1-5-3M0-5 4-6" fill="none" stroke="#b0cc7c" strokeWidth=".6" />
        </symbol>
        <symbol id={id('mushroom')} viewBox="-12 -12 24 24">
          <path d="m-3-1-1 10Q0 12 4 9L2-1" fill={paint('cream')} stroke="#a47d58" strokeWidth=".65" />
          <path d="M-10 0C-11-13 9-13 10 0Q4 5-10 0Z" fill={paint('mushroom')} stroke="#895c42" strokeWidth=".8" />
          <path d="M-9 0Q0 5 9 0" fill="#b78a6c" stroke="#79533d" strokeWidth=".6" />
          <path d="m-7 0 4 1M-4-1 3 2M0-1 1 2M5-1 3 1" stroke="#77523f" strokeWidth=".55" />
          <path d="M-7-4Q-4-9 1-8M-1 4v4" fill="none" stroke="#fff0cd" strokeWidth=".9" strokeLinecap="round" />
        </symbol>
        <symbol id={id('black-olive')} viewBox="-12 -12 24 24">
          <path d="M-9 0a9 7 0 1 0 18 0 9 7 0 1 0-18 0M-4 0a4 3 0 1 1 8 0 4 3 0 1 1-8 0" fill={paint('olive')} fillRule="evenodd" stroke="#32382d" strokeWidth=".7" />
          <ellipse rx="4.5" ry="3.5" fill="none" stroke="#9a9a78" strokeWidth=".7" />
          <path d="M-7-2Q-5-5-1-5" fill="none" stroke="#c0c0a4" strokeWidth="1" strokeLinecap="round" />
        </symbol>
        <symbol id={id('green-olive')} viewBox="-12 -12 24 24">
          <ellipse rx="7" ry="9" fill={paint('leaf')} stroke="#657735" strokeWidth=".7" />
          <ellipse cx="1" cy="-3" rx="2.5" ry="3" fill="#b45536" stroke="#6d7032" strokeWidth=".8" />
          <path d="M-4-4Q-6 0-4 4" fill="none" stroke="#e0dfa1" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
        </symbol>
        <symbol id={id('onion')} viewBox="-12 -12 24 24">
          <ellipse rx="9.5" ry="7" fill="none" stroke="#a76991" strokeWidth="2.3" opacity=".8" />
          <ellipse cy="-.4" rx="9" ry="6.5" fill="none" stroke="#fff0ee" strokeWidth="1.3" opacity=".9" />
          <path d="M-6 4Q0 8 6 3" fill="none" stroke="#dfb1ca" strokeWidth=".7" />
          <path d="M-8-2Q-5-7 1-6" fill="none" stroke="#fff9ef" strokeWidth=".8" />
        </symbol>
        {['red', 'yellow', 'green'].map((color) => (
          <symbol key={color} id={id(`pepper-${color}`)} viewBox="-12 -12 24 24">
            <path d="M-9 6C-11-5-4-11 5-8L9-4 6-1C0-6-5-2-4 6Z" fill={paint(color === 'red' ? 'red' : color === 'yellow' ? 'gold' : 'leaf')} stroke={color === 'red' ? '#b3412e' : color === 'yellow' ? '#b18b34' : '#44743a'} strokeWidth=".7" />
            <path d="M-7 4Q-8-7 3-6" fill="none" stroke="#fff2b6" strokeWidth=".9" strokeLinecap="round" opacity=".75" />
            <path d="m-4 4-3 1M5-5 7-3" stroke="#ffedba" strokeWidth=".8" />
          </symbol>
        ))}
        <symbol id={id('garlic')} viewBox="-12 -12 24 24">
          <path d="M1-10C8-3 10 7 3 9C-9 12-10-1 1-10Z" fill={paint('cream')} stroke="#b99b78" strokeWidth=".6" />
          <path d="M0-6Q-5 1-2 6M2 8l2-1" fill="none" stroke="#fffef0" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2-7Q7 2 3 7" fill="none" stroke="#d1b39b" strokeWidth=".6" />
        </symbol>
        <symbol id={id('oregano')} viewBox="-12 -12 24 24">
          <path d="m-6 11 10-22" stroke="#777449" strokeWidth=".9" />
          <path d="M-4 6Q-12 4-7 0Q-2 0-4 6M-1 0Q-9-4-4-6Q1-5-1 0M2-6Q-2-12 3-11Q6-9 2-6M-3 5Q6 6 6 1Q2-1-3 5M0-1Q9 0 8-5Q3-6 0-1" fill={paint('leaf')} stroke="#527342" strokeWidth=".4" />
          <path d="m-6 2 2 3M4 3-6 8M-3-4 2-1" stroke="#c2d18e" strokeWidth=".4" />
        </symbol>
        <symbol id={id('sauce')} viewBox="-12 -12 24 24">
          <path d="M-8-3C-13-9-3-10-2-6C2-12 8-9 6-4C14-3 10 5 5 4C5 11-4 10-5 5C-12 8-12 1-8-3Z" fill={paint('red')} stroke="#ba412a" strokeWidth=".45" />
          <circle cx="10" cy="8" r="1.3" fill="#c4492d" /><path d="M-6-4Q-3-7 0-5" fill="none" stroke="#ffb58d" strokeWidth="1.2" strokeLinecap="round" />
        </symbol>
        <symbol id={id('pesto')} viewBox="-12 -12 24 24">
          <path d="M-9-2Q-10-8-3-8Q5-12 8-4Q13 4 5 7Q-4 12-8 5Z" fill={paint('leaf')} stroke="#537b36" strokeWidth=".6" />
          <path d="m-5-3 2-1M2 3l3 1M2-5l2 1M-4 4l-1 1" stroke="#34592b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M-6-2Q-4-7 0-6M3 5l2-1" fill="none" stroke="#d7d37c" strokeWidth="1" strokeLinecap="round" />
        </symbol>
        <symbol id={id('oil')} viewBox="-12 -12 24 24">
          <path d="M0-10C-1-5-9 0-7 6C-5 12 6 11 7 5C9 0 2-5 0-10Z" fill={paint('oil')} stroke="#bc943c" strokeWidth=".5" />
          <path d="M-4 1Q-7 5-3 7" fill="none" stroke="#fffbd5" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="9" cy="9" r="1.4" fill={paint('oil')} />
        </symbol>
        <symbol id={id('garlic-sauce')} viewBox="-12 -12 24 24">
          <path d="M-8-2Q-6-8 0-5Q8-8 8-1Q10 7 1 7Q-9 9-8-2Z" fill={paint('cream')} stroke="#c3af82" strokeWidth=".45" />
          <path d="m-4-2 1-1M3 3l1-1" stroke="#648245" strokeWidth=".7" /><circle cx="-9" cy="8" r="1.5" fill="#fff5d9" />
          <path d="M-5-2Q-3-5 1-3" fill="none" stroke="#fffef6" strokeWidth="1.3" strokeLinecap="round" />
        </symbol>
        <symbol id={id('mozzarella')} viewBox="-12 -12 24 24">
          <path d="M-8-6Q-3-11 2-7Q10-10 9-2Q12 4 5 6Q1 11-4 7Q-12 7-8-6Z" fill={paint('cream')} stroke="#d1bd91" strokeWidth=".6" />
          <path d="M-6-3Q-7-7-1-6M1 5l3-1" fill="none" stroke="#fffef6" strokeWidth="1.3" strokeLinecap="round" />
          <path d="m-5 3 3-1M3-4l2 1" stroke="#dfc995" strokeWidth=".6" />
        </symbol>
        <symbol id={id('parmesan')} viewBox="-12 -12 24 24">
          <path d="m-10-5 13-4 5 4-14 6Z" fill={paint('cream')} stroke="#d0b274" strokeWidth=".55" />
          <path d="m-5 3 13-2 2 6-10 3Z" fill={paint('cream')} stroke="#cfb378" strokeWidth=".55" />
          <path d="m-7-4 9-3M-2 5l8-2" stroke="#fffdf0" strokeWidth="1.1" />
        </symbol>
        <symbol id={id('cheese')} viewBox="-12 -12 24 24">
          <path d="m-9-5 12-4 7 7-12 5Z" fill={paint('gold')} stroke="#c2974f" strokeWidth=".6" />
          <path d="m-9-5 7 8v7l-7-7Z" fill="#e7bb61" stroke="#bb8d43" strokeWidth=".6" />
          <path d="m-2 3 12-5v8l-12 4Z" fill="#f6d17b" stroke="#bb8d43" strokeWidth=".6" />
          <ellipse cx="4" cy="4" rx="1.4" ry="1.1" fill="#cca44e" /><circle cx="0" cy="6" r=".8" fill="#cca44e" />
          <path d="m-7-5 9-3" stroke="#fff3ba" strokeWidth="1" />
        </symbol>
        <symbol id={id('strand')} viewBox="-12 -12 24 24">
          <path d="M-10 6C-6-10-3 10 1-3S6-5 10-7" fill="none" stroke="#caa56d" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M-10 5C-6-11-3 9 1-4S6-6 10-8" fill="none" stroke="#fff4d3" strokeWidth="1.5" strokeLinecap="round" />
        </symbol>
        <symbol id={id('pepperoni')} viewBox="-12 -12 24 24">
          <path d="M-9-3C-8-11 4-11 8-5C14 3 5 11-3 9C-10 8-12 2-9-3Z" fill={paint('red')} stroke="#8c3928" strokeWidth="1.2" />
          <path d="M-7-3Q-6-8 0-8M3 7l3-2" fill="none" stroke="#f9b07f" strokeWidth=".8" strokeLinecap="round" />
          <path d="m-5-1 2 1M2-4l1 1M4 2l2 1M-3 5l1-1M-1-6h1" stroke="#ffe1af" strokeWidth="1.2" strokeLinecap="round" />
          <path d="m-6 4 1 1M5-2l1 1" stroke="#9f3826" strokeWidth="1" />
        </symbol>
        <symbol id={id('ham')} viewBox="-12 -12 24 24">
          <path d="m-9-5 11-4 8 7-4 9-10-2-6 3 3-7Z" fill={paint('ham')} stroke="#be7477" strokeWidth=".6" />
          <path d="M-7-4 5-2-4 4 5 5 8-1" fill="none" stroke="#b96670" strokeWidth="1" />
          <path d="m-7-5 9-2M-4 3l8-4" stroke="#ffe1cc" strokeWidth=".9" strokeLinecap="round" />
          <path d="m-7 0 1 1M3 3h2" stroke="#fcd1bd" strokeWidth="1.1" />
        </symbol>
        <symbol id={id('flour')} viewBox="-12 -12 24 24">
          <ellipse rx="8" ry="5" fill="#fff5dd" opacity=".32" />
          <path d="m-7-1 2-2 3 1 2-3 3 3 4 1-2 3-5 2-5-1Z" fill="#fff6df" opacity=".65" />
          <path d="M-9-5h1M-4 5h1M3-7h1M8 4h1M-2-1h1M3 2h1M-6 1h1" stroke="#fffdf0" strokeWidth="1.2" strokeLinecap="round" />
        </symbol>
        <symbol id={id('dough')} viewBox="-12 -12 24 24">
          <path d="M-9 0Q-10-7-3-6Q4-9 7-2Q9 6 2 8Q-7 9-9 0Z" fill={paint('cream')} stroke="#c7aa7c" strokeWidth=".7" />
          <path d="M-6-1Q-6-5-1-4" fill="none" stroke="#fffbed" strokeWidth="1.2" strokeLinecap="round" />
          <path d="m-4 3 1 1M3-1l1 1" stroke="#b99b6c" strokeWidth=".65" /><circle cx="10" cy="7" r="1.4" fill="#f5e3bc" />
        </symbol>
        <symbol id={id('seasoning')} viewBox="-12 -12 24 24">
          <path d="m-3 1 1-6 5 1 1 5Z" fill={paint('cream')} stroke="#c8b28a" strokeWidth=".5" />
          <path d="m-7-5 3 1-1 3-3-1ZM2 4l3-1 1 3-3 1ZM5-8l2 1-1 2-2-1Z" fill="#fff7e8" stroke="#cdbda3" strokeWidth=".4" />
          <circle cx="1" cy="-2" r="1.2" fill="#725a40" /><circle cx="-6" cy="5" r=".9" fill="#634b37" /><circle cx="8" cy="1" r=".8" fill="#624a34" />
          <path d="m-1-7 2 1-1 2-2-1Z" fill="#b34728" />
        </symbol>
      </defs>
      <path ref={guideRef} d={path} fill="none" stroke="none" />
      <g filter={`url(#${id('shadow')})`}>
        {pieces.map((piece, index) => (
          // Keep route coordinates stretched to the grid, but cancel that stretch on the art.
          <g
            key={index}
            transform={`translate(${piece.x} ${piece.y}) scale(${1 / scale.x} ${1 / scale.y}) rotate(${Math.atan2(Math.sin(piece.angle) * scale.y, Math.cos(piece.angle) * scale.x) * 180 / Math.PI + piece.turn})`}
          >
            <use href={`#${id(piece.ingredient)}`} x={-piece.size / 2} y={-piece.size / 2} width={piece.size} height={piece.size} />
          </g>
        ))}
      </g>
    </svg>
  )
}
