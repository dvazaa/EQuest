<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  useTicket,
  addXp,
  addTickets,
  addReward,
  unlockBadge,
} from '../utils/equestState'

const router = useRouter()
const currentUser = ref(null)
const userStats = ref(null)

const isOpening = ref(false)
const revealedReward = ref(null)
const activeTab = ref('all') // 'all', 'badges', 'items'

const PRIZE_POOL = [
  {
    name: 'Bonus XP Jumbo (+150 XP)',
    icon: '⚡',
    type: 'xp',
    amount: 150,
    rarity: 'Epic',
    rarityColor: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Langsung menambah 150 XP ke profil belajarmu!',
  },
  {
    name: 'Bonus XP Kilat (+50 XP)',
    icon: '✨',
    type: 'xp',
    amount: 50,
    rarity: 'Common',
    rarityColor: 'bg-gray-100 text-gray-800 border-gray-300',
    desc: 'Menambah 50 XP ke akunmu.',
  },
  {
    name: 'Tiket Keberuntungan (+2 Tiket)',
    icon: '🎟️',
    type: 'tickets',
    amount: 2,
    rarity: 'Rare',
    rarityColor: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Dapatkan 2 tiket tambahan untuk membuka Blind Box lagi!',
  },
  {
    name: 'Shield Streak Beku',
    icon: '🛡️',
    type: 'item',
    rarity: 'Rare',
    rarityColor: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Melindungi streak harianmu agar tidak putus jika terlewat 1 hari.',
  },
  {
    name: 'Gelar: Pendekar Soal AI',
    icon: '⚔️',
    type: 'title',
    rarity: 'Epic',
    rarityColor: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Gelar kehormatan bagi siswa pembelajar aktif.',
  },
  {
    name: 'Badge Emas: Pemburu Harta',
    icon: '👑',
    type: 'badge',
    badgeId: 'lucky_box',
    rarity: 'Legendary',
    rarityColor: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Hadiah langka! Membuka badge eksklusif di profilmu.',
  },
]

function loadData() {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.email) {
    router.push('/login')
    return
  }
  userStats.value = getUserStats(currentUser.value.email)
}

onMounted(() => {
  loadData()
})

const ticketsCount = computed(() => userStats.value?.tickets || 0)
const rewardsList = computed(() => userStats.value?.rewards || [])

const filteredRewards = computed(() => {
  if (activeTab.value === 'all') return rewardsList.value
  if (activeTab.value === 'badges')
    return rewardsList.value.filter((r) => r.type === 'badge' || r.type === 'title')
  return rewardsList.value.filter((r) => r.type === 'xp' || r.type === 'tickets' || r.type === 'item')
})

function openBox() {
  if (ticketsCount.value <= 0 || isOpening.value) return

  isOpening.value = true
  revealedReward.value = null

  // Deduct ticket
  const success = useTicket(currentUser.value.email)
  if (!success) {
    isOpening.value = false
    return
  }

  // Animation delay
  setTimeout(() => {
    // Pick prize with weighted probability
    const rand = Math.random()
    let prize
    if (rand < 0.1) {
      // 10% Legendary
      prize = PRIZE_POOL[5]
    } else if (rand < 0.35) {
      // 25% Epic
      prize = Math.random() > 0.5 ? PRIZE_POOL[0] : PRIZE_POOL[4]
    } else if (rand < 0.65) {
      // 30% Rare
      prize = Math.random() > 0.5 ? PRIZE_POOL[2] : PRIZE_POOL[3]
    } else {
      // 35% Common
      prize = PRIZE_POOL[1]
    }

    // Apply reward effects
    if (prize.type === 'xp') {
      addXp(currentUser.value.email, prize.amount)
    } else if (prize.type === 'tickets') {
      addTickets(currentUser.value.email, prize.amount)
    } else if (prize.badgeId) {
      unlockBadge(currentUser.value.email, prize.badgeId)
    }

    addReward(currentUser.value.email, prize)

    // Reload stats
    userStats.value = getUserStats(currentUser.value.email)
    revealedReward.value = prize
    isOpening.value = false
  }, 1200)
}

function claimReward() {
  revealedReward.value = null
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <Navbar />

    <main class="mx-auto max-w-7xl px-6 py-8">
      <!-- Header -->
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold sm:text-4xl flex items-center gap-3">
            <span>🎁</span>
            <span>Blind Box Reward</span>
          </h1>
          <p class="mt-2 text-lg text-blue-900/70 sm:text-xl">
            Tukarkan tiket belajarmu untuk membuka kotak misteri dan dapatkan reward seru!
          </p>
        </div>

        <!-- Ticket Counter -->
        <div class="flex items-center gap-3 rounded-2xl border-2 border-purple-300 bg-white px-6 py-3 shadow-md">
          <span class="text-3xl">🎟️</span>
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-purple-700">Tiket Dimiliki</p>
            <p class="text-2xl font-black text-purple-900">{{ ticketsCount }} Tiket</p>
          </div>
        </div>
      </section>

      <!-- Main Unboxing Stage -->
      <section class="mt-8 grid gap-8 lg:grid-cols-5 items-stretch">
        <!-- Interactive Box Arena (Left 3 cols) -->
        <div class="lg:col-span-3 rounded-3xl border-2 border-blue-400 bg-gradient-to-b from-white via-sky-50 to-blue-100 p-8 text-center shadow-lg flex flex-col items-center justify-between min-h-[460px] relative overflow-hidden">
          <div class="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-blue-200/50 blur-2xl"></div>
          <div class="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-purple-200/50 blur-2xl"></div>

          <div>
            <span class="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-white shadow-xs">
              EQuest Mystery Box
            </span>
            <h2 class="mt-4 text-2xl font-extrabold text-blue-950 sm:text-3xl">
              Buka Kotak & Raih Kejutan!
            </h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Setiap kotak berisi XP, Tiket gratis, item perlindungan streak, atau Badge langka.
            </p>
          </div>

          <!-- The Mystery Box Graphic -->
          <div class="my-8 relative">
            <div
              class="relative flex h-48 w-48 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 shadow-2xl transition-all duration-300"
              :class="{
                'animate-bounce scale-105 ring-8 ring-amber-300/60': isOpening,
                'hover:scale-105 hover:rotate-1': !isOpening,
              }"
            >
              <!-- Ribbon -->
              <div class="absolute inset-y-0 w-8 bg-red-500 rounded-sm shadow-xs"></div>
              <div class="absolute inset-x-0 h-8 bg-red-500 rounded-sm shadow-xs"></div>

              <!-- Bow -->
              <div class="absolute -top-4 text-5xl drop-shadow-md">🎀</div>

              <span class="relative z-10 text-6xl drop-shadow-lg">
                {{ isOpening ? '✨' : '🎁' }}
              </span>
            </div>

            <p v-if="isOpening" class="mt-4 text-lg font-extrabold text-blue-700 animate-pulse">
              Membuka kotak misteri...
            </p>
          </div>

          <!-- Action Button -->
          <div class="w-full max-w-sm">
            <button
              type="button"
              :disabled="ticketsCount <= 0 || isOpening"
              @click="openBox"
              class="w-full rounded-2xl py-4 text-lg font-black text-white shadow-xl transition-all duration-200"
              :class="
                ticketsCount > 0 && !isOpening
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/30 hover:scale-[1.02] cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-70'
              "
            >
              <span v-if="isOpening">Sedang Membuka...</span>
              <span v-else-if="ticketsCount > 0">Buka Box Sekarang (1 🎟️)</span>
              <span v-else>Tiket Habis (Yuk Belajar Dulu!)</span>
            </button>

            <p v-if="ticketsCount === 0" class="mt-2 text-xs font-semibold text-red-600">
              Kamu butuh tiket! Selesaikan tugas mandiri untuk dapat tiket baru.
            </p>
          </div>
        </div>

        <!-- How to get tickets & prize list (Right 2 cols) -->
        <div class="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <!-- Cara Dapatkan Tiket -->
          <div class="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-extrabold text-blue-950 flex items-center gap-2">
              <span>🎯</span>
              <span>Cara Mendapatkan Tiket</span>
            </h3>

            <div class="mt-4 space-y-3">
              <div class="flex items-start gap-3 rounded-2xl bg-sky-50 p-3">
                <span class="text-2xl">✍️</span>
                <div class="text-xs">
                  <p class="font-bold text-blue-950">Kerjakan Soal Mandiri</p>
                  <p class="text-blue-900/70">Unggah jawabanmu dan dapatkan skor lulus (+1 🎟️ & +50 XP)</p>
                </div>
              </div>

              <div class="flex items-start gap-3 rounded-2xl bg-sky-50 p-3">
                <span class="text-2xl">🔥</span>
                <div class="text-xs">
                  <p class="font-bold text-blue-950">Jaga Streak 3 Hari</p>
                  <p class="text-blue-900/70">Masuk & belajar setiap hari berturut-turut (+1 🎟️ bonus)</p>
                </div>
              </div>

              <div class="flex items-start gap-3 rounded-2xl bg-sky-50 p-3">
                <span class="text-2xl">📤</span>
                <div class="text-xs">
                  <p class="font-bold text-blue-950">Upload Soal Baru</p>
                  <p class="text-blue-900/70">Bantu AI menganalisis soal pelajaran barumu</p>
                </div>
              </div>
            </div>

            <RouterLink
              to="/upload"
              class="mt-4 block w-full rounded-xl bg-sky-100 py-2.5 text-center text-xs font-bold text-blue-700 transition hover:bg-sky-200"
            >
              Upload Soal Sekarang →
            </RouterLink>
          </div>

          <!-- Kemungkinan Hadiah -->
          <div class="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
            <h3 class="text-lg font-extrabold text-blue-950 flex items-center gap-2">
              <span>✨</span>
              <span>Daftar Hadiah Tersedia</span>
            </h3>

            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div v-for="item in PRIZE_POOL" :key="item.name" class="rounded-xl border border-gray-100 bg-gray-50/70 p-2.5">
                <div class="flex items-center gap-1.5 font-bold text-gray-800">
                  <span>{{ item.icon }}</span>
                  <span class="truncate">{{ item.name }}</span>
                </div>
                <span class="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold" :class="item.rarityColor">
                  {{ item.rarity }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Reward Inventory / Koleksi Hadiah -->
      <section class="mt-10 rounded-3xl border border-blue-200 bg-white p-6 sm:p-8 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 class="text-2xl font-extrabold text-blue-950 flex items-center gap-2">
              <span>🏆</span>
              <span>Koleksi Hadiah Saya</span>
            </h2>
            <p class="text-sm text-blue-900/70">
              Semua hadiah yang berhasil kamu buka dari Blind Box
            </p>
          </div>

          <!-- Tabs -->
          <div class="flex rounded-xl bg-sky-50 p-1 text-xs font-bold text-blue-900/70">
            <button
              type="button"
              @click="activeTab = 'all'"
              class="rounded-lg px-3 py-1.5 transition"
              :class="activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-blue-950'"
            >
              Semua ({{ rewardsList.length }})
            </button>
            <button
              type="button"
              @click="activeTab = 'badges'"
              class="rounded-lg px-3 py-1.5 transition"
              :class="activeTab === 'badges' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-blue-950'"
            >
              Badge & Gelar
            </button>
            <button
              type="button"
              @click="activeTab = 'items'"
              class="rounded-lg px-3 py-1.5 transition"
              :class="activeTab === 'items' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-blue-950'"
            >
              XP & Item
            </button>
          </div>
        </div>

        <!-- Inventory Grid -->
        <div v-if="filteredRewards.length > 0" class="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="reward in filteredRewards"
            :key="reward.id"
            class="flex flex-col justify-between rounded-2xl border border-blue-100 bg-sky-50/50 p-4 transition hover:shadow-md hover:border-blue-300"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-3xl">{{ reward.icon || '🎁' }}</span>
                <span
                  class="rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                  :class="reward.rarityColor || 'bg-blue-100 text-blue-800 border-blue-200'"
                >
                  {{ reward.rarity || 'Hadiah' }}
                </span>
              </div>
              <h4 class="mt-3 font-extrabold text-blue-950 text-sm">{{ reward.name }}</h4>
              <p class="mt-1 text-xs text-blue-900/70">{{ reward.desc || 'Hadiah dari Blind Box EQuest' }}</p>
            </div>

            <p class="mt-4 text-[11px] font-semibold text-blue-900/50">
              Didapatkan: {{ reward.date || 'Hari ini' }}
            </p>
          </div>
        </div>

        <div v-else class="mt-8 rounded-2xl border border-dashed border-gray-200 py-12 text-center">
          <span class="text-4xl">📦</span>
          <p class="mt-2 text-sm font-bold text-gray-700">Belum ada hadiah di kategori ini.</p>
          <p class="text-xs text-gray-500">Buka kotak di atas untuk mengisi koleksimu!</p>
        </div>
      </section>
    </main>

    <!-- Celebration Modal when box opens -->
    <div
      v-if="revealedReward"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all"
    >
      <div
        class="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
        @click.stop
      >
        <span class="text-xs font-black uppercase tracking-widest text-amber-600">
          🎉 SELAMAT! KAMU MENDAPATKAN 🎉
        </span>

        <div class="my-6">
          <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-100 to-yellow-200 text-5xl shadow-lg ring-8 ring-amber-50">
            {{ revealedReward.icon }}
          </div>

          <h3 class="mt-5 text-2xl font-black text-blue-950">
            {{ revealedReward.name }}
          </h3>

          <span
            class="mt-2 inline-block rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider"
            :class="revealedReward.rarityColor"
          >
            Tingkat: {{ revealedReward.rarity }}
          </span>

          <p class="mt-3 text-sm text-gray-600">
            {{ revealedReward.desc }}
          </p>
        </div>

        <button
          type="button"
          @click="claimReward"
          class="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
        >
          Klaim & Simpan ke Koleksi
        </button>
      </div>
    </div>
  </div>
</template>
