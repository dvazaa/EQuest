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
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <!-- Sticky Navbar EQuest -->
    <Navbar />

    <!-- Hero Banner Gaya Simpel & Seamless (Langit Malam Berbintang + Bulan + Awan Menyatu ke Latar) -->
    <section class="relative flex min-h-[370px] w-full items-center overflow-hidden bg-gradient-to-b from-[#0B3568] via-[#134E94] to-[#1E62B0] text-white sm:min-h-[410px]">
      <!-- Latar Belakang Vektor HD (Bintang, Bulan Bersinar, & Awan Berlapis) -->
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full object-cover"
        viewBox="0 0 1440 460"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#E0F2FE" stop-opacity="0.45" />
            <stop offset="55%" stop-color="#93C5FD" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#0B3568" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="moonBody" cx="35%" cy="35%" r="68%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#EFF6FF" />
            <stop offset="100%" stop-color="#DBEAFE" />
          </radialGradient>
        </defs>

        <!-- Bintang-bintang halus di langit -->
        <g fill="#FFFFFF">
          <circle cx="95" cy="65" r="1.4" opacity="0.7" />
          <circle cx="170" cy="115" r="1" opacity="0.5" />
          <circle cx="230" cy="52" r="1.6" opacity="0.8" />
          <circle cx="385" cy="82" r="1.2" opacity="0.6" />
          <circle cx="465" cy="145" r="1" opacity="0.45" />
          <circle cx="540" cy="48" r="1.5" opacity="0.7" />
          <circle cx="635" cy="96" r="1.2" opacity="0.55" />
          <circle cx="725" cy="42" r="1.4" opacity="0.65" />
          <circle cx="810" cy="120" r="1" opacity="0.45" />
          <circle cx="915" cy="68" r="1.6" opacity="0.75" />
          <circle cx="1010" cy="44" r="1.1" opacity="0.5" />
          <circle cx="1085" cy="110" r="1.5" opacity="0.65" />
          <circle cx="1175" cy="62" r="1.2" opacity="0.6" />
          <circle cx="1265" cy="95" r="1.6" opacity="0.75" />
          <circle cx="1350" cy="55" r="1.3" opacity="0.55" />
          <circle cx="1395" cy="140" r="1" opacity="0.5" />
          <circle cx="130" cy="240" r="1.1" opacity="0.4" />
          <circle cx="430" cy="245" r="1.3" opacity="0.5" />
          <circle cx="595" cy="215" r="1" opacity="0.4" />
          <circle cx="965" cy="230" r="1.2" opacity="0.45" />
          <circle cx="1235" cy="220" r="1.4" opacity="0.5" />
        </g>

        <!-- Cahaya & Bulan di sebelah kiri -->
        <circle cx="270" cy="185" r="175" fill="url(#moonHalo)" />
        <circle cx="270" cy="185" r="76" fill="url(#moonBody)" />
        <!-- Kawah bulan halus -->
        <circle cx="244" cy="162" r="12" fill="#BFDBFE" opacity="0.45" />
        <circle cx="294" cy="176" r="16" fill="#BFDBFE" opacity="0.35" />
        <circle cx="262" cy="212" r="9" fill="#BFDBFE" opacity="0.4" />
        <circle cx="288" cy="145" r="6" fill="#BFDBFE" opacity="0.35" />

        <!-- Lapisan Awan Belakang -->
        <g fill="#5B93D3" opacity="0.72">
          <circle cx="60" cy="415" r="65" />
          <circle cx="165" cy="400" r="78" />
          <circle cx="285" cy="418" r="66" />
          <circle cx="410" cy="405" r="75" />
          <circle cx="540" cy="415" r="68" />
          <circle cx="670" cy="400" r="82" />
          <circle cx="805" cy="418" r="70" />
          <circle cx="935" cy="402" r="76" />
          <circle cx="1065" cy="415" r="68" />
          <circle cx="1195" cy="400" r="80" />
          <circle cx="1320" cy="412" r="72" />
          <circle cx="1420" cy="405" r="65" />
        </g>

        <!-- Lapisan Awan Tengah -->
        <g fill="#94C2F2" opacity="0.88">
          <circle cx="25" cy="435" r="55" />
          <circle cx="115" cy="422" r="64" />
          <circle cx="220" cy="434" r="56" />
          <circle cx="340" cy="424" r="65" />
          <circle cx="465" cy="436" r="58" />
          <circle cx="595" cy="422" r="68" />
          <circle cx="730" cy="434" r="60" />
          <circle cx="860" cy="425" r="64" />
          <circle cx="990" cy="435" r="58" />
          <circle cx="1125" cy="420" r="68" />
          <circle cx="1260" cy="434" r="62" />
          <circle cx="1385" cy="424" r="64" />
        </g>

        <!-- Lapisan Awan Depan (Menyatu dengan #D8EDFB di bawahnya) -->
        <g fill="#D8EDFB">
          <circle cx="40" cy="458" r="52" />
          <circle cx="140" cy="446" r="58" />
          <circle cx="255" cy="456" r="50" />
          <circle cx="375" cy="448" r="56" />
          <circle cx="495" cy="458" r="52" />
          <circle cx="625" cy="445" r="60" />
          <circle cx="760" cy="456" r="54" />
          <circle cx="890" cy="448" r="58" />
          <circle cx="1020" cy="456" r="52" />
          <circle cx="1150" cy="446" r="60" />
          <circle cx="1285" cy="455" r="54" />
          <circle cx="1405" cy="448" r="58" />
          <rect x="0" y="444" width="1440" height="20" />
        </g>
      </svg>

      <!-- Konten Hero Sederhana di Tengah-Kanan seperti Referensi -->
      <div class="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-14 pt-8">
        <div class="mx-auto max-w-xl text-center lg:ml-[38%] lg:text-left">
          <p class="text-sm font-normal text-sky-200">
            Halo, {{ currentUser?.name || 'Selamat Datang' }}
          </p>
          <h1 class="mt-2 text-2xl font-normal leading-snug tracking-normal text-white sm:text-4xl">
            Belajar &amp; Pahami Tugas Lebih Mudah dengan EQuest
          </h1>
          <p class="mt-3 text-sm font-normal leading-relaxed text-sky-100/85">
            Unggah soalmu, pahami langkah penyelesaiannya dengan bahasa sederhana, dan kumpulkan XP setiap hari.
          </p>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <RouterLink
              to="/upload"
              class="inline-flex items-center justify-center rounded-xl bg-white px-7 py-2.5 text-sm font-medium text-[#134E94] shadow-sm transition hover:bg-sky-50"
            >
              Mulai Belajar
            </RouterLink>
            <RouterLink
              to="/tasks"
              class="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Lihat Tugas Saya
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <main class="mx-auto max-w-[1200px] px-6 pb-14 pt-3 space-y-6">
      <!-- Notifikasi / Pengingat Streak Harian (Tema Biru & Bisa Di-Close) -->
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

      <!-- Bar Ringkasan Terpadu (Simple, Bersih, Tanpa Kartu Berlebihan) -->
      <section class="rounded-2xl border border-[#C5E4FA] bg-white px-6 py-4 shadow-2xs">
        <div class="grid grid-cols-2 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-y-0 sm:divide-x lg:grid-cols-5">
          <RouterLink to="/progress" class="py-2 sm:px-4 first:pl-0 transition hover:opacity-80">
            <p class="text-xs text-slate-500">Total XP</p>
            <p class="mt-0.5 text-xl font-semibold text-[#0A2540]">{{ userStats?.xp ?? 0 }} XP</p>
          </RouterLink>

          <RouterLink to="/blind-box" class="py-2 sm:px-4 transition hover:opacity-80">
            <p class="text-xs text-slate-500">Tiket Blind Box</p>
            <p class="mt-0.5 text-xl font-semibold text-[#0A2540]">{{ userStats?.tickets ?? 0 }} Tiket</p>
          </RouterLink>

          <RouterLink to="/progress" class="py-2 sm:px-4 transition hover:opacity-80">
            <p class="text-xs text-slate-500">Hari Streak</p>
            <p class="mt-0.5 text-xl font-semibold text-[#2D6BE4]">{{ userStats?.streak ?? 0 }} Hari</p>
          </RouterLink>

          <RouterLink to="/riwayat" class="py-2 sm:px-4 transition hover:opacity-80">
            <p class="text-xs text-slate-500">Soal Selesai</p>
            <p class="mt-0.5 text-xl font-semibold text-[#0A2540]">{{ userStats?.soalSelesai ?? 0 }} Soal</p>
          </RouterLink>

          <button
            type="button"
            @click="scrollToLeaderboard"
            class="col-span-2 py-2 text-left sm:col-span-1 sm:px-4 transition hover:opacity-80 cursor-pointer"
          >
            <p class="text-xs text-slate-500">Peringkat Kamu</p>
            <p class="mt-0.5 text-xl font-semibold text-[#2D6BE4]">
              #{{ currentUserRank }} <span class="text-xs font-normal text-slate-500">({{ currentUserTier.label }})</span>
            </p>
          </button>
        </div>
      </section>

      <!-- Bagian Terpadu: Lanjutkan Belajar & Akses Fitur -->
      <section class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs space-y-6">
        <!-- Aktivitas Terakhir -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p class="text-xs font-medium text-[#2D6BE4]">
              {{ currentTask ? 'Lanjutkan Belajar' : 'Mulai Latihan Pertama' }}
            </p>
            <h2 class="mt-0.5 text-base font-semibold text-[#0A2540] sm:text-lg">
              {{ currentTask?.name || 'Belum ada tugas yang diunggah' }}
            </h2>
            <p v-if="currentTask" class="mt-0.5 text-xs text-slate-500">
              Status: {{ currentTask.status }} &bull; {{ currentTask.questionCount || 10 }} soal
            </p>
          </div>

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
            class="rounded-xl bg-[#2D6BE4] px-5 py-2.5 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
          >
            {{ currentTask.status === 'Selesai' ? 'Lihat Hasil' : 'Lanjutkan' }}
          </RouterLink>
          <RouterLink
            v-else
            to="/upload"
            class="rounded-xl bg-[#2D6BE4] px-5 py-2.5 text-xs font-medium text-white shadow-2xs transition hover:bg-blue-700 sm:text-sm"
          >
            Upload Soal Sekarang
          </RouterLink>
        </div>

        <!-- 4 Menu Utama Bersih dalam Satu Area -->
        <div class="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <RouterLink
            to="/upload"
            class="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FBFF] p-3.5 transition hover:border-[#2D6BE4] hover:bg-[#EAF5FD]/60"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-[#2D6BE4]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-[#0A2540]">Upload Soal</p>
              <p class="text-xs text-slate-500">File atau teks</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/tasks"
            class="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FBFF] p-3.5 transition hover:border-[#2D6BE4] hover:bg-[#EAF5FD]/60"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-[#2D6BE4]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="3" />
                <path d="M9 10l2 2 4-4" />
                <line x1="9" y1="16" x2="15" y2="16" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-[#0A2540]">List Tugas</p>
              <p class="text-xs text-slate-500">{{ tasks.length }} tugas</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/blind-box"
            class="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FBFF] p-3.5 transition hover:border-[#2D6BE4] hover:bg-[#EAF5FD]/60"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-[#2D6BE4]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-[#0A2540]">Blind Box</p>
              <p class="text-xs text-slate-500">{{ userStats?.tickets ?? 0 }} tiket</p>
            </div>
          </RouterLink>

          <RouterLink
            to="/progress"
            class="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F8FBFF] p-3.5 transition hover:border-[#2D6BE4] hover:bg-[#EAF5FD]/60"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-[#2D6BE4]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-[#0A2540]">Progress</p>
              <p class="text-xs text-slate-500">{{ currentUserTier.label }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- Papan Peringkat Pengguna (Tema Biru Bersih) -->
      <section id="peringkat" class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-base font-semibold text-[#0A2540] sm:text-lg">
              Peringkat Pengguna
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Urutan berdasarkan Total XP, soal yang diselesaikan benar, dan streak harian.
            </p>
          </div>
          <span class="rounded-full bg-[#EAF5FD] px-3.5 py-1 text-xs font-medium text-[#2D6BE4]">
            Peringkatmu: #{{ currentUserRank }} dari {{ leaderboard.length }}
          </span>
        </div>

        <div class="mt-4 divide-y divide-slate-100">
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
      </section>
    </main>
  </div>
</template>
