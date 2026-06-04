import { reactive, toRefs, watch } from 'vue'
import { loadFromStorage, saveToStorage } from '../utils/storage'
import { speakText, setSpeechConfig, getSpeechConfig } from '../composables/useSpeech'
import { bookData } from '../data/index.js'

// ===== Reactive State =====
const state = reactive({
  wordBooks: [],
  folders: [],
  currentBookId: null,
  currentWordIndex: 0,
  showDetail: false,
  voiceLang: 'en-US',
  autoSpeak: true,
  selectedVoiceURI: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  activeRangeIndices: [],
  inRangeMode: false,
  tempStartIndex: -1,
  selectedLibBookId: null,
  fastMode: true,
  loopUnit: false,
  noteEditBookId: null,
  noteEditWordIndex: null,
  examplesEditBookId: null,
  examplesEditWordIndex: null,
  theme: 'system',
  backgroundTheme: 'flower',
  wordFontSize: 32,
  meaningFontSize: 18,
  rootFontSize: 14,
  examplesFontSize: 14,
  iconSize: 40,
  buttonPosition: 200,
  uiFont: 'default',
  unitGroupMode: true,
  unitCollapsed: {},
  studyMode: 'all',
  masteredFilterMode: 'all',
  filterType: 'all',
  filterOriginalId: null,
  lockMode: false,
  folderExpanded: {},
  bookStudyStates: {},
  learningRecords: [],
  checkInState: { lastDate: '', streak: 0, total: 0 },
  studyStats: { totalSeconds: 0, daily: {} },
  studyTimerLastAt: 0,
  lastUserActivityAt: Date.now(),
  studyStatsDirty: false,
  lastStudyStatsSaveAt: 0,
  // Listening state
  listeningMode: 'all',
  listeningContentMode: 'both',
  listeningRepeatCount: 1,
  listeningSpeed: 1.0,
  listeningCurrentIndex: 0,
  listeningShowDetailByClick: false,
  listeningIsPlaying: false,
  listeningLoopMode: false,
  listeningLockMode: false,
  listeningRangeStartIndex: -1,
  listeningRangeEndIndex: -1,
  listeningRandomMode: false,
  listeningCurrentUnit: 0,
  listeningSelectedUnits: [],
  listeningShuffledIndices: [],
  listeningPlayedIndices: [],
  listeningLastRoundFirstIndex: -1,
  listeningShowChinese: true,
  listeningWordFontSize: 32,
  listeningMeaningFontSize: 18,
  listeningExamplesFontSize: 16,
  listeningUnitGroupMode: true,
  listeningMasteredFilterMode: 'all',
  listeningTempStartIndex: -1,
  listeningTempEndIndex: -1,
  listeningActiveRangeIndices: [],
  // UI flags
  navActive: true,
  showingDetail: false,
})

export function useWordStore() {
  return state
}

// ===== Data Management =====
export function initDefaultData() {
  state.wordBooks = bookData.map(b => ({
    id: b.id,
    name: b.name,
    coopEnabled: false,
    coopBookId: null,
    words: b.words.map(w => ({
      word: w.word,
      meaning: w.meaning,
      root: w.root || '',
      memo: w.memo || '',
      note: '',
      review: false,
      mastered: false,
      studied: false,
    })),
    units: buildUnits(b.words.length, b.unitSize || 20),
  }))
  // 添加一个我的收藏本
  state.wordBooks.push({
    id: 'favorites',
    name: '我的收藏',
    coopEnabled: false,
    coopBookId: null,
    words: [],
    units: [],
  })
}

function buildUnits(total, size) {
  const units = []
  let start = 0
  let num = 1
  while (start < total) {
    const count = Math.min(size, total - start)
    units.push({ start, count, number: num, name: `单元${num}` })
    start += count
    num++
  }
  return units
}

export function loadData() {
  const parsed = loadFromStorage()
  if (parsed) {
    try {
      Object.assign(state, {
        wordBooks: parsed.wordBooks || [],
        folders: parsed.folders || [],
        currentBookId: parsed.currentBookId || null,
        currentWordIndex: parsed.currentWordIndex || 0,
        voiceLang: parsed.voiceLang || 'en-US',
        autoSpeak: parsed.autoSpeak !== undefined ? parsed.autoSpeak : true,
        fastMode: parsed.fastMode !== undefined ? parsed.fastMode : true,
        loopUnit: parsed.loopUnit || false,
        theme: parsed.theme || 'system',
        backgroundTheme: parsed.backgroundTheme || 'flower',
        wordFontSize: parsed.wordFontSize || 32,
        meaningFontSize: parsed.meaningFontSize || 18,
        rootFontSize: parsed.rootFontSize || 14,
        examplesFontSize: parsed.examplesFontSize || 14,
        iconSize: parsed.iconSize || 40,
        uiFont: parsed.uiFont || 'default',
        selectedVoiceURI: parsed.selectedVoiceURI || '',
        speechRate: parsed.speechRate !== undefined ? parsed.speechRate : 1.0,
        studyMode: parsed.studyMode || 'all',
        buttonPosition: parsed.buttonPosition || 200,
        learningRecords: parsed.learningRecords || [],
        checkInState: normalizeCheckInState(parsed.checkInState),
        studyStats: normalizeStudyStats(parsed.studyStats),
        lockMode: parsed.lockMode !== undefined ? parsed.lockMode : false,
        bookStudyStates: parsed.bookStudyStates || {},
        listeningWordFontSize: parsed.listeningWordFontSize || 32,
        listeningMeaningFontSize: parsed.listeningMeaningFontSize || 18,
        listeningShowChinese: parsed.listeningShowChinese !== undefined ? parsed.listeningShowChinese : true,
      })
    } catch (e) {
      initDefaultData()
    }
  } else {
    initDefaultData()
  }

  // Normalize book data
  normalizeBooks()

  // Ensure currentBookId is valid
  if (!state.currentBookId && state.wordBooks.length > 0) {
    state.currentBookId = state.wordBooks[0].id
  }

  resetRangeToAll()
  applyTheme()
  applyBackgroundTheme()
  applyFontSizes()
  applyIconSize()
  applyButtonPosition()
  applyUIFont()

  setSpeechConfig({
    voiceLang: state.voiceLang,
    selectedVoiceURI: state.selectedVoiceURI,
    speechRate: state.speechRate,
    speechPitch: 1.0
  })
}

function normalizeBooks() {
  state.wordBooks.forEach(book => {
    if (book.coopEnabled === undefined) book.coopEnabled = false
    if (book.coopBookId === undefined) book.coopBookId = null
    if (book.folderId === undefined) book.folderId = null
    if (book.originalBookId && !book.copySourceBookId) book.copySourceBookId = book.originalBookId
    if (isCopyBook(book) && book.coopTargetBookId === undefined) book.coopTargetBookId = null
    if (!isCopyBook(book) && book.coopTargetBookId === undefined) book.coopTargetBookId = book.coopBookId || null
    if (!book.units) book.units = []
    if (book.units.length === 0 && book.words && book.words.length > 0) {
      book.units = [{ start: 0, count: book.words.length }]
    }
    // Fix copy book unit start values
    if (book.originalBookId && book.units && book.units.length > 0) {
      let currentStart = 0
      for (let i = 0; i < book.units.length; i++) {
        book.units[i].start = currentStart
        currentStart += book.units[i].count
      }
    }
    book.words.forEach(w => {
      if (w.note === undefined) w.note = ''
      if (w.review === undefined) w.review = false
      if (w.mastered === undefined) w.mastered = false
      if (w.studied === undefined) w.studied = false
    })
  })
}

export function saveData() {
  // Save current book study state
  if (state.currentBookId) {
    state.bookStudyStates[state.currentBookId] = {
      currentWordIndex: state.currentWordIndex,
      studyMode: state.studyMode,
      fastMode: state.fastMode,
      loopUnit: state.loopUnit,
      lockMode: state.lockMode,
    }
  }
  const toStore = {
    wordBooks: state.wordBooks,
    folders: state.folders,
    currentBookId: state.currentBookId,
    currentWordIndex: state.currentWordIndex,
    voiceLang: state.voiceLang,
    autoSpeak: state.autoSpeak,
    fastMode: state.fastMode,
    loopUnit: state.loopUnit,
    theme: state.theme,
    backgroundTheme: state.backgroundTheme,
    wordFontSize: state.wordFontSize,
    meaningFontSize: state.meaningFontSize,
    rootFontSize: state.rootFontSize,
    examplesFontSize: state.examplesFontSize,
    iconSize: state.iconSize,
    uiFont: state.uiFont,
    selectedVoiceURI: state.selectedVoiceURI,
    speechRate: state.speechRate,
    studyMode: state.studyMode,
    buttonPosition: state.buttonPosition,
    learningRecords: state.learningRecords,
    checkInState: state.checkInState,
    studyStats: state.studyStats,
    lockMode: state.lockMode,
    bookStudyStates: state.bookStudyStates,
    listeningWordFontSize: state.listeningWordFontSize,
    listeningMeaningFontSize: state.listeningMeaningFontSize,
    listeningShowChinese: state.listeningShowChinese,
  }
  saveToStorage(toStore)
}

// ===== Theme Functions =====
export function applyTheme() {
  const body = document.body
  body.classList.remove('dark-mode', 'green-mode', 'blue-mode')
  if (state.theme === 'system') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('dark-mode')
    }
  } else {
    body.classList.add(state.theme + '-mode')
  }
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === state.theme)
  })
}

export function applyBackgroundTheme() {
  const allowed = ['flower', 'space', 'station', 'ocean', 'forest', 'calm']
  if (!allowed.includes(state.backgroundTheme)) state.backgroundTheme = 'flower'
  document.body.classList.remove(...allowed.map(name => `visual-theme-${name}`))
  document.body.classList.add(`visual-theme-${state.backgroundTheme}`)
  document.querySelectorAll('.home-bg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bgTheme === state.backgroundTheme)
  })
}

export function applyFontSizes() {
  state.wordFontSize = Number.isFinite(parseInt(state.wordFontSize)) ? parseInt(state.wordFontSize) : 32
  state.meaningFontSize = Number.isFinite(parseInt(state.meaningFontSize)) ? parseInt(state.meaningFontSize) : 18
  state.rootFontSize = Number.isFinite(parseInt(state.rootFontSize)) ? parseInt(state.rootFontSize) : 14
  state.examplesFontSize = Number.isFinite(parseInt(state.examplesFontSize)) ? parseInt(state.examplesFontSize) : 14

  document.documentElement.style.setProperty('--word-scale', ((state.wordFontSize - 32) / 8).toFixed(2))
  document.documentElement.style.setProperty('--meaning-scale', ((state.meaningFontSize - 18) / 4).toFixed(2))
  document.documentElement.style.setProperty('--root-scale', ((state.rootFontSize - 14) / 2).toFixed(2))
  document.documentElement.style.setProperty('--examples-scale', ((state.examplesFontSize - 14) / 2).toFixed(2))
  document.documentElement.style.setProperty('--word-font-size', state.wordFontSize + 'px')
  document.documentElement.style.setProperty('--meaning-font-size', state.meaningFontSize + 'px')
  document.documentElement.style.setProperty('--root-font-size', state.rootFontSize + 'px')
  document.documentElement.style.setProperty('--examples-font-size', state.examplesFontSize + 'px')

  document.querySelectorAll('.word-main').forEach(el => { el.style.fontSize = state.wordFontSize + 'px' })
  document.querySelectorAll('.meaning').forEach(el => { el.style.fontSize = state.meaningFontSize + 'px' })
  document.querySelectorAll('.root-memo').forEach(el => { el.style.fontSize = state.rootFontSize + 'px' })
}

export function applyIconSize() {
  state.iconSize = Number.isFinite(parseInt(state.iconSize)) ? parseInt(state.iconSize) : 40
  document.documentElement.style.setProperty('--icon-scale', (state.iconSize / 40).toFixed(2))
  document.documentElement.style.setProperty('--study-icon-size', state.iconSize + 'px')
}

export function applyButtonPosition() {
  state.buttonPosition = Number.isFinite(parseInt(state.buttonPosition)) ? parseInt(state.buttonPosition) : 60
  document.documentElement.style.setProperty('--action-row-bottom', state.buttonPosition + 'px')
  document.documentElement.style.setProperty('--persist-note-bottom', (state.buttonPosition + 60) + 'px')
  const stickyOffset = Math.max(0, Math.min(90, Math.round((state.buttonPosition - 60) * 0.65)))
  document.documentElement.style.setProperty('--action-row-sticky-bottom', stickyOffset + 'px')
}

export function applyUIFont() {
  if (state.uiFont === 'default') {
    document.documentElement.style.setProperty('--ui-font', '')
    document.body.style.fontFamily = ''
  } else {
    document.documentElement.style.setProperty('--ui-font', state.uiFont)
    document.body.style.fontFamily = state.uiFont
  }
}

// ===== Book Helpers =====
export function getCurrentBook() {
  return state.wordBooks.find(b => b.id === state.currentBookId) || null
}

export function getBookById(id) {
  return state.wordBooks.find(b => b.id === id) || null
}

export function getCurrentWord() {
  const book = getCurrentBook()
  if (book && book.words[state.currentWordIndex]) return book.words[state.currentWordIndex]
  return null
}

export function switchTab(pageId, router) {
  state.showingDetail = false
  state.navActive = true
}

export function resetRangeToAll() {
  const book = getCurrentBook()
  if (!book) {
    state.activeRangeIndices = []
    state.inRangeMode = false
    state.tempStartIndex = -1
    return
  }
  state.activeRangeIndices = book.words.map((_, idx) => idx)
  state.inRangeMode = false
  state.tempStartIndex = -1
}

export function getFilteredIndices(book) {
  if (!book) book = getCurrentBook()
  if (!book) return []
  const all = book.words.map((_, idx) => idx)
  if (state.studyMode === 'mastered') return all.filter(i => book.words[i].mastered)
  if (state.studyMode === 'unmastered') return all.filter(i => !book.words[i].mastered)
  if (state.studyMode === 'unstudied') return all.filter(i => !book.words[i].studied)
  return all
}

// ===== Learning Record =====
export function saveLearningRecord() {
  const book = getCurrentBook()
  if (!book) return null
  const record = {
    id: 'record_' + Date.now(),
    bookId: book.id,
    bookName: book.name,
    timestamp: new Date().toISOString(),
    words: book.words.map(w => ({ word: w.word, meaning: w.meaning, mastered: w.mastered, review: w.review })),
    summary: {
      total: book.words.length,
      mastered: book.words.filter(w => w.mastered).length,
      unmastered: book.words.filter(w => !w.mastered).length,
    }
  }
  state.learningRecords.unshift(record)
  if (state.learningRecords.length > 20) state.learningRecords = state.learningRecords.slice(0, 20)
  saveData()
  return record
}

// ===== Study Stats =====
let studyTimerId = null

export function startStudyTimer() {
  if (studyTimerId) return
  state.studyTimerLastAt = Date.now()
  studyTimerId = setInterval(() => {
    const now = Date.now()
    const elapsed = (now - state.studyTimerLastAt) / 1000
    state.studyTimerLastAt = now
    if (elapsed > 0 && elapsed < 60) {
      state.studyStats.totalSeconds += elapsed
      const today = getToday()
      if (!state.studyStats.daily[today]) state.studyStats.daily[today] = 0
      state.studyStats.daily[today] += elapsed
      state.studyStatsDirty = true
      const nowSec = Date.now()
      if (nowSec - state.lastStudyStatsSaveAt > 30000) {
        state.lastStudyStatsSaveAt = nowSec
        saveData()
        state.studyStatsDirty = false
      }
    }
  }, 10000)
}

export function stopStudyTimer() {
  if (studyTimerId) {
    clearInterval(studyTimerId)
    studyTimerId = null
  }
}

// ===== Daily Check-in =====
export function doDailyCheckIn() {
  const today = getToday()
  if (state.checkInState.lastDate === today) {
    return 'already'
  }
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0')

  if (state.checkInState.lastDate === yesterdayStr) {
    state.checkInState.streak++
  } else {
    state.checkInState.streak = 1
  }
  state.checkInState.lastDate = today
  state.checkInState.total++
  saveData()
  return 'done'
}

export function getTodayStudySeconds() {
  const today = getToday()
  return state.studyStats.daily[today] || 0
}

export function getTotalStudySeconds() {
  return state.studyStats.totalSeconds || 0
}

// ===== Export =====
export function generateExportHTML(bookId, format, columns, rowsPerColumn, noPaging, bgColor, fontFamily, colOrder, includeEbbinghaus) {
  const book = getBookById(bookId)
  if (!book || book.words.length === 0) return null

  const words = book.words
  const totalRows = noPaging ? words.length : rowsPerColumn
  const totalCols = columns
  const itemsPerPage = noPaging ? words.length : totalRows * totalCols
  const totalPages = noPaging ? 1 : Math.ceil(words.length / itemsPerPage)

  let headerCells = []
  if (colOrder === 'zh-en') headerCells = ['中文', '英文']
  else headerCells = ['英文', '中文']
  if (includeEbbinghaus) headerCells.push('艾宾浩斯记忆复习周期')

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${book.name} 导出</title>
<style>
body { font-family: ${fontFamily === 'default' ? 'sans-serif' : fontFamily}; margin: 0; padding: 10px; background-color: ${bgColor === 'warm' ? '#fff8eb' : '#ebf5eb'}; }
table { border-collapse: collapse; width: 100%; margin: 0 auto; background-color: white; table-layout: fixed; }
th, td { border: 1px solid #aaa; padding: 8px; text-align: center; vertical-align: middle; line-height: 1.4; }
table { border: 1px solid #aaa; border-collapse: separate; border-spacing: 0; }
th { background-color: #f0f0f0; font-weight: bold; }
td { background-color: #fff; }
.page-break { page-break-before: always; }
h1 { text-align: center; color: #333; }
.page-footer { text-align: center; margin: 20px 0 10px; font-size: 12px; color: #666; }
th:first-child, td:first-child { width: 5%; min-width: 30px; max-width: 40px; }
.content-col { width: 30%; min-width: 150px; max-width: 250px; }
.empty-col { width: 70%; min-width: 300px; }
.seq-col { width: 5%; min-width: 30px; max-width: 40px; }
@media print { body { margin: 0.5in; background-color: white; font-size: 12pt; } }
</style>
</head>
<body>
<h1>${book.name}</h1>`

  function renderRow(idx) {
    const w = words[idx]
    let zh = w.meaning || ''
    let en = w.word || ''
    if (format === 'en') zh = ''
    else if (format === 'zh') en = ''
    else if (format === 'full') {
      zh = w.meaning || ''
      en = w.word + ' (词根:' + (w.root || '无') + ' 助记:' + (w.memo || '无') + ')' + ((w.examples && w.examples.length) ? ' 例句:' + w.examples.join(' / ') : '')
    }
    const seq = idx + 1
    let row = `    <td class="seq-col">${seq}</td>`
    if (colOrder === 'zh-en') {
      row += `<td class="${format === 'en' ? 'empty-col' : 'content-col'}">${format === 'en' ? '' : zh}</td><td class="${format === 'zh' ? 'empty-col' : 'content-col'}">${format === 'zh' ? '' : en}</td>`
    } else {
      row += `<td class="${format === 'zh' ? 'empty-col' : 'content-col'}">${format === 'zh' ? '' : en}</td><td class="${format === 'en' ? 'empty-col' : 'content-col'}">${format === 'en' ? '' : zh}</td>`
    }
    if (includeEbbinghaus) row += '<td></td>'
    return row
  }

  if (noPaging) {
    html += '<table>\n<thead>\n<tr>\n'
    for (let c = 0; c < totalCols; c++) {
      html += '<th class="seq-col">序号</th>'
      headerCells.forEach(cell => html += `<th class="content-col">${cell}</th>`)
    }
    html += '</tr>\n</thead>\n<tbody>\n'
    let currentIndex = 0
    while (currentIndex < words.length) {
      html += '<tr>\n'
      for (let col = 0; col < totalCols; col++) {
        if (currentIndex < words.length) {
          html += renderRow(currentIndex)
          currentIndex++
        } else {
          html += '<td></td>'
          for (let i = 0; i < headerCells.length; i++) html += '<td></td>'
        }
      }
      html += '</tr>\n'
    }
    html += '</tbody>\n</table>\n'
    html += `<div class="page-footer">共 ${words.length} 个单词</div>\n`
  } else {
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * itemsPerPage
      const endIdx = Math.min(startIdx + itemsPerPage, words.length)
      if (page > 0) html += '<div class="page-break"></div>\n'
      html += '<table>\n<thead>\n<tr>\n'
      for (let c = 0; c < totalCols; c++) {
        html += '<th class="seq-col">序号</th>'
        headerCells.forEach(cell => html += `<th class="content-col">${cell}</th>`)
      }
      html += '</tr>\n</thead>\n<tbody>\n'
      let currentIndex = startIdx
      while (currentIndex < endIdx) {
        html += '<tr>\n'
        for (let col = 0; col < totalCols; col++) {
          if (currentIndex < endIdx) {
            html += renderRow(currentIndex)
            currentIndex++
          } else {
            html += '<td></td>'
            for (let i = 0; i < headerCells.length; i++) html += '<td></td>'
          }
        }
        html += '</tr>\n'
      }
      html += '</tbody>\n</table>\n'
      html += `<div class="page-footer">第 ${page + 1} / ${totalPages} 页 · 共 ${words.length} 个单词</div>\n`
    }
  }

  html += '</body>\n</html>'
  return html
}

export function exportAsWord(htmlContent, filename) {
  const styledHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<style>
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #000; padding: 6px; text-align: center; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`
  const blob = new Blob(['﻿' + styledHtml], { type: 'application/msword' })
  downloadBlob(blob, filename + '.doc')
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ===== Listen functions (re-export from useSpeech) =====
export { speakText }
