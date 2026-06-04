<template>
  <div class="page active" id="studyPage">
    <div class="study-header">
      <div class="book-row">
        <span class="current-book-name" id="currentBookName">{{ currentBook?.name || '无单词本' }}</span>
        <div class="study-quick-actions">
          <button class="icon-btn compact-action" id="studySearchBtn" @click="openSearch" title="搜索全部单词本">🔍</button>
          <button class="icon-btn compact-action" @click="goToSettings" title="打开设置">⚙️</button>
        </div>
      </div>
      <button class="study-controls-toggle" id="studyControlsToggle" type="button" @click="toggleControls" :aria-expanded="controlsOpen">
        <span class="study-controls-toggle-title">⚙️ 刷词控制</span>
        <span class="study-controls-toggle-summary" id="studyControlsSummary">{{ controlsSummary }}</span>
        <span class="study-controls-toggle-arrow" :class="{ open: controlsOpen }">⌄</span>
      </button>
      <div class="study-controls-panel" id="studyControlsPanel" v-show="controlsOpen">
        <div class="mode-row">
          <button class="mode-toggle" id="modeToggle" @click="toggleFastMode">{{ store.fastMode ? '⚡ 速刷模式' : '🐢 慢刷模式' }}</button>
          <div class="unit-control">
            <select class="unit-selector" id="unitSelector" v-model="selectedUnit" @change="onUnitChange">
              <option value="-1">全部单元</option>
              <option v-for="(u, i) in currentBook?.units || []" :key="i" :value="i">{{ u.name || `单元${u.number || i + 1}` }}</option>
            </select>
            <button class="loop-btn" id="loopUnitBtn" :class="{ active: store.loopUnit }" @click="toggleLoopUnit">🔁 循环</button>
            <button class="loop-btn" id="lockModeBtn" :class="{ active: store.lockMode }" @click="toggleLockMode">🔒 锁定</button>
          </div>
        </div>
        <div class="mode-row">
          <div class="study-mode-control">
            <button class="mode-toggle" :class="{ active: store.studyMode === 'all' }" @click="setStudyMode('all')">📚 全部单词</button>
            <button class="mode-toggle" :class="{ active: store.studyMode === 'mastered' }" @click="setStudyMode('mastered')">✅ 已掌握</button>
            <button class="mode-toggle" :class="{ active: store.studyMode === 'unmastered' }" @click="setStudyMode('unmastered')">😵 未掌握</button>
            <button class="mode-toggle" :class="{ active: store.studyMode === 'unstudied' }" @click="setStudyMode('unstudied')">📝 未刷</button>
          </div>
        </div>
        <div class="mode-row" style="justify-content: flex-end;">
          <button class="loop-btn" id="saveStudyRecordBtn" @click="saveRecord">💾 保存记录</button>
        </div>
      </div>
      <div class="progress" id="progressText">{{ progressText }}</div>
    </div>
    <div class="card-area">
      <div class="flash-card" id="flashCard" @click="toggleDetail">
        <div class="word-main" id="wordDisplay">{{ currentWordText }}</div>
        <div class="click-hint" id="clickHint" :class="{ hidden: store.showDetail }">👆 点击卡片显示释义</div>
        <div class="icon-row">
          <div class="icon-item" id="speakCurrentBtn" @click.stop="speakCurrent" title="发音">🔊</div>
          <div class="icon-item review-icon" :class="{ active: currentWord?.review }" @click.stop="toggleReview" title="标记待复习">☆</div>
          <div class="icon-item add-icon" @click.stop="addToAny" title="添加到单词本">📌</div>
          <div class="icon-item note-icon" @click.stop="editNote" title="编辑笔记">📝</div>
        </div>
        <div class="detail-section" id="detailSection" :class="{ 'show-by-click': store.showDetail }">
          <div class="meaning" id="meaningDisplay">{{ currentWord?.meaning || '' }}</div>
          <div class="root-memo" id="rootDisplay" v-if="currentWord?.root || currentWord?.memo">
            <div v-if="currentWord?.root"><strong>词根：</strong>{{ currentWord.root }}</div>
            <span v-if="currentWord?.memo">{{ currentWord.memo }}</span>
          </div>
          <div class="examples-section" v-if="currentExamples.length > 0">
            <div v-for="(ex, i) in currentExamples" :key="i" class="example-item" @click.stop>
              <span class="example-speak-btn" @click.stop="speakText(ex)">🔊</span>
              <div class="example-content">
                <div class="example-en">{{ ex }}</div>
                <div class="example-zh" v-if="currentExampleMeanings[i]">{{ currentExampleMeanings[i] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="action-row" id="actionRow">
        <button class="secondary-btn" id="prevBtn" :style="{ display: !store.fastMode ? '' : 'none' }" @click="prevWord">⏪ 上一个</button>
        <button class="secondary-btn" id="forgetBtn" :class="{ active: forgetActive }" @click="markUnknown">😵 不认识</button>
        <button class="primary-btn" id="knowBtn" @click="markKnown">✅ 认识</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  useWordStore, getCurrentBook, getCurrentWord, saveData,
  speakText, saveLearningRecord, resetRangeToAll, getFilteredIndices,
  getBookById
} from '../stores/wordStore'
import { normalizeWordExamples } from '../utils/helpers'

const store = useWordStore()
const router = useRouter()

const controlsOpen = ref(false)
const selectedUnit = ref('-1')
const forgetActive = ref(false)

const currentBook = computed(() => getCurrentBook())
const currentWord = computed(() => getCurrentWord())
const currentWordText = computed(() => currentWord.value ? currentWord.value.word : '✨ 没有单词')

const currentExamples = computed(() => {
  if (!currentWord.value) return []
  normalizeWordExamples(currentWord.value)
  return currentWord.value.examples || []
})

const currentExampleMeanings = computed(() => {
  return currentWord.value?.exampleMeanings || []
})

const progressText = computed(() => {
  const book = currentBook.value
  if (!book) return '0 / 0 单词'
  const total = getFilteredIndices().length
  const pos = getFilteredIndices().indexOf(store.currentWordIndex) + 1
  return `${Math.max(0, pos)} / ${total} 单词 · 全局第${store.currentWordIndex + 1}个`
})

const controlsSummary = computed(() => {
  const mode = store.fastMode ? '⚡速刷' : '🐢慢刷'
  const study = store.studyMode === 'all' ? '全部' : store.studyMode === 'mastered' ? '已掌握' : store.studyMode === 'unmastered' ? '未掌握' : '未刷'
  return `${mode} · ${study} · 单词${totalWords.value}个`
})

const totalWords = computed(() => currentBook.value?.words.length || 0)

function toggleControls() {
  controlsOpen.value = !controlsOpen.value
}

function toggleFastMode() {
  store.fastMode = !store.fastMode
  if (!store.fastMode && !store.showDetail) {
    store.showDetail = true
  }
  saveData()
}

function toggleLoopUnit() {
  store.loopUnit = !store.loopUnit
  saveData()
}

function toggleLockMode() {
  store.lockMode = !store.lockMode
  saveData()
}

function setStudyMode(mode) {
  store.studyMode = mode
  store.currentWordIndex = 0
  store.showDetail = false
  forgetActive.value = false
  saveData()
}

function onUnitChange() {
  const book = currentBook.value
  if (!book) return
  const val = parseInt(selectedUnit.value)
  if (val === -1) {
    resetRangeToAll()
  } else if (book.units[val]) {
    const unit = book.units[val]
    store.activeRangeIndices = []
    for (let i = unit.start; i < unit.start + unit.count; i++) {
      if (i < book.words.length) store.activeRangeIndices.push(i)
    }
    store.currentWordIndex = unit.start
    store.showDetail = false
    forgetActive.value = false
  }
  saveData()
}

function toggleDetail() {
  store.showDetail = !store.showDetail
}

function speakCurrent() {
  const w = currentWord.value
  if (w) speakText(w.word)
}

function toggleReview() {
  const w = currentWord.value
  if (w) {
    w.review = !w.review
    saveData()
  }
}

function addToAny() {
  const w = currentWord.value
  if (!w) return
  const modal = document.getElementById('addToModal')
  if (!modal) return
  const container = document.getElementById('addToBookList')
  if (!container) return
  container.innerHTML = ''
  store.wordBooks.forEach(book => {
    if (book.id === store.currentBookId) return
    const btn = document.createElement('button')
    btn.className = 'secondary-btn'
    btn.style.cssText = 'width:100%;text-align:left;padding:12px;'
    btn.textContent = book.name
    btn.onclick = () => {
      book.words.push({ ...w })
      if (!book.units || book.units.length === 0) {
        book.units = [{ start: 0, count: book.words.length }]
      } else {
        const last = book.units[book.units.length - 1]
        book.units.push({ start: last.start + last.count, count: 1 })
      }
      saveData()
      modal.classList.remove('show')
    }
    container.appendChild(btn)
  })
  modal.classList.add('show')
}

function editNote() {
  const w = currentWord.value
  if (!w) return
  const modal = document.getElementById('noteModal')
  if (!modal) return
  store.noteEditBookId = store.currentBookId
  store.noteEditWordIndex = store.currentWordIndex
  const titleEl = document.getElementById('noteWordTitle')
  if (titleEl) titleEl.textContent = `编辑笔记：${w.word}`
  const inputEl = document.getElementById('noteEditInput')
  if (inputEl) inputEl.value = w.note || ''
  modal.classList.add('show')
}

function markKnown() {
  const w = currentWord.value
  if (!w) return
  w.mastered = true
  w.studied = true
  forgetActive.value = false
  advanceWord()
  saveData()
}

function markUnknown() {
  const w = currentWord.value
  if (!w) return
  w.studied = true
  forgetActive.value = true
  if (!store.fastMode) {
    store.showDetail = true
    saveData()
    return
  }
  store.showDetail = true
  saveData()
}

function advanceWord() {
  const indices = getFilteredIndices()
  if (indices.length === 0) return

  if (store.lockMode) {
    const unmasteredIndices = indices.filter(i => !getCurrentBook()?.words[i]?.mastered)
    if (unmasteredIndices.length > 0) {
      const pos = unmasteredIndices.indexOf(store.currentWordIndex)
      if (pos >= 0 && pos < unmasteredIndices.length - 1) {
        store.currentWordIndex = unmasteredIndices[pos + 1]
      } else {
        store.currentWordIndex = unmasteredIndices[0]
      }
      store.showDetail = false
      forgetActive.value = false
      return
    }
  }

  const pos = indices.indexOf(store.currentWordIndex)

  if (store.loopUnit) {
    const unitIndices = getUnitIndices()
    if (unitIndices.length > 0) {
      const unitPos = unitIndices.indexOf(store.currentWordIndex)
      if (unitPos >= 0 && unitPos < unitIndices.length - 1) {
        store.currentWordIndex = unitIndices[unitPos + 1]
      } else {
        store.currentWordIndex = unitIndices[0]
      }
      store.showDetail = false
      forgetActive.value = false
      if (store.autoSpeak) speakCurrent()
      return
    }
  }

  if (pos >= 0 && pos < indices.length - 1) {
    store.currentWordIndex = indices[pos + 1]
  } else {
    store.currentWordIndex = indices[0]
  }
  store.showDetail = false
  forgetActive.value = false
  if (store.autoSpeak) speakCurrent()
}

function getUnitIndices() {
  const book = currentBook.value
  if (!book || !book.units || book.units.length === 0) return []
  const unitIdx = parseInt(selectedUnit.value)
  if (unitIdx >= 0 && book.units[unitIdx]) {
    const u = book.units[unitIdx]
    const indices = []
    for (let i = u.start; i < u.start + u.count; i++) {
      if (i < book.words.length) indices.push(i)
    }
    return indices
  }
  return []
}

function prevWord() {
  const indices = getFilteredIndices()
  if (indices.length === 0) return
  const pos = indices.indexOf(store.currentWordIndex)
  if (pos > 0) {
    store.currentWordIndex = indices[pos - 1]
  }
  store.showDetail = !store.fastMode
  forgetActive.value = false
}

function saveRecord() {
  saveLearningRecord()
}

function openSearch() {
  const modal = document.getElementById('globalSearchModal')
  if (modal) modal.classList.add('show')
}

function goToSettings() {
  router.push('/settings')
}

// Keyboard shortcuts
function handleKeydown(e) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    markKnown()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    if (store.fastMode) markUnknown()
    else prevWord()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  // Auto speak on mount
  if (store.autoSpeak && currentWord.value) {
    setTimeout(() => speakText(currentWord.value.word), 300)
  }
})

// Watch for word changes to speak
watch(() => store.currentWordIndex, () => {
  if (store.autoSpeak && currentWord.value) {
    speakText(currentWord.value.word)
  }
})
</script>
