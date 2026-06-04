<template>
  <div class="app-container" id="appContainer">
    <div class="page-content" id="pageContent">
      <router-view />
    </div>
    <TabBar />
    <ModalContainer ref="modalRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from './components/TabBar.vue'
import ModalContainer from './components/ModalContainer.vue'
import {
  useWordStore, loadData, startStudyTimer, applyTheme,
  applyBackgroundTheme, applyFontSizes, applyIconSize,
  applyButtonPosition, applyUIFont
} from './stores/wordStore'
import { populateVoiceSelector } from './composables/useSpeech'

const store = useWordStore()
const router = useRouter()
const modalRef = ref(null)

// Provide modal open functions to all children
provide('openModal', {
  reviewRecords: () => modalRef.value?.openReviewRecords(),
  globalSearch: () => modalRef.value?.openGlobalSearch(),
  note: (bookId, idx, word) => modalRef.value?.openNote(bookId, idx, word),
  addTo: () => modalRef.value?.openAddTo(),
  import: () => modalRef.value?.openImport(),
  importPhrase: () => modalRef.value?.openImportPhrase(),
  export: () => modalRef.value?.openExport(),
  filter: () => modalRef.value?.openFilter(),
  help: () => modalRef.value?.openHelp(),
  listeningWordList: () => modalRef.value?.openListeningWordList(),
})

onMounted(() => {
  loadData()
  applyBackgroundTheme()

  // Set up speech synthesis
  if (window.speechSynthesis) {
    setTimeout(() => {
      const sel = document.getElementById('voiceSelector')
      if (sel) populateVoiceSelector(sel)
    }, 500)
    window.speechSynthesis.onvoiceschanged = () => {
      const sel = document.getElementById('voiceSelector')
      if (sel) populateVoiceSelector(sel)
    }
  }

  // Dark mode system preference listener
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (store.theme === 'system') applyTheme()
    })
  }

  // Start learning timer
  startStudyTimer()
})

onUnmounted(() => {
  // Cleanup happens in store
})
</script>
