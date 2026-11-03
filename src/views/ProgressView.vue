<script setup>
import { computed, ref, onMounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import { getCurrentUser, getUserStats } from '../utils/equestState'

import badge1 from '../assets/images/badge_1.png'
import badge2 from '../assets/images/badge_2.png'
import badge3 from '../assets/images/badge_3.png'
import badge4 from '../assets/images/badge_4.png'
import badge5 from '../assets/images/badge_5.png'

const badgeImages = {
  first_step: badge1,
  streak_7: badge2,
  problem_solver: badge3,
  curious_mind: badge4,
  master_learner: badge5,
}

const currentUser = ref(null)
const userStats = ref(null)

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  } else {
    userStats.value = { xp: 0, tickets: 0, streak: 0, soalSelesai: 0, badges: [] }
  }
}

onMounted(() => {
  loadData()
})

const badges = computed(() => userStats.value?.badges || [])
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header sesuai Desktop - 8 -->
      <section class="mb-6">
        <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
          Progress Belajar
        </h1>
        <p class="mt-1 text-base text-slate-600 sm:text-lg">
          Lihat perkembangan dan pencapaianmu di EQuest
        </p>
      </section>

      <!-- 4 Top Cards sesuai Desktop - 8 -->
      <section class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <!-- 1. Total XP -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-700 sm:text-base">
            Total XP :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            {{ userStats?.xp ?? 0 }}
          </p>
        </div>

        <!-- 2. Tiket Blind Box -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-700 sm:text-base">
            Tiket Blind Box :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            {{ userStats?.tickets ?? 0 }}
          </p>
        </div>

        <!-- 3. Hari Streak -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-700 sm:text-base">
            Hari Streak :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            {{ userStats?.streak ?? 0 }}
          </p>
        </div>

        <!-- 4. Soal Selesai -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-bold text-slate-700 sm:text-base">
            Soal Selesai :
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            {{ userStats?.soalSelesai ?? 0 }}
          </p>
        </div>
      </section>

      <!-- Achievement / Badge Card sesuai Desktop - 8 -->
      <section class="mt-8 rounded-3xl bg-white p-8 shadow-xs sm:p-10">
        <h2 class="text-lg font-black text-[#0A2540] sm:text-xl">
          Achievement / Badge
        </h2>

        <div class="mt-6 space-y-6">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="flex items-center gap-5 transition hover:translate-x-1"
            :class="badge.unlocked ? 'opacity-100' : 'opacity-60'"
          >
            <!-- Badge Shield Icon dari Figma -->
            <div class="flex h-14 w-14 shrink-0 items-center justify-center">
              <img
                :src="badgeImages[badge.id] || badge1"
                :alt="badge.name"
                class="h-12 w-auto object-contain drop-shadow-xs"
              />
            </div>

            <!-- Detail Badge -->
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-extrabold text-[#0A2540] sm:text-lg">
                  {{ badge.name }}
                </h3>
                <span
                  v-if="badge.unlocked"
                  class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700"
                >
                  ✓ Terbuka
                </span>
                <span
                  v-else
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500"
                >
                  🔒 Terkunci
                </span>
              </div>
              <p class="text-sm text-slate-500">
                {{ badge.desc }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
