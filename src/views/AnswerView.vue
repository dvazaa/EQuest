<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const currentUser = ref(readStorage('equestUser', null))
const isLoggedIn = computed(() => !!currentUser.value)

const taskStorageKey = currentUser.value?.email
  ? `equestTasks_${encodeURIComponent(
      currentUser.value.email.trim().toLowerCase()
    )}`
  : 'equestTasks_guest'

const tasks = ref(readStorage(taskStorageKey, []))
const taskId = route.query.id

const task = computed(() =>
  tasks.value.find((item) => String(item.id) === String(taskId))
)

const showExplanations = ref([])

function getAnswerItems(text) {
  if (!text) return []

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const items = []
  let current = null

  for (const line of lines) {
    const match = line.match(
      /^(?:(?:soal|pertanyaan)\s*)?(\d+)[.)]\s*(.*)$/i
    )

    if (match) {
      if (current) items.push(current)

      current = {
        question: match[2],
        answer: '',
        explanation: '',
      }
      continue
    }

    if (!current) {
      current = {
        question: task.value?.questionText || 'Jawaban AI',
        answer: '',
        explanation: '',
      }
    }

    if (/^penjelasan\s*:/i.test(line)) {
      current.explanation +=
        (current.explanation ? '\n' : '') +
        line.replace(/^penjelasan\s*:\s*/i, '')
    } else if (/^jawaban\s*:/i.test(line)) {
      current.answer +=
        (current.answer ? '\n' : '') +
        line.replace(/^jawaban\s*:\s*/i, '')
    } else {
      current.answer += (current.answer ? '\n' : '') + line
    }
  }

  if (current) items.push(current)

  return items.map((item, index) => ({
    ...item,
    question: item.question || `Jawaban ${index + 1}`,
    answer: item.answer || 'Jawaban belum tersedia.',
    explanation: item.explanation || item.answer,
  }))
}

const answerItems = computed(() =>
  getAnswerItems(task.value?.answer)
)

function toggleExplanation(index) {
  if (showExplanations.value.includes(index)) {
    showExplanations.value = showExplanations.value.filter(
      (item) => item !== index
    )
  } else {
    showExplanations.value.push(index)
  }
}

function finishViewing() {
  if (task.value && !task.value.answerViewed) {
    const updatedTasks = tasks.value.map((item) =>
      String(item.id) === String(taskId)
        ? { ...item, answerViewed: true, mode: 'study' }
        : item
    )

    localStorage.setItem(taskStorageKey, JSON.stringify(updatedTasks))
  }

  router.push('/tasks')
}

function logout() {
  localStorage.removeItem('equestUser')
  currentUser.value = null
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <!-- Navbar mengikuti HomeView.vue -->
    <header class="bg-sky-100 px-6 py-5">
      <nav class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <RouterLink to="/" class="flex items-center gap-3">
          <span class="text-5xl">📚</span>
          <span class="text-4xl font-extrabold text-black">EQuest</span>
        </RouterLink>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-lg font-bold">
          <RouterLink to="/" class="text-blue-900/50 hover:text-blue-600">
            Beranda
          </RouterLink>

          <RouterLink to="/tasks" class="text-blue-900/50 hover:text-blue-600">
            Tugas Saya
          </RouterLink>

          <RouterLink to="/upload" class="text-blue-900/50 hover:text-blue-600">
            Upload Soal
          </RouterLink>

          <span class="cursor-not-allowed text-blue-900/40">Blind Box</span>
          <span class="cursor-not-allowed text-blue-900/40">Progress</span>
          <span class="cursor-not-allowed text-blue-900/40">Riwayat</span>
        </div>

        <div v-if="isLoggedIn" class="flex items-center gap-3">
          <span class="font-semibold text-blue-900">
            {{ currentUser.name || currentUser.email || 'Pengguna' }}
          </span>

          <button
            type="button"
            @click="logout"
            class="rounded-xl border border-blue-300 px-4 py-2 font-semibold hover:bg-white"
          >
            Logout
          </button>
        </div>

        <RouterLink
          v-else
          to="/login"
          class="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Login
        </RouterLink>
      </nav>
    </header>

    <main class="space-y-6 px-6 pb-10">
      <!-- Judul dan file -->
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold sm:text-4xl">
            Daftar Jawaban
          </h1>

          <p class="mt-3 text-lg text-blue-900/70 sm:text-xl">
            Jawaban dari soal yang kamu unggah
          </p>
        </div>

        <div
          v-if="task"
          class="flex items-center gap-3 rounded-xl bg-white px-5 py-3"
        >
          <span class="text-2xl">📄</span>
          <div class="max-w-56">
            <p class="break-words text-sm font-bold">
              {{ task.fileName || task.name || 'Soal tanpa nama' }}
            </p>
            <p class="text-xs text-blue-900/60">
              Mode belajar · Tanpa poin
            </p>
          </div>
        </div>
      </section>

      <!-- Jawaban -->
      <section
        v-if="task && answerItems.length"
        class="rounded-xl border border-blue-300 bg-white p-4 sm:p-5"
      >
        <p class="mb-4 text-sm font-bold">
          {{ answerItems.length }} Jawaban
        </p>

        <article
          v-for="(item, index) in answerItems"
          :key="index"
          class="grid gap-4 rounded-xl border border-blue-200 p-4 sm:grid-cols-[minmax(0,1fr)_140px]"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600"
            >
              {{ index + 1 }}
            </span>

            <div class="min-w-0 flex-1">
              <h2 class="font-bold leading-relaxed">
                {{ item.question }}
              </h2>

              <div
                class="mt-2 inline-flex max-w-full flex-wrap items-center gap-2 rounded-lg border border-green-300 bg-green-100 px-3 py-1.5 text-sm text-green-900"
              >
                <span class="font-bold">Jawaban</span>
                <span class="whitespace-pre-wrap break-words">{{ item.answer }}</span>
              </div>

              <div
                v-if="showExplanations.includes(index)"
                class="mt-3 rounded-lg bg-sky-50 p-3 text-sm leading-relaxed text-blue-950"
              >
                <p class="mb-1 font-bold">Penjelasan</p>
                <p class="whitespace-pre-wrap">{{ item.explanation }}</p>
              </div>
            </div>
          </div>

          <div class="sm:pl-2">
            <button
              type="button"
              @click="toggleExplanation(index)"
              class="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-600 transition hover:bg-sky-50"
            >
              {{
                showExplanations.includes(index)
                  ? 'Tutup Penjelasan'
                  : 'Penjelasan'
              }}
            </button>
          </div>
        </article>

        <p class="mt-4 rounded-lg bg-sky-50 p-3 text-sm text-blue-800">
          Kamu melihat jawaban langsung. Mode ini tidak memberikan poin.
        </p>
      </section>

      <!-- Jika jawaban belum tersedia -->
      <section
        v-else
        class="rounded-xl border border-blue-300 bg-white p-8 text-center"
      >
        <p class="text-4xl">📄</p>
        <h2 class="mt-3 text-xl font-bold">Jawaban belum tersedia</h2>
        <p class="mt-2 text-blue-900/70">
          Tugas tidak ditemukan atau jawaban AI belum tersimpan.
          Coba kembali ke Tugas Saya.
        </p>
      </section>

      <!-- Selesai -->
      <div class="flex justify-end">
        <button
          type="button"
          @click="finishViewing"
          class="min-w-40 rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          Selesai
        </button>
      </div>
    </main>
  </div>
</template>