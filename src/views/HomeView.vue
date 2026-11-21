<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  getUserTasks,
  checkAndUpdateDailyStreak,
  simulateNextDayStreak,
  getLeaderboard,
  getRankTier,
} from '../utils/equestState'

const currentUser = ref(null)
const userStats = ref(null)
const tasks = ref([])
const streakReminder = ref(null)
const showStreakBanner = ref(true)
const leaderboard = ref([])

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    streakReminder.value = checkAndUpdateDailyStreak(currentUser.value.email)
    userStats.value = getUserStats(currentUser.value.email)
    tasks.value = getUserTasks(currentUser.value.email)
    leaderboard.value = getLeaderboard(currentUser.value.email)
  } else {
    userStats.value = { xp: 0, tickets: 0, streak: 0, soalSelesai: 0 }
    tasks.value = []
    streakReminder.value = null
    leaderboard.value = getLeaderboard('')
  }
  window.dispatchEvent(new Event('equest-stats-updated'))
}

onMounted(() => {
  loadData()
})

function handleSimulateNextDay() {
  if (!currentUser.value?.email) return
  streakReminder.value = simulateNextDayStreak(currentUser.value.email)
  userStats.value = getUserStats(currentUser.value.email)
  leaderboard.value = getLeaderboard(currentUser.value.email)
  showStreakBanner.value = true
  window.dispatchEvent(new Event('equest-stats-updated'))
}

const currentTask = computed(() => {
  if (!tasks.value.length) return null
  return tasks.value.find((t) => t.status !== 'Selesai') || tasks.value[0]
})

const currentUserRank = computed(() => {
  const found = leaderboard.value.find((u) => u.isCurrentUser)
  return found ? found.rank : '-'
})

const currentUserTier = computed(() => {
  return getRankTier(userStats.value?.xp || 0)
})

const tierProgress = computed(() => {
  const xp = Number(userStats.value?.xp || 0)
  const thresholds = [
    { min: 0, next: 30, nextLabel: 'Pelajar Tekun' },
    { min: 30, next: 100, nextLabel: 'Pejuang Aktif' },
    { min: 100, next: 250, nextLabel: 'Master Scholar' },
    { min: 250, next: 400, nextLabel: 'Grandmaster' },
  ]
  const currentBand = thresholds.find((t) => xp < t.next)
  if (!currentBand) {
    return {
      percent: 100,
      remaining: 0,
      nextLabel: 'Tier Maksimal',
    }
  }
  const span = currentBand.next - currentBand.min
  const gained = xp - currentBand.min
  return {
    percent: Math.min(100, Math.max(8, Math.round((gained / span) * 100))),
    remaining: currentBand.next - xp,
    nextLabel: currentBand.nextLabel,
  }
})

const streakWindowDays = computed(() => {
  const current = Number(userStats.value?.streak || 0)
  const start = current >= 7 ? current - 5 : 1
  return Array.from({ length: 7 }, (_, i) => {
    const dayNum = start + i
    return {
      dayNum,
      completed: dayNum <= current,
      isNextTarget: dayNum === current + 1,
    }
  })
})

function scrollToLeaderboard() {
  const el = document.getElementById('peringkat')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <!-- Sticky Navbar EQuest -->
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-6 pb-14 pt-6 space-y-7">
      <!-- A. PENGINGAT STREAK HARIAN (Deteksi Login Beda Hari + Tracker 7 Hari) -->
      <section
        v-if="currentUser && streakReminder && showStreakBanner"
        class="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 shadow-xs sm:p-6"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl text-white shadow-sm">
              🔥
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-black text-amber-950 sm:text-lg">
                  {{ streakReminder.title }}
                </h2>
                <span
                  v-if="streakReminder.increasedToday"
                  class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800"
                >
                  +1 Hari Hari Ini!
                </span>
              </div>
              <p class="text-xs leading-relaxed text-amber-900/90 sm:text-sm">
                {{ streakReminder.message }}
              </p>

              <!-- 7-Day Visual Streak Pills -->
              <div class="flex flex-wrap items-center gap-2 pt-2">
                <div
                  v-for="item in streakWindowDays"
                  :key="item.dayNum"
                  class="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition"
                  :class="
                    item.completed
                      ? 'border-orange-300 bg-white text-orange-700 shadow-2xs'
                      : item.isNextTarget
                        ? 'border-dashed border-amber-500 bg-amber-100/80 text-amber-900'
                        : 'border-amber-200/70 bg-white/50 text-amber-700/60'
                  "
                >
                  <span v-if="item.completed">🔥</span>
                  <span v-else-if="item.isNextTarget">🎯</span>
                  <span v-else>○</span>
                  <span>Hari {{ item.dayNum }}</span>
                  <span v-if="item.completed" class="text-[10px] text-emerald-600">✓</span>
                  <span v-else-if="item.isNextTarget" class="text-[10px] font-bold text-amber-800">(Besok)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2.5 self-start lg:self-center">
            <button
              type="button"
              @click="handleSimulateNextDay"
              class="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-xs font-extrabold text-amber-900 shadow-2xs transition hover:bg-amber-100 cursor-pointer"
              title="Uji pertambahan streak seperti login di hari berikutnya"
            >
              ⚡ Simulasi Login Besok (+1 Hari)
            </button>
            <button
              type="button"
              @click="showStreakBanner = false"
              aria-label="Tutup pengingat streak"
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/80 text-sm font-bold text-amber-800 transition hover:bg-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      </section>

      <!-- B. HERO BANNER FULL-WIDTH DENGAN LATAR HD DI BELAKANG -->
      <section class="relative min-h-[360px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#163B6E] to-[#2D6BE4] text-white shadow-lg sm:min-h-[400px]">
        <!-- Latar Belakang Ilustrasi Vektor HD -->
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            class="h-full w-full object-cover"
            viewBox="0 0 1440 520"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="heroGlowA" cx="80%" cy="22%" r="55%">
                <stop offset="0%" stop-color="#60A5FA" stop-opacity="0.45" />
                <stop offset="60%" stop-color="#3B82F6" stop-opacity="0.12" />
                <stop offset="100%" stop-color="#0A2540" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="heroGlowB" cx="18%" cy="85%" r="50%">
                <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#0A2540" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="hillBack" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#1E40AF" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.25" />
              </linearGradient>
              <linearGradient id="hillFront" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#0F172A" stop-opacity="0.42" />
                <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.3" />
              </linearGradient>
              <pattern id="softGrid" width="44" height="44" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.3" fill="#FFFFFF" fill-opacity="0.12" />
              </pattern>
            </defs>

            <!-- Base mesh & glowing aurora -->
            <rect width="1440" height="520" fill="url(#softGrid)" />
            <rect width="1440" height="520" fill="url(#heroGlowA)" />
            <rect width="1440" height="520" fill="url(#heroGlowB)" />

            <!-- Scenic waves along the bottom -->
            <path
              d="M0,395 C260,335 470,445 760,385 C1040,325 1230,395 1440,340 L1440,520 L0,520 Z"
              fill="url(#hillBack)"
            />
            <path
              d="M0,445 C310,390 610,485 930,425 C1170,380 1320,430 1440,405 L1440,520 L0,520 Z"
              fill="url(#hillFront)"
            />

            <!-- Orbital rings & crisp decorative clouds/stars -->
            <circle cx="1180" cy="180" r="220" fill="none" stroke="#93C5FD" stroke-opacity="0.15" stroke-width="1.5" stroke-dasharray="8 8" />
            <circle cx="1180" cy="180" r="155" fill="none" stroke="#BAE6FD" stroke-opacity="0.2" stroke-width="1.5" />

            <!-- Abstract floating study card & open book silhouettes on the right background -->
            <g opacity="0.22" transform="translate(1030, 75) rotate(-6)">
              <rect x="0" y="0" width="230" height="145" rx="22" fill="#FFFFFF" fill-opacity="0.18" stroke="#E0F2FE" stroke-width="2" />
              <path d="M40 52 C40 42 52 38 68 38 L108 38 C113 38 115 41 115 46 L115 108 C110 102 98 100 84 100 L48 100 C43 100 40 97 40 92 Z" fill="#FFFFFF" fill-opacity="0.45" />
              <path d="M190 52 C190 42 178 38 162 38 L122 38 C117 38 115 41 115 46 L115 108 C120 102 132 100 146 100 L182 100 C187 100 190 97 190 92 Z" fill="#FFFFFF" fill-opacity="0.3" />
            </g>

            <!-- Graduation cap silhouette -->
            <g opacity="0.24" transform="translate(880, 62) rotate(8)">
              <polygon points="60,12 115,36 60,60 5,36" fill="#E0F2FE" />
              <path d="M24 46 V68 C24 76 40 84 60 84 C80 84 96 76 96 68 V46 L60 62 Z" fill="#BAE6FD" />
            </g>

            <!-- Crisp star sparkles -->
            <path d="M770 95 L775 107 L787 112 L775 117 L770 129 L765 117 L753 112 L765 107 Z" fill="#FDE68A" fill-opacity="0.7" />
            <path d="M1340 92 L1344 101 L1353 105 L1344 109 L1340 118 L1336 109 L1327 105 L1336 101 Z" fill="#FFFFFF" fill-opacity="0.75" />
            <path d="M970 360 L973 368 L981 371 L973 374 L970 382 L967 374 L959 371 L967 368 Z" fill="#BAE6FD" fill-opacity="0.65" />
            <circle cx="820" cy="310" r="5" fill="#93C5FD" fill-opacity="0.45" />
            <circle cx="1310" cy="300" r="7" fill="#FDE68A" fill-opacity="0.4" />
          </svg>
          <!-- Scrim halus agar teks di depan selalu tajam & nyaman dibaca -->
          <div class="absolute inset-0 bg-gradient-to-r from-[#0A2540]/75 via-[#0A2540]/35 to-transparent"></div>
        </div>

        <!-- Konten Utama di Depan Latar HD -->
        <div class="relative z-10 grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.35fr_0.85fr]">
          <!-- Kiri: Sapaan, Judul, & Tombol Aksi -->
          <div class="space-y-5">
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-xs font-extrabold text-white backdrop-blur-xs sm:text-sm">
                Halo, {{ currentUser?.name || 'Pelajar EQuest' }}! 👋
              </span>
              <button
                type="button"
                @click="scrollToLeaderboard"
                class="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-3.5 py-1 text-xs font-extrabold text-amber-100 backdrop-blur-xs transition hover:bg-amber-400/30 cursor-pointer"
              >
                <span>🏆</span>
                <span>Peringkat #{{ currentUserRank }} ({{ currentUserTier.label }})</span>
              </button>
              <span class="inline-flex items-center gap-1 rounded-full border border-orange-300/40 bg-orange-400/20 px-3.5 py-1 text-xs font-extrabold text-orange-100 backdrop-blur-xs">
                🔥 {{ userStats?.streak ?? 0 }} Hari Streak
              </span>
            </div>

            <h1 class="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Belajar Jadi Lebih Seru &amp; Terarah dengan EQuest!
            </h1>

            <p class="max-w-xl text-base leading-relaxed text-sky-100/90 sm:text-lg">
              Unggah soalmu, pahami materinya dengan penjelasan yang mudah dimengerti, periksa jawabanmu untuk meraih XP, dan naikkan peringkatmu setiap hari.
            </p>

            <div class="flex flex-wrap items-center gap-3.5 pt-1">
              <RouterLink
                to="/upload"
                class="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-[#0A2540] shadow-md transition hover:scale-[1.02] hover:bg-sky-50 sm:text-base"
              >
                <span>Mulai Belajar Sekarang</span>
                <span>→</span>
              </RouterLink>
              <RouterLink
                to="/tasks"
                class="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xs transition hover:bg-white/20 sm:text-base"
              >
                <span>Lihat Tugas Saya</span>
              </RouterLink>
            </div>
          </div>

          <!-- Kanan: Kartu Ringkasan Progres & Peringkat (Glassmorphic Card) -->
          <div class="rounded-3xl border border-white/20 bg-white/12 p-6 text-white shadow-xl backdrop-blur-md space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                  Status Belajar Kamu
                </p>
                <p class="mt-0.5 text-lg font-black text-white">
                  {{ currentUserTier.label }}
                </p>
              </div>
              <div class="flex flex-col items-end">
                <span class="rounded-xl bg-amber-400 px-3 py-1 text-xs font-black text-[#0A2540]">
                  Rank #{{ currentUserRank }}
                </span>
              </div>
            </div>

            <!-- Bar Progres XP ke Tier Berikutnya -->
            <div class="space-y-1.5 rounded-2xl bg-white/10 p-4">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-sky-100">Total XP Saat Ini</span>
                <span class="text-white font-black">{{ userStats?.xp ?? 0 }} XP</span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all duration-500"
                  :style="{ width: `${tierProgress.percent}%` }"
                ></div>
              </div>
              <p class="text-[11px] text-sky-100/90">
                <template v-if="tierProgress.remaining > 0">
                  Butuh <strong>{{ tierProgress.remaining }} XP</strong> lagi untuk naik ke tier <strong>{{ tierProgress.nextLabel }}</strong>
                </template>
                <template v-else>
                  Kamu sudah mencapai tier tertinggi! 🎉
                </template>
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="rounded-2xl bg-white/10 p-3">
                <p class="text-[11px] font-bold text-sky-200">Streak Aktif</p>
                <p class="mt-0.5 text-lg font-black text-white">🔥 {{ userStats?.streak ?? 0 }} Hari</p>
              </div>
              <div class="rounded-2xl bg-white/10 p-3">
                <p class="text-[11px] font-bold text-sky-200">Soal Selesai</p>
                <p class="mt-0.5 text-lg font-black text-white">✓ {{ userStats?.soalSelesai ?? 0 }} Soal</p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-2 pt-1 text-xs font-bold">
              <button
                type="button"
                @click="scrollToLeaderboard"
                class="text-amber-200 underline-offset-4 hover:underline cursor-pointer"
              >
                Lihat Papan Peringkat ↓
              </button>
              <RouterLink
                to="/progress"
                class="text-white underline-offset-4 hover:underline"
              >
                Detail Progress →
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <!-- C. 5 KARTU STATISTIK UTAMA -->
      <section class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 sm:gap-5">
        <!-- 1. Total XP -->
        <RouterLink
          to="/progress"
          class="group rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold text-slate-500 sm:text-sm">Total XP</p>
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2D6BE4]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
          </div>
          <p class="mt-3 text-3xl font-black text-[#0A2540]">
            {{ userStats?.xp ?? 0 }} <span class="text-sm font-extrabold text-slate-400">XP</span>
          </p>
        </RouterLink>

        <!-- 2. Tiket Blind Box -->
        <RouterLink
          to="/blind-box"
          class="group rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold text-slate-500 sm:text-sm">Tiket Blind Box</p>
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
            </span>
          </div>
          <p class="mt-3 text-3xl font-black text-[#0A2540]">
            {{ userStats?.tickets ?? 0 }} <span class="text-sm font-extrabold text-slate-400">Tiket</span>
          </p>
        </RouterLink>

        <!-- 3. Hari Streak -->
        <RouterLink
          to="/progress"
          class="group rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold text-slate-500 sm:text-sm">Hari Streak</p>
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </span>
          </div>
          <p class="mt-3 text-3xl font-black text-[#0A2540]">
            {{ userStats?.streak ?? 0 }} <span class="text-sm font-extrabold text-slate-400">Hari</span>
          </p>
          <p class="mt-1 text-[11px] font-bold text-orange-600">
            Login beda hari +1
          </p>
        </RouterLink>

        <!-- 4. Soal Selesai -->
        <RouterLink
          to="/riwayat"
          class="group rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold text-slate-500 sm:text-sm">Soal Selesai</p>
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
          </div>
          <p class="mt-3 text-3xl font-black text-[#0A2540]">
            {{ userStats?.soalSelesai ?? 0 }} <span class="text-sm font-extrabold text-slate-400">Soal</span>
          </p>
        </RouterLink>

        <!-- 5. Peringkat Kamu -->
        <button
          type="button"
          @click="scrollToLeaderboard"
          class="col-span-2 group rounded-2xl border border-[#C5E4FA] bg-white p-5 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md sm:col-span-1 cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-bold text-slate-500 sm:text-sm">Peringkat Kamu</p>
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </span>
          </div>
          <p class="mt-3 text-3xl font-black text-[#0A2540]">
            #{{ currentUserRank }}
          </p>
          <span
            class="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold"
            :class="currentUserTier.badgeClass"
          >
            {{ currentUserTier.label }}
          </span>
        </button>
      </section>

      <!-- D. BARIS TENGAH: LANJUTKAN BELAJAR & 4 FITUR UTAMA (IKON VEKTOR BERSIH & MUDAH DIPAHAMI) -->
      <section class="grid gap-6 lg:grid-cols-[1.05fr_2.45fr]">
        <!-- Kolom Lanjutkan Belajar -->
        <div>
          <h2 class="mb-3 text-lg font-extrabold text-[#0A2540]">
            Lanjutkan Belajar
          </h2>

          <div class="flex min-h-[190px] flex-col justify-between rounded-3xl border border-[#C5E4FA] bg-white p-6 shadow-xs">
            <div>
              <span class="rounded-full bg-[#EAF5FD] px-3 py-1 text-xs font-extrabold text-[#2D6BE4]">
                {{ currentTask ? 'Aktivitas Terakhir' : 'Mulai Tugas Baru' }}
              </span>
              <h3 class="mt-3 text-lg font-black text-[#0A2540]">
                {{ currentTask?.name || 'Belum ada tugas yang kamu buat' }}
              </h3>
              <p v-if="currentTask" class="mt-1 text-xs font-semibold text-slate-500">
                Status: {{ currentTask.status }} &bull; {{ currentTask.questionCount || 10 }} soal
              </p>
            </div>

            <div class="mt-5 flex justify-end">
              <RouterLink
                v-if="currentTask"
                :to="
                  currentTask.status === 'Selesai'
                    ? {
                        path: '/answer',
                        query: {
                          id: currentTask.id,
                          mode: currentTask.directStudy && !currentTask.hasSubmittedAnswer ? 'study' : 'score',
                        },
                      }
                    : { path: '/answer-upload', query: { taskId: currentTask.id } }
                "
                class="rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
              >
                {{ currentTask.status === 'Selesai' ? 'Lihat Hasil' : 'Lanjutkan' }}
              </RouterLink>
              <RouterLink
                v-else
                to="/upload"
                class="rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
              >
                Upload Soal Sekarang →
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Kolom 4 Fitur Utama (Ikon UI Bersih Non-AI, Jelas & Ramah Pengguna Awam) -->
        <div>
          <h2 class="mb-3 text-lg font-extrabold text-[#0A2540]">
            Fitur Utama
          </h2>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <!-- 1. Upload Soal -->
            <RouterLink
              to="/upload"
              class="group flex flex-col items-center justify-between rounded-3xl border border-[#C5E4FA] bg-white p-5 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5FD] text-[#2D6BE4] transition-transform group-hover:scale-105">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div class="mt-3">
                <p class="text-sm font-black text-[#0A2540]">Upload Soal</p>
                <p class="mt-0.5 text-xs text-slate-500">Kirim foto, PDF, atau teks</p>
              </div>
              <span class="mt-3 rounded-full bg-blue-50 px-3 py-0.5 text-[10px] font-extrabold text-[#2D6BE4]">
                Cepat &amp; Mudah
              </span>
            </RouterLink>

            <!-- 2. List Tugas -->
            <RouterLink
              to="/tasks"
              class="group flex flex-col items-center justify-between rounded-3xl border border-[#C5E4FA] bg-white p-5 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="3" />
                  <path d="M9 10l2 2 4-4" />
                  <line x1="9" y1="16" x2="15" y2="16" />
                </svg>
              </div>
              <div class="mt-3">
                <p class="text-sm font-black text-[#0A2540]">List Tugas</p>
                <p class="mt-0.5 text-xs text-slate-500">Kelola &amp; lanjutkan soal</p>
              </div>
              <span class="mt-3 rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-extrabold text-emerald-700">
                {{ tasks.length }} tugas
              </span>
            </RouterLink>

            <!-- 3. Blind Box -->
            <RouterLink
              to="/blind-box"
              class="group flex flex-col items-center justify-between rounded-3xl border border-[#C5E4FA] bg-white p-5 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-105">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M12 8v13" />
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                  <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
                </svg>
              </div>
              <div class="mt-3">
                <p class="text-sm font-black text-[#0A2540]">Blind Box</p>
                <p class="mt-0.5 text-xs text-slate-500">Tukar tiket jadi hadiah</p>
              </div>
              <span class="mt-3 rounded-full bg-purple-50 px-3 py-0.5 text-[10px] font-extrabold text-purple-700">
                {{ userStats?.tickets ?? 0 }} tiket tersedia
              </span>
            </RouterLink>

            <!-- 4. Progress & Peringkat -->
            <RouterLink
              to="/progress"
              class="group flex flex-col items-center justify-between rounded-3xl border border-[#C5E4FA] bg-white p-5 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-[#2D6BE4] hover:shadow-md"
            >
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div class="mt-3">
                <p class="text-sm font-black text-[#0A2540]">Progress</p>
                <p class="mt-0.5 text-xs text-slate-500">Pantau lencana &amp; peringkat</p>
              </div>
              <span class="mt-3 rounded-full bg-amber-50 px-3 py-0.5 text-[10px] font-extrabold text-amber-800">
                {{ currentUserTier.label }}
              </span>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- E. PAPAN PERINGKAT PENGGUNA (LEADERBOARD SETIAP USER) -->
      <section id="peringkat" class="rounded-3xl border border-[#C5E4FA] bg-white p-6 shadow-xs sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 class="text-xl font-black text-[#0A2540] sm:text-2xl">
              🏆 Peringkat Pengguna EQuest
            </h2>
            <p class="mt-1 text-xs text-slate-500 sm:text-sm">
              Urutan peringkat setiap pengguna berdasarkan Total XP, jumlah soal selesai, dan konsistensi streak harian.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="rounded-2xl border border-[#C5E4FA] bg-[#EAF5FD] px-4 py-2 text-xs font-extrabold text-[#0A2540]">
              Peringkatmu: <span class="text-[#2D6BE4]">#{{ currentUserRank }}</span> dari {{ leaderboard.length }} Pengguna
            </div>
          </div>
        </div>

        <div class="mt-5 space-y-2.5">
          <div
            v-for="item in leaderboard"
            :key="item.email"
            class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition sm:px-6"
            :class="
              item.isCurrentUser
                ? 'border-2 border-[#2D6BE4] bg-[#EAF5FD]/70 shadow-2xs'
                : 'border-slate-100 bg-slate-50/60 hover:border-[#C5E4FA] hover:bg-white'
            "
          >
            <!-- Kiri: Nomor Peringkat + Avatar + Nama & Tier -->
            <div class="flex items-center gap-3.5">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                :class="
                  item.rank === 1
                    ? 'bg-amber-100 text-amber-700'
                    : item.rank === 2
                      ? 'bg-slate-200 text-slate-700'
                      : item.rank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-white text-slate-500 border border-slate-200'
                "
              >
                <span v-if="item.rank === 1">🥇</span>
                <span v-else-if="item.rank === 2">🥈</span>
                <span v-else-if="item.rank === 3">🥉</span>
                <span v-else>#{{ item.rank }}</span>
              </div>

              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-2xs"
                :class="item.isCurrentUser ? 'bg-[#2D6BE4]' : 'bg-slate-600'"
              >
                {{ item.name?.charAt(0).toUpperCase() || 'U' }}
              </div>

              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-extrabold text-[#0A2540]">
                    {{ item.name }}
                  </p>
                  <span
                    v-if="item.isCurrentUser"
                    class="rounded-full bg-[#2D6BE4] px-2.5 py-0.5 text-[10px] font-extrabold text-white"
                  >
                    Kamu
                  </span>
                  <span
                    class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold"
                    :class="item.tierClass"
                  >
                    {{ item.tierLabel }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400">
                  {{ item.email }}
                </p>
              </div>
            </div>

            <!-- Kanan: Streak, Soal Selesai, Total XP -->
            <div class="flex flex-wrap items-center gap-3 text-xs font-bold sm:gap-5">
              <span class="rounded-xl bg-orange-50 px-3 py-1.5 text-orange-700">
                🔥 {{ item.streak }} hari
              </span>
              <span class="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700">
                ✓ {{ item.soalSelesai }} soal
              </span>
              <span class="min-w-[82px] rounded-xl bg-white px-3.5 py-1.5 text-right text-sm font-black text-[#2D6BE4] shadow-2xs border border-[#C5E4FA]">
                {{ item.xp }} XP
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
