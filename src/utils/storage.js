const STORAGE_KEY = 'speedReviewAppPlus'

const memoryStore = {}

function createSafeStorage() {
  try {
    const testKey = STORAGE_KEY + '_storage_test'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return window.localStorage
  } catch (err) {
    return {
      getItem(key) { return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null },
      setItem(key, value) { memoryStore[key] = String(value) },
      removeItem(key) { delete memoryStore[key] },
      clear() { Object.keys(memoryStore).forEach(key => delete memoryStore[key]) }
    }
  }
}

const storage = createSafeStorage()

export function loadFromStorage() {
  const stored = storage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      return null
    }
  }
  return null
}

export function saveToStorage(data) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    return false
  }
}

export { STORAGE_KEY }
