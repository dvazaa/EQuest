<script setup>
import { ref, computed, onMounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  useTicket,
  addXp,
  addTickets,
  addReward,
} from '../utils/equestState'

const currentUser = ref(null)
const userStats = ref(null)
const isOpening = ref(false)
const showRewardModal = ref(false)
const lastReward = ref(null)
const alertNotice = ref('')

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  }
}

onMounted(() => {
  loadData()
})

const ticketCount = computed(() => userStats.value?.tickets || 0)

const possibleRewards = [
  { type: 'xp', name: '+ 50 XP', xp: 50, icon: '⭐', desc: 'Bonus pengalaman belajar ekstra' },
  { type: 'xp', name: '+ 100 XP', xp: 100, icon: '🌟', desc: 'Hadiah XP besar untuk akselerasi rank' },
  { type: 'ticket', name: '+ 1 Tiket', tickets: 1, icon: '🎟️', desc: 'Tiket gratis untuk membuka Blind Box lagi' },
  { type: 'badge', name: 'Badge', icon: '🎖️', desc: 'Pencapaian eksklusif pemburu misteri' },
  { type: 'theme', name: 'Tema Spesial', icon: '🎨', desc: 'Koleksi tema antarmuka EQuest' },
  { type: 'figure', name: 'Figure Collection', icon: '🤖', desc: 'Miniatur figur 3D robot AI' },
]

function handleOpenBox() {
  alertNotice.value = ''
  const email = currentUser.value?.email
  if (!email) return

  if (ticketCount.value <= 0) {
    alertNotice.value = 'Tiket kamu tidak mencukupi. Selesaikan latihan tugas untuk mengumpulkan tiket!'
    return
  }

  const success = useTicket(email)
  if (!success) return

  isOpening.value = true

  setTimeout(() => {
    // Pick random reward from possible rewards
    const randomIndex = Math.floor(Math.random() * possibleRewards.length)
    const wonReward = possibleRewards[randomIndex]

    if (wonReward.xp) {
      addXp(email, wonReward.xp)
    }
    if (wonReward.tickets) {
      addTickets(email, wonReward.tickets)
    }

    addReward(email, {
      name: wonReward.name,
      icon: wonReward.icon,
      rarity: wonReward.tickets ? 'Rare' : 'Common',
    })

    lastReward.value = wonReward
    isOpening.value = false
    showRewardModal.value = true
    loadData()
  }, 900)
}

function closeModal() {
  showRewardModal.value = false
  lastReward.value = null
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header sesuai Desktop - 7 -->
      <section class="mb-6">
        <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
          Mystery Blind Box
        </h1>
        <p class="mt-1 text-base text-slate-600 sm:text-lg">
          Gunakan tiket kamu untuk membuka blind box dan dapatkan hadiah menarik!
        </p>
      </section>

      <!-- Pesan jika tiket habis -->
      <div
        v-if="alertNotice"
        class="mb-6 rounded-2xl bg-amber-100 border border-amber-300 p-4 text-sm font-bold text-amber-900"
      >
        ⚠️ {{ alertNotice }}
      </div>

      <!-- Main Layout sesuai Desktop - 7 -->
      <div class="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <!-- Bagian Tengah: 3D Blue Gift Box & Tombol Buka -->
        <div class="flex flex-col items-center justify-center rounded-3xl py-12">
          <!-- Gambar Kado 3D -->
          <div
            class="transition-transform duration-500"
            :class="isOpening ? 'scale-110 animate-bounce' : 'hover:scale-105'"
          >
            <img
              src="../assets/images/gift_box.png"
              alt="Mystery Blind Box"
              class="h-[340px] w-auto drop-shadow-xl"
            />
          </div>

          <!-- Tombol Buka Blind Box -->
          <button
            type="button"
            @click="handleOpenBox"
            :disabled="isOpening || ticketCount <= 0"
            class="mt-8 flex flex-col items-center justify-center rounded-2xl bg-[#2D6BE4] px-12 py-3.5 text-center text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <span class="text-base font-extrabold sm:text-lg">
              {{ isOpening ? 'Membuka...' : 'Buka Blind Box' }}
            </span>
            <span class="text-xs font-semibold text-sky-200">
              1 Tiket
            </span>
          </button>
        </div>

        <!-- Kolom Kanan: 2 Kartu Putih sesuai Desktop - 7 -->
        <div class="space-y-6">
          <!-- Kartu 1: Tiket Kamu -->
          <div class="rounded-3xl bg-white p-7 shadow-xs">
            <p class="text-base font-bold text-[#0A2540]">
              Tiket kamu :
            </p>
            <p class="mt-2 text-5xl font-black text-[#0A2540]">
              {{ ticketCount }}
            </p>
          </div>

          <!-- Kartu 2: Kemungkinan Hadiah -->
          <div class="rounded-3xl bg-white p-7 shadow-xs space-y-4">
            <h2 class="text-base font-black text-[#0A2540]">
              Kemungkinan Hadiah
            </h2>

            <ul class="space-y-3.5 text-sm font-bold text-[#64748B]">
              <li
                v-for="(item, idx) in possibleRewards"
                :key="idx"
                class="flex items-center gap-2.5 transition hover:text-[#0A2540]"
              >
                <span>{{ item.name }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Hadiah Terbuka (Celebration Popup) -->
    <div
      v-if="showRewardModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div class="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
        <span class="text-6xl animate-bounce">{{ lastReward?.icon || '🎁' }}</span>
        <h3 class="mt-4 text-2xl font-black text-[#0A2540]">
          Selamat!
        </h3>
        <p class="mt-1 text-sm font-bold text-[#2D6BE4]">
          Kamu mendapatkan {{ lastReward?.name }}
        </p>
        <p class="mt-2 text-xs text-slate-500">
          {{ lastReward?.desc }}
        </p>

        <button
          type="button"
          @click="closeModal"
          class="mt-6 w-full rounded-2xl bg-[#2D6BE4] py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 cursor-pointer"
        >
          Ambil &amp; Simpan Hadiah
        </button>
      </div>
    </div>
  </div>
</template>
