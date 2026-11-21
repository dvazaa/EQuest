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

function scrollToLeaderboard() {
  const el = document.getElementById('peringkat')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased transition-colors duration-300">
    <!-- Sticky Navbar EQuest -->
    <Navbar />

    <main class="mx-auto max-w-[1280px] px-6 pb-14 pt-6 space-y-6">
      <!-- Notifikasi Streak Harian (Tema Biru & Bisa Di-Close) -->
      <section
        v-if="currentUser && streakReminder && showStreakBanner"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#B8DCFA] bg-white/95 px-4 py-3 shadow-2xs"
      >
        <div class="flex items-start gap-3 sm:items-center">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-[#2D6BE4]">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.7 2.4c.2 2.4 1.8 4.1 3.3 5.7 1.3 1.4 2.5 2.8 2.5 5.1a6.5 6.5 0 1 1-13 0c0-1.9.8-3.6 2-5-.1 1.6.8 2.6 1.7 3 .2-2.9 1.6-5.7 3.5-8.8Z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-[#0A2540] sm:text-sm">
              Streak Harian: {{ userStats?.streak ?? 0 }} Hari
              <span
                v-if="streakReminder.increasedToday"
                class="ml-1.5 rounded-full bg-[#EAF5FD] px-2 py-0.5 text-[11px] font-medium text-[#2D6BE4]"
              >
                +1 hari ini
              </span>
            </p>
            <p class="text-xs text-slate-600">
              {{ streakReminder.message }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleSimulateNextDay"
            class="rounded-xl border border-[#C5E4FA] bg-[#EAF5FD] px-3 py-1.5 text-xs font-medium text-[#2D6BE4] transition hover:bg-blue-100 cursor-pointer"
            title="Simulasikan login di hari berikutnya"
          >
            Simulasi Hari Berikutnya (+1)
          </button>
          <button
            type="button"
            @click="showStreakBanner = false"
            aria-label="Tutup pengingat streak"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      </section>

      <!-- Hero Banner Konsep Awal EQuest (2 Kolom: Ilustrasi Ruang Belajar HD + Sapaan & CTA) -->
      <section class="grid items-center gap-8 rounded-3xl border border-[#C5E4FA] bg-white p-6 shadow-2xs sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
        <!-- Kiri: Kartu Ilustrasi Workspace Belajar HD -->
        <div class="relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D6BE4] via-[#3B82F6] to-[#60A5FA] p-6 text-white sm:min-h-[280px]">
          <!-- Latar Belakang Ilustrasi HD Vector (Buku, Grafik Progres, Gelembung Pembahasan, & Centang) -->
          <svg
            class="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 600 320"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="eqGlow1" cx="82%" cy="22%" r="52%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#2D6BE4" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="eqGlow2" cx="15%" cy="88%" r="48%">
                <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#2D6BE4" stop-opacity="0" />
              </radialGradient>
            </defs>

            <rect width="600" height="320" fill="url(#eqGlow1)" />
            <rect width="600" height="320" fill="url(#eqGlow2)" />

            <!-- Lengkung lembut latar belakang -->
            <path d="M0 245 Q150 205 310 248 T600 225 L600 320 L0 320 Z" fill="#1E40AF" fill-opacity="0.22" />

            <!-- Kartu Mockup Catatan Soal di Tengah-Kanan Background -->
            <g transform="translate(275, 42) rotate(3)">
              <rect x="0" y="0" width="270" height="175" rx="18" fill="#FFFFFF" fill-opacity="0.16" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1.5" />
              <circle cx="32" cy="34" r="12" fill="#FFFFFF" fill-opacity="0.28" />
              <path d="M27 34l3.5 3.5L38 30" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              <rect x="54" y="26" width="120" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.65" />
              <rect x="54" y="40" width="84" height="6" rx="3" fill="#E0F2FE" fill-opacity="0.55" />

              <!-- Garis pembahasan -->
              <rect x="24" y="68" width="218" height="36" rx="10" fill="#FFFFFF" fill-opacity="0.14" />
              <rect x="36" y="79" width="150" height="6" rx="3" fill="#FFFFFF" fill-opacity="0.65" />
              <rect x="36" y="90" width="110" height="5" rx="2.5" fill="#DBEAFE" fill-opacity="0.55" />

              <!-- Bar progress mini -->
              <rect x="24" y="120" width="218" height="8" rx="4" fill="#FFFFFF" fill-opacity="0.2" />
              <rect x="24" y="120" width="158" height="8" rx="4" fill="#93C5FD" />
              <rect x="24" y="142" width="76" height="18" rx="9" fill="#FFFFFF" fill-opacity="0.24" />
              <rect x="110" y="142" width="90" height="18" rx="9" fill="#FFFFFF" fill-opacity="0.16" />
            </g>

            <!-- Ikon Buku Terbuka HD di Kiri -->
            <g transform="translate(52, 85)" opacity="0.28">
              <path d="M12 20C12 12 22 8 36 8H74C79 8 82 11 82 16V102C76 96 64 94 48 94H20C15 94 12 91 12 86V20Z" fill="#FFFFFF" />
              <path d="M152 20C152 12 142 8 128 8H90C85 8 82 11 82 16V102C88 96 100 94 116 94H144C149 94 152 91 152 86V20Z" fill="#DBEAFE" />
            </g>

            <!-- Bintang & aksen bersih -->
            <circle cx="220" cy="48" r="4" fill="#FFFFFF" fill-opacity="0.45" />
            <circle cx="540" cy="245" r="6" fill="#DBEAFE" fill-opacity="0.4" />
            <circle cx="48" cy="44" r="3" fill="#FFFFFF" fill-opacity="0.5" />
          </svg>

          <!-- Konten Ringkas di Atas Ilustrasi Card -->
          <div class="relative z-10 flex items-center justify-between">
            <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
              Pendamping Tugas Interaktif
            </span>
            <span class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
              {{ userStats?.xp ?? 0 }} XP &bull; Rank #{{ currentUserRank }}
            </span>
          </div>

          <div class="relative z-10 mt-10 max-w-xs space-y-1.5">
            <p class="text-sm font-semibold text-white sm:text-base">
              Pahami Konsep, Bukan Sekadar Jawaban
            </p>
            <p class="text-xs leading-relaxed text-sky-100">
              Setiap langkah soal dijelaskan dengan bahasa sederhana agar kamu makin paham sebelum mengumpulkan tugas.
            </p>
          </div>
        </div>

        <!-- Kanan: Sapaan, Judul Utama, & Tombol Mulai Belajar -->
        <div class="flex flex-col justify-center space-y-4">
          <p class="text-sm font-medium text-slate-600 sm:text-base">
            Halo, {{ currentUser?.name || 'Selamat Datang' }}! 👋
          </p>

          <h1 class="text-2xl font-semibold leading-snug tracking-tight text-[#0A2540] sm:text-3xl">
            Belajar Jadi Lebih Seru dengan EQuest
          </h1>

          <p class="text-sm leading-relaxed text-slate-600">
            Unggah soal atau tugasmu, dapatkan penjelasan langkah demi langkah yang mudah dipahami, dan kumpulkan XP, Tiket Blind Box, serta peringkat belajarmu.
          </p>

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <RouterLink
              to="/upload"
              class="inline-flex items-center justify-center rounded-xl bg-[#2D6BE4] px-7 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-blue-700"
            >
              Mulai Belajar
            </RouterLink>
            <RouterLink
              to="/tasks"
              class="inline-flex items-center justify-center rounded-xl border border-[#C5E4FA] bg-[#F8FBFF] px-6 py-2.5 text-sm font-medium text-[#2D6BE4] transition hover:bg-[#EAF5FD]"
            >
              Lihat Tugas Saya
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- 4 Kartu Statistik Sesuai Konsep Awal (Font Konsisten) -->
      <section class="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <RouterLink
          to="/progress"
          class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs transition hover:border-[#2D6BE4]"
        >
          <p class="text-xs font-medium text-slate-500 sm:text-sm">Total XP</p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ userStats?.xp ?? 0 }}
          </p>
        </RouterLink>

        <RouterLink
          to="/blind-box"
          class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs transition hover:border-[#2D6BE4]"
        >
          <p class="text-xs font-medium text-slate-500 sm:text-sm">Tiket Blind Box</p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ userStats?.tickets ?? 0 }}
          </p>
        </RouterLink>

        <RouterLink
          to="/progress"
          class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs transition hover:border-[#2D6BE4]"
        >
          <p class="text-xs font-medium text-slate-500 sm:text-sm">Hari Streak</p>
          <p class="mt-1.5 text-2xl font-semibold text-[#2D6BE4] sm:text-3xl">
            {{ userStats?.streak ?? 0 }} Hari
          </p>
        </RouterLink>

        <RouterLink
          to="/riwayat"
          class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs transition hover:border-[#2D6BE4]"
        >
          <p class="text-xs font-medium text-slate-500 sm:text-sm">Soal Selesai</p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ userStats?.soalSelesai ?? 0 }}
          </p>
        </RouterLink>
      </section>

      <!-- Baris Bawah Konsep Awal: Lanjutkan Belajar (Kiri) & 4 Fitur (Kanan) -->
      <section class="grid gap-6 lg:grid-cols-[1.05fr_2.35fr]">
        <!-- Kolom Lanjutkan Belajar -->
        <div>
          <h2 class="mb-3 text-base font-semibold text-[#0A2540]">
            Lanjutkan Belajar
          </h2>

          <div class="flex min-h-[165px] flex-col justify-between rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs">
            <div>
              <span class="rounded-full bg-[#EAF5FD] px-3 py-1 text-xs font-medium text-[#2D6BE4]">
                {{ currentTask ? 'Aktivitas Terakhir' : 'Mulai Tugas Baru' }}
              </span>
              <h3 class="mt-3 text-base font-semibold text-[#0A2540]">
                {{ currentTask?.name || 'Belum ada tugas yang kamu buat' }}
              </h3>
              <p v-if="currentTask" class="mt-1 text-xs text-slate-500">
                Status: {{ currentTask.status }} &bull; {{ currentTask.questionCount || 10 }} soal
              </p>
            </div>

            <div class="mt-4 flex justify-end">
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
                class="rounded-xl bg-[#2D6BE4] px-5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
              >
                {{ currentTask.status === 'Selesai' ? 'Lihat Hasil' : 'Lanjutkan' }}
              </RouterLink>
              <RouterLink
                v-else
                to="/upload"
                class="rounded-xl bg-[#2D6BE4] px-5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
              >
                Upload Soal Sekarang
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Kolom 4 Fitur Utama -->
        <div>
          <h2 class="mb-3 text-base font-semibold text-[#0A2540]">
            Fitur
          </h2>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <RouterLink
              to="/upload"
              class="flex flex-col items-center justify-center rounded-2xl border border-[#C5E4FA] bg-white p-5 text-center shadow-2xs transition hover:border-[#2D6BE4]"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5FD] text-[#2D6BE4]">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p class="mt-3 text-sm font-semibold text-[#0A2540]">
                Upload Soal
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Dari file atau teks
              </p>
            </RouterLink>

            <RouterLink
              to="/tasks"
              class="flex flex-col items-center justify-center rounded-2xl border border-[#C5E4FA] bg-white p-5 text-center shadow-2xs transition hover:border-[#2D6BE4]"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5FD] text-[#2D6BE4]">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="3" />
                  <path d="M9 10l2 2 4-4" />
                  <line x1="9" y1="16" x2="15" y2="16" />
                </svg>
              </div>
              <p class="mt-3 text-sm font-semibold text-[#0A2540]">
                List Tugas
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Kerjakan soalmu
              </p>
            </RouterLink>

            <RouterLink
              to="/blind-box"
              class="flex flex-col items-center justify-center rounded-2xl border border-[#C5E4FA] bg-white p-5 text-center shadow-2xs transition hover:border-[#2D6BE4]"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5FD] text-[#2D6BE4]">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="8" width="18" height="4" rx="1" />
                  <path d="M12 8v13" />
                  <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                </svg>
              </div>
              <p class="mt-3 text-sm font-semibold text-[#0A2540]">
                Blind Box
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Tukar tiketmu
              </p>
            </RouterLink>

            <RouterLink
              to="/progress"
              class="flex flex-col items-center justify-center rounded-2xl border border-[#C5E4FA] bg-white p-5 text-center shadow-2xs transition hover:border-[#2D6BE4]"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF5FD] text-[#2D6BE4]">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <p class="mt-3 text-sm font-semibold text-[#0A2540]">
                Progress
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Pantau hasilmu
              </p>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Papan Peringkat Akun Pengguna Nyata (#peringkat) -->
      <section id="peringkat" class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-base font-semibold text-[#0A2540] sm:text-lg">
              Peringkat Pengguna
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Urutan peringkat akun pengguna yang terdaftar di EQuest berdasarkan Total XP, soal selesai, dan streak harian.
            </p>
          </div>
          <span class="rounded-full bg-[#EAF5FD] px-3.5 py-1 text-xs font-medium text-[#2D6BE4]">
            Peringkatmu: #{{ currentUserRank }} dari {{ leaderboard.length }}
          </span>
        </div>

        <div v-if="leaderboard.length > 0" class="mt-4 divide-y divide-slate-100">
          <div
            v-for="item in leaderboard"
            :key="item.email"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3.5 py-3 transition"
            :class="item.isCurrentUser ? 'bg-[#EAF5FD]/80' : 'hover:bg-slate-50/70'"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                :class="
                  item.rank <= 3
                    ? 'bg-[#2D6BE4] text-white'
                    : 'bg-slate-100 text-slate-600'
                "
              >
                #{{ item.rank }}
              </span>

              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                :class="item.isCurrentUser ? 'bg-[#2D6BE4]' : 'bg-slate-500'"
              >
                {{ item.name?.charAt(0).toUpperCase() || 'U' }}
              </div>

              <div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <p class="text-sm font-medium text-[#0A2540]">
                    {{ item.name }}
                  </p>
                  <span
                    v-if="item.isCurrentUser"
                    class="rounded-full bg-[#2D6BE4] px-2 py-0.5 text-[10px] font-medium text-white"
                  >
                    Kamu
                  </span>
                  <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                    {{ item.tierLabel }}
                  </span>
                </div>
                <p class="text-[11px] text-slate-400">
                  {{ item.email }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5 text-xs">
              <span class="rounded-lg bg-[#EAF5FD] px-2.5 py-1 font-medium text-[#2D6BE4]">
                {{ item.streak }} hari streak
              </span>
              <span class="rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                {{ item.soalSelesai }} soal
              </span>
              <span class="min-w-[72px] text-right text-sm font-semibold text-[#0A2540]">
                {{ item.xp }} XP
              </span>
            </div>
          </div>
        </div>

        <p v-else class="py-6 text-center text-xs text-slate-500">
          Masuk dengan akunmu untuk melihat posisi peringkat di EQuest.
        </p>
      </section>
    </main>
  </div>
</template>
