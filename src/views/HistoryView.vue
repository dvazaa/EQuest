<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { getCurrentUser, getUserStats, getUserHistory } from '../utils/equestState'

const router = useRouter()
const currentUser = ref(null)
const userStats = ref(null)
const historyGroups = ref([])
const searchQuery = ref('')
const selectedPeriod = ref('30 Hari Terakhir')

const periods = ['7 Hari Terakhir', '30 Hari Terakhir', 'Semua Waktu']

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
    historyGroups.value = getUserHistory(currentUser.value.email)
  } else {
    userStats.value = { activityMonth: 0, xpMonth: 0, soalSelesai: 0, openedBoxes: 0 }
    historyGroups.value = []
  }
}

onMounted(() => {
  loadData()
})

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return historyGroups.value
  const q = searchQuery.value.toLowerCase()

  return historyGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
      ),
    }))
    .filter((group) => group.items.length > 0)
})

function handleViewResult(taskId) {
  router.push({
    path: '/answer',
    query: { id: taskId, mode: 'score' },
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1280px] px-6 pb-12 pt-6 sm:px-8">
      <!-- Header dan Filter -->
      <section class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-[#0A2540]">
            Riwayat Belajar
          </h1>
          <p class="mt-1 text-xs text-slate-600 sm:text-sm">
            Lihat kembali soal yang sudah kamu kerjakan
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Search input -->
          <div class="flex items-center gap-2 rounded-2xl border border-[#C5E4FA] bg-white px-4 py-2.5 shadow-2xs w-64 sm:w-80">
            <svg
              class="h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari aktivitas..."
              class="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <!-- Periode Dropdown -->
          <div class="relative">
            <select
              v-model="selectedPeriod"
              class="appearance-none rounded-2xl border border-[#C5E4FA] bg-white px-5 py-2.5 pr-10 text-xs font-medium text-[#0f2852] shadow-2xs outline-none cursor-pointer sm:text-sm"
            >
              <option v-for="p in periods" :key="p" :value="p">
                {{ p }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              ▼
            </span>
          </div>
        </div>
      </section>

      <!-- 4 Top Cards -->
      <section class="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <!-- 1. Aktivitas bulan ini -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs">
          <p class="text-xs font-medium text-slate-500 sm:text-sm">
            Aktivitas bulan ini
          </p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ userStats?.activityMonth ?? 0 }}
          </p>
        </div>

        <!-- 2. XP didapat -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs">
          <p class="text-xs font-medium text-slate-500 sm:text-sm">
            XP didapat
          </p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ (userStats?.xpMonth ?? 0) > 0 ? '+' + userStats.xpMonth : 0 }}
          </p>
        </div>

        <!-- 3. Soal selesai -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs">
          <p class="text-xs font-medium text-slate-500 sm:text-sm">
            Soal selesai
          </p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ userStats?.soalSelesai ?? 0 }}
          </p>
        </div>

        <!-- 4. Blind Box dibuka -->
        <div class="rounded-2xl border border-[#C5E4FA] bg-white p-5 shadow-2xs">
          <p class="text-xs font-medium text-slate-500 sm:text-sm">
            Blind Box dibuka
          </p>
          <p class="mt-1.5 text-2xl font-semibold text-[#0A2540] sm:text-3xl">
            {{ userStats?.openedBoxes ?? 0 }}
          </p>
        </div>
      </section>

      <!-- Timeline Kelompok Tanggal -->
      <section class="mt-7 space-y-6">
        <div
          v-for="group in filteredGroups"
          :key="group.dateLabel"
          class="space-y-3"
        >
          <!-- Tanggal Header -->
          <div class="text-xs text-slate-600 sm:text-sm">
            <span class="font-semibold text-[#0A2540]">{{ group.dateLabel }}</span>
            <span class="ml-2 font-normal text-slate-500">{{ group.dayName }}</span>
          </div>

          <!-- List Item Aktivitas -->
          <div
            v-for="item in group.items"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C5E4FA] bg-white px-6 py-4 shadow-2xs transition hover:border-[#2D6BE4]"
          >
            <!-- Ikon & Info Aktivitas -->
            <div class="flex items-center gap-4">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-lg text-[#2D6BE4]">
                <span v-if="item.type === 'task'">📄</span>
                <span v-else-if="item.type === 'box'">🎁</span>
                <span v-else-if="item.type === 'badge'">🛡️</span>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-[#0A2540] sm:text-base">
                  {{ item.title }}
                </h3>
                <p class="text-xs text-slate-500">
                  {{ item.subtitle }}
                </p>
              </div>
            </div>

            <!-- Badge XP/Tiket & Tombol Lihat Hasil -->
            <div class="flex items-center gap-4">
              <span
                class="rounded-full px-3.5 py-1 text-xs font-medium"
                :class="item.badgeClass"
              >
                {{ item.badgeText }}
              </span>

              <button
                v-if="item.hasAction"
                type="button"
                @click="handleViewResult(item.taskId)"
                class="rounded-xl border border-[#C5E4FA] bg-white px-4 py-2 text-xs font-medium text-[#2D6BE4] transition hover:bg-sky-50 cursor-pointer"
              >
                Lihat Hasil
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State jika akun baru -->
        <div
          v-if="filteredGroups.length === 0"
          class="rounded-3xl border border-[#C5E4FA] bg-white p-12 text-center shadow-2xs"
        >
          <span class="text-4xl">🕒</span>
          <h3 class="mt-4 text-lg font-semibold text-[#0A2540]">
            Belum ada riwayat aktivitas
          </h3>
          <p class="mt-2 text-xs text-slate-500 sm:text-sm">
            Selesaikan tugas atau buka Mystery Blind Box untuk mencatat riwayat belajarmu di sini.
          </p>
          <div class="mt-6">
            <RouterLink
              to="/upload"
              class="inline-block rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-xs font-medium text-white shadow-2xs hover:bg-blue-700"
            >
              Upload Tugas Pertama →
            </RouterLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
