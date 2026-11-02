<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  getUserTasks,
} from '../utils/equestState'

const router = useRouter()
const currentUser = ref(null)
const userStats = ref(null)
const userTasks = ref([])

function loadData() {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.email) {
    router.push('/login')
    return
  }
  userStats.value = getUserStats(currentUser.value.email)
  userTasks.value = getUserTasks(currentUser.value.email)
}

onMounted(() => {
  loadData()
})

// XP & Level calculations
const totalXp = computed(() => userStats.value?.xp || 0)
const userLevel = computed(() => Math.floor(totalXp.value / 100) + 1)
const currentLevelXp = computed(() => totalXp.value % 100)
const nextLevelXp = 100
const progressPercent = computed(() => Math.min(100, Math.round((currentLevelXp.value / nextLevelXp) * 100)))

// Streak & Activity
const streakDays = computed(() => userStats.value?.streak || 0)
const weekDays = [
  { day: 'Sen', active: true },
  { day: 'Sel', active: true },
  { day: 'Rab', active: true },
  { day: 'Kam', active: false },
  { day: 'Jum', active: false },
  { day: 'Sab', active: false },
  { day: 'Min', active: false },
]

// Task Stats
const totalTasks = computed(() => userTasks.value.length)
const completedTasks = computed(
  () => userTasks.value.filter((t) => t.status === 'Selesai').length
)
const inProgressTasks = computed(
  () => userTasks.value.filter((t) => t.status !== 'Selesai').length
)
const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

// Badges
const badges = computed(() => userStats.value?.badges || [])
const unlockedBadgesCount = computed(
  () => badges.value.filter((b) => b.unlocked).length
)
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <Navbar />

    <main class="mx-auto max-w-7xl px-6 py-8">
      <!-- Header -->
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold sm:text-4xl flex items-center gap-3">
            <span>📊</span>
            <span>Progress Belajar & Prestasi</span>
          </h1>
          <p class="mt-2 text-lg text-blue-900/70 sm:text-xl">
            Pantau pertumbuhan kemampuanmu, pencapaian badge, dan streak harian
          </p>
        </div>

        <!-- Level Pill -->
        <div class="flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-white px-6 py-3 shadow-md">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-2xl font-black text-amber-950">
            L{{ userLevel }}
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-amber-700">Tingkat Kemampuan</p>
            <p class="text-xl font-black text-amber-950">Siswa Level {{ userLevel }}</p>
          </div>
        </div>
      </section>

      <!-- Level & XP Hero Bar -->
      <section class="mt-8 rounded-3xl border-2 border-blue-300 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-lg">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              Level Progression
            </span>
            <h2 class="mt-3 text-2xl font-black sm:text-3xl">
              Level {{ userLevel }} → Level {{ userLevel + 1 }}
            </h2>
            <p class="mt-1 text-sm text-blue-100">
              Butuh {{ nextLevelXp - currentLevelXp }} XP lagi untuk naik ke Level berikutnya.
            </p>
          </div>

          <div class="text-right">
            <p class="text-xs font-bold text-blue-200 uppercase">Total XP Akumulasi</p>
            <p class="text-3xl sm:text-4xl font-black text-amber-300">⭐ {{ totalXp }} XP</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-6">
          <div class="flex justify-between text-xs font-bold text-blue-100 mb-2">
            <span>{{ currentLevelXp }} XP</span>
            <span>{{ progressPercent }}% Menuju Level {{ userLevel + 1 }}</span>
            <span>{{ nextLevelXp }} XP</span>
          </div>
          <div class="h-4 w-full overflow-hidden rounded-full bg-blue-950/40 p-0.5 border border-white/20">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 transition-all duration-500 shadow-sm"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
      </section>

      <!-- Key Analytics Metrics (4 Cards) -->
      <section class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between text-blue-900/60">
            <span class="text-xs font-bold uppercase">Streak Aktif</span>
            <span class="text-2xl">🔥</span>
          </div>
          <p class="mt-2 text-3xl font-black text-blue-950">{{ streakDays }} Hari</p>
          <p class="mt-1 text-xs text-green-600 font-semibold">Aktif berturut-turut!</p>
        </div>

        <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between text-blue-900/60">
            <span class="text-xs font-bold uppercase">Total Tugas</span>
            <span class="text-2xl">📚</span>
          </div>
          <p class="mt-2 text-3xl font-black text-blue-950">{{ totalTasks }}</p>
          <p class="mt-1 text-xs text-blue-600 font-semibold">{{ completedTasks }} Selesai dikerjakan</p>
        </div>

        <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between text-blue-900/60">
            <span class="text-xs font-bold uppercase">Tingkat Kelulusan</span>
            <span class="text-2xl">🎯</span>
          </div>
          <p class="mt-2 text-3xl font-black text-blue-950">{{ completionRate }}%</p>
          <p class="mt-1 text-xs text-blue-900/70">Penyelesaian soal</p>
        </div>

        <div class="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
          <div class="flex items-center justify-between text-blue-900/60">
            <span class="text-xs font-bold uppercase">Badge Terkumpul</span>
            <span class="text-2xl">🎖️</span>
          </div>
          <p class="mt-2 text-3xl font-black text-blue-950">{{ unlockedBadgesCount }}/{{ badges.length }}</p>
          <p class="mt-1 text-xs text-purple-600 font-semibold">Koleksi prestasi</p>
        </div>
      </section>

      <!-- Streak Calendar & Study Habits -->
      <section class="mt-8 grid gap-8 lg:grid-cols-3">
        <!-- Streak Tracker (Col 1) -->
        <div class="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-extrabold text-blue-950 flex items-center gap-2">
            <span>🔥</span>
            <span>Jadwal Belajar Mingguan</span>
          </h3>
          <p class="mt-1 text-xs text-blue-900/70">
            Jaga streak agar tidak putus dengan belajar atau review soal setiap hari!
          </p>

          <div class="mt-6 flex items-center justify-between gap-2">
            <div
              v-for="(day, idx) in weekDays"
              :key="day.day"
              class="flex flex-col items-center gap-2"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black shadow-xs transition"
                :class="
                  day.active
                    ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-100'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                "
              >
                {{ day.active ? '🔥' : '⚪' }}
              </div>
              <span class="text-xs font-bold text-blue-900/70">{{ day.day }}</span>
            </div>
          </div>

          <div class="mt-6 rounded-2xl bg-amber-50 p-4 border border-amber-200">
            <p class="text-xs font-bold text-amber-900">
              💡 Tips Streak:
            </p>
            <p class="mt-1 text-xs text-amber-800 leading-relaxed">
              Kamu bisa mendapatkan "Shield Streak Beku" dari Blind Box untuk melindungi harimu saat libur.
            </p>
          </div>
        </div>

        <!-- Badges & Achievements (Col 2 & 3) -->
        <div class="lg:col-span-2 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 class="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                <span>🏅</span>
                <span>Pencapaian & Badge Penghargaan</span>
              </h3>
              <p class="text-xs text-blue-900/70">
                Selesaikan tantangan untuk membuka lencana keahlianmu
              </p>
            </div>
            <span class="rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              {{ unlockedBadgesCount }} Terbuka
            </span>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div
              v-for="badge in badges"
              :key="badge.id"
              class="flex flex-col justify-between rounded-2xl border p-4 transition"
              :class="
                badge.unlocked
                  ? 'border-amber-300 bg-amber-50/40 shadow-xs hover:border-amber-400'
                  : 'border-gray-200 bg-gray-50/60 opacity-60'
              "
            >
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-3xl" :class="{ 'filter grayscale': !badge.unlocked }">
                    {{ badge.icon }}
                  </span>
                  <span
                    class="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase"
                    :class="
                      badge.unlocked
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-200 text-gray-600'
                    "
                  >
                    {{ badge.unlocked ? 'Terkunci: Tidak' : 'Terkunci' }}
                  </span>
                </div>
                <h4 class="mt-3 text-sm font-extrabold text-blue-950">{{ badge.name }}</h4>
                <p class="mt-1 text-xs text-blue-900/70 leading-relaxed">{{ badge.desc }}</p>
              </div>

              <p class="mt-3 text-[10px] font-semibold text-blue-900/50">
                {{ badge.unlocked ? `Terbuka: ${badge.unlockedAt || 'Baru saja'}` : 'Selesaikan syarat untuk membuka' }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
