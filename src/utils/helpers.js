export function escapeHTML(str) {
  if (typeof str !== 'string') return str || ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getToday() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function getDateString(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
}

export function normalizeStudyStats(stats) {
  if (!stats || typeof stats !== 'object') return { totalSeconds: 0, daily: {} }
  if (typeof stats.totalSeconds !== 'number') stats.totalSeconds = 0
  if (!stats.daily || typeof stats.daily !== 'object') stats.daily = {}
  return stats
}

export function normalizeCheckInState(state) {
  if (!state || typeof state !== 'object') return { lastDate: '', streak: 0, total: 0 }
  return { lastDate: state.lastDate || '', streak: state.streak || 0, total: state.total || 0 }
}

export function normalizeWordExamples(word) {
  if (!word.examples) word.examples = []
  if (!word.exampleMeanings) word.exampleMeanings = []
  while (word.exampleMeanings.length < word.examples.length) word.exampleMeanings.push('')
}

export function isCopyBook(book) {
  return !!book.originalBookId
}

export function getWord(book, index) {
  return book && book.words && book.words[index] ? book.words[index] : null
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}小时${m % 60}分钟`
  }
  return m + '分钟' + (s > 0 ? s + '秒' : '')
}

export function getWordScale(base, value) {
  return ((value - base) / 8).toFixed(2)
}
