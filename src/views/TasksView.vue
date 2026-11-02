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
  { label: 'Semua Status', value: 'Semua Status' },
  { label: 'Sedang Dikerjakan', value: 'Sedang Dikerjakan' },
  { label: 'Selesai', value: 'Selesai' },
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

function uploadTask() {
  router.push('/upload')
}

function openTask(task) {
  router.push({
    path: '/task-choice',
    query: { id: task.id },
  })
}

function handleDelete(taskId) {
  if (confirm('Apakah kamu yakin ingin menghapus tugas ini?')) {
    tasks.value = deleteTask(currentUser.value.email, taskId)
  }
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <!-- Navbar -->
    <Navbar />

    <main class="mx-auto max-w-7xl px-6 pb-12 pt-4">
      <!-- Judul dan kontrol pencarian -->
      <section class="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 class="text-3xl font-extrabold sm:text-4xl text-blue-950">
            Tugas Saya
          </h1>

          <p class="mt-2 text-base text-blue-900/70 sm:text-xl">
            Lihat dan lanjutkan tugas yang sedang atau pernah kamu kerjakan
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Search Box -->
          <label class="flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-2.5 shadow-xs">
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari tugas..."
              class="w-40 sm:w-52 text-sm outline-none"
            />
          </label>

          <!-- Status Dropdown -->
          <select
            v-model="selectedStatus"
            class="rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-950 shadow-xs outline-none cursor-pointer"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <!-- Upload Button -->
          <button
            type="button"
            @click="uploadTask"
            class="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
          >
            + Upload Baru
          </button>
        </div>
      </section>

      <!-- Tampilan jika belum ada tugas sama sekali -->
      <section
        v-if="tasks.length === 0"
        class="grid min-h-[480px] items-center gap-8 rounded-3xl border border-blue-200 bg-white p-8 lg:grid-cols-2 lg:px-16 shadow-sm"
      >
        <div class="flex items-center justify-center">
          <img
            src="../assets/images/robot_bingung.png"
            alt="Robot EQuest sedang bingung karena belum ada tugas"
            class="max-h-[340px] w-full object-contain"
          />
        </div>

        <div class="flex flex-col gap-6">
          <div>
            <span class="rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-blue-700 uppercase">
              Mulai Langkah Pertama
            </span>
            <h2 class="mt-3 text-3xl font-extrabold sm:text-4xl text-blue-950">
              Belum ada tugas tersimpan
            </h2>

            <p class="mt-3 text-base text-blue-900/70 sm:text-lg leading-relaxed">
              Mulai dengan mengunggah soal atau tugas untuk mendapatkan
              bantuan AI, belajar dengan cepat, dan kumpulkan tiket hadiah.
            </p>
          </div>

          <button
            type="button"
            @click="uploadTask"
            class="w-full sm:w-fit rounded-2xl bg-blue-600 px-8 py-4 text-base sm:text-lg font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 hover:scale-[1.02]"
          >
            Upload Soal Sekarang →
          </button>
        </div>
      </section>

      <!-- Daftar tugas -->
      <section v-else class="space-y-3.5">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-white p-5 shadow-xs transition hover:border-blue-400 hover:shadow-md"
        >
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-3xl shadow-xs">
              {{ task.fileName?.endsWith('.pdf') ? '📕' : '📄' }}
            </div>

            <div class="min-w-0">
              <h2 class="truncate text-lg font-extrabold text-blue-950 sm:text-xl">
                {{ task.name || task.fileName || 'Tugas tanpa nama' }}
              </h2>

              <p class="mt-0.5 text-xs text-blue-900/60 font-medium sm:text-sm">
                {{ task.questionCount || 1 }} soal
                &nbsp; | &nbsp;
                Diunggah {{ task.uploadDate || 'Baru saja' }}
                <span v-if="task.userScore !== undefined" class="ml-2 font-bold text-green-700">
                  (Nilai: {{ task.userScore }}/100)
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="
                task.status === 'Selesai'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              "
            >
              {{ task.status === 'Selesai' ? '✓ Selesai' : 'Sedang Dikerjakan' }}
            </span>

            <button
              type="button"
              @click="openTask(task)"
              class="rounded-xl px-5 py-2.5 text-sm font-bold transition shadow-xs"
              :class="
                task.status === 'Selesai'
                  ? 'bg-sky-100 text-blue-700 hover:bg-sky-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              "
            >
              {{ task.status === 'Selesai' ? 'Lihat Hasil' : 'Periksa Soal' }}
            </button>

            <button
              type="button"
              @click="handleDelete(task.id)"
              title="Hapus tugas"
              class="rounded-xl border border-gray-200 p-2 text-xs text-red-500 hover:bg-red-50 hover:border-red-200"
            >
              🗑️
            </button>
          </div>
        </div>

        <p
          v-if="filteredTasks.length === 0"
          class="rounded-3xl border border-blue-200 bg-white p-8 text-center text-sm font-semibold text-blue-900/70"
        >
          Tidak ada tugas yang cocok dengan pencarian atau filter status tersebut.
        </p>
      </section>
    </main>
  </div>
</template>
