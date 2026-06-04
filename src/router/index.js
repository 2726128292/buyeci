import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import StudyPage from '../views/StudyPage.vue'
import LibraryPage from '../views/LibraryPage.vue'
import ListeningPage from '../views/ListeningPage.vue'
import SettingsPage from '../views/SettingsPage.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'home', component: HomePage },
  { path: '/study', name: 'study', component: StudyPage },
  { path: '/library', name: 'library', component: LibraryPage },
  { path: '/listening', name: 'listening', component: ListeningPage },
  { path: '/settings', name: 'settings', component: SettingsPage },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
