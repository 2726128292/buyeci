<template>
  <div class="page active" id="homePage">
    <div class="home-page">
      <div class="home-topbar">
        <div class="home-logo">🐯</div>
        <div class="home-book-pill" id="homeCurrentBookName" @click="goToStudy">{{ currentBookName }}</div>
        <div class="home-bg-switcher">
          <button class="home-bg-btn" v-for="bg in bgThemes" :key="bg.id" :class="{ active: store.backgroundTheme === bg.id }" :data-bg-theme="bg.id" :title="bg.title" @click="setBg(bg.id)">{{ bg.label }}</button>
        </div>
      </div>
      <div class="home-center">
        <button class="checkin-card" id="homeCheckInCard" @click="doCheckIn">
          <div class="checkin-icon" id="homeCheckInIcon">🗓️</div>
          <div class="checkin-title" id="homeCheckInTitle">{{ checkInTitle }}</div>
          <div class="checkin-date" id="homeDateText">{{ dateText }}</div>
          <div class="checkin-streak" id="homeCheckInStreak">连续 {{ store.checkInState.streak }} 天</div>
        </button>
      </div>
      <div class="home-actions">
        <button class="home-stat-card" id="homeLearnCard" @click="goToStudy">
          <div class="home-stat-title">Learn</div>
          <div class="home-stat-number" id="homeLearnCount">{{ totalWords }}</div>
          <div class="home-stat-sub">进入当前单词本刷词</div>
        </button>
        <button class="home-stat-card" id="homeReviewCard" @click="openReviewRecords">
          <div class="home-stat-title">Review</div>
          <div class="home-stat-number" id="homeReviewCount">{{ unmasteredCount }}</div>
          <div class="home-stat-sub">查看不认识/错词记录</div>
        </button>
      </div>
      <section class="home-learning-panel">
        <div class="home-learning-head">
          <div class="home-learning-title">📊 学习记录</div>
          <div class="home-learning-note"><span class="home-live-dot"></span>学习时长实时累计</div>
        </div>
        <div class="home-record-grid">
          <div class="home-record-item">
            <div class="home-record-label">今日时长</div>
            <div class="home-record-value" id="homeTodayStudyTime">{{ todayStudyTime }}</div>
            <div class="home-record-sub">打开页面并使用时自动累计</div>
          </div>
          <div class="home-record-item">
            <div class="home-record-label">今日单词</div>
            <div class="home-record-value" id="homeTodayWords">{{ todayWordsCount }}</div>
            <div class="home-record-sub">今日已接触</div>
          </div>
          <div class="home-record-item">
            <div class="home-record-label">累计时长</div>
            <div class="home-record-value" id="homeTotalStudyTime">{{ totalStudyTime }}</div>
            <div class="home-record-sub">本浏览器记录</div>
          </div>
          <div class="home-record-item">
            <div class="home-record-label">累计已刷</div>
            <div class="home-record-value" id="homeTotalWords">{{ totalWordsAll }}</div>
            <div class="home-record-sub">所有单词本</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWordStore, applyBackgroundTheme, saveData, doDailyCheckIn as doCheckInFn, getTodayStudySeconds, getTotalStudySeconds } from '../stores/wordStore'

const store = useWordStore()
const router = useRouter()

const bgThemes = [
  { id: 'flower', label: '🌸 花朵', title: '花朵壁纸主题' },
  { id: 'space', label: '🌌 太空', title: '太空主题' },
  { id: 'station', label: '🚀 空间站', title: '中国空间站主题' },
  { id: 'ocean', label: '🌊 海洋', title: '海洋主题' },
  { id: 'forest', label: '🌲 森林', title: '森林主题' },
  { id: 'calm', label: '✨ 简洁', title: '简洁柔和主题' },
]

const currentBookName = computed(() => {
  const book = store.wordBooks.find(b => b.id === store.currentBookId)
  return book ? book.name : '当前单词本'
})

const totalWords = computed(() => {
  const book = store.wordBooks.find(b => b.id === store.currentBookId)
  return book ? book.words.length : 0
})

const unmasteredCount = computed(() => {
  const book = store.wordBooks.find(b => b.id === store.currentBookId)
  return book ? book.words.filter(w => !w.mastered).length : 0
})

const totalWordsAll = computed(() => {
  return store.wordBooks.reduce((sum, b) => sum + b.words.length, 0)
})

const dateText = computed(() => {
  const d = new Date()
  return (d.getMonth() + 1) + '/' + d.getDate()
})

const checkInTitle = computed(() => {
  if (store.checkInState.lastDate === getTodayDate()) return '✅ 已签到'
  return '签到'
})

const todayStudyTime = ref('0分钟')
const totalStudyTime = ref('0分钟')
const todayWordsCount = ref('0')

let timerId = null

function getTodayDate() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function updateStudyTimes() {
  const secs = getTodayStudySeconds()
  todayStudyTime.value = secs < 60 ? Math.floor(secs) + '秒' : Math.floor(secs / 60) + '分钟'
  const total = getTotalStudySeconds()
  const m = Math.floor(total / 60)
  totalStudyTime.value = m >= 60 ? Math.floor(m / 60) + '小时' + (m % 60) + '分钟' : m + '分钟'
  todayWordsCount.value = String(store.learningRecords.reduce((sum, r) => {
    if (r.timestamp && r.timestamp.startsWith(getTodayDate())) return sum + r.words.length
    return sum
  }, 0))
}

function setBg(id) {
  store.backgroundTheme = id
  applyBackgroundTheme()
  saveData()
}

function doCheckIn() {
  doCheckInFn()
  saveData()
}

function goToStudy() {
  router.push('/study')
}

function openReviewRecords() {
  const modal = document.getElementById('reviewRecordsModal')
  if (modal) modal.classList.add('show')
}

onMounted(() => {
  updateStudyTimes()
  timerId = setInterval(updateStudyTimes, 5000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})
</script>
