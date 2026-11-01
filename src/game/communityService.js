import communityData from '../data/community.json'
import { validateChefProfile } from './chefProfile'

const photos = import.meta.glob('../assets/Comunidad/*.{jpg,jpeg,webp,png}', {
  eager: true,
  import: 'default',
})
const photosByName = Object.fromEntries(Object.entries(photos).map(([path, url]) => [
  path.split('/').pop().replace(/\.[^.]+$/, ''), url,
]))

function seedFor(text) {
  return [...text].reduce((seed, letter) => (seed * 31 + letter.charCodeAt(0)) >>> 0, 7)
}

function avatarFor(handle) {
  const words = handle.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^a-zA-Z]+/).filter(Boolean)
  return {
    initials: words.map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
    color: `hsl(${seedFor(handle) % 360} 55% 82%)`,
  }
}

// Each provider owns a store; only this adapter knows about JSON and local assets.
export function createCommunityService() {
  const listeners = new Set()
  let snapshot = { votes: {}, ownEntries: {} }
  function notify(next) {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  function challengeFor(id) {
    const challenge = communityData.challenges.find((item) => item.id === id)
    if (!challenge) throw new Error('Este reto no está disponible.')
    return challenge
  }
  function baseEntries(challengeId) {
    return communityData.entries.filter((entry) => entry.challengeId === challengeId)
  }
  function maximum(challengeId) {
    return Math.max(0, ...baseEntries(challengeId).map((entry) => entry.hearts))
  }
  function getEntries(challengeId) {
    challengeFor(challengeId)
    const own = snapshot.ownEntries[challengeId]
    return [...baseEntries(challengeId), ...(own ? [own] : [])].map((entry) => ({
      ...entry,
      ...avatarFor(entry.handle),
      photo: entry.own ? entry.photo : photosByName[entry.id],
      voted: !entry.own && snapshot.votes[challengeId] === entry.id,
      hearts: entry.own
        ? Math.min(maximum(challengeId), entry.hearts)
        : entry.hearts + Number(snapshot.votes[challengeId] === entry.id),
    })).sort((a, b) => b.hearts - a.hearts || a.id.localeCompare(b.id))
  }
  return {
    getChallenges: () => communityData.challenges.map((challenge) => ({ ...challenge })),
    getPublishingUnlockLevel: () => communityData.publishingUnlocksAfterLevel,
    getEntries,
    getCredits: () => communityData.entries.filter((entry) => entry.credit.trim()).map((entry) => ({
      pizzaName: entry.pizzaName, credit: entry.credit,
    })),
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    toggleVote(entryId) {
      if (Object.values(snapshot.ownEntries).some((entry) => entry.id === entryId)) {
        throw new Error('No puedes votar por tu propia pizza')
      }
      const entry = communityData.entries.find((item) => item.id === entryId)
      if (!entry) throw new Error('Esta pizza ya no está disponible.')
      const votes = { ...snapshot.votes }
      const removing = votes[entry.challengeId] === entryId
      if (removing) delete votes[entry.challengeId]
      else votes[entry.challengeId] = entryId
      notify({ ...snapshot, votes })
      return removing ? null : entry.pizzaName
    },
    publishEntry(challengeId, entry) {
      challengeFor(challengeId)
      if (snapshot.ownEntries[challengeId]) throw new Error('Retira tu pizza antes de publicar otra en este reto.')
      const pizzaName = entry.pizzaName?.trim()
      const handle = validateChefProfile(entry.handle, entry.avatarId)
      if (!pizzaName || pizzaName.length > 30) throw new Error('Escribe un nombre de entre 1 y 30 caracteres.')
      if (!/^data:image\/webp;base64,/.test(entry.photo)) throw new Error('Selecciona una foto de tu pizza antes de publicar.')
      const id = `player-${challengeId}`
      const seed = seedFor(`${challengeId}:${pizzaName}`)
      notify({
        ...snapshot,
        ownEntries: {
          ...snapshot.ownEntries,
          [challengeId]: {
            id, challengeId, pizzaName, photo: entry.photo, handle, avatarId: entry.avatarId,
            bio: 'Tu pizza en esta comunidad ficticia.', credit: '', own: true,
            hearts: 0, step: 0, elapsed: 0, nextAt: 3 + seed % 4, seed,
          },
        },
      })
    },
    removeEntry(challengeId) {
      challengeFor(challengeId)
      if (!snapshot.ownEntries[challengeId]) throw new Error('No tienes una pizza publicada en este reto.')
      const ownEntries = { ...snapshot.ownEntries }
      delete ownEntries[challengeId]
      notify({ ...snapshot, ownEntries })
    },
    hasPendingReactions() {
      return Object.values(snapshot.ownEntries).some((entry) => entry.step < 60 && entry.hearts < maximum(entry.challengeId) - 1)
    },
    advanceReactions() {
      let changed = false
      const ownEntries = Object.fromEntries(Object.entries(snapshot.ownEntries).map(([id, entry]) => {
        if (entry.step >= 60 || entry.hearts >= maximum(id) - 1) return [id, entry]
        changed = true
        const elapsed = entry.elapsed + 1
        if (elapsed < entry.nextAt) return [id, { ...entry, elapsed }]
        const step = entry.step + 1
        return [id, {
          ...entry, elapsed, step,
          hearts: Math.min(maximum(id) - 1, entry.hearts + 1 + (entry.seed + step * 17) % 7),
          nextAt: elapsed + 3 + (entry.seed + step * 13) % 5,
        }]
      }))
      if (changed) notify({ ...snapshot, ownEntries })
    },
    reset() {
      notify({ votes: {}, ownEntries: {} })
    },
  }
}
