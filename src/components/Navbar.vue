<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getCurrentUser,
  getUserStats,
  getLeaderboard,
  logoutUser,
} from '../utils/equestState'

const router = useRouter()
const route = useRoute()

const currentUser = ref(null)
const userStats = ref(null)
const userRank = ref('-')

function loadUserState() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
    const board = getLeaderboard(currentUser.value.email)
    const found = board.find((u) => u.isCurrentUser)
    userRank.value = found ? found.rank : '-'
  } else {
    userStats.value = null
    userRank.value = '-'
  }
}

onMounted(() => {
  loadUserState()
  window.addEventListener('equest-stats-updated', loadUserState)
})

onUnmounted(() => {
  window.removeEventListener('equest-stats-updated', loadUserState)
})

watch(
  () => route.fullPath,
  () => {
    loadUserState()
  }
)

const navLinks = [
  { name: 'Beranda', to: '/' },
  { name: 'Tugas saya', to: '/tasks' },
  { name: 'Upload Soal', to: '/upload' },
  { name: 'Blind Box', to: '/blind-box' },
  { name: 'Progress', to: '/progress' },
  { name: 'Riwayat', to: '/riwayat' },
  { name: 'Premium', to: '/premium', isPremium: true },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  if (path === '/upload') {
    return (
      route.path.startsWith('/upload') ||
      route.path.startsWith('/answer-upload') ||
      route.path.startsWith('/answer') ||
      route.path.startsWith('/explanation') ||
      route.path.startsWith('/score')
    )
  }
  return route.path.startsWith(path)
}

function handleLogout() {
  logoutUser()
  currentUser.value = null
  userStats.value = null
  userRank.value = '-'
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-[#C5E4FA]/80 bg-[#D8EDFB]/92 px-6 py-3.5 backdrop-blur-md shadow-2xs transition-all sm:px-8">
    <nav class="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
      <!-- Brand Wordmark Tanpa Ikon Tambahan -->
      <RouterLink to="/" class="shrink-0 text-xl font-semibold tracking-tight text-[#0A2540] sm:text-2xl">
        EQuest
      </RouterLink>

      <!-- Nav Links + Tombol Premium Ungu -->
      <div class="hidden items-center gap-x-5 md:flex lg:gap-x-7">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="whitespace-nowrap text-sm font-medium transition-colors"
          :class="
            link.isPremium
              ? isActive(link.to)
                ? 'rounded-full bg-purple-600 px-3.5 py-1 text-xs font-medium text-white shadow-2xs'
                : 'rounded-full bg-purple-100 px-3.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200'
              : isActive(link.to)
                ? 'text-[#2D6BE4] font-semibold'
                : 'text-slate-600 hover:text-[#0f2852]'
          "
        >
          {{ link.isPremium && userStats?.isPremium ? 'Premium ★' : link.name }}
        </RouterLink>
      </div>

      <!-- Streak Pill (Biru), Peringkat Badge, & User Profile / Logout -->
      <div class="flex shrink-0 items-center gap-2 sm:gap-2.5">
        <div v-if="currentUser" class="flex items-center gap-2">
          <RouterLink
            to="/progress"
            title="Streak Belajar Harian"
            class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-[#EAF5FD] px-2.5 py-1 text-xs font-medium text-[#2D6BE4] transition hover:bg-blue-100"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.7 2.4c.2 2.4 1.8 4.1 3.3 5.7 1.3 1.4 2.5 2.8 2.5 5.1a6.5 6.5 0 1 1-13 0c0-1.9.8-3.6 2-5-.1 1.6.8 2.6 1.7 3 .2-2.9 1.6-5.7 3.5-8.8Z" />
            </svg>
            <span>{{ userStats?.streak ?? 0 }} hari</span>
          </RouterLink>
          <RouterLink
            to="/progress#peringkat"
            title="Peringkat Kamu"
            class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-[#2D6BE4] transition hover:bg-blue-50"
          >
            <span>#{{ userRank }}</span>
          </RouterLink>
          <span class="hidden max-w-[140px] truncate text-xs font-medium text-slate-700 lg:inline">
            {{ currentUser.name }}
          </span>
          <button
            type="button"
            @click="handleLogout"
            title="Keluar"
            class="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white cursor-pointer"
          >
            Keluar
          </button>
        </div>
        <RouterLink
          v-else
          to="/login"
          class="rounded-xl bg-[#2D6BE4] px-4 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-blue-700"
        >
          Masuk
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
