<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserTasks,
  deleteTask,
} from '../utils/equestState'

const router = useRouter()
const currentUser = ref(null)
const tasks = ref([])
const searchQuery = ref('')
const selectedStatus = ref('Semua Status')

const statusOptions = [
  'Semua Status',
  'Sedang Dikerjakan',
  'Selesai',
]

function loadTasks() {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.email) {
    router.push('/login')
    return
  }
  tasks.value = getUserTasks(currentUser.value.email)
}

onMounted(() => {
  loadTasks()
})

const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    const matchesSearch = (task.name || task.fileName || '')
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase())

    const matchesStatus =
      selectedStatus.value === 'Semua Status' ||
      task.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

function handleTaskAction(task) {
  if (task.status === 'Selesai') {
    if (task.directStudy && !task.hasSubmittedAnswer) {
      router.push({
        path: '/answer',
        query: { id: task.id, mode: 'study', direct: '1' },
      })
      return
    }
    // Mode Lihat Hasil / Skor Akhir sesuai Desktop - 14
    router.push({
      path: '/answer',
      query: { id: task.id, mode: 'score' },
    })
  } else {
    // Arahkan ke halaman Upload / Ketik Jawaban terlebih dahulu sebelum masuk ke halaman koreksi
    router.push({
      path: '/answer-upload',
      query: { taskId: task.id },
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header dan Bar Pencarian sesuai Desktop - 2 -->
      <section class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Tugas Saya
          </h1>
          <p class="mt-1 text-base text-slate-600 sm:text-lg">
            Lihat dan lanjutkan tugas yang sedang atau pernah kamu kerjakan
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
              placeholder="Cari tugas..."
              class="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <!-- Status Dropdown -->
          <div class="relative">
            <select
              v-model="selectedStatus"
              class="appearance-none rounded-2xl bg-white px-5 py-2.5 pr-10 text-sm font-bold text-[#0f2852] shadow-2xs outline-none cursor-pointer"
            >
              <option v-for="opt in statusOptions" :key="opt" :value="opt">
                {{ opt }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              ▼
            </span>
          </div>
        </div>
      </section>

      <!-- Empty State sesuai Desktop - 3 -->
      <section
        v-if="filteredTasks.length === 0 && tasks.length === 0"
        class="flex min-h-[500px] flex-col items-center justify-center rounded-3xl bg-white p-12 shadow-xs lg:flex-row lg:justify-around"
      >
        <div class="max-w-md text-center lg:text-left">
          <img
            src="../assets/images/robot_bingung.png"
            alt="Belum ada tugas"
            class="mx-auto max-h-[320px] object-contain"
          />
        </div>

        <div class="mt-8 max-w-lg space-y-5 text-center lg:mt-0 lg:text-left">
          <h2 class="text-3xl font-extrabold text-[#0A2540]">
            Belum ada tugas
          </h2>
          <p class="text-base leading-relaxed text-slate-600 sm:text-lg">
            Mulai dengan mengunggah soal atau tugas untuk mendapatkan bantuan AI dan mulai belajar.
          </p>
          <div>
            <RouterLink
              to="/upload"
              class="inline-block rounded-2xl bg-[#2D6BE4] px-8 py-3.5 text-base font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Upload Soal Sekarang
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Daftar Tugas sesuai Desktop - 2 -->
      <section v-else class="space-y-4">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C5E4FA] bg-white px-7 py-5 shadow-xs transition hover:border-[#2D6BE4]"
        >
          <!-- Info Tugas -->
          <div>
            <h2 class="text-lg font-black text-[#0A2540] sm:text-xl">
              {{ task.name || task.fileName }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ task.questionCount || 10 }} soal &nbsp;|&nbsp; Diunggah {{ task.uploadDate || '12 Okt 2026' }}
            </p>
          </div>

          <!-- Status & Action Buttons sesuai Figma -->
          <div class="flex items-center gap-4">
            <span
              class="rounded-full px-4 py-1.5 text-xs font-bold"
              :class="
                task.status === 'Selesai'
                  ? 'bg-[#BFF0D2] text-[#0A6C35]'
                  : 'bg-[#DDF0FD] text-[#2D6BE4]'
              "
            >
              {{ task.status }}
            </span>

            <button
              type="button"
              @click="handleTaskAction(task)"
              class="rounded-xl px-7 py-2.5 text-sm font-bold transition shadow-xs cursor-pointer"
              :class="
                task.status === 'Selesai'
                  ? 'bg-[#DDF0FD] text-[#2D6BE4] hover:bg-[#c9e8fb]'
                  : 'bg-[#2D6BE4] text-white hover:bg-blue-700'
              "
            >
              {{ task.status === 'Selesai' ? 'Lihat Hasil' : 'Periksa' }}
            </button>
          </div>
        </div>

        <p
          v-if="filteredTasks.length === 0"
          class="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500"
        >
          Tidak ada tugas dengan filter atau kata kunci tersebut.
        </p>
      </section>
    </main>
  </div>
</template>
