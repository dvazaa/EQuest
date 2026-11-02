<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserTasks,
  updateTask,
  addXp,
  unlockBadge,
} from '../utils/equestState'

const router = useRouter()
const route = useRoute()
const taskId = route.query.id

const currentUser = ref(null)
const tasks = ref([])
const showExplanations = ref([])

onMounted(() => {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.email) {
    router.push('/login')
    return
  }
  tasks.value = getUserTasks(currentUser.value.email)
})

const task = computed(() =>
  tasks.value.find((item) => String(item.id) === String(taskId))
)

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
        question: task.value?.questionText || task.value?.name || 'Jawaban AI',
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
    question: item.question || `Pertanyaan ${index + 1}`,
    answer: item.answer || 'Jawaban lengkap tersedia pada penjelasan.',
    explanation: item.explanation || item.answer || 'Pelajari konsep utama pada pembahasan.',
  }))
}

const answerItems = computed(() => getAnswerItems(task.value?.answer))

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
  const email = currentUser.value?.email
  if (task.value && email) {
    updateTask(email, taskId, {
      status: 'Selesai',
      answerViewed: true,
      mode: 'study',
      completedAt: new Date().toLocaleDateString('id-ID'),
    })

    // Award study XP
    addXp(email, 20)
    unlockBadge(email, 'first_task')
  }

  router.push('/tasks')
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <Navbar />

    <main class="mx-auto max-w-5xl px-6 pb-12 pt-4 space-y-6">
      <!-- Judul dan info berkas -->
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            @click="router.push('/tasks')"
            class="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-900/70 hover:text-blue-900 transition"
          >
            ← Kembali ke Tugas
          </button>
          <h1 class="text-3xl font-black text-blue-950 sm:text-4xl">
            Daftar Jawaban &amp; Pembahasan AI
          </h1>
          <p class="mt-1 text-sm text-blue-900/70 sm:text-base">
            Pelajari konsep dan cara penyelesaian yang telah dianalisis oleh AI EQuest
          </p>
        </div>

        <div
          v-if="task"
          class="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white px-5 py-3 shadow-xs"
        >
          <span class="text-3xl">📄</span>
          <div class="max-w-64">
            <p class="truncate text-sm font-black text-blue-950">
              {{ task.fileName || task.name || 'Soal tanpa nama' }}
            </p>
            <p class="text-xs text-blue-900/60 font-semibold">
              Mode Belajar &bull; +20 XP Pembelajaran
            </p>
          </div>
        </div>
      </section>

      <!-- Jawaban list -->
      <section
        v-if="task && answerItems.length"
        class="rounded-3xl border border-blue-200 bg-white p-6 sm:p-8 shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <p class="text-sm font-black text-blue-950">
            Ditemukan {{ answerItems.length }} Butir Soal
          </p>
          <span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            Kunci Jawaban Resmi AI
          </span>
        </div>

        <article
          v-for="(item, index) in answerItems"
          :key="index"
          class="rounded-2xl border border-blue-100 bg-sky-50/30 p-5 transition hover:border-blue-300"
        >
          <div class="flex items-start gap-4">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-xs"
            >
              {{ index + 1 }}
            </span>

            <div class="min-w-0 flex-1">
              <h2 class="font-extrabold text-blue-950 text-base leading-relaxed">
                {{ item.question }}
              </h2>

              <!-- Jawaban Singkat -->
              <div
                class="mt-3 rounded-xl border border-green-300 bg-green-50 p-3.5 text-sm text-green-950"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-black text-xs uppercase tracking-wider text-green-800">Jawaban Tepat:</span>
                </div>
                <div class="whitespace-pre-wrap font-bold">{{ item.answer }}</div>
              </div>

              <!-- Penjelasan Lengkap (Collapsible) -->
              <div
                v-if="showExplanations.includes(index)"
                class="mt-3 rounded-xl bg-white p-4 text-sm leading-relaxed text-blue-950 border border-blue-200 shadow-xs"
              >
                <p class="mb-1 text-xs font-bold uppercase tracking-wider text-blue-700">Penjelasan &amp; Langkah Pengerjaan:</p>
                <p class="whitespace-pre-wrap text-gray-700">{{ item.explanation }}</p>
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  type="button"
                  @click="toggleExplanation(index)"
                  class="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-bold text-blue-600 transition hover:bg-sky-50 cursor-pointer"
                >
                  {{
                    showExplanations.includes(index)
                      ? '▲ Tutup Pembahasan'
                      : '▼ Buka Pembahasan Detail'
                  }}
                </button>
              </div>
            </div>
          </div>
        </article>

        <div class="rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-900 border border-amber-200">
          💡 Catatan: Mode belajar langsung ini membuka kunci pembahasan secara instan dan memberikanmu 20 XP. Jika ingin mendapatkan Tiket Blind Box misteri, kamu bisa mencoba "Kerjakan Sendiri" pada tugas lainnya.
        </div>
      </section>

      <!-- Jika jawaban belum tersedia -->
      <section
        v-else
        class="rounded-3xl border border-blue-200 bg-white p-12 text-center shadow-xs"
      >
        <span class="text-5xl">📄</span>
        <h2 class="mt-4 text-xl font-black text-blue-950">Jawaban belum tersedia</h2>
        <p class="mt-2 text-sm text-blue-900/70">
          Tugas tidak ditemukan atau jawaban belum tersimpan di memori peramban.
        </p>
        <RouterLink
          to="/tasks"
          class="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          Kembali ke Tugas Saya
        </RouterLink>
      </section>

      <!-- Tombol Selesai Belajar -->
      <div class="flex justify-end gap-3 pt-4">
        <button
          type="button"
          @click="finishViewing"
          class="rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 cursor-pointer"
        >
          Selesai Membaca &amp; Simpan Progres (+20 XP) ✓
        </button>
      </div>
    </main>
  </div>
</template>
