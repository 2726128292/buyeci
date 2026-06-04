<template>
  <div class="page active" id="libraryPage">
    <!-- Book List View -->
    <template v-if="!showDetail">
      <div class="library-header">
        <h2>单词本</h2>
        <div class="library-search-wrap">
          <input type="text" class="search-box library-search-input" id="bookSearchInput" v-model="bookSearch" placeholder="🔍 搜索单词，显示所在单词本">
          <div class="search-hint compact-hint" id="bookSearchHint"></div>
        </div>
        <div class="library-actions">
          <button class="icon-btn" @click="openFilterModal">🔍</button>
          <button class="icon-btn" v-show="store.filterType !== 'all'" @click="resetFilter">🗑️</button>
          <button class="icon-btn" @click="openNewFolder">📁</button>
          <button class="icon-btn" @click="openNewBook">➕</button>
          <button class="icon-btn" @click="openExportModal">📤</button>
          <button class="icon-btn" @click="renameBook">✏️</button>
          <button class="icon-btn" @click="openImportModal">📝</button>
          <button class="icon-btn" @click="openImportPhraseModal">💬</button>
        </div>
      </div>
      <div class="book-list" id="bookListContainer">
        <div v-for="folder in folders" :key="folder.id" class="folder-card">
          <div class="folder-header" @click="toggleFolder(folder.id)">
            <span>📁 {{ folder.name }}</span>
            <span>{{ folderExpanded[folder.id] ? '▼' : '▶' }}</span>
          </div>
          <div v-show="folderExpanded[folder.id]" class="folder-books">
            <div v-for="book in getBooksInFolder(folder.id)" :key="book.id" class="book-card" :class="{ active: store.currentBookId === book.id }" @click="selectBook(book.id)">
              <div class="book-info">
                <h3>{{ book.name }}</h3>
                <p>{{ book.words.length }} 单词{{ isCopyBook(book) ? ' · 副本' : '' }}</p>
              </div>
              <div class="book-actions">
                <span v-if="store.currentBookId === book.id" class="book-current-tag">当前</span>
                <span class="delete-book-btn" @click.stop="deleteBook(book.id)">🗑️</span>
              </div>
            </div>
          </div>
        </div>
        <div v-for="book in getUnfolderedBooks()" :key="book.id" class="book-card" :class="{ active: store.currentBookId === book.id }" @click="selectBook(book.id)">
          <div class="book-info">
            <h3>{{ book.name }}</h3>
            <p>{{ book.words.length }} 单词{{ isCopyBook(book) ? ' · 副本' : '' }}</p>
          </div>
          <div class="book-actions">
            <span v-if="store.currentBookId === book.id" class="book-current-tag">当前</span>
            <span class="delete-book-btn" @click.stop="deleteBook(book.id)">🗑️</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Word Detail View -->
    <template v-if="showDetail">
      <div class="word-detail-view show" id="wordDetailView">
        <div class="detail-header">
          <button class="back-btn" @click="showDetail = false">←</button>
          <h3>{{ selectedBook?.name || '单词列表' }}</h3>
        </div>
        <div class="list-toolbar" style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px;">
          <button class="unit-toggle-btn" @click="toggleUnitGroup">{{ store.unitGroupMode ? '📂 按单元' : '📂 全部显示' }}</button>
          <div class="mastered-filter-group" style="gap: 4px; padding: 1px;">
            <button class="unit-toggle-btn" :class="{ active: store.masteredFilterMode === 'all' }" @click="setMasteredFilter('all')">📚 全部</button>
            <button class="unit-toggle-btn" :class="{ active: store.masteredFilterMode === 'mastered' }" @click="setMasteredFilter('mastered')">✅ 已掌握</button>
            <button class="unit-toggle-btn" :class="{ active: store.masteredFilterMode === 'unmastered' }" @click="setMasteredFilter('unmastered')">😵 未掌握</button>
            <button class="unit-toggle-btn" :class="{ active: store.masteredFilterMode === 'unstudied' }" @click="setMasteredFilter('unstudied')">📝 未刷</button>
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button class="secondary-btn" style="padding: 6px 10px; font-size: 12px;" @click="selectAllInUnit">☑️ 全选</button>
            <button class="secondary-btn" style="background-color: #ff4d4f; color: white; padding: 6px 10px; font-size: 12px;" @click="deleteSelectedWords">🗑️ 删除选中</button>
          </div>
          <input type="text" class="search-box" v-model="wordSearch" placeholder="🔍 搜索" style="flex:1;min-width:120px;padding:6px 10px;">
        </div>
        <div class="word-list" id="libWordListContainer">
          <!-- 按单元分组模式 -->
          <template v-if="store.unitGroupMode && !wordSearch.trim()">
            <div v-for="unit in unitsWithWords" :key="unit.index" class="unit-group">
              <div class="unit-header" @click="toggleUnitCollapsed(unit.index)">
                <span class="unit-title">{{ unit.name }} ({{ unit.words.length }}词)</span>
                <span class="unit-toggle">{{ store.unitCollapsed[unit.index] ? '展开' : '折叠' }}</span>
              </div>
              <div v-show="!store.unitCollapsed[unit.index]">
                <div v-for="(item, idx) in unit.words" :key="item.realIndex" class="list-item">
                  <div class="list-content" @click="item.open = !item.open">
                    <div class="list-word">
                      <div class="list-word-left">
                        <input type="checkbox" :checked="selectedWords.has(item.realIndex)" @click.stop @change="toggleWordSelect(item.realIndex)" class="word-checkbox" :data-index="item.realIndex">
                        <span class="list-speaker" @click.stop="speakWord(item.word.word)">🔊</span>
                        <span>{{ item.word.word }}</span>
                        <span v-if="item.word.review" class="list-review-star">⭐</span>
                        <span v-if="item.word.mastered" class="list-mastered-icon">✅</span>
                      </div>
                    </div>
                    <div class="list-detail" v-show="item.open">
                      <div class="list-meaning">{{ item.word.meaning || '无' }}</div>
                      <div class="list-root">词根: {{ item.word.root || '无' }} · 助记: {{ item.word.memo || '无' }}</div>
                      <div class="list-note" v-if="item.word.note">📝 {{ item.word.note }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- 平铺模式 -->
          <template v-else>
            <div v-for="(item, idx) in filteredWordList" :key="idx" class="list-item">
              <div class="list-content" @click="item.open = !item.open">
                <div class="list-word">
                  <div class="list-word-left">
                    <input type="checkbox" :checked="selectedWords.has(item.realIndex)" @click.stop @change="toggleWordSelect(item.realIndex)" class="word-checkbox" :data-index="item.realIndex">
                    <span class="list-speaker" @click.stop="speakWord(item.word.word)">🔊</span>
                    <span>{{ item.word.word }}</span>
                    <span v-if="item.word.review" class="list-review-star">⭐</span>
                    <span v-if="item.word.mastered" class="list-mastered-icon">✅</span>
                  </div>
                </div>
                <div class="list-detail" v-show="item.open">
                  <div class="list-meaning">{{ item.word.meaning || '无' }}</div>
                  <div class="list-root">词根: {{ item.word.root || '无' }} · 助记: {{ item.word.memo || '无' }}</div>
                  <div class="list-note" v-if="item.word.note">📝 {{ item.word.note }}</div>
                </div>
              </div>
            </div>
          </template>
          <div v-if="filteredWordList.length === 0" style="text-align:center;padding:40px;color:var(--text-secondary);">暂无单词</div>
        </div>
        <div class="library-action-dock compact-library-dock">
          <div class="library-start-actions">
            <button class="secondary-btn" @click="setAsCurrent">🔄 设为当前</button>
            <button class="primary-btn" @click="startStudying">▶ 开始刷</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useWordStore, getCurrentBook, speakText, saveData, resetRangeToAll, getBookById } from '../stores/wordStore'
import { isCopyBook } from '../utils/helpers'

const store = useWordStore()
const router = useRouter()

const showDetail = ref(false)
const selectedBookId = ref(null)
const bookSearch = ref('')
const wordSearch = ref('')
const selectedWords = reactive(new Set())

const selectedBook = computed(() => store.wordBooks.find(b => b.id === selectedBookId.value || b.id === store.currentBookId))

const filteredWordList = computed(() => {
  const book = store.wordBooks.find(b => b.id === selectedBookId.value)
  if (!book) return []
  let words = book.words.map((w, i) => ({ word: w, realIndex: i, open: false }))
  if (wordSearch.value.trim()) {
    const q = wordSearch.value.toLowerCase()
    words = words.filter(item => item.word.word.toLowerCase().includes(q) || (item.word.meaning || '').toLowerCase().includes(q))
  }
  if (store.masteredFilterMode === 'mastered') words = words.filter(i => i.word.mastered)
  else if (store.masteredFilterMode === 'unmastered') words = words.filter(i => !i.word.mastered)
  else if (store.masteredFilterMode === 'unstudied') words = words.filter(i => !i.word.studied)
  return words
})

const unitsWithWords = computed(() => {
  const book = store.wordBooks.find(b => b.id === selectedBookId.value)
  if (!book || !book.units) return []
  return book.units.map((unit, idx) => {
    const unitIndices = []
    for (let i = unit.start; i < unit.start + unit.count; i++) {
      if (i < book.words.length) unitIndices.push(i)
    }
    // Apply filters
    let wordItems = unitIndices.map(i => ({ word: book.words[i], realIndex: i, open: false }))
    if (wordSearch.value.trim()) {
      const q = wordSearch.value.toLowerCase()
      wordItems = wordItems.filter(item => item.word.word.toLowerCase().includes(q) || (item.word.meaning || '').toLowerCase().includes(q))
    }
    if (store.masteredFilterMode === 'mastered') wordItems = wordItems.filter(i => i.word.mastered)
    else if (store.masteredFilterMode === 'unmastered') wordItems = wordItems.filter(i => !i.word.mastered)
    else if (store.masteredFilterMode === 'unstudied') wordItems = wordItems.filter(i => !i.word.studied)
    // Ensure collapsed state exists
    if (store.unitCollapsed[idx] === undefined) store.unitCollapsed[idx] = false
    return { index: idx, name: unit.name || `单元${unit.number || idx + 1}`, words: wordItems }
  }).filter(u => u.words.length > 0)
})

function toggleUnitGroup() {
  store.unitGroupMode = !store.unitGroupMode
}

function toggleUnitCollapsed(idx) {
  store.unitCollapsed[idx] = !store.unitCollapsed[idx]
}

function setMasteredFilter(mode) {
  store.masteredFilterMode = mode
}

function selectBook(bookId) {
  selectedBookId.value = bookId
  store.currentBookId = bookId
  showDetail.value = true
  saveData()
}

function speakWord(text) {
  speakText(text)
}

function toggleWordSelect(index) {
  if (selectedWords.has(index)) selectedWords.delete(index)
  else selectedWords.add(index)
}

function selectAllInUnit() {
  filteredWordList.value.forEach(item => selectedWords.add(item.realIndex))
}

function deleteSelectedWords() {
  const book = store.wordBooks.find(b => b.id === selectedBookId.value)
  if (!book || selectedWords.size === 0) return
  if (!confirm(`确定删除选中的 ${selectedWords.size} 个单词？`)) return
  const indices = Array.from(selectedWords).sort((a, b) => b - a)
  indices.forEach(idx => book.words.splice(idx, 1))
  if (book.units) book.units = [{ start: 0, count: book.words.length }]
  selectedWords.clear()
  saveData()
}

function setAsCurrent() {
  store.currentBookId = selectedBookId.value
  store.currentWordIndex = 0
  resetRangeToAll()
  saveData()
}

function startStudying() {
  if (selectedBookId.value) store.currentBookId = selectedBookId.value
  store.currentWordIndex = 0
  resetRangeToAll()
  saveData()
  router.push('/study')
}

function deleteBook(id) {
  if (!confirm('确定删除此单词本？')) return
  store.wordBooks = store.wordBooks.filter(b => b.id !== id)
  if (store.currentBookId === id) {
    store.currentBookId = store.wordBooks[0]?.id || null
  }
  saveData()
  showDetail.value = false
}

function renameBook() {
  const book = store.wordBooks.find(b => b.id === store.currentBookId) || store.wordBooks[0]
  if (!book) return
  const name = prompt('输入新名称', book.name)
  if (name && name.trim()) {
    book.name = name.trim()
    saveData()
  }
}

function getBooksInFolder(folderId) {
  return store.wordBooks.filter(b => b.folderId === folderId)
}

function getUnfolderedBooks() {
  const folderIds = new Set(store.folders.map(f => f.id))
  return store.wordBooks.filter(b => !b.folderId || !folderIds.has(b.folderId))
}

const folders = computed(() => store.folders || [])
const folderExpanded = computed(() => store.folderExpanded || {})

function toggleFolder(id) {
  store.folderExpanded[id] = !store.folderExpanded[id]
  saveData()
}

function openNewFolder() {
  const name = prompt('输入文件夹名称', '新文件夹')
  if (name && name.trim()) {
    store.folders.push({ id: 'folder_' + Date.now(), name: name.trim() })
    saveData()
  }
}

function openNewBook() {
  const name = prompt('输入单词本名称', '新单词本')
  if (name && name.trim()) {
    store.wordBooks.push({
      id: 'book_' + Date.now(), name: name.trim(),
      words: [], units: [], coopEnabled: false, coopBookId: null
    })
    saveData()
  }
}

function openFilterModal() {
  const modal = document.getElementById('filterModal')
  if (modal) modal.classList.add('show')
}

function resetFilter() {
  store.filterType = 'all'
  store.filterOriginalId = null
}

function openExportModal() {
  const modal = document.getElementById('exportModal')
  if (modal) modal.classList.add('show')
}

function openImportModal() {
  const modal = document.getElementById('importModal')
  if (modal) {
    modal.classList.add('show')
    const title = document.getElementById('importModalTitle')
    if (title) title.textContent = '粘贴导入'
    const wordBtn = document.getElementById('importTypeWord')
    if (wordBtn) { wordBtn.classList.add('active'); document.getElementById('importTypePhrase')?.classList.remove('active') }
    document.getElementById('importFormatHintPhrase').style.display = 'none'
    document.getElementById('importFormatHint').style.display = ''
  }
}

function openImportPhraseModal() {
  const modal = document.getElementById('importModal')
  if (modal) {
    modal.classList.add('show')
    const title = document.getElementById('importModalTitle')
    if (title) title.textContent = '粘贴导入短语/句子'
    const phraseBtn = document.getElementById('importTypePhrase')
    if (phraseBtn) { phraseBtn.classList.add('active'); document.getElementById('importTypeWord')?.classList.remove('active') }
    document.getElementById('importFormatHint').style.display = 'none'
    document.getElementById('importFormatHintPhrase').style.display = ''
  }
}
</script>
