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
  { name: '👑 Premium', to: '/premium', isPremium: true },
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
      <!-- Logo EQuest HD (Proporsional & Tidak Terpotong) -->
      <RouterLink to="/" class="flex shrink-0 items-center gap-3 group">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D6BE4] to-[#1E40AF] text-white shadow-sm transition-transform group-hover:scale-105">
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4H11a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H4.5A2.5 2.5 0 0 1 2 16V6.5Z" />
            <path d="M22 6.5A2.5 2.5 0 0 0 19.5 4H13a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5h7A2.5 2.5 0 0 0 22 16V6.5Z" />
            <path d="M18 3l.7 1.3L20 5l-1.3.7L18 7l-.7-1.3L16 5l1.3-.7L18 3Z" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xl font-black tracking-tight text-[#0A2540] sm:text-2xl">EQuest</span>
          <span class="hidden rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-extrabold text-[#2D6BE4] lg:inline-block">
            EduWeb
          </span>
        </div>
      </RouterLink>

      <!-- Nav Links + Tombol Premium -->
      <div class="hidden items-center gap-x-5 md:flex lg:gap-x-8">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="whitespace-nowrap text-sm font-bold transition-colors lg:text-base"
          :class="
            link.isPremium
              ? isActive(link.to)
                ? 'rounded-full bg-amber-400 px-3.5 py-1 text-xs font-black text-[#0A2540] shadow-2xs'
                : 'rounded-full bg-amber-100 px-3.5 py-1 text-xs font-extrabold text-amber-900 hover:bg-amber-200'
              : isActive(link.to)
                ? 'text-[#2D6BE4] font-extrabold'
                : 'text-[#64748B] hover:text-[#0f2852]'
          "
        >
          {{ link.name }}
        </RouterLink>
      </div>

      <!-- Streak Pill, Peringkat Badge, & User Profile / Logout -->
      <div class="flex shrink-0 items-center gap-2.5 sm:gap-3">
        <div v-if="currentUser" class="flex items-center gap-2">
          <RouterLink
            to="/progress"
            title="Streak Belajar Harian"
            class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800 transition hover:bg-amber-100"
          >
            <span>🔥</span>
            <span>{{ userStats?.streak ?? 0 }}</span>
          </RouterLink>
          <RouterLink
            to="/progress#peringkat"
            title="Peringkat Kamu"
            class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-extrabold text-[#2D6BE4] transition hover:bg-blue-50"
          >
            <span>🏆</span>
            <span>#{{ userRank }}</span>
          </RouterLink>
          <span class="hidden max-w-[140px] truncate text-xs font-bold text-slate-700 lg:inline">
            {{ currentUser.name }}
          </span>
          <button
            type="button"
            @click="handleLogout"
            title="Keluar"
            class="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-white cursor-pointer"
          >
            Keluar
          </button>
        </div>
        <RouterLink
          v-else
          to="/login"
          class="rounded-xl bg-[#2D6BE4] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
        >
          Masuk
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
