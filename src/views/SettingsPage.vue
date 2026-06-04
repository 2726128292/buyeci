<template>
  <div class="page active" id="settingsPage">
    <div class="settings-page">
      <div class="settings-title">⚙️ 设置</div>

      <div class="settings-section">
        <h3>🎨 主题模式</h3>
        <div class="theme-selector">
          <button class="theme-btn" :class="{ active: store.theme === 'system' }" data-theme="system" @click="setTheme('system')">跟随系统</button>
          <button class="theme-btn" :class="{ active: store.theme === 'dark' }" data-theme="dark" @click="setTheme('dark')">深色模式</button>
          <button class="theme-btn" :class="{ active: store.theme === 'green' }" data-theme="green" @click="setTheme('green')">护眼绿</button>
          <button class="theme-btn" :class="{ active: store.theme === 'blue' }" data-theme="blue" @click="setTheme('blue')">护眼蓝</button>
        </div>
        <div class="settings-item" style="margin-top: var(--space-3);">
          <label class="settings-label">背景图片主题</label>
          <div class="home-bg-switcher" style="justify-content:flex-start;max-width:100%;">
            <button class="home-bg-btn" v-for="bg in bgThemes" :key="bg.id" :class="{ active: store.backgroundTheme === bg.id }" :data-bg-theme="bg.id" @click="setBgTheme(bg.id)">{{ bg.label }}</button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>🔊 发音设置</h3>
        <div class="settings-item">
          <span class="settings-label">口音</span>
          <div class="settings-control">
            <button class="voice-btn" :class="{ active: store.voiceLang === 'en-US' }" data-voice="en-US" @click="setVoiceLang('en-US')">🇺🇸 美音</button>
            <button class="voice-btn" :class="{ active: store.voiceLang === 'en-GB' }" data-voice="en-GB" @click="setVoiceLang('en-GB')">🇬🇧 英音</button>
          </div>
        </div>
        <div class="settings-item">
          <span class="settings-label">自动发音</span>
          <button class="toggle-switch" id="autoToggle" @click="toggleAutoSpeak">{{ store.autoSpeak ? '🔊 开' : '🔊 关' }}</button>
        </div>
        <div class="settings-item">
          <span class="settings-label">语音选择</span>
          <select class="voice-selector" id="voiceSelector" v-model="store.selectedVoiceURI" @change="onVoiceChange">
            <option value="">系统默认</option>
          </select>
        </div>
        <div class="voice-slider-item">
          <div class="slider-label">
            <span>语速</span>
            <span class="slider-value" id="rateValue">{{ store.speechRate.toFixed(1) }}</span>
          </div>
          <input type="range" class="slider" min="0.5" max="2" step="0.1" :value="store.speechRate" @input="onRateChange">
        </div>
      </div>

      <div class="settings-section">
        <h3>📚 合作模式</h3>
        <div class="settings-item">
          <span class="settings-label">合作模式</span>
          <button class="toggle-switch" @click="toggleCoop">{{ coopEnabled ? '🤝 开' : '🤝 关' }}</button>
        </div>
        <div class="settings-item" style="flex-wrap: wrap;">
          <span class="settings-label">副本本</span>
          <select class="coop-selector" id="coopBookSelector" v-model="coopTargetBookId" :disabled="!coopEnabled">
            <option value="">请选择副本本</option>
            <option v-for="b in copyBooks" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <button class="coop-new-btn" id="coopNewBookBtn" :disabled="!coopEnabled" @click="createCoopBook">➕新建副本</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>🔤 字体大小调节</h3>
        <div v-for="slider in fontSliders" :key="slider.key" class="font-slider-item">
          <div class="slider-label">
            <span>{{ slider.label }}</span>
            <span class="slider-value">{{ store[slider.key] }}px</span>
          </div>
          <input type="range" class="slider" :min="slider.min" :max="slider.max" step="1" :value="store[slider.key]" @input="e => changeFont(slider.key, parseInt(e.target.value))">
        </div>
      </div>

      <div class="settings-section">
        <h3>🖼️ 图标大小调节</h3>
        <div class="icon-slider-item">
          <div class="slider-label">
            <span>刷词页图标</span>
            <span class="slider-value">{{ store.iconSize }}px</span>
          </div>
          <input type="range" class="slider" min="32" max="52" step="1" :value="store.iconSize" @input="e => changeIconSize(parseInt(e.target.value))">
        </div>
      </div>

      <div class="settings-section">
        <h3>📱 按钮位置调节</h3>
        <div class="icon-slider-item">
          <div class="slider-label">
            <span>按钮高度位置</span>
            <span class="slider-value">{{ store.buttonPosition }}px</span>
          </div>
          <input type="range" class="slider" min="60" max="200" step="5" :value="store.buttonPosition" @input="e => changeButtonPos(parseInt(e.target.value))">
        </div>
        <div class="export-note">📌 调节按钮在屏幕底部的高度位置，确保操作舒适且不遮挡内容</div>
      </div>

      <div class="settings-section" id="recordsSection">
        <h3>📊 学习记录管理</h3>
        <div class="export-note">📌 在刷词页面或听力页面保存记录后，可在此查看和加载历史记录</div>
        <div id="recordsList" style="margin-top: 16px; max-height: 300px; overflow-y: auto;">
          <div v-if="store.learningRecords.length === 0" style="color: var(--text-secondary); padding: 20px; text-align: center;">暂无学习记录</div>
          <div v-for="(rec, i) in store.learningRecords" :key="rec.id" style="padding: 12px; margin-bottom: 8px; background: var(--bg-primary); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>{{ rec.bookName }}</strong>
                <span style="color: var(--text-secondary); font-size: 12px; margin-left: 8px;">{{ formatTimestamp(rec.timestamp) }}</span>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 12px; color: var(--text-secondary);">{{ rec.summary?.mastered || 0 }}/{{ rec.summary?.total || 0 }} 已掌握</span>
                <button class="secondary-btn" style="padding: 4px 8px; font-size: 11px;" @click="deleteRecord(i)">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>📝 界面字体</h3>
        <div class="settings-item">
          <span class="settings-label">字体</span>
          <select class="ui-font-selector" id="uiFontSelector" v-model="store.uiFont" @change="onUIFontChange">
            <option value="default">系统默认</option>
            <option value="'宋体', SimSun">宋体</option>
            <option value="'黑体', SimHei">黑体</option>
            <option value="'微软雅黑', 'Microsoft YaHei'">微软雅黑</option>
            <option value="'楷体', KaiTi">楷体</option>
            <option value="Arial, Helvetica">Arial</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h3>ℹ️ 关于</h3>
        <p style="color: var(--text-secondary); line-height:1.6;">版本 6.4 · 不背单词速刷<br>数据永久保存在浏览器中</p>
        <div class="settings-item">
          <span class="settings-label">使用说明</span>
          <button class="secondary-btn" id="helpBtn" @click="openHelp">📖 查看使用说明</button>
        </div>
      </div>
      <div class="version-info">© 2025 不背单词 · 移动优化版</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useWordStore, applyTheme, applyBackgroundTheme, applyFontSizes, applyIconSize, applyButtonPosition, applyUIFont, saveData } from '../stores/wordStore'
import { getSpeechConfig, setSpeechConfig, populateVoiceSelector } from '../composables/useSpeech'

const store = useWordStore()

const bgThemes = [
  { id: 'flower', label: '🌸 花朵' }, { id: 'space', label: '🌌 太空' },
  { id: 'station', label: '🚀 空间站' }, { id: 'ocean', label: '🌊 海洋' },
  { id: 'forest', label: '🌲 森林' }, { id: 'calm', label: '✨ 简洁' },
]

const fontSliders = [
  { key: 'wordFontSize', label: '英文单词', min: 24, max: 60 },
  { key: 'meaningFontSize', label: '中文释义', min: 14, max: 36 },
  { key: 'rootFontSize', label: '词根助记', min: 12, max: 28 },
  { key: 'examplesFontSize', label: '例句字体', min: 12, max: 28 },
]

const coopEnabled = computed(() => {
  const book = store.wordBooks.find(b => b.id === store.currentBookId)
  return book ? book.coopEnabled : false
})

const coopTargetBookId = computed({
  get() {
    const book = store.wordBooks.find(b => b.id === store.currentBookId)
    return book ? (book.coopTargetBookId || '') : ''
  },
  set(val) {
    const book = store.wordBooks.find(b => b.id === store.currentBookId)
    if (book) { book.coopTargetBookId = val || null; saveData() }
  }
})

const copyBooks = computed(() => store.wordBooks.filter(b => b.originalBookId))

function setTheme(t) {
  store.theme = t
  applyTheme()
  saveData()
}

function setBgTheme(id) {
  store.backgroundTheme = id
  applyBackgroundTheme()
  saveData()
}

function setVoiceLang(lang) {
  store.voiceLang = lang
  setSpeechConfig({ voiceLang: lang })
  saveData()
}

function toggleAutoSpeak() {
  store.autoSpeak = !store.autoSpeak
  saveData()
}

function onVoiceChange() {
  setSpeechConfig({ selectedVoiceURI: store.selectedVoiceURI })
  saveData()
}

function onRateChange(e) {
  store.speechRate = parseFloat(e.target.value) || 1
  setSpeechConfig({ speechRate: store.speechRate })
  saveData()
}

function changeFont(key, val) {
  store[key] = val
  applyFontSizes()
  saveData()
}

function changeIconSize(val) {
  store.iconSize = val
  applyIconSize()
  saveData()
}

function changeButtonPos(val) {
  store.buttonPosition = val
  applyButtonPosition()
  saveData()
}

function onUIFontChange() {
  applyUIFont()
  saveData()
}

function toggleCoop() {
  const book = store.wordBooks.find(b => b.id === store.currentBookId)
  if (book) { book.coopEnabled = !book.coopEnabled; saveData() }
}

function createCoopBook() {
  const name = prompt('输入副本单词本名称', '我的错词本')
  if (name && name.trim()) {
    const book = store.wordBooks.find(b => b.id === store.currentBookId)
    if (book) {
      const newId = 'copy_' + Date.now()
      store.wordBooks.push({
        id: newId, name: name.trim(), originalBookId: book.id,
        copySourceBookId: book.id, coopTargetBookId: null,
        words: [], units: [], coopEnabled: false, coopBookId: null
      })
      book.coopTargetBookId = newId
      book.coopEnabled = true
      saveData()
    }
  }
}

function deleteRecord(index) {
  store.learningRecords.splice(index, 1)
  saveData()
}

function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
}

function openHelp() {
  const modal = document.getElementById('helpModal')
  if (modal) modal.classList.add('show')
}

onMounted(() => {
  setTimeout(() => {
    const sel = document.getElementById('voiceSelector')
    if (sel && window.speechSynthesis) populateVoiceSelector(sel)
  }, 100)
})
</script>
