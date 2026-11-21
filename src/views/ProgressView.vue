<script setup>
import { computed, ref, onMounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  checkAndUpdateDailyStreak,
  simulateNextDayStreak,
  getLeaderboard,
  getRankTier,
} from '../utils/equestState'

const currentUser = ref(null)
const userStats = ref(null)
const streakReminder = ref(null)
const leaderboard = ref([])

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    streakReminder.value = checkAndUpdateDailyStreak(currentUser.value.email)
    userStats.value = getUserStats(currentUser.value.email)
    leaderboard.value = getLeaderboard(currentUser.value.email)
  } else {
    userStats.value = { xp: 0, tickets: 0, streak: 0, soalSelesai: 0, badges: [] }
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
  window.dispatchEvent(new Event('equest-stats-updated'))
}

const badges = computed(() => userStats.value?.badges || [])

const currentUserRank = computed(() => {
  const found = leaderboard.value.find((u) => u.isCurrentUser)
  return found ? found.rank : '-'
})

const currentUserTier = computed(() => {
  return getRankTier(userStats.value?.xp || 0)
})

const badgePalettes = {
  first_step: { bg: '#EFF6FF', fill: '#2D6BE4', border: '#1D4ED8', accent: '#DBEAFE' },
  streak_7: { bg: '#FFF7ED', fill: '#EA580C', border: '#C2410C', accent: '#FED7AA' },
  problem_solver: { bg: '#ECFDF5', fill: '#059669', border: '#047857', accent: '#A7F3D0' },
  curious_mind: { bg: '#F5F3FF', fill: '#7C3AED', border: '#6D28D9', accent: '#DDD6FE' },
  master_learner: { bg: '#FFFBEB', fill: '#D97706', border: '#B45309', accent: '#FDE68A' },
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-6 pb-14 pt-6 space-y-8 sm:px-8">
      <!-- Header -->
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Progress Belajar &amp; Peringkat
          </h1>
          <p class="mt-1 text-base text-slate-600 sm:text-lg">
            Lihat perkembangan streak harian, lencana pencapaian, dan posisimu di papan peringkat
          </p>
        </div>

        <button
          v-if="currentUser"
          type="button"
          @click="handleSimulateNextDay"
          class="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-900 shadow-2xs transition hover:bg-amber-100 cursor-pointer"
        >
          ⚡ Simulasi Login Besok (+1 Hari Streak)
        </button>
      </section>

      <!-- Pengingat Streak Harian -->
      <section
        v-if="currentUser && streakReminder"
        class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-2xs"
      >
        <div class="flex items-center gap-3.5">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl text-white shadow-2xs">
            🔥
          </span>
          <div>
            <p class="text-sm font-black text-amber-950">
              {{ streakReminder.title }}
            </p>
            <p class="text-xs text-amber-900/90">
              {{ streakReminder.message }}
            </p>
          </div>
        </div>
        <span class="rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-orange-700 border border-orange-200">
          Streak: {{ userStats?.streak ?? 0 }} Hari
        </span>
      </section>

      <!-- 5 Top Cards -->
      <section class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 sm:gap-5">
        <!-- 1. Total XP -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-600">
            Total XP :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540]">
            {{ userStats?.xp ?? 0 }}
          </p>
        </div>

        <!-- 2. Tiket Blind Box -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-600">
            Tiket Blind Box :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540]">
            {{ userStats?.tickets ?? 0 }}
          </p>
        </div>

        <!-- 3. Hari Streak -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-600">
            Hari Streak :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540]">
            {{ userStats?.streak ?? 0 }}
          </p>
          <p class="mt-1 text-[11px] font-bold text-orange-600">
            Bertambah +1 setiap beda hari
          </p>
        </div>

        <!-- 4. Soal Selesai -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-600">
            Soal Selesai :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540]">
            {{ userStats?.soalSelesai ?? 0 }}
          </p>
        </div>

        <!-- 5. Peringkat Kamu -->
        <div class="col-span-2 rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-xs sm:col-span-1">
          <p class="text-sm font-bold text-slate-600">
            Peringkat Kamu :
          </p>
          <p class="mt-2 text-4xl font-black text-[#2D6BE4]">
            #{{ currentUserRank }}
          </p>
          <span
            class="mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold"
            :class="currentUserTier.badgeClass"
          >
            {{ currentUserTier.label }}
          </span>
        </div>
      </section>

      <!-- Achievement / Badge Card dengan Ikon Shield Vektor HD (Tidak Terpotong) -->
      <section class="rounded-3xl border border-[#C5E4FA] bg-white p-8 shadow-xs sm:p-10">
        <h2 class="text-lg font-black text-[#0A2540] sm:text-xl">
          Achievement / Badge
        </h2>
        <p class="mt-1 text-xs text-slate-500">
          Selesaikan latihan soal, jaga streak login harianmu, dan unggah materi untuk membuka semua lencana.
        </p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="flex items-center gap-5 rounded-2xl border p-4 transition hover:translate-x-1"
            :class="
              badge.unlocked
                ? 'border-[#C5E4FA] bg-[#F8FBFF]'
                : 'border-slate-100 bg-slate-50/70 opacity-75'
            "
          >
            <!-- HD Vector Shield Badge (Zero Cropping) -->
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl p-2"
              :style="{
                backgroundColor: badge.unlocked
                  ? (badgePalettes[badge.id]?.bg || '#EFF6FF')
                  : '#F1F5F9',
              }"
            >
              <svg
                class="h-12 w-12"
                viewBox="0 0 48 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <!-- Unlocked Shield -->
                <template v-if="badge.unlocked">
                  <path
                    d="M24 3L41 9.5V23.5C41 34.8 33.6 43.9 24 48C14.4 43.9 7 34.8 7 23.5V9.5L24 3Z"
                    :fill="badgePalettes[badge.id]?.fill || '#2D6BE4'"
                    :stroke="badgePalettes[badge.id]?.border || '#1D4ED8'"
                    stroke-width="2"
                  />
                  <path
                    d="M24 7.5L36.5 12.2V23.2C36.5 32.1 30.9 39.4 24 43C17.1 39.4 11.5 32.1 11.5 23.2V12.2L24 7.5Z"
                    fill="#FFFFFF"
                    fill-opacity="0.18"
                  />
                  <!-- Badge-specific Emblem -->
                  <path
                    v-if="badge.id === 'first_step'"
                    d="M24 14L26.9 19.8L33.2 20.7L28.6 25.2L29.7 31.5L24 28.5L18.3 31.5L19.4 25.2L14.8 20.7L21.1 19.8L24 14Z"
                    fill="#FFFFFF"
                  />
                  <path
                    v-else-if="badge.id === 'streak_7'"
                    d="M24.8 14C24.8 14 29.8 18.6 29.8 24C29.8 27.6 27.2 30.5 24 30.5C20.8 30.5 18.2 27.9 18.2 24.5C18.2 22.1 19.6 20 20.8 18.9C20.8 21.1 22.1 22.1 23 22.1C22.3 19.1 23.4 16 24.8 14Z"
                    fill="#FFFFFF"
                  />
                  <path
                    v-else-if="badge.id === 'problem_solver'"
                    d="M17.5 24.5L22 29L31.5 19"
                    stroke="#FFFFFF"
                    stroke-width="3.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <g v-else-if="badge.id === 'curious_mind'">
                    <path d="M16 18.5C16 17.7 16.7 17 17.5 17H23V30H17.5C16.7 30 16 29.3 16 28.5V18.5Z" fill="#FFFFFF" />
                    <path d="M32 18.5C32 17.7 31.3 17 30.5 17H25V30H30.5C31.3 30 32 29.3 32 28.5V18.5Z" fill="#FFFFFF" fill-opacity="0.85" />
                  </g>
                  <path
                    v-else
                    d="M15.5 28L17.5 18.5L21.5 22L24 16L26.5 22L30.5 18.5L32.5 28H15.5Z"
                    fill="#FFFFFF"
                  />
                </template>

                <!-- Locked Shield -->
                <template v-else>
                  <path
                    d="M24 3L41 9.5V23.5C41 34.8 33.6 43.9 24 48C14.4 43.9 7 34.8 7 23.5V9.5L24 3Z"
                    fill="#E2E8F0"
                    stroke="#94A3B8"
                    stroke-width="2"
                  />
                  <rect x="18" y="22" width="12" height="10" rx="2.5" fill="#64748B" />
                  <path
                    d="M20.5 22V19.5C20.5 17.6 22.1 16 24 16C25.9 16 27.5 17.6 27.5 19.5V22"
                    stroke="#64748B"
                    stroke-width="2.2"
                    stroke-linecap="round"
                  />
                  <circle cx="24" cy="27" r="1.4" fill="#FFFFFF" />
                </template>
              </svg>
            </div>

            <!-- Detail Badge -->
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-base font-extrabold text-[#0A2540] sm:text-lg">
                  {{ badge.name }}
                </h3>
                <span
                  v-if="badge.unlocked"
                  class="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold text-green-700"
                >
                  ✓ Terbuka
                </span>
                <span
                  v-else
                  class="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-600"
                >
                  🔒 Terkunci
                </span>
              </div>
              <p class="mt-0.5 text-sm text-slate-500">
                {{ badge.desc }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Papan Peringkat Pengguna (Leaderboard) -->
      <section id="peringkat" class="rounded-3xl border border-[#C5E4FA] bg-white p-6 shadow-xs sm:p-10">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 class="text-xl font-black text-[#0A2540] sm:text-2xl">
              🏆 Papan Peringkat Pengguna
            </h2>
            <p class="mt-1 text-xs text-slate-500 sm:text-sm">
              Peringkat disusun berdasarkan Total XP, soal yang diselesaikan, dan streak belajar harian.
            </p>
          </div>
          <div class="rounded-2xl border border-[#C5E4FA] bg-[#EAF5FD] px-4 py-2 text-xs font-extrabold text-[#0A2540]">
            Peringkat Kamu: <span class="text-[#2D6BE4]">#{{ currentUserRank }}</span> ({{ currentUserTier.label }})
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
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
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
