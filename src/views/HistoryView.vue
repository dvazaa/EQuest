<script setup>
import { ref, computed, onMounted } from 'vue'
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
const selectedFilter = ref('all') // 'all', 'completed', 'in_progress', 'self_solve'
const selectedTaskDetail = ref(null)

function loadData() {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.email) {
    router.push('/login')
    return
  }
  tasks.value = getUserTasks(currentUser.value.email)
}

onMounted(() => {
  loadData()
})

const filteredHistory = computed(() => {
  return tasks.value.filter((task) => {
    const matchesSearch =
      (task.name || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (task.questionText || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    let matchesFilter = true
    if (selectedFilter.value === 'completed') {
      matchesFilter = task.status === 'Selesai'
    } else if (selectedFilter.value === 'in_progress') {
      matchesFilter = task.status !== 'Selesai'
    } else if (selectedFilter.value === 'self_solve') {
      matchesFilter = task.mode === 'self' || task.userScore !== undefined
    }

    return matchesSearch && matchesFilter
  })
})

function handleDelete(taskId) {
  if (confirm('Yakin ingin menghapus tugas ini dari riwayat?')) {
    tasks.value = deleteTask(currentUser.value.email, taskId)
  }
}

function openDetail(task) {
  selectedTaskDetail.value = task
}

function closeDetail() {
  selectedTaskDetail.value = null
}

function continueTask(task) {
  router.push({
    path: '/task-choice',
    query: { id: task.id },
  })
}

function viewAnswer(task) {
  router.push({
    path: '/answer',
    query: { id: task.id },
  })
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
            <span>🕒</span>
            <span>Riwayat Pembelajaran</span>
          </h1>
          <p class="mt-2 text-lg text-blue-900/70 sm:text-xl">
            Arsip soal dan tugas yang pernah kamu unggah, pelajari, dan selesaikan
          </p>
        </div>

        <RouterLink
          to="/upload"
          class="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
        >
          + Upload Soal Baru
        </RouterLink>
      </section>

      <!-- Filter & Search Controls -->
      <section class="mt-8 flex flex-wrap items-center justify-between gap-4">
        <!-- Search -->
        <div class="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white px-4 py-3 shadow-xs w-full sm:w-80">
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
            placeholder="Cari dalam riwayat..."
            class="w-full text-sm outline-none"
          />
        </div>

        <!-- Filter Tabs -->
        <div class="flex flex-wrap gap-2 rounded-2xl bg-white p-1.5 border border-blue-200 shadow-xs">
          <button
            type="button"
            @click="selectedFilter = 'all'"
            class="rounded-xl px-4 py-2 text-xs font-bold transition"
            :class="selectedFilter === 'all' ? 'bg-blue-600 text-white' : 'text-blue-900/70 hover:bg-sky-50'"
          >
            Semua ({{ tasks.length }})
          </button>
          <button
            type="button"
            @click="selectedFilter = 'completed'"
            class="rounded-xl px-4 py-2 text-xs font-bold transition"
            :class="selectedFilter === 'completed' ? 'bg-blue-600 text-white' : 'text-blue-900/70 hover:bg-sky-50'"
          >
            Selesai
          </button>
          <button
            type="button"
            @click="selectedFilter = 'self_solve'"
            class="rounded-xl px-4 py-2 text-xs font-bold transition"
            :class="selectedFilter === 'self_solve' ? 'bg-blue-600 text-white' : 'text-blue-900/70 hover:bg-sky-50'"
          >
            Kerjakan Sendiri
          </button>
          <button
            type="button"
            @click="selectedFilter = 'in_progress'"
            class="rounded-xl px-4 py-2 text-xs font-bold transition"
            :class="selectedFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'text-blue-900/70 hover:bg-sky-50'"
          >
            Belum Selesai
          </button>
        </div>
      </section>

      <!-- History List -->
      <section class="mt-8 space-y-4">
        <div
          v-for="task in filteredHistory"
          :key="task.id"
          class="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-3xl">
                {{ task.fileName?.endsWith('.pdf') ? '📕' : '📄' }}
              </div>

              <div>
                <h3 class="text-lg font-extrabold text-blue-950 sm:text-xl">
                  {{ task.name || task.fileName || 'Soal Tanpa Judul' }}
                </h3>
                <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-blue-900/60 font-semibold">
                  <span>📅 Diunggah {{ task.uploadDate || 'Baru saja' }}</span>
                  <span>•</span>
                  <span>{{ task.questionCount || 1 }} Soal</span>
                  <span v-if="task.mode === 'self' || task.userScore !== undefined" class="rounded bg-green-100 px-2 py-0.5 text-green-800">
                    Nilai: {{ task.userScore || 85 }}/100
                  </span>
                </div>

                <p v-if="task.questionText" class="mt-2 text-xs text-gray-600 line-clamp-2 max-w-2xl bg-gray-50 rounded-lg p-2 border border-gray-100">
                  "{{ task.questionText }}"
                </p>
              </div>
            </div>

            <!-- Badges & Actions -->
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="
                  task.status === 'Selesai'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                "
              >
                {{ task.status === 'Selesai' ? '✓ Selesai' : '⏳ Sedang Dikerjakan' }}
              </span>

              <button
                type="button"
                @click="openDetail(task)"
                class="rounded-xl border border-blue-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-sky-100"
              >
                Detail
              </button>

              <button
                type="button"
                @click="viewAnswer(task)"
                class="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                Lihat Jawaban
              </button>

              <button
                type="button"
                @click="handleDelete(task.id)"
                title="Hapus dari riwayat"
                class="rounded-xl border border-gray-200 p-2 text-xs text-red-500 hover:bg-red-50 hover:border-red-200"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="filteredHistory.length === 0"
          class="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center"
        >
          <span class="text-5xl">📂</span>
          <h3 class="mt-4 text-xl font-bold text-gray-800">Tidak ada riwayat ditemukan</h3>
          <p class="mt-2 text-sm text-gray-500">
            Mulai belajar dengan mengunggah soal pertamamu sekarang!
          </p>
          <RouterLink
            to="/upload"
            class="mt-6 inline-block rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Upload Soal Sekarang
          </RouterLink>
        </div>
      </section>
    </main>

    <!-- Detail Drawer Modal -->
    <div
      v-if="selectedTaskDetail"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div
        class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📄</span>
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ selectedTaskDetail.name }}</h3>
              <p class="text-xs text-gray-500">Diunggah: {{ selectedTaskDetail.uploadDate }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="closeDetail"
            class="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div class="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          <div v-if="selectedTaskDetail.questionText">
            <h4 class="text-xs font-bold uppercase text-gray-500">Teks Soal</h4>
            <div class="mt-1 rounded-2xl bg-sky-50/70 p-4 text-sm text-blue-950 leading-relaxed border border-sky-100">
              {{ selectedTaskDetail.questionText }}
            </div>
          </div>

          <div v-if="selectedTaskDetail.userScore !== undefined">
            <h4 class="text-xs font-bold uppercase text-gray-500">Hasil Penilaian</h4>
            <div class="mt-1 rounded-2xl bg-green-50 p-4 text-sm text-green-950 border border-green-200">
              <p class="font-extrabold text-lg">Skor AI: {{ selectedTaskDetail.userScore }}/100</p>
              <p class="mt-1 text-xs text-green-800">{{ selectedTaskDetail.userFeedback || 'Jawaban telah dianalisis dengan baik!' }}</p>
            </div>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase text-gray-500">Kunci Jawaban AI</h4>
            <div class="mt-1 rounded-2xl bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 max-h-60 overflow-y-auto">
              {{ selectedTaskDetail.answer || 'Belum ada kunci jawaban tersimpan.' }}
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            @click="closeDetail"
            class="rounded-xl border border-gray-200 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            Tutup
          </button>
          <button
            type="button"
            @click="continueTask(selectedTaskDetail)"
            class="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
          >
            Buka Pilihan Belajar →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
