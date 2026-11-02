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
const tasks = ref([])

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
    tasks.value = getUserTasks(currentUser.value.email)
  } else {
    userStats.value = { xp: 0, tickets: 0, streak: 0 }
    tasks.value = []
  }
}

onMounted(() => {
  loadData()
})

const isLoggedIn = computed(() => !!currentUser.value)

const completedTasksCount = computed(() => {
  return tasks.value.filter((t) => t.status === 'Selesai').length
})

const latestTask = computed(() => {
  if (!Array.isArray(tasks.value) || tasks.value.length === 0) {
    return null
  }
  return [...tasks.value].sort((a, b) => Number(b.id) - Number(a.id))[0]
})

const continueTarget = computed(() => {
  if (!isLoggedIn.value) return '/login'
  if (!latestTask.value) return '/upload'
  return {
    path: '/task-choice',
    query: { id: latestTask.value.id },
  }
})
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <!-- Unified Dynamic Navbar -->
    <Navbar />

    <main class="space-y-6 px-6 pb-12 pt-4">
      <!-- Bagian utama Hero -->
      <section class="grid items-center gap-6 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <img
            src="../assets/images/beranda.png"
            alt="Ilustrasi siswa belajar bersama robot AI"
            class="h-[300px] w-full rounded-3xl object-cover shadow-sm sm:h-[380px] lg:h-[430px]"
          />
        </div>

        <div class="py-2 lg:col-span-2">
          <p class="text-lg font-bold text-blue-900/70 sm:text-xl">
            Halo, {{ currentUser?.name || 'Selamat Datang' }}! 👋
          </p>

          <h1 class="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl text-blue-950">
            Belajar Jadi Lebih Seru dengan EQuest!
          </h1>

          <p class="mt-4 text-base leading-relaxed text-blue-900/75 sm:text-xl">
            Kerjakan soal, dapatkan bantuan AI, dan kumpulkan reward menarik
            di setiap langkah belajarmu.
          </p>

          <div class="mt-8 flex justify-start">
            <RouterLink
              :to="isLoggedIn ? '/tasks' : '/login'"
              class="rounded-3xl bg-blue-600 px-10 py-4 text-center text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 hover:scale-[1.02] sm:text-2xl"
            >
              Mulai Belajar Sekarang →
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Statistik Dinamis User -->
      <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <!-- Total XP -->
        <RouterLink
          to="/progress"
          class="group rounded-2xl border border-blue-200/70 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-amber-300"
        >
          <div class="flex items-center justify-between text-blue-900/60">
            <p class="text-sm font-bold sm:text-lg">Total XP</p>
            <span class="text-2xl">⭐</span>
          </div>
          <p class="mt-2 text-3xl font-black text-amber-600 sm:text-4xl">
            {{ userStats?.xp || 0 }}
          </p>
          <p class="mt-1 text-xs text-blue-900/50 group-hover:text-blue-600">Lihat progres level →</p>
        </RouterLink>

        <!-- Tiket Blind Box -->
        <RouterLink
          to="/blind-box"
          class="group rounded-2xl border border-blue-200/70 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-purple-300"
        >
          <div class="flex items-center justify-between text-blue-900/60">
            <p class="text-sm font-bold sm:text-lg">Tiket Blind Box</p>
            <span class="text-2xl">🎟️</span>
          </div>
          <p class="mt-2 text-3xl font-black text-purple-700 sm:text-4xl">
            {{ userStats?.tickets || 0 }}
          </p>
          <p class="mt-1 text-xs text-blue-900/50 group-hover:text-purple-600">Buka reward sekarang →</p>
        </RouterLink>

        <!-- Hari Streak -->
        <RouterLink
          to="/progress"
          class="group rounded-2xl border border-blue-200/70 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-orange-300"
        >
          <div class="flex items-center justify-between text-blue-900/60">
            <p class="text-sm font-bold sm:text-lg">Hari Streak</p>
            <span class="text-2xl">🔥</span>
          </div>
          <p class="mt-2 text-3xl font-black text-orange-600 sm:text-4xl">
            {{ userStats?.streak || 0 }} Hari
          </p>
          <p class="mt-1 text-xs text-blue-900/50 group-hover:text-orange-600">Jaga streak harian →</p>
        </RouterLink>

        <!-- Soal Selesai -->
        <RouterLink
          to="/riwayat"
          class="group rounded-2xl border border-blue-200/70 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-green-300"
        >
          <div class="flex items-center justify-between text-blue-900/60">
            <p class="text-sm font-bold sm:text-lg">Soal Selesai</p>
            <span class="text-2xl">✅</span>
          </div>
          <p class="mt-2 text-3xl font-black text-green-600 sm:text-4xl">
            {{ completedTasksCount }}
          </p>
          <p class="mt-1 text-xs text-blue-900/50 group-hover:text-green-600">Buka riwayat tugas →</p>
        </RouterLink>
      </section>

      <!-- Lanjutkan belajar dan fitur (Unblocked!) -->
      <section class="grid gap-6 lg:grid-cols-[1.1fr_2.1fr]">
        <!-- Lanjutkan belajar -->
        <div>
          <h2 class="mb-3 text-2xl font-extrabold text-blue-950">
            Lanjutkan Belajar
          </h2>

          <div class="flex min-h-56 flex-col justify-between rounded-3xl border border-blue-200/70 bg-white p-6 shadow-sm">
            <div>
              <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {{ latestTask ? 'Aktivitas Terakhir' : 'Mulai Sekarang' }}
              </span>
              <p class="mt-3 break-words text-xl font-bold sm:text-2xl text-blue-950">
                {{ latestTask ? (latestTask.name || latestTask.fileName) : 'Belum ada tugas yang diunggah' }}
              </p>
              <p v-if="latestTask" class="mt-1 text-xs text-blue-900/60">
                Status: {{ latestTask.status }} &bull; Diunggah {{ latestTask.uploadDate }}
              </p>
            </div>

            <div class="mt-6 flex justify-end">
              <RouterLink
                :to="continueTarget"
                class="rounded-2xl bg-blue-600 px-7 py-3 text-base font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 sm:text-xl"
              >
                {{ latestTask ? 'Lanjutkan Tugas →' : 'Upload Soal Baru →' }}
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Fitur Aplikasi EQuest (ALL UNBLOCKED & INTERACTIVE!) -->
        <div>
          <h2 class="mb-3 text-2xl font-extrabold text-blue-950">Fitur Utama</h2>

          <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <!-- 1. Upload Soal -->
            <RouterLink
              to="/upload"
              class="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-blue-200/70 bg-white p-5 text-center shadow-xs transition hover:border-blue-400 hover:shadow-md hover:scale-[1.02]"
            >
              <span class="text-5xl">📥</span>
              <h3 class="mt-3 text-base font-bold sm:text-lg text-blue-950">Upload Soal</h3>
              <p class="mt-1 text-xs text-blue-900/70">
                Dari file foto atau teks
              </p>
            </RouterLink>

            <!-- 2. List Tugas -->
            <RouterLink
              to="/tasks"
              class="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-blue-200/70 bg-white p-5 text-center shadow-xs transition hover:border-blue-400 hover:shadow-md hover:scale-[1.02]"
            >
              <span class="text-5xl">📝</span>
              <h3 class="mt-3 text-base font-bold sm:text-lg text-blue-950">Tugas Saya</h3>
              <p class="mt-1 text-xs text-blue-900/70">
                Kerjakan atau periksa
              </p>
            </RouterLink>

            <!-- 3. Blind Box (UNBLOCKED!) -->
            <RouterLink
              to="/blind-box"
              class="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-purple-200 bg-white p-5 text-center shadow-xs transition hover:border-purple-400 hover:shadow-md hover:scale-[1.02]"
            >
              <span class="text-5xl">🎁</span>
              <h3 class="mt-3 text-base font-bold sm:text-lg text-purple-950">Blind Box</h3>
              <p class="mt-1 text-xs text-purple-900/70">
                Tukar tiket hadiahmu
              </p>
            </RouterLink>

            <!-- 4. Progress (UNBLOCKED!) -->
            <RouterLink
              to="/progress"
              class="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-amber-200 bg-white p-5 text-center shadow-xs transition hover:border-amber-400 hover:shadow-md hover:scale-[1.02]"
            >
              <span class="text-5xl">📊</span>
              <h3 class="mt-3 text-base font-bold sm:text-lg text-amber-950">Progress</h3>
              <p class="mt-1 text-xs text-amber-900/70">
                Level, streak & badge
              </p>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
