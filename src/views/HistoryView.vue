<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { getCurrentUser, getUserStats } from '../utils/equestState'

const router = useRouter()
const currentUser = ref(null)
const userStats = ref(null)
const searchQuery = ref('')
const selectedPeriod = ref('30 Hari Terakhir')

const periods = ['7 Hari Terakhir', '30 Hari Terakhir', 'Semua Waktu']

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  }
}

onMounted(() => {
  loadData()
})

const timelineGroups = [
  {
    dateLabel: '12 Okt 2026',
    dayName: 'Senin',
    items: [
      {
        id: 1,
        type: 'task',
        title: 'Menyelesaikan soal_latihan.pdf',
        subtitle: '10 soal | 8 benar | 14.20',
        badgeText: '+40 XP',
        badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
        hasAction: true,
        taskId: 1,
      },
      {
        id: 2,
        type: 'box',
        title: 'Membuka Blind Box',
        subtitle: 'Hadiah: +50 XP | 13.05',
        badgeText: '-1 Tiket',
        badgeClass: 'bg-[#DDF0FD] text-[#2D6BE4]',
        hasAction: false,
      },
    ],
  },
  {
    dateLabel: '10 Okt 2026',
    dayName: 'Sabtu',
    items: [
      {
        id: 3,
        type: 'task',
        title: 'Menyelesaikan Pemrograman_Modul 2.png',
        subtitle: '5 soal | 5 benar | 19.42',
        badgeText: '+25 XP',
        badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
        hasAction: true,
        taskId: 2,
      },
      {
        id: 4,
        type: 'badge',
        title: 'Badge baru: 7 Days Streak',
        subtitle: 'Belajar 7 hari berturut-turut | 19.43',
        badgeText: 'Badge',
        badgeClass: 'bg-[#F0E6FF] text-[#7C3AED]',
        hasAction: false,
      },
    ],
  },
  {
    dateLabel: '1 Okt 2026',
    dayName: 'Kamis',
    items: [
      {
        id: 5,
        type: 'task',
        title: 'Menyelesaikan JaringanKomputer_Kuis.pdf',
        subtitle: '5 soal | 4 benar | 16.30',
        badgeText: '+20 XP',
        badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
        hasAction: true,
        taskId: 5,
      },
    ],
  },
]

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return timelineGroups
  const q = searchQuery.value.toLowerCase()

  return timelineGroups
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

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header dan Filter sesuai Desktop - 9 -->
      <section class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Riwayat Belajar
          </h1>
          <p class="mt-1 text-base text-slate-600 sm:text-lg">
            Lihat kembali soal yang sudah kamu kerjakan
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Search input -->
          <div class="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 shadow-2xs w-64 sm:w-80">
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
              class="appearance-none rounded-2xl bg-white px-5 py-2.5 pr-10 text-sm font-bold text-[#0f2852] shadow-2xs outline-none cursor-pointer"
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

      <!-- 4 Top Cards sesuai Desktop - 9 -->
      <section class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <!-- 1. Aktivitas bulan ini -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Aktivitas bulan ini
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            24
          </p>
        </div>

        <!-- 2. XP didapat -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            XP didapat
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            +135
          </p>
        </div>

        <!-- 3. Soal selesai -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Soal selesai
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            45
          </p>
        </div>

        <!-- 4. Blind Box dibuka -->
        <div class="rounded-2xl bg-white p-6 shadow-xs">
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Blind Box dibuka
          </p>
          <p class="mt-2 text-4xl font-black text-[#0A2540] sm:text-5xl">
            3
          </p>
        </div>
      </section>

      <!-- Timeline Kelompok Tanggal sesuai Desktop - 9 -->
      <section class="mt-8 space-y-6">
        <div
          v-for="group in filteredGroups"
          :key="group.dateLabel"
          class="space-y-3"
        >
          <!-- Tanggal Header -->
          <div class="text-sm font-bold text-slate-600">
            <span class="font-extrabold text-[#0A2540]">{{ group.dateLabel }}</span>
            <span class="ml-2 font-normal text-slate-500">{{ group.dayName }}</span>
          </div>

          <!-- List Item Aktivitas -->
          <div
            v-for="item in group.items"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C5E4FA] bg-white px-6 py-4 shadow-xs transition hover:border-[#2D6BE4]"
          >
            <!-- Ikon & Info Aktivitas -->
            <div class="flex items-center gap-4">
              <!-- Ikon -->
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF5FD] text-xl text-[#2D6BE4]">
                <span v-if="item.type === 'task'">📄</span>
                <span v-else-if="item.type === 'box'">🎁</span>
                <span v-else-if="item.type === 'badge'">🛡️</span>
              </div>

              <div>
                <h3 class="text-base font-extrabold text-[#0A2540]">
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
                class="rounded-full px-4 py-1.5 text-xs font-bold"
                :class="item.badgeClass"
              >
                {{ item.badgeText }}
              </span>

              <button
                v-if="item.hasAction"
                type="button"
                @click="handleViewResult(item.taskId)"
                class="rounded-xl border border-[#C5E4FA] bg-white px-5 py-2 text-xs font-bold text-[#2D6BE4] transition hover:bg-sky-50 cursor-pointer"
              >
                Lihat Hasil
              </button>
            </div>
          </div>
        </div>

        <p
          v-if="filteredGroups.length === 0"
          class="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500"
        >
          Tidak ada riwayat aktivitas yang sesuai pencarian.
        </p>
      </section>
    </main>
  </div>
</template>
