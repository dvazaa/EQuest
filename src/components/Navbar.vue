<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentUser, logoutUser, getUserStats } from '../utils/equestState'

const router = useRouter()
const route = useRoute()

const currentUser = ref(null)
const userStats = ref(null)
const mobileMenuOpen = ref(false)

function loadUserState() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  } else {
    userStats.value = null
  }
}

onMounted(() => {
  loadUserState()
})

const isLoggedIn = computed(() => !!currentUser.value)

const navLinks = [
  { name: 'Beranda', to: '/' },
  { name: 'Tugas Saya', to: '/tasks' },
  { name: 'Upload Soal', to: '/upload' },
  { name: 'Blind Box', to: '/blind-box', badge: '🎁' },
  { name: 'Progress', to: '/progress', badge: '📊' },
  { name: 'Riwayat', to: '/riwayat', badge: '🕒' },
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleLogout() {
  logoutUser()
  currentUser.value = null
  userStats.value = null
  mobileMenuOpen.value = false
  router.push('/')
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-blue-200/60 bg-sky-100/90 backdrop-blur-md px-6 py-4 transition-all">
    <nav class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-3 transition hover:opacity-90">
        <span class="text-4xl sm:text-5xl">📚</span>
        <span class="text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-950">EQuest</span>
      </RouterLink>

      <!-- Desktop Navigation Menu -->
      <div class="hidden items-center gap-x-1 lg:flex xl:gap-x-2">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="relative rounded-xl px-3 py-2 text-base font-bold transition-all sm:text-lg"
          :class="
            isActive(link.to)
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-blue-900/70 hover:bg-sky-200/70 hover:text-blue-900'
          "
        >
          <span class="inline-flex items-center gap-1.5">
            <span>{{ link.name }}</span>
            <span v-if="link.badge && !isActive(link.to)" class="text-xs">{{ link.badge }}</span>
          </span>
        </RouterLink>
      </div>

      <!-- User Area / Login (Desktop) -->
      <div class="hidden items-center gap-3 sm:flex">
        <div v-if="isLoggedIn" class="flex items-center gap-3">
          <!-- Mini Stats Pills -->
          <div v-if="userStats" class="flex items-center gap-2">
            <RouterLink
              to="/progress"
              title="Total XP"
              class="flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 transition hover:bg-amber-200"
            >
              <span>⭐</span>
              <span>{{ userStats.xp || 0 }} XP</span>
            </RouterLink>

            <RouterLink
              to="/blind-box"
              title="Tiket Blind Box"
              class="flex items-center gap-1 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 transition hover:bg-purple-200"
            >
              <span>🎟️</span>
              <span>{{ userStats.tickets || 0 }} Tiket</span>
            </RouterLink>
          </div>

          <!-- User Name -->
          <div class="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 shadow-xs border border-blue-200">
            <span class="text-xl">{{ currentUser.avatar || '👤' }}</span>
            <span class="max-w-[120px] truncate text-sm font-bold text-blue-950">
              {{ currentUser.name || currentUser.email?.split('@')[0] }}
            </span>
          </div>

          <!-- Logout Button -->
          <button
            type="button"
            @click="handleLogout"
            class="cursor-pointer rounded-xl border border-red-200 bg-white/80 px-3 py-1.5 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:border-red-300"
          >
            Logout
          </button>
        </div>

        <RouterLink
          v-else
          to="/login"
          class="rounded-xl bg-blue-600 px-6 py-2.5 text-base font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
        >
          Masuk
        </RouterLink>
      </div>

      <!-- Mobile Hamburger Button -->
      <div class="flex items-center gap-2 lg:hidden">
        <button
          type="button"
          @click="toggleMobileMenu"
          class="inline-flex items-center justify-center rounded-xl bg-white p-2 text-blue-900 shadow-sm border border-blue-200"
          aria-label="Toggle menu"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            v-else
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile Dropdown Menu -->
    <div
      v-if="mobileMenuOpen"
      class="mt-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-xl lg:hidden transition-all"
    >
      <div class="flex flex-col space-y-1">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          @click="mobileMenuOpen = false"
          class="rounded-xl px-4 py-2.5 text-base font-bold transition"
          :class="
            isActive(link.to)
              ? 'bg-blue-600 text-white'
              : 'text-blue-900 hover:bg-sky-50'
          "
        >
          <span class="inline-flex items-center gap-2">
            <span>{{ link.badge }}</span>
            <span>{{ link.name }}</span>
          </span>
        </RouterLink>
      </div>

      <div class="mt-4 border-t border-blue-100 pt-3">
        <div v-if="isLoggedIn" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ currentUser.avatar || '👤' }}</span>
              <div>
                <p class="text-sm font-bold text-blue-950">{{ currentUser.name }}</p>
                <p class="text-xs text-blue-900/60">{{ currentUser.email }}</p>
              </div>
            </div>
            <div class="flex gap-1.5">
              <span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                ⭐ {{ userStats?.xp || 0 }}
              </span>
              <span class="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
                🎟️ {{ userStats?.tickets || 0 }}
              </span>
            </div>
          </div>

          <button
            type="button"
            @click="handleLogout"
            class="w-full rounded-xl bg-red-50 py-2.5 text-center text-sm font-bold text-red-600 transition hover:bg-red-100"
          >
            Logout
          </button>
        </div>

        <RouterLink
          v-else
          to="/login"
          @click="mobileMenuOpen = false"
          class="block w-full rounded-xl bg-blue-600 py-3 text-center text-base font-bold text-white transition hover:bg-blue-700"
        >
          Masuk / Buat Akun
        </RouterLink>
      </div>
    </div>
  </header>
</template>
