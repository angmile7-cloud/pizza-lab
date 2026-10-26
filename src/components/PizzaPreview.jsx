import { useId } from 'react'

const DEFAULT_SELECTION = {
  masa: 'napolitana',
  salsa: 'tomate',
  queso: 'mozzarella',
  toppings: ['albahaca'],
}

const TOPPINGS = [
  'pepperoni', 'champinones', 'aceitunas', 'jamon', 'cebolla', 'albahaca', 'rucula',
]

function seedFor(value) {
  return [...value].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 7)
}

// Each ingredient owns interleaved slots; adding another never moves existing pieces.
function toppingSlots(id, index) {
  const seed = seedFor(id)
  return Array.from({ length: 5 }, (_, piece) => {
    const angle = (piece * 137.508 + index * 51.43 + seed % 29) * Math.PI / 180
    const radius = 35 + ((piece + index) % 3) * 18
    return {
      x: 120 + Math.cos(angle) * radius,
      y: 120 + Math.sin(angle) * radius,
      rotation: (seed + piece * 73) % 360,
      scale: 0.8 + ((seed + piece) % 4) * 0.08,
    }
  })
}

const CRUST = 'M120 20C143 17 156 25 173 33C190 39 207 60 214 80C224 98 219 114 222 132C223 151 210 168 198 185C184 201 167 209 148 216C128 222 113 217 94 218C73 216 61 203 46 190C30 175 24 158 20 138C15 120 21 102 24 84C31 64 43 52 60 39C78 26 98 22 120 20Z'
const SAUCE = 'M120 40C142 35 155 46 172 51C190 64 198 81 200 102C206 121 200 139 194 157C184 173 171 187 152 193C134 201 115 197 97 199C78 195 65 185 54 170C42 155 39 136 40 118C38 98 47 80 57 66C74 49 97 39 120 40Z'
const CHEESE_SLOTS = [[78, 76, -20, 1], [127, 67, 18, 0.95], [166, 91, 65, 1.1], [77, 125, 130, 1.15], [123, 116, 5, 1.2], [159, 145, 95, 1.1], [104, 166, -35, 1.15]]

export default function PizzaPreview({
  selection = DEFAULT_SELECTION,
  className,
  glow = false,
  cutLines = false,
  doneness = 'golden',
}) {
  const burnt = doneness === 'burnt'
  const instanceId = useId()
  const id = (name) => `${instanceId}-${name}`
  const paint = (name) => `url(#${id(name)})`
  const wholegrain = selection.masa === 'integral'
  const thin = selection.masa === 'fina'
  const sauce = selection.salsa || 'tomate'
  const cheese = selection.queso || 'mozzarella'
  const selectedToppings = selection.toppings ?? []

  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {burnt ? (
          <>
            <radialGradient id={id('charred-edge')} cx=".4" cy=".35" r=".7">
              <stop offset=".45" stopColor="#3a241a" stopOpacity=".6" />
              <stop offset=".78" stopColor="#281c16" stopOpacity=".9" />
              <stop offset="1" stopColor="#100f0e" />
            </radialGradient>
            <radialGradient id={id('charred-cheese')} cx=".35" cy=".3" r=".75">
              <stop stopColor="#c08a49" /><stop offset=".55" stopColor="#80502d" />
              <stop offset=".82" stopColor="#38271d" /><stop offset="1" stopColor="#141311" />
            </radialGradient>
            <filter id={id('scorch')} x="-5%" y="-5%" width="110%" height="110%">
              <feColorMatrix type="saturate" values=".3" />
              <feComponentTransfer>
                <feFuncR type="linear" slope=".52" />
                <feFuncG type="linear" slope=".45" />
                <feFuncB type="linear" slope=".4" />
              </feComponentTransfer>
            </filter>
          </>
        ) : null}
        <radialGradient id={id('wood')} cx=".32" cy=".24" r=".8">
          <stop stopColor="#b9834f" /><stop offset=".7" stopColor="#80512e" /><stop offset="1" stopColor="#50321f" />
        </radialGradient>
        <radialGradient id={id('crust')} cx=".38" cy=".3" r=".74">
          <stop stopColor={wholegrain ? '#c59352' : '#ffe2a0'} />
          <stop offset=".65" stopColor={wholegrain ? '#b2783c' : '#edb55e'} />
          <stop offset=".88" stopColor={wholegrain ? '#8b5029' : '#c77b32'} />
          <stop offset="1" stopColor={wholegrain ? '#57331e' : '#8c461f'} />
        </radialGradient>
        <radialGradient id={id('tomate')} cx=".3" cy=".22" r=".85">
          <stop stopColor="#e35b37" /><stop offset=".55" stopColor="#c63c27" /><stop offset="1" stopColor="#8d281d" />
        </radialGradient>
        <radialGradient id={id('bianca')} cx=".3" cy=".22" r=".85">
          <stop stopColor="#fff3ce" /><stop offset=".65" stopColor="#e9d3a0" /><stop offset="1" stopColor="#c2a76b" />
        </radialGradient>
        <radialGradient id={id('pesto')} cx=".3" cy=".22" r=".85">
          <stop stopColor="#8eae41" /><stop offset=".55" stopColor="#5c892d" /><stop offset="1" stopColor="#315a25" />
        </radialGradient>
        <linearGradient id={id('mozzarella')} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fffbe5" /><stop offset=".5" stopColor="#fff0bd" /><stop offset="1" stopColor="#d6aa60" />
        </linearGradient>
        <radialGradient id={id('toast')} cx=".4" cy=".3">
          <stop stopColor="#a75b25" /><stop offset=".65" stopColor="#d39543" /><stop offset="1" stopColor="#edc47c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('pepperoni')} cx=".3" cy=".25">
          <stop stopColor="#e77f4d" /><stop offset=".6" stopColor="#bd402d" /><stop offset="1" stopColor="#7e281e" />
        </radialGradient>
        <linearGradient id={id('mushroom')} x1="0" y1="0" x2=".8" y2="1">
          <stop stopColor="#f8e7c9" /><stop offset=".6" stopColor="#d1b18c" /><stop offset="1" stopColor="#98684a" />
        </linearGradient>
        <linearGradient id={id('ham')} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f7b6a6" /><stop offset=".5" stopColor="#e48986" /><stop offset="1" stopColor="#bd646a" />
        </linearGradient>
        <linearGradient id={id('leaf')} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#85b751" /><stop offset=".45" stopColor="#3f8c3b" /><stop offset="1" stopColor="#205831" />
        </linearGradient>
        <filter id={id('shadow')} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#291b12" floodOpacity=".3" />
        </filter>
        <radialGradient id={id('glow')}>
          <stop offset=".65" stopColor="#ffd36e" stopOpacity=".3" /><stop offset="1" stopColor="#ffd36e" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('surface')}><path d={SAUCE} /></clipPath>
        <symbol id={id('cheese')} viewBox="-22 -22 44 44">
          <path d="M-18-7C-20-17-8-19-2-15C5-21 18-15 16-6C24 1 14 7 15 14C8 23 1 13-8 17C-19 18-15 9-20 5C-23 1-21-4-18-7Z" fill={paint(burnt ? 'charred-cheese' : 'mozzarella')} stroke={burnt ? '#211a15' : '#c89a56'} strokeWidth=".6" />
          <path d="M-14-8Q-10-15-3-12M0-12L5-13" fill="none" stroke={burnt ? '#bc8c55' : '#fffdf0'} strokeWidth="2" strokeLinecap="round" opacity={burnt ? '.4' : '.85'} />
          <ellipse cx="7" cy="7" rx="6" ry="4" fill={paint('toast')} />
          <ellipse cx="-9" cy="-3" rx="3" ry="2" fill={paint('toast')} />
          {burnt ? (
            <g fill="#171513">
              <ellipse cx="7" cy="7" rx="4.5" ry="3" />
              <ellipse cx="-9" cy="-3" rx="2.5" ry="2" />
              <path d="M-12 9l6-3-3 6M3-10l5 3-6 1" opacity=".7" />
            </g>
          ) : null}
        </symbol>
        <symbol id={id('pepperoni-piece')} viewBox="-16 -16 32 32">
          <ellipse cy="2" rx="14" ry="13" fill="#542b1d" opacity=".22" />
          <path d="M-13-4C-11-15 3-15 11-8C19 0 9 14-2 13C-13 12-16 2-13-4Z" fill={paint('pepperoni')} stroke="#812b22" strokeWidth="1.2" />
          <path d="M-10-4Q-5-12 3-10" fill="none" stroke="#f8b582" strokeWidth="1.5" strokeLinecap="round" opacity=".85" />
          <path d="M-6 0l2-2m8 8 2-1M3-5l2 1M-7 6l2 1M8 0h1" stroke="#f3c198" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-10 8Q0 17 10 6" fill="none" stroke="#71271f" strokeWidth="1.3" />
        </symbol>
        <symbol id={id('champinones-piece')} viewBox="-16 -16 32 32">
          <path d="M-14 3Q0-17 14 3L5 8L5 15H-4L-5 7Z" fill="#4b3024" opacity=".22" transform="translate(0 2)" />
          <path d="M-4 0L-4 14Q0 16 5 13L3 0" fill="#eedbb6" stroke="#aa825c" strokeWidth=".8" />
          <path d="M-14 2C-14-16 12-17 14 2Q1 10-14 2Z" fill={paint('mushroom')} stroke="#84553b" strokeWidth="1" />
          <path d="M-13 3Q0 12 13 3Q0-2-13 3Z" fill="#936d52" />
          <path d="M-9 3l7 3M-5 2l4 4M5 2 2 6M9 3 4 6" stroke="#dcc2a1" strokeWidth=".7" />
          <path d="M-10-3Q-6-10 1-10" fill="none" stroke="#fff0d7" strokeWidth="1.5" strokeLinecap="round" />
        </symbol>
        <symbol id={id('aceitunas-piece')} viewBox="-16 -16 32 32">
          <ellipse cy="3" rx="10" ry="8" fill="#30281f" opacity=".22" />
          <ellipse rx="9" ry="7" fill="none" stroke="#252d25" strokeWidth="6" />
          <ellipse rx="5.7" ry="4" fill="none" stroke="#78816a" strokeWidth="1.3" />
          <path d="M-9-3Q-6-7-2-7" fill="none" stroke="#b6bba0" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
        <symbol id={id('jamon-piece')} viewBox="-16 -16 32 32">
          <path d="M-14-7L7-11L14 9L-8 14Z" fill="#743a35" opacity=".2" transform="translate(0 2)" />
          <path d="M-14-9Q-4-6 6-12L14 9Q3 6-8 13Z" fill={paint('ham')} stroke="#b96a6b" strokeWidth=".7" />
          <path d="M-14-9L-1-1L-8 13L-3-2L6-12" fill="#b85f69" opacity=".6" />
          <path d="M-12-8L-1-2M-7 10Q3 4 12 8" fill="none" stroke="#ffdac4" strokeWidth="1.3" />
        </symbol>
        <symbol id={id('cebolla-piece')} viewBox="-16 -16 32 32">
          <path d="M10-10C-12-17-19 10-2 13C5 14 12 8 12 2" fill="none" stroke="#654255" strokeWidth="3.8" opacity=".18" transform="translate(0 1.5)" />
          <path d="M10-10C-12-17-19 10-2 13C5 14 12 8 12 2" fill="none" stroke="#b37d9f" strokeWidth="3" opacity=".8" />
          <path d="M10-10C-12-17-19 10-2 13C5 14 12 8 12 2" fill="none" stroke="#f6dfe7" strokeWidth="1.5" opacity=".9" />
        </symbol>
        <symbol id={id('albahaca-piece')} viewBox="-16 -16 32 32">
          <path d="M-10 12C-17-5-1-16 12-12C15 4 4 17-10 12Z" fill="#233e22" opacity=".22" transform="translate(0 2)" />
          <path d="M-10 12C-17-5-1-16 12-12C15 4 4 17-10 12Z" fill={paint('leaf')} stroke="#356631" strokeWidth=".8" />
          <path d="M-12 15L9-10M-5 6l-5-7M0 0l-3-8M0 0l8 1M-5 6l8 2" fill="none" stroke="#b2cc75" strokeWidth=".8" opacity=".8" />
        </symbol>
        <symbol id={id('rucula-piece')} viewBox="-16 -16 32 32">
          <path d="M-4 14L-10 7L-5 5L-13-1L-6-3L-10-9L-3-8L2-15L6-8L12-8L8-2L13 1L5 5L8 9L1 11Z" fill="#234423" opacity=".2" transform="translate(0 2)" />
          <path d="M-4 14L-10 7L-5 5L-13-1L-6-3L-10-9L-3-8L2-15L6-8L12-8L8-2L13 1L5 5L8 9L1 11Z" fill={paint('leaf')} stroke="#3b7030" strokeWidth=".6" />
          <path d="M-5 17L2-12M-2 6l-5-5M0 0l6-4" fill="none" stroke="#c2d382" strokeWidth=".9" />
        </symbol>
      </defs>
      {glow ? <circle cx="120" cy="120" r="120" fill={paint('glow')} /> : null}
      <circle cx="120" cy="121" r="113" fill={paint('wood')} stroke="#5d3a24" strokeWidth="1.5" filter={paint('shadow')} />
      <g fill="none" stroke="#e4b782" strokeWidth=".7" opacity=".22">
        <path d="M58 28Q76 119 57 210M67 24Q82 115 67 216M177 24Q159 111 179 215M191 34Q174 128 193 205M36 48Q49 121 34 190" />
        <circle cx="120" cy="120" r="107" />
      </g>
      <path d={CRUST} fill="#65371e" opacity=".3" transform="translate(0 3)" />
      <g transform={thin ? 'translate(120 120) scale(1.025) translate(-120 -120)' : undefined}>
        <path d={CRUST} fill={paint('crust')} stroke="#9d5a2c" strokeWidth="1" />
        {burnt ? <path d={CRUST} fill={paint('charred-edge')} /> : null}
        <path d="M32 93Q36 63 65 46M78 35Q101 25 120 27M140 29L151 32" fill="none" stroke={burnt ? '#95704c' : '#ffe8b1'} strokeWidth={thin ? 2 : 4} opacity={burnt ? '.3' : '.7'} strokeLinecap="round" />
        {Array.from({ length: 19 }, (_, index) => {
          const angle = index * Math.PI * 2 / 19
          const radius = 94 + Math.sin(index * 7) * 3
          return (
            <g key={index} transform={`translate(${120 + Math.cos(angle) * radius} ${120 + Math.sin(angle) * radius}) rotate(${index * 27})`}>
              <ellipse rx={thin ? 3 : 5 + index % 3} ry={thin ? 1.5 : 3.5} fill={paint('toast')} />
              {index % 3 === 0 ? <ellipse cx="1" cy="1" rx="2.8" ry="1.6" fill="#66381e" opacity=".8" /> : null}
              {!thin ? <path d="M-4-3Q0-6 4-3" fill="none" stroke="#ffdf98" strokeWidth="1" opacity=".8" /> : null}
              {burnt ? <ellipse rx={thin ? 3 : 6 + index % 3} ry={thin ? 1.7 : 4} fill="#141312" opacity={index % 3 === 0 ? '.95' : '.75'} /> : null}
            </g>
          )
        })}
        {wholegrain ? Array.from({ length: 62 }, (_, index) => {
          const angle = index * 2.39996
          const radius = 88 + index % 5 * 3.1
          return <ellipse key={index} cx={120 + Math.cos(angle) * radius} cy={120 + Math.sin(angle) * radius} rx="1.4" ry=".7" transform={`rotate(${index * 19} ${120 + Math.cos(angle) * radius} ${120 + Math.sin(angle) * radius})`} fill={index % 2 ? '#ecd09a' : '#624021'} />
        }) : null}
      </g>
      <g transform={thin ? 'translate(120 120) scale(1.09) translate(-120 -120)' : undefined}>
        <path d={SAUCE} fill={paint(sauce)} stroke={sauce === 'pesto' ? '#46652b' : sauce === 'bianca' ? '#c1a66e' : '#a13523'} strokeWidth="1" />
        <g clipPath={paint('surface')}>
          <path d="M61 101C62 56 154 44 180 94S150 185 99 179S66 111 110 94S170 115 144 144" fill="none" stroke={sauce === 'tomate' ? '#f39060' : sauce === 'pesto' ? '#b3c963' : '#fff9d9'} strokeWidth="3" opacity=".28" strokeLinecap="round" />
          {Array.from({ length: 27 }, (_, index) => {
            const angle = index * 2.39996
            const radius = 22 + Math.sqrt(index / 27) * 63
            return <ellipse key={index} cx={120 + Math.cos(angle) * radius} cy={120 + Math.sin(angle) * radius} rx={sauce === 'pesto' ? 2.6 : 1.3} ry={sauce === 'bianca' ? 1.5 : .8} fill={sauce === 'tomate' ? '#8a3423' : '#36562a'} opacity=".5" />
          })}
          <path d="M56 94Q64 68 88 59M99 54L105 52M174 72L178 77" fill="none" stroke={sauce === 'tomate' ? '#ffb289' : '#fff8bb'} strokeWidth="2" opacity=".6" strokeLinecap="round" />
          {cheese !== 'sin-queso' ? (
            <>
              <path d="M79 80Q96 107 124 115T160 147M80 125Q92 142 105 163M125 67Q127 89 126 115" fill="none" stroke="#f9e5ac" strokeWidth="1.5" opacity=".8" />
              {CHEESE_SLOTS.map(([x, y, rotation, scale], index) => (
                <use key={index} href={`#${id('cheese')}`} x="-22" y="-22" width="44" height="44" transform={`translate(${x} ${y}) rotate(${rotation}) scale(${burnt ? scale * .88 : scale})`} />
              ))}
              {cheese === 'mix' ? [[62, 96], [111, 87], [151, 70], [175, 123], [128, 155], [77, 158], [148, 177]].map(([x, y], index) => (
                <g key={index} transform={`translate(${x} ${y}) rotate(${index * 43})`}>
                  <path d="M-9-3L6-5L10 2L-6 4Z" fill="#926631" opacity=".2" transform="translate(0 1)" />
                  <path d="M-9-3L6-5L10 2L-6 4Z" fill="#fff2bf" stroke="#d1b777" strokeWidth=".6" />
                  <path d="M-7-2L5-4" stroke="#fffbe3" strokeWidth="1" />
                </g>
              )) : null}
            </>
          ) : null}
          <g filter={burnt ? paint('scorch') : undefined}>
            {TOPPINGS.flatMap((topping, index) => selectedToppings.includes(topping)
            ? toppingSlots(topping, index).map(({ x, y, rotation, scale }, piece) => (
              <use key={`${topping}-${piece}`} href={`#${id(`${topping}-piece`)}`} x="-16" y="-16" width="32" height="32" transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} />
            ))
              : [])}
          </g>
        </g>
        {burnt ? (
          <>
            <path d={CRUST} fill="#737471" opacity=".12" />
            <path d="M116 57C104 47 130 40 119 30S118 16 125 11M135 48C146 37 128 31 139 22" fill="none" stroke="#aaa9a4" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
          </>
        ) : null}
        {cutLines ? (
          <g clipPath={paint('surface')} fill="none" stroke="#6e4326" strokeWidth="1" opacity=".35">
            <path d="M38 120H202M79 49L161 191M79 191L161 49" />
          </g>
        ) : null}
      </g>
    </svg>
  )
}
