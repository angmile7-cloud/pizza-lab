export const MAX_COMMUNITY_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function prepareCommunityPhoto(file, signal) {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error('Elige una foto JPG, PNG o WebP.')
  if (file.size > MAX_COMMUNITY_PHOTO_BYTES) throw new Error('Tu foto es demasiado grande. El máximo es 5 MB.')
  signal?.throwIfAborted()
  const url = URL.createObjectURL(file)
  const image = new Image()
  let released = false
  function release() {
    if (!released) URL.revokeObjectURL(url)
    released = true
  }
  function cancel() {
    image.removeAttribute('src')
    release()
  }
  signal?.addEventListener('abort', cancel, { once: true })
  try {
    image.src = url
    try {
      await image.decode()
    } catch {
      throw new Error('No pudimos leer esta foto. Prueba con otra imagen JPG, PNG o WebP.')
    }
    signal?.throwIfAborted()
    const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No pudimos preparar la foto en este navegador.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const photo = canvas.toDataURL('image/webp', 0.85)
    if (!photo.startsWith('data:image/webp;base64,')) throw new Error('Este navegador no permite preparar fotos WebP.')
    return photo
  } finally {
    signal?.removeEventListener('abort', cancel)
    release()
  }
}
