<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentUser, logoutUser } from '../utils/equestState'

const router = useRouter()
const route = useRoute()

const currentUser = ref(null)

function loadUserState() {
  currentUser.value = getCurrentUser()
}

onMounted(() => {
  loadUserState()
})

const navLinks = [
  { name: 'Beranda', to: '/' },
  { name: 'Tugas saya', to: '/tasks' },
  { name: 'Upload Soal', to: '/upload' },
  { name: 'Blind Box', to: '/blind-box' },
  { name: 'Progress', to: '/progress' },
  { name: 'Riwayat', to: '/riwayat' },
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
  router.push('/login')
}
</script>

<template>
  <header class="w-full bg-[#D8EDFB] px-8 py-5">
    <nav class="mx-auto flex max-w-[1360px] items-center justify-between">
      <!-- Logo EQuest sesuai Figma (Isometric Book Icon + EQuest) -->
      <RouterLink to="/" class="flex items-center gap-3">
        <svg
          class="h-9 w-9 text-black"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19 2H6c-1.2 0-2.4.6-3 1.6V20c.6-1 1.8-1.6 3-1.6h13c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1zm-1 14.5H6c-.8 0-1.5.3-2 .8V4.7c.5-.4 1.2-.7 2-.7h12v12.5z" />
          <path d="M4 20.4c.6-.3 1.3-.4 2-.4h13v2H6c-1.1 0-2-.9-2-1.6z" />
        </svg>
        <span class="text-2xl font-black tracking-tight text-black sm:text-3xl">EQuest</span>
      </RouterLink>

      <!-- Nav Links sesuai Figma -->
      <div class="hidden items-center gap-x-8 md:flex lg:gap-x-12">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-base font-bold transition-colors"
          :class="
            isActive(link.to)
              ? 'text-[#2D6BE4] font-extrabold'
              : 'text-[#64748B] hover:text-[#0f2852]'
          "
        >
          {{ link.name }}
        </RouterLink>
      </div>

      <!-- User Profile / Logout -->
      <div class="flex items-center gap-3">
        <div v-if="currentUser" class="flex items-center gap-2">
          <span class="hidden text-xs font-bold text-slate-600 sm:inline">
            {{ currentUser.name }}
          </span>
          <button
            type="button"
            @click="handleLogout"
            title="Keluar"
            class="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white"
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
