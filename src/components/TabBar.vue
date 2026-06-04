<template>
  <div class="tab-bar">
    <div
      class="tab-item"
      :class="{ active: activeTab === 'home' }"
      @click="goTo('home')"
    >
      <i>🏠</i><span>首页</span>
    </div>
    <div
      class="tab-item"
      :class="{ active: activeTab === 'study' }"
      @click="goTo('study')"
    >
      <i>📖</i><span>刷词</span>
    </div>
    <div
      class="tab-item"
      :class="{ active: activeTab === 'library' }"
      @click="goTo('library')"
    >
      <i>📚</i><span>词库</span>
    </div>
    <div
      class="tab-item"
      :class="{ active: activeTab === 'listening' }"
      @click="goTo('listening')"
    >
      <i>🎧</i><span>听力</span>
    </div>
    <div
      class="tab-item"
      :class="{ active: activeTab === 'settings' }"
      @click="goTo('settings')"
    >
      <i>⚙️</i><span>设置</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWordStore } from '../stores/wordStore'
import { switchTab } from '../stores/wordStore'

const route = useRoute()
const router = useRouter()
const store = useWordStore()

const activeTab = computed(() => route.name || 'home')

function goTo(page) {
  switchTab(page)
  router.push('/' + page)
}
</script>
