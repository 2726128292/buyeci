<template>
  <div class="page active" id="listeningPage">
    <div class="study-header">
      <div class="book-row" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="current-book-name" id="listeningBookName">{{ currentBook?.name || '无单词本' }}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 6px 12px; background: var(--bg-primary); border-radius: 40px;" @click="showSettings = !showSettings">
            <span>播放设置</span>
            <span id="listeningSettingsIcon">⚙️</span>
          </div>
        </div>
      </div>
      <div class="mode-row">
        <div class="study-mode-control">
          <button class="mode-toggle" :class="{ active: store.listeningMode === 'all' }" @click="setListeningMode('all')">📚 全部单词</button>
          <button class="mode-toggle" :class="{ active: store.listeningMode === 'mastered' }" @click="setListeningMode('mastered')">✅ 已掌握</button>
          <button class="mode-toggle" :class="{ active: store.listeningMode === 'unmastered' }" @click="setListeningMode('unmastered')">😵 未掌握</button>
          <button class="mode-toggle" :class="{ active: store.listeningMode === 'unstudied' }" @click="setListeningMode('unstudied')">📝 未刷</button>
        </div>
      </div>
      <div class="mode-row" style="justify-content: flex-end;">
        <div class="unit-control" style="margin-left: auto;">
          <button class="loop-btn" @click="showUnitSelector = !showUnitSelector">📚 单元</button>
          <div class="unit-select-dropdown" v-show="showUnitSelector" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 1000; min-width: 200px; max-width: 95vw; max-height: 80vh; overflow-y: auto;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">选择单元</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label v-for="(u, i) in currentBook?.units || []" :key="i" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" :checked="listeningSelectedUnits.includes(i)" @change="toggleListeningUnit(i)" style="width: 18px; height: 18px;">
                <span>{{ u.name || `单元${u.number || i + 1}` }}</span>
              </label>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
              <button class="secondary-btn" style="font-size: 12px; padding: 6px 12px;" @click="selectAllListeningUnits">全选</button>
              <button class="secondary-btn" style="font-size: 12px; padding: 6px 12px;" @click="store.listeningSelectedUnits = []; showUnitSelector = false">取消全选</button>
              <button class="primary-btn" style="font-size: 12px; padding: 6px 12px;" @click="showUnitSelector = false">确定</button>
            </div>
          </div>
          <button class="loop-btn" :class="{ active: store.listeningLoopMode }" @click="toggleListeningLoop">🔁 循环</button>
          <button class="loop-btn" :class="{ active: store.listeningLockMode }" @click="toggleListeningLock">🔒 锁定</button>
          <button class="loop-btn" :class="{ active: store.listeningRandomMode }" @click="toggleListeningRandom">🎲 随机</button>
          <button class="loop-btn" @click="openListeningWordList">📋 单词列表</button>
        </div>
      </div>
      <div class="progress" id="listeningProgressText">{{ progressText }}</div>
    </div>
    <div class="card-area">
      <div class="flash-card" id="listeningCard" @click="toggleListeningDetail">
        <div class="word-main" id="listeningWordDisplay">{{ currentWordText }}</div>
        <div class="click-hint" id="listeningClickHint" :class="{ hidden: !listeningShowDetailByClick && !showMeaning }">👆 点击卡片显示释义</div>
        <div class="detail-section" id="listeningDetailSection" :class="{ 'show-by-click': listeningShowDetailByClick || showMeaning }">
          <div class="meaning" id="listeningMeaningDisplay" v-if="store.listeningShowChinese">{{ currentWordMeaning }}</div>
        </div>
      </div>
      <div class="action-row listening-action-row" id="listeningActionRow">
        <button class="secondary-btn" id="listeningPrevBtn" @click="listeningPrev">⏪ 上一个</button>
        <button class="primary-btn" id="listeningPlayPauseBtn" @click="togglePlayPause">{{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}</button>
        <button class="secondary-btn" id="listeningNextBtn" @click="listeningNext">⏩ 下一个</button>
      </div>
      <div class="listening-note">🎧 便携听力模式 · 支持后台播放</div>
    </div>

    <!-- Settings Modal -->
    <div class="modal-overlay" v-show="showSettings" @click.self="showSettings = false">
      <div class="modal-center">
        <div class="modal-title">
          <span>播放设置</span>
          <button class="close-btn" @click="showSettings = false">✕</button>
        </div>
        <div class="settings-section" style="padding: 0;">
          <div class="settings-item">
            <span class="settings-label">内容选择</span>
            <div class="settings-control">
              <button class="mode-toggle" :class="{ active: store.listeningContentMode === 'both' }" @click="store.listeningContentMode = 'both'">单词+释义</button>
              <button class="mode-toggle" :class="{ active: store.listeningContentMode === 'words' }" @click="store.listeningContentMode = 'words'">仅单词</button>
              <button class="mode-toggle" :class="{ active: store.listeningContentMode === 'meanings' }" @click="store.listeningContentMode = 'meanings'">仅释义</button>
            </div>
          </div>
          <div class="settings-item">
            <span class="settings-label">语言</span>
            <div class="settings-control">
              <button class="mode-toggle" :class="{ active: store.listeningShowChinese }" @click="store.listeningShowChinese = true">中英文</button>
              <button class="mode-toggle" :class="{ active: !store.listeningShowChinese }" @click="store.listeningShowChinese = false">仅英文</button>
            </div>
          </div>
          <div class="settings-item">
            <span class="settings-label">重复次数</span>
            <div style="display: flex; gap: 4px;">
              <button v-for="n in [1,2,3]" :key="n" class="mode-toggle" :class="{ active: store.listeningRepeatCount === n }" @click="store.listeningRepeatCount = n">{{ n }}次</button>
            </div>
          </div>
          <div class="voice-slider-item">
            <div class="slider-label">
              <span>播放速度</span>
              <span class="slider-value">{{ store.listeningSpeed.toFixed(1) }}</span>
            </div>
            <input type="range" class="slider" min="0.5" max="2" step="0.1" v-model.number="store.listeningSpeed">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useWordStore, getCurrentBook, getCurrentWord, speakText, saveData } from '../stores/wordStore'

const store = useWordStore()
const showSettings = ref(false)
const showUnitSelector = ref(false)
const isPlaying = ref(false)
const showMeaning = ref(false)
const listeningShowDetailByClick = ref(false)

const currentBook = computed(() => getCurrentBook())
const currentWordText = computed(() => {
  const word = getListeningCurrentWord()
  return word ? word.word : '✨ 准备就绪'
})
const currentWordMeaning = computed(() => {
  const word = getListeningCurrentWord()
  return word ? word.meaning : ''
})

const listeningSelectedUnits = computed({
  get: () => store.listeningSelectedUnits,
  set: (val) => { store.listeningSelectedUnits = val }
})

const progressText = computed(() => {
  const indices = getListeningIndices()
  const pos = indices.indexOf(store.listeningCurrentIndex)
  return `${Math.max(0, pos + 1)} / ${indices.length} 单词 · 全局第${store.listeningCurrentIndex + 1}个`
})

let audioTimer = null

function getListeningCurrentWord() {
  const book = currentBook.value
  if (book && book.words[store.listeningCurrentIndex]) return book.words[store.listeningCurrentIndex]
  return null
}

function getListeningIndices() {
  const book = currentBook.value
  if (!book) return []
  const all = book.words.map((_, i) => i)
  let filtered = all
  if (store.listeningMode === 'mastered') filtered = filtered.filter(i => book.words[i].mastered)
  else if (store.listeningMode === 'unmastered') filtered = filtered.filter(i => !book.words[i].mastered)
  else if (store.listeningMode === 'unstudied') filtered = filtered.filter(i => !book.words[i].studied)

  if (store.listeningLockMode) {
    const unmastered = filtered.filter(i => !book.words[i].mastered)
    if (unmastered.length > 0) filtered = unmastered
  }
  return filtered
}

function setListeningMode(mode) {
  store.listeningMode = mode
  store.listeningCurrentIndex = 0
  showMeaning.value = false
  saveData()
}

function toggleListeningLoop() {
  store.listeningLoopMode = !store.listeningLoopMode
  saveData()
}

function toggleListeningLock() {
  store.listeningLockMode = !store.listeningLockMode
  saveData()
}

function toggleListeningRandom() {
  store.listeningRandomMode = !store.listeningRandomMode
  if (store.listeningRandomMode) {
    store.listeningPlayedIndices = []
    store.listeningShuffledIndices = []
  }
  saveData()
}

function toggleListeningUnit(idx) {
  const i = store.listeningSelectedUnits.indexOf(idx)
  if (i >= 0) store.listeningSelectedUnits.splice(i, 1)
  else store.listeningSelectedUnits.push(idx)
}

function selectAllListeningUnits() {
  const book = currentBook.value
  if (book) store.listeningSelectedUnits = book.units.map((_, i) => i)
}

function toggleListeningDetail() {
  listeningShowDetailByClick.value = !listeningShowDetailByClick.value
}

function togglePlayPause() {
  if (isPlaying.value) {
    stopPlayback()
  } else {
    startPlayback()
  }
}

function startPlayback() {
  isPlaying.value = true
  showMeaning.value = false
  speakCurrentWordWithRepeat()
}

function stopPlayback() {
  isPlaying.value = false
  if (audioTimer) {
    clearTimeout(audioTimer)
    audioTimer = null
  }
  window.speechSynthesis?.cancel()
}

function speakCurrentWordWithRepeat() {
  if (!isPlaying.value) return
  const word = getListeningCurrentWord()
  if (!word) { stopPlayback(); return }

  let repeatCount = 0
  const maxRepeats = store.listeningRepeatCount

  function speakOne() {
    if (!isPlaying.value) return
    if (repeatCount >= maxRepeats) {
      // All repeats done, move to next
      advancePlayback()
      return
    }
    const text = getListeningText()
    if (text) {
      speakText(text, () => {
        repeatCount++
        setTimeout(speakOne, 300)
      })
    } else {
      repeatCount++
      setTimeout(speakOne, 300)
    }
  }

  speakOne()
}

function getListeningText() {
  const word = getListeningCurrentWord()
  if (!word) return ''
  if (store.listeningContentMode === 'words') return word.word
  if (store.listeningContentMode === 'meanings') return word.meaning || ''
  return word.word + (store.listeningShowChinese && word.meaning ? ', ' + word.meaning : '')
}

function advancePlayback() {
  if (!isPlaying.value) return
  const indices = getListeningIndices()
  if (indices.length === 0) { stopPlayback(); return }

  if (store.listeningRandomMode) {
    // Random mode: pick a random unplayed index
    const unplayed = indices.filter(i => !store.listeningPlayedIndices.includes(i))
    if (unplayed.length === 0) {
      store.listeningPlayedIndices = []
      showMeaning.value = true
      setTimeout(() => { showMeaning.value = false; startPlayback() }, 2000)
      return
    }
    const next = unplayed[Math.floor(Math.random() * unplayed.length)]
    store.listeningCurrentIndex = next
    store.listeningPlayedIndices.push(next)
  } else if (store.listeningLoopMode && store.listeningSelectedUnits.length > 0) {
    const pos = indices.indexOf(store.listeningCurrentIndex)
    if (pos >= 0 && pos < indices.length - 1) {
      store.listeningCurrentIndex = indices[pos + 1]
    } else {
      store.listeningCurrentIndex = indices[0]
    }
  } else {
    const pos = indices.indexOf(store.listeningCurrentIndex)
    if (pos >= 0 && pos < indices.length - 1) {
      store.listeningCurrentIndex = indices[pos + 1]
    } else {
      store.listeningCurrentIndex = indices[0]
    }
  }
  showMeaning.value = true
  setTimeout(() => {
    showMeaning.value = false
    speakCurrentWordWithRepeat()
  }, 1500)
}

function listeningPrev() {
  stopPlayback()
  const indices = getListeningIndices()
  const pos = indices.indexOf(store.listeningCurrentIndex)
  if (pos > 0) store.listeningCurrentIndex = indices[pos - 1]
  showMeaning.value = false
}

function listeningNext() {
  stopPlayback()
  const indices = getListeningIndices()
  const pos = indices.indexOf(store.listeningCurrentIndex)
  if (pos >= 0 && pos < indices.length - 1) store.listeningCurrentIndex = indices[pos + 1]
  showMeaning.value = false
}

function openListeningWordList() {
  const modal = document.getElementById('listeningWordListModal')
  if (modal) modal.classList.add('show')
}

onUnmounted(() => {
  stopPlayback()
})
</script>
