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
    userStats.value = { xp: 0, tickets: 0, streak: 0, soalSelesai: 0 }
    tasks.value = []
  }
}

onMounted(() => {
  loadData()
})

const currentTask = computed(() => {
  if (!tasks.value.length) return null
  return (
    tasks.value.find((t) => t.status !== 'Selesai') ||
    tasks.value[0]
  )
})
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <!-- Navbar EQuest -->
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-6 pb-12 pt-5 space-y-6">
      <!-- Hero Banner sesuai Desktop - 1 -->
      <section class="grid items-center gap-8 rounded-3xl lg:grid-cols-[1.1fr_0.9fr]">
        <div class="overflow-hidden rounded-3xl shadow-sm">
          <img
            src="../assets/images/beranda.png"
            alt="Belajar bersama robot AI EQuest"
            class="h-[320px] w-full object-cover sm:h-[400px] lg:h-[420px]"
          />
        </div>

        <div class="flex flex-col justify-center space-y-4">
          <p class="text-base font-bold text-slate-600 sm:text-lg">
            Halo, {{ currentUser?.name || 'Selamat Datang' }}! 👋
          </p>

          <h1 class="text-3xl font-extrabold leading-tight tracking-tight text-[#0f2852] sm:text-5xl">
            Belajar Jadi Lebih Seru dengan EQuest!
          </h1>

          <p class="text-base leading-relaxed text-slate-600 sm:text-lg">
            Kerjakan soal, dapatkan bantuan AI, dan kumpulkan reward menarik
            di setiap langkah belajarmu.
          </p>

          <div class="pt-2">
            <RouterLink
              to="/upload"
              class="inline-block rounded-2xl bg-[#2D6BE4] px-10 py-3.5 text-base font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 hover:scale-[1.02]"
            >
              Mulai Belajar
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- 4 Kartu Statistik sesuai Desktop - 1 -->
      <section class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <!-- Total XP -->
        <RouterLink
          to="/progress"
          class="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md"
        >
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Total XP :
          </p>
          <p class="mt-2 text-3xl font-black text-black sm:text-4xl">
            {{ userStats?.xp ?? 0 }}
          </p>
        </RouterLink>

        <!-- Tiket Blind Box -->
        <RouterLink
          to="/blind-box"
          class="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md"
        >
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Tiket Blind Box :
          </p>
          <p class="mt-2 text-3xl font-black text-black sm:text-4xl">
            {{ userStats?.tickets ?? 0 }}
          </p>
        </RouterLink>

        <!-- Hari Streak -->
        <RouterLink
          to="/progress"
          class="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md"
        >
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Hari Streak :
          </p>
          <p class="mt-2 text-3xl font-black text-black sm:text-4xl">
            {{ userStats?.streak ?? 0 }}
          </p>
        </RouterLink>

        <!-- Soal Selesai -->
        <RouterLink
          to="/riwayat"
          class="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md"
        >
          <p class="text-sm font-semibold text-slate-700 sm:text-base">
            Soal Selesai :
          </p>
          <p class="mt-2 text-3xl font-black text-black sm:text-4xl">
            {{ userStats?.soalSelesai ?? 0 }}
          </p>
        </RouterLink>
      </section>

      <!-- Baris Bawah: Lanjutkan Belajar & 4 Fitur sesuai Desktop - 1 -->
      <section class="grid gap-6 lg:grid-cols-[1.1fr_2.4fr]">
        <!-- Kolom Lanjutkan Belajar -->
        <div>
          <h2 class="mb-3 text-lg font-bold text-[#0f2852]">
            Lanjutkan Belajar
          </h2>

          <div class="flex min-h-[160px] flex-col justify-between rounded-2xl border border-blue-100 bg-white p-6 shadow-xs">
            <div>
              <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {{ currentTask ? 'Aktivitas Terakhir' : 'Mulai Tugas Baru' }}
              </span>
              <h3 class="mt-3 text-lg font-extrabold text-[#0f2852]">
                {{ currentTask?.name || 'Belum ada tugas yang kamu buat' }}
              </h3>
            </div>

            <div class="mt-4 flex justify-end">
              <RouterLink
                v-if="currentTask"
                :to="{ path: '/answer', query: { id: currentTask.id, mode: 'eval' } }"
                class="rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
              >
                Lanjutkan
              </RouterLink>
              <RouterLink
                v-else
                to="/upload"
                class="rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700"
              >
                Upload Soal Sekarang →
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Kolom 4 Fitur Utama -->
        <div>
          <h2 class="mb-3 text-lg font-bold text-[#0f2852]">
            Fitur
          </h2>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <!-- 1. Upload Soal -->
            <RouterLink
              to="/upload"
              class="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-xs transition hover:border-blue-400 hover:shadow-sm"
            >
              <img
                src="../assets/images/feature_1.png"
                alt="Upload Soal"
                class="h-14 w-auto object-contain"
              />
              <p class="mt-3 text-sm font-extrabold text-[#0f2852]">
                Upload Soal
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Dari file/gambar
              </p>
            </RouterLink>

            <!-- 2. List Tugas -->
            <RouterLink
              to="/tasks"
              class="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-xs transition hover:border-blue-400 hover:shadow-sm"
            >
              <img
                src="../assets/images/feature_2.png"
                alt="List Tugas"
                class="h-14 w-auto object-contain"
              />
              <p class="mt-3 text-sm font-extrabold text-[#0f2852]">
                List Tugas
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Kerjakan soalmu
              </p>
            </RouterLink>

            <!-- 3. Blind Box -->
            <RouterLink
              to="/blind-box"
              class="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-xs transition hover:border-blue-400 hover:shadow-sm"
            >
              <img
                src="../assets/images/feature_3.png"
                alt="Blind Box"
                class="h-14 w-auto object-contain"
              />
              <p class="mt-3 text-sm font-extrabold text-[#0f2852]">
                Blind Box
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Tukar tiketmu
              </p>
            </RouterLink>

            <!-- 4. Progress -->
            <RouterLink
              to="/progress"
              class="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-xs transition hover:border-blue-400 hover:shadow-sm"
            >
              <img
                src="../assets/images/feature_4.png"
                alt="Progress"
                class="h-14 w-auto object-contain"
              />
              <p class="mt-3 text-sm font-extrabold text-[#0f2852]">
                Progress
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                Pantau Hasilmu
              </p>
            </RouterLink>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
