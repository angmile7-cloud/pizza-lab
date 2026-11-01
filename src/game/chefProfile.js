export const CHEF_AVATARS = [
  { id: 'pepperoni-pirata', name: 'Pepperoni Pirata' },
  { id: 'aceituna-elegante', name: 'Aceituna Elegante' },
  { id: 'champinon-ninja', name: 'Champiñón Ninja' },
  { id: 'tomate-timido', name: 'Tomate Tímido' },
  { id: 'queso-cool', name: 'Queso Cool' },
  { id: 'albahaca-aventurera', name: 'Albahaca Aventurera' },
  { id: 'rodillo-rebelde', name: 'Rodillo Rebelde' },
  { id: 'pina-polemica', name: 'Piña Polémica' },
]

export function normalizeNickname(name) {
  return name.normalize('NFC').replace(/ {2,}/g, ' ').trim()
}

export function nicknameError(name) {
  const nickname = normalizeNickname(name)
  const length = [...nickname].length
  if (!length) return 'Escribe tu apodo para empezar.'
  if (length < 2 || length > 16) return 'Tu apodo debe tener entre 2 y 16 caracteres.'
  if (!/^[\p{L}\p{Nd} ._-]+$/u.test(nickname)) {
    return 'Usa letras, números, espacios, punto, guion o guion bajo.'
  }
  if (!/[\p{L}\p{Nd}]/u.test(nickname)) return 'Añade al menos una letra o un número a tu apodo.'
  return ''
}

export function validateChefProfile(name, avatarId) {
  const error = nicknameError(name)
  if (error) throw new Error(error)
  if (!CHEF_AVATARS.some((avatar) => avatar.id === avatarId)) {
    throw new Error('Elige uno de los avatares disponibles.')
  }
  return normalizeNickname(name)
}
