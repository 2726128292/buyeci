<template>
  <div>
    <!-- Review Records Modal -->
    <div class="modal-overlay" id="reviewRecordsModal" v-show="showReviewRecords" @click.self="showReviewRecords = false">
      <div class="modal-center compact-search-modal">
        <div class="modal-title">
          <span>🧾 复习记录</span>
          <button class="close-btn" @click="showReviewRecords = false">✕</button>
        </div>
        <div class="search-hint">按单词本区分不认识/错词，可单独删除记录。</div>
        <div class="review-records-panel" id="reviewRecordsList">
          <div v-for="(rec, i) in store.learningRecords" :key="rec.id" style="padding: 12px; margin-bottom: 8px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>{{ rec.bookName }}</strong>
                <span style="color: var(--text-secondary); font-size: 12px; margin-left: 8px;">{{ formatTime(rec.timestamp) }}</span>
              </div>
              <button class="secondary-btn" style="padding: 4px 8px; font-size: 11px;" @click="deleteRecord(i)">🗑️</button>
            </div>
            <div style="margin-top: 8px; font-size: 13px; color: var(--text-secondary);">
              已掌握: {{ rec.summary?.mastered || 0 }}/{{ rec.summary?.total || 0 }} · 未掌握: {{ rec.summary?.unmastered || 0 }}
            </div>
          </div>
          <div v-if="store.learningRecords.length === 0" style="text-align: center; padding: 30px; color: var(--text-secondary);">暂无记录</div>
        </div>
      </div>
    </div>

    <!-- Global Search Modal -->
    <div class="modal-overlay" id="globalSearchModal" v-show="showGlobalSearch" @click.self="showGlobalSearch = false">
      <div class="modal-center compact-search-modal">
        <div class="modal-title">
          <span>🔍 搜索全部单词本</span>
          <button class="close-btn" @click="showGlobalSearch = false">✕</button>
        </div>
        <input type="text" class="search-box" v-model="globalSearchQuery" placeholder="输入单词..." style="width:100%;margin-bottom:12px;">
        <div class="search-hint" v-if="globalSearchQuery.trim()">找到 {{ globalSearchResults.length }} 个结果</div>
        <div style="max-height: 50vh; overflow-y: auto;">
          <div v-for="(r, i) in globalSearchResults" :key="i" style="padding: 10px; margin-bottom: 6px; background: var(--bg-primary); border-radius: 10px; border: 1px solid var(--border-color); cursor: pointer;" @click="goToWord(r.bookId, r.index)">
            <strong>{{ r.word }}</strong>
            <span style="color: var(--text-secondary);"> - {{ r.meaning }}</span>
            <div style="font-size: 12px; color: var(--text-tertiary);">{{ r.bookName }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Note Modal -->
    <div class="modal-overlay" id="noteModal" v-show="showNote" @click.self="closeNote">
      <div class="modal-center" style="height: auto; max-height: 80vh;">
        <div class="modal-title">
          <span>编辑笔记</span>
          <button class="close-btn" @click="closeNote">✕</button>
        </div>
        <div id="noteWordTitle" style="margin-bottom:8px;color:var(--accent);">{{ noteWord }}</div>
        <textarea class="note-edit-area" v-model="noteText" placeholder="记录你的思考..." style="width:100%;min-height:100px;padding:12px;border:2px solid var(--border-color);border-radius:18px;font-size:14px;resize:vertical;background:var(--bg-card);color:var(--text-primary);"></textarea>
        <div style="text-align:right; margin-top:12px; color:var(--text-secondary);">自动保存</div>
      </div>
    </div>

    <!-- Add to Any Modal -->
    <div class="modal-overlay" id="addToModal" v-show="showAddTo" @click.self="showAddTo = false">
      <div class="modal-center" style="height: auto; max-height: 80vh;">
        <div class="modal-title">
          <span>添加到单词本</span>
          <button class="close-btn" @click="showAddTo = false">✕</button>
        </div>
        <button class="primary-btn" style="margin-bottom:16px;" @click="addToNewBook">➕ 新建本</button>
        <div id="addToBookList" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    </div>

    <!-- Import Modal -->
    <div class="modal-overlay" id="importModal" v-show="showImport" @click.self="closeImport">
      <div class="modal-center">
        <div class="modal-title">
          <span id="importModalTitle">{{ importType === 'word' ? '粘贴导入' : '粘贴导入短语/句子' }}</span>
          <div class="modal-actions">
            <div class="import-type-toggle">
              <button class="mode-toggle" :class="{ active: importType === 'word' }" @click="setImportType('word')">📝 单词</button>
              <button class="mode-toggle" :class="{ active: importType === 'phrase' }" @click="setImportType('phrase')">💬 短语</button>
            </div>
            <button @click="importText = ''">清空</button>
            <button class="close-btn" @click="closeImport">✕</button>
          </div>
        </div>
        <div class="format-hint" v-show="importType === 'word'">
          <strong>📌 单词导入格式：</strong><br>
          <span style="font-size:13px;">1. 关键词格式（推荐）：</span><br>
          <code>英文: apple<br>中文: 苹果<br>词根: appl<br>助记: 手机品牌</code><br>
          <span style="font-size:13px;">2. 箭头分隔：</span><br>
          <code>apple → 苹果 → appl → 手机品牌</code>
        </div>
        <div class="format-hint" v-show="importType === 'phrase'">
          <strong>📌 短语导入格式：</strong><br>
          <span style="font-size:13px;">1. 关键词格式（推荐）：</span><br>
          <code>英文: break up<br>中文: 分手<br>例子: They broke up last week.<br>例译: 他们上周分手了。</code>
        </div>
        <div style="margin: 10px 0;">
          <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">📁 或上传TXT文件：</label>
          <input type="file" id="importFile" accept=".txt" style="width:100%;padding:8px;border:2px solid var(--border-color);border-radius:24px;background:var(--bg-card);" @change="onFileUpload">
        </div>
        <textarea id="importText" v-model="importText" placeholder="请按上方格式粘贴..." rows="4" style="width:100%;padding:12px;border:2px solid var(--border-color);border-radius:18px;font-size:14px;resize:vertical;background:var(--bg-card);color:var(--text-primary);"></textarea>
        <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
          <input type="checkbox" id="enableUnitSize" v-model="enableUnitSize" style="width:18px;height:18px;">
          <label for="enableUnitSize">启用每单元词数:</label>
        </div>
        <div class="row-flex" v-show="enableUnitSize">
          <label>每单元词数:</label>
          <input type="number" id="unitSizeInput" v-model.number="unitSize" min="1" style="flex:1;max-width:120px;padding:8px;border:2px solid var(--border-color);border-radius:18px;">
        </div>
        <div style="display: flex; align-items: center; gap:8px; margin:8px 0;">
          <select id="importTargetBook" v-model="importTargetBookId" style="flex:3;padding:8px;border:2px solid var(--border-color);border-radius:24px;background:var(--bg-card);color:var(--text-primary);">
            <option v-for="b in store.wordBooks" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <button class="secondary-btn" @click="createImportBook">➕新建</button>
        </div>
        <button class="primary-btn" style="width:100%;margin-top:8px;" @click="doImport">导入</button>
      </div>
    </div>

    <!-- Export Modal -->
    <div class="modal-overlay" id="exportModal" v-show="showExport" @click.self="showExport = false">
      <div class="modal-center" style="height: auto; max-height: 90vh;">
        <div class="modal-title">
          <span>导出单词本</span>
          <button class="close-btn" @click="showExport = false">✕</button>
        </div>
        <div class="export-settings">
          <div class="export-setting-item">
            <span class="export-setting-label">选择单词本</span>
            <select class="export-select" v-model="exportBookId" style="padding:8px;border:2px solid var(--border-color);border-radius:24px;">
              <option v-for="b in store.wordBooks" :key="b.id" :value="b.id">{{ b.name }} ({{ b.words.length }}词)</option>
            </select>
          </div>
          <div class="export-setting-item">
            <span class="export-setting-label">导出格式</span>
            <select class="export-select" v-model="exportFormat" style="padding:8px;border:2px solid var(--border-color);border-radius:24px;">
              <option value="en">仅英文</option>
              <option value="zh">仅中文</option>
              <option value="both" selected>英文+中文</option>
              <option value="full">全部（含词根助记）</option>
            </select>
          </div>
          <div class="export-setting-item">
            <span class="export-setting-label">列数</span>
            <select class="export-select" v-model="exportColumns" style="padding:8px;border:2px solid var(--border-color);border-radius:24px;">
              <option value="2">2列</option>
              <option value="3">3列</option>
            </select>
          </div>
          <div class="export-setting-item">
            <span class="export-setting-label">每列行数</span>
            <input type="number" class="export-number-input" v-model.number="exportRows" min="1" max="50" style="padding:8px;border:2px solid var(--border-color);border-radius:24px;width:80px;">
          </div>
          <div class="export-setting-item">
            <span class="export-setting-label">不分页模式</span>
            <input type="checkbox" v-model="exportNoPaging" class="export-checkbox">
          </div>
          <div class="export-setting-item">
            <span class="export-setting-label">列顺序</span>
            <div class="export-radio-group">
              <label><input type="radio" v-model="exportColOrder" value="zh-en"> 中文 / 英文</label>
              <label><input type="radio" v-model="exportColOrder" value="en-zh"> 英文 / 中文</label>
            </div>
          </div>
          <div class="export-setting-item">
            <span class="export-setting-label">文件类型</span>
            <div class="export-radio-group">
              <label><input type="radio" v-model="exportFileType" value="html"> HTML (.html)</label>
              <label><input type="radio" v-model="exportFileType" value="txt"> TXT (.txt)</label>
            </div>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button class="secondary-btn" style="max-width: none;" @click="showExport = false">取消</button>
            <button class="primary-btn" style="max-width: none;" @click="doExport">导出</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Modal -->
    <div class="modal-overlay" id="filterModal" v-show="showFilter" @click.self="showFilter = false">
      <div class="modal-center" style="height: auto; max-height: 80vh;">
        <div class="modal-title">
          <span>筛选单词本</span>
          <button class="close-btn" @click="showFilter = false">✕</button>
        </div>
        <div style="padding: 16px 0;">
          <div style="margin-bottom: 16px;">
            <h4 style="margin-bottom: 8px;">筛选类型</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button class="secondary-btn" :class="{ active: store.filterType === 'all' }" @click="store.filterType = 'all'">全部</button>
              <button class="secondary-btn" :class="{ active: store.filterType === 'originals' }" @click="store.filterType = 'originals'">原始词书</button>
              <button class="secondary-btn" :class="{ active: store.filterType === 'copies' }" @click="store.filterType = 'copies'">副本词书</button>
            </div>
          </div>
          <div style="margin-bottom: 16px;">
            <h4 style="margin-bottom: 8px;">按原始词书筛选</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button v-for="book in originalBooks" :key="book.id" class="secondary-btn" :class="{ active: store.filterOriginalId === book.id }" @click="store.filterOriginalId = book.id">{{ book.name }}</button>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 20px;">
          <button class="primary-btn" style="flex:1;" @click="showFilter = false">确定</button>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <div class="modal-overlay" id="helpModal" v-show="showHelp" @click.self="showHelp = false">
      <div class="modal-center" style="height: auto; max-height: 80vh;">
        <div class="modal-title">
          <span>📖 使用说明</span>
          <button class="close-btn" @click="showHelp = false">✕</button>
        </div>
        <div class="help-content">
          <div class="help-section">
            <h4>📚 基本操作</h4>
            <ul>
              <li>🔄 <strong>刷词模式切换</strong>：点击顶部的「⚡ 速刷模式」按钮，可在速刷模式和慢刷模式之间切换</li>
              <li>🎯 <strong>学习模式选择</strong>：在顶部选择「全部单词」、「已掌握」、「未掌握」或「未刷」进行针对性学习</li>
              <li>🔊 <strong>单词发音</strong>：点击单词旁的喇叭图标可播放单词发音，支持美音和英音切换</li>
              <li>⭐ <strong>标记复习</strong>：点击星星图标可标记单词为待复习，方便后续重点学习</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Listening Word List Modal -->
    <div class="modal-overlay" id="listeningWordListModal" v-show="showListeningWordList" @click.self="showListeningWordList = false">
      <div class="modal-center" style="height: auto; max-height: 85vh;">
        <div class="modal-title">
          <span>📋 单词列表</span>
          <button class="close-btn" @click="showListeningWordList = false">✕</button>
        </div>
        <input type="text" class="search-box" v-model="listeningWordSearch" placeholder="🔍 搜索..." style="width:100%;margin-bottom:12px;">
        <div style="max-height: 60vh; overflow-y: auto;">
          <div v-for="(item, i) in filteredListeningWords" :key="i" class="list-item" style="padding: 8px 12px; margin-bottom: 4px;">
            <div class="list-word">
              <div class="list-word-left">
                <span class="list-speaker" @click="speakWord(item.word.word)">🔊</span>
                <span>{{ item.word.word }}</span>
                <span v-if="item.word.review" class="list-review-star">⭐</span>
                <span v-if="item.word.mastered" class="list-mastered-icon">✅</span>
              </div>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); padding-left: 28px;">{{ item.word.meaning || '' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWordStore, saveData, speakText, generateExportHTML, downloadBlob, resetRangeToAll } from '../stores/wordStore'

const store = useWordStore()
const router = useRouter()

// Visibility states
const showReviewRecords = ref(false)
const showGlobalSearch = ref(false)
const showNote = ref(false)
const showAddTo = ref(false)
const showImport = ref(false)
const showExport = ref(false)
const showFilter = ref(false)
const showHelp = ref(false)
const showListeningWordList = ref(false)

// Global search
const globalSearchQuery = ref('')
const globalSearchResults = computed(() => {
  if (!globalSearchQuery.value.trim()) return []
  const q = globalSearchQuery.value.toLowerCase()
  const results = []
  store.wordBooks.forEach(book => {
    book.words.forEach((w, idx) => {
      if (w.word.toLowerCase().includes(q) || (w.meaning || '').toLowerCase().includes(q)) {
        results.push({ ...w, bookId: book.id, bookName: book.name, index: idx })
      }
    })
  })
  return results.slice(0, 50)
})

// Note
const noteText = ref('')
const noteWord = ref('')
const importType = ref('word')
const importText = ref('')
const enableUnitSize = ref(false)
const unitSize = ref(5)
const importTargetBookId = ref('')

// Export
const exportBookId = ref('')
const exportFormat = ref('both')
const exportColumns = ref('2')
const exportRows = ref(20)
const exportNoPaging = ref(false)
const exportColOrder = ref('zh-en')
const exportFileType = ref('html')

// Filter
const originalBooks = computed(() => store.wordBooks.filter(b => !b.originalBookId))

// Listening word list
const listeningWordSearch = ref('')
const filteredListeningWords = computed(() => {
  const book = store.wordBooks.find(b => b.id === store.currentBookId)
  if (!book) return []
  let words = book.words.map((w, i) => ({ word: w, realIndex: i }))
  if (listeningWordSearch.value.trim()) {
    const q = listeningWordSearch.value.toLowerCase()
    words = words.filter(item => item.word.word.toLowerCase().includes(q) || (item.word.meaning || '').toLowerCase().includes(q))
  }
  return words
})

// Expose open functions for parent components
function openReviewRecords() { showReviewRecords.value = true }
function openGlobalSearch() { showGlobalSearch.value = true; globalSearchQuery.value = '' }
function openNote(bookId, wordIndex, wordText) {
  store.noteEditBookId = bookId
  store.noteEditWordIndex = wordIndex
  noteWord.value = wordText
  const book = store.wordBooks.find(b => b.id === bookId)
  const word = book?.words[wordIndex]
  noteText.value = word?.note || ''
  showNote.value = true
}
function openAddTo() { showAddTo.value = true }
function openImport() { showImport.value = true; importType.value = 'word'; importText.value = '' }
function openImportPhrase() { showImport.value = true; importType.value = 'phrase'; importText.value = '' }
function openExport() { showExport.value = true; exportBookId.value = store.currentBookId || store.wordBooks[0]?.id || '' }
function openFilter() { showFilter.value = true }
function openHelp() { showHelp.value = true }
function openListeningWordList() { showListeningWordList.value = true; listeningWordSearch.value = '' }

function closeNote() {
  if (store.noteEditBookId && store.noteEditWordIndex !== null && store.noteEditWordIndex !== undefined) {
    const book = store.wordBooks.find(b => b.id === store.noteEditBookId)
    if (book && book.words[store.noteEditWordIndex]) {
      book.words[store.noteEditWordIndex].note = noteText.value
      saveData()
    }
  }
  showNote.value = false
}

function closeImport() { showImport.value = false }

function setImportType(type) { importType.value = type }

function onFileUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { importText.value = ev.target.result }
  reader.readAsText(file)
}

function createImportBook() {
  const name = prompt('输入新单词本名称', '新本')
  if (name && name.trim()) {
    const id = 'book_' + Date.now()
    store.wordBooks.push({ id, name: name.trim(), words: [], units: [], coopEnabled: false, coopBookId: null })
    importTargetBookId.value = id
    saveData()
  }
}

function doImport() {
  if (!importText.value.trim()) return
  const book = store.wordBooks.find(b => b.id === importTargetBookId.value)
  if (!book) { alert('请选择目标单词本'); return }
  const lines = importText.value.split('\n').map(l => l.trim()).filter(Boolean)
  const isPhrase = importType.value === 'phrase'
  const rawWords = []
  let currentEntry = null
  let currentUnit = null
  const unitWordMap = {}

  lines.forEach(line => {
    const unitMatch = line.match(/^#(\d+)$/)
    if (unitMatch) {
      if (currentEntry) { rawWords.push(currentEntry); currentEntry = null }
      currentUnit = parseInt(unitMatch[1]) - 1
      return
    }
    if (isPhrase) {
      const enMatch = line.match(/^英文[：:]\s*(.+)/)
      if (enMatch) {
        if (currentEntry) rawWords.push(currentEntry)
        currentEntry = { word: enMatch[1], meaning: '', examples: [], exampleMeanings: [], root: '', memo: '', note: '', review: false, mastered: false, studied: false, isPhraseOrSentence: true, unit: currentUnit }
        return
      }
      const zhMatch = line.match(/^中文[：:]\s*(.+)/)
      if (zhMatch && currentEntry) { currentEntry.meaning = zhMatch[1]; return }
      const exMatch = line.match(/^例子[：:]\s*(.+)/)
      if (exMatch && currentEntry) { currentEntry.examples.push(exMatch[1]); return }
      const exzhMatch = line.match(/^例译[：:]\s*(.+)/)
      if (exzhMatch && currentEntry) { currentEntry.exampleMeanings.push(exzhMatch[1]); return }
      // Arrow format
      const arrowMatch = line.match(/^(.+?)\s*[→➡]\s*(.+)/)
      if (arrowMatch && !currentEntry) {
        const parts = line.split(/[→➡]/).map(s => s.trim())
        currentEntry = { word: parts[0] || '', meaning: parts[1] || '', examples: parts.slice(2).filter((_, i) => i % 2 === 0), exampleMeanings: parts.slice(2).filter((_, i) => i % 2 === 1), root: '', memo: '', note: '', review: false, mastered: false, studied: false, isPhraseOrSentence: true, unit: currentUnit }
        if (currentEntry.word) { rawWords.push(currentEntry); currentEntry = null }
        return
      }
    } else {
      const enMatch = line.match(/^英文[：:]\s*(.+)/)
      if (enMatch) {
        if (currentEntry) rawWords.push(currentEntry)
        currentEntry = { word: enMatch[1], meaning: '', root: '', memo: '', note: '', review: false, mastered: false, studied: false, unit: currentUnit }
        return
      }
      const zhMatch = line.match(/^中文[：:]\s*(.+)/)
      if (zhMatch && currentEntry) { currentEntry.meaning = zhMatch[1]; return }
      const rootMatch = line.match(/^词根[：:]\s*(.+)/)
      if (rootMatch && currentEntry) { currentEntry.root = rootMatch[1]; return }
      const memoMatch = line.match(/^助记[：:]\s*(.+)/)
      if (memoMatch && currentEntry) { currentEntry.memo = memoMatch[1]; return }
      const noteMatch = line.match(/^笔记[：:]\s*(.+)/)
      if (noteMatch && currentEntry) { currentEntry.note = noteMatch[1]; return }
      // Arrow format
      const arrowMatch = line.match(/^(.+?)\s*[→➡]\s*(.+)/)
      if (arrowMatch && !currentEntry) {
        const parts = line.split(/[→➡]/).map(s => s.trim())
        currentEntry = { word: parts[0] || '', meaning: parts[1] || '', root: parts[2] || '', memo: parts[3] || '', note: '', review: false, mastered: false, studied: false, unit: currentUnit }
        if (currentEntry.word) { rawWords.push(currentEntry); currentEntry = null }
        return
      }
      // Simple space-split
      if (!currentEntry) {
        const spaceIdx = line.indexOf(' ')
        if (spaceIdx > 0) {
          currentEntry = { word: line.substring(0, spaceIdx).trim(), meaning: line.substring(spaceIdx + 1).trim(), root: '', memo: '', note: '', review: false, mastered: false, studied: false, unit: currentUnit }
          if (currentEntry.word) { rawWords.push(currentEntry); currentEntry = null }
        }
        return
      }
    }
  })
  if (currentEntry) rawWords.push(currentEntry)

  if (rawWords.length === 0) { alert('没有可导入的单词'); return }

  // Group by unit
  const unitGroups = {}
  rawWords.forEach(w => {
    const u = w.unit !== null && w.unit !== undefined ? w.unit : 0
    if (!unitGroups[u]) unitGroups[u] = []
    delete w.unit
    unitGroups[u].push(w)
  })

  const sortedUnits = Object.keys(unitGroups).sort((a, b) => a - b)
  sortedUnits.forEach(unitIdx => {
    const unitWords = unitGroups[unitIdx]
    if (enableUnitSize.value && unitSize.value > 0) {
      // Split into sub-units by size
      for (let i = 0; i < unitWords.length; i += unitSize.value) {
        const chunk = unitWords.slice(i, i + unitSize.value)
        book.words.push(...chunk)
        if (!book.units) book.units = []
        book.units.push({ start: book.words.length - chunk.length, count: chunk.length })
      }
    } else {
      // Add to existing unit or create new
      if (book.units && book.units[unitIdx]) {
        // Insert into this unit
        const unit = book.units[unitIdx]
        const insertAt = unit.start + unit.count
        book.words.splice(insertAt, 0, ...unitWords)
        unit.count += unitWords.length
        // Shift subsequent units
        for (let j = unitIdx + 1; j < book.units.length; j++) {
          book.units[j].start += unitWords.length
        }
      } else {
        book.words.push(...unitWords)
        if (!book.units) book.units = []
        book.units.push({ start: book.words.length - unitWords.length, count: unitWords.length })
      }
    }
  })

  saveData()
  alert(`成功导入 ${rawWords.length} 个单词/短语到「${book.name}」`)
  showImport.value = false
  importText.value = ''
}

function doExport() {
  const html = generateExportHTML(
    exportBookId.value,
    exportFormat.value,
    parseInt(exportColumns.value),
    exportRows.value,
    exportNoPaging.value,
    'green',
    'default',
    exportColOrder.value,
    false
  )
  if (!html) { alert('没有可导出的单词'); return }
  const book = store.wordBooks.find(b => b.id === exportBookId.value)
  const name = book ? book.name : 'export'
  if (exportFileType.value === 'html') {
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), name + '.html')
  } else {
    downloadBlob(new Blob([html], { type: 'text/plain;charset=utf-8' }), name + '.txt')
  }
  showExport.value = false
}

function addToNewBook() {
  const name = prompt('输入新单词本名称', '新本')
  if (name && name.trim()) {
    const id = 'book_' + Date.now()
    store.wordBooks.push({ id, name: name.trim(), words: [], units: [], coopEnabled: false, coopBookId: null })
    const container = document.getElementById('addToBookList')
    if (container) {
      // Trigger adding current word to this new book
      store.wordBooks[store.wordBooks.length - 1].words.push({ ...store.wordBooks.find(b => b.id === store.currentBookId)?.words[store.currentWordIndex] })
      saveData()
      showAddTo.value = false
    }
  }
}

function goToWord(bookId, index) {
  store.currentBookId = bookId
  store.currentWordIndex = index
  showGlobalSearch.value = false
  router.push('/study')
}

function deleteRecord(index) {
  store.learningRecords.splice(index, 1)
  saveData()
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0')
}

function speakWord(text) { speakText(text) }

// Make open functions available to parent
defineExpose({
  openReviewRecords, openGlobalSearch, openNote, openAddTo,
  openImport, openImportPhrase, openExport, openFilter,
  openHelp, openListeningWordList
})

onMounted(() => {
  importTargetBookId.value = store.currentBookId || store.wordBooks[0]?.id || ''
})
</script>
