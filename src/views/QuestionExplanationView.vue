<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserTasks,
  DEFAULT_DATABASE_QUESTIONS,
} from '../utils/equestState'

const route = useRoute()
const router = useRouter()

const taskId = route.query.taskId || '1'
const currentIndex = ref(Number(route.query.questionIndex || 0))

const currentUser = ref(null)
const tasks = ref([])
const userPrompt = ref('')
const isAskingAi = ref(false)
const aiChatReplies = ref([])

onMounted(() => {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    tasks.value = getUserTasks(currentUser.value.email)
  }
})

const task = computed(() => {
  return tasks.value.find((t) => String(t.id) === String(taskId)) || tasks.value[0] || {
    fileName: 'soal_latihan.pdf',
    questions: DEFAULT_DATABASE_QUESTIONS,
  }
})

const questions = computed(() => {
  return task.value?.questions || DEFAULT_DATABASE_QUESTIONS
})

const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || questions.value[0]
})

function goToNextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    userPrompt.value = ''
    aiChatReplies.value = []
  } else {
    // Kembali ke Daftar Jawaban
    router.push({
      path: '/answer',
      query: { id: taskId, mode: 'study' },
    })
  }
}

function goBackToAnswer() {
  router.push({
    path: '/answer',
    query: { id: taskId, mode: 'study' },
  })
}

async function handleAskAi() {
  if (!userPrompt.value.trim() || isAskingAi.value) return

  const promptText = userPrompt.value.trim()
  userPrompt.value = ''
  isAskingAi.value = true

  try {
    const res = await fetch('http://localhost:3000/api/ask-question-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: currentQuestion.value.question,
        currentAnswer: currentQuestion.value.correctAnswer,
        userPrompt: promptText,
      }),
    })

    const data = await res.json()
    aiChatReplies.value.push({
      user: promptText,
      ai: data.reply || 'SQL adalah bahasa terstruktur untuk berinteraksi dengan database relasional.',
    })
  } catch (err) {
    // Instant fallback jika server belum aktif
    aiChatReplies.value.push({
      user: promptText,
      ai: `Tentu! Terkait "${promptText}": Konsep intinya adalah perintah SQL berjalan secara deklaratif untuk memilih, memfilter, atau mengelola data tabel secara sistematis.`,
    })
  } finally {
    isAskingAi.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header sesuai Desktop - 15 -->
      <section class="mb-6">
        <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
          Penjelasan Soal
        </h1>
        <p class="mt-1 text-base text-slate-600 sm:text-lg">
          {{ task.fileName || 'jawaban_latihan.pdf' }} &nbsp;|&nbsp; Soal {{ currentIndex + 1 }} dari {{ questions.length }}
        </p>
      </section>

      <!-- Layout 3 Kolom: Robot | Main Card | Sidebar Info -->
      <div class="grid items-start gap-8 lg:grid-cols-[280px_1fr_320px]">
        <!-- 1. Robot Mascot (Kiri) -->
        <div class="hidden lg:flex items-center justify-center pt-8">
          <img
            src="../assets/images/robot_nunjuk.png"
            alt="Mascot EQuest"
            class="max-h-[380px] w-auto object-contain"
          />
        </div>

        <!-- 2. Kartu Utama Penjelasan Soal (Tengah) -->
        <div class="rounded-3xl bg-white p-7 shadow-xs space-y-6">
          <!-- Soal & Jawaban Singkat -->
          <div>
            <div class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF5FD] text-xs font-black text-[#2D6BE4]">
                {{ currentIndex + 1 }}
              </span>
              <h2 class="text-base font-extrabold text-[#0A2540] sm:text-lg">
                {{ currentQuestion.question }}
              </h2>
            </div>

            <div class="mt-3 ml-10 inline-flex items-center gap-2 rounded-xl bg-[#E1F7E9] px-3.5 py-1.5 text-xs font-bold text-[#16A34A]">
              <span>Jawaban</span>
              <span class="font-extrabold text-[#0F6F32]">{{ currentQuestion.correctAnswer }}</span>
            </div>
          </div>

          <!-- AI Explanation Block -->
          <div class="rounded-2xl bg-[#EAF5FD] p-5">
            <div class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D6BE4] text-xs font-black text-white">
                AI
              </span>
              <div>
                <h3 class="text-sm font-black text-[#0A2540]">
                  Kenapa jawabannya begitu?
                </h3>
                <p class="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-700">
                  {{ currentQuestion.explanation }}
                </p>
              </div>
            </div>
          </div>

          <!-- Contoh Penggunaan (Code Snippet Box) -->
          <div v-if="currentQuestion.exampleCode" class="space-y-2">
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Contoh penggunaan
            </h3>

            <div class="rounded-2xl bg-[#1A2234] p-5 font-mono text-xs sm:text-sm text-sky-200">
              <pre class="overflow-x-auto whitespace-pre">{{ currentQuestion.exampleCode }}</pre>
            </div>

            <p class="text-xs text-slate-500">
              {{ currentQuestion.exampleCaption }}
            </p>
          </div>

          <!-- Riwayat Tanya AI (Jika ada interaksi) -->
          <div v-if="aiChatReplies.length > 0" class="space-y-3 pt-2">
            <div
              v-for="(chat, cIdx) in aiChatReplies"
              :key="cIdx"
              class="space-y-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs"
            >
              <p class="font-bold text-[#2D6BE4]">
                💬 Pertanyaanmu: {{ chat.user }}
              </p>
              <p class="leading-relaxed text-slate-700 whitespace-pre-wrap">
                🤖 <strong>AI EQuest:</strong> {{ chat.ai }}
              </p>
            </div>
          </div>

          <!-- Input "Masih bingung? Tanya AI tentang soal ini..." -->
          <div class="flex items-center gap-2 pt-2">
            <input
              v-model="userPrompt"
              type="text"
              placeholder="Masih bingung? Tanya AI tentang soal ini..."
              @keyup.enter="handleAskAi"
              class="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-[#0A2540] outline-none transition focus:border-[#2D6BE4] placeholder:text-slate-400"
            />
            <button
              type="button"
              @click="handleAskAi"
              :disabled="isAskingAi || !userPrompt.trim()"
              class="rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {{ isAskingAi ? '...' : 'Tanya' }}
            </button>
          </div>

          <!-- Tombol Navigasi Bawah -->
          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="goBackToAnswer"
              class="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Kembali ke Daftar
            </button>

            <button
              type="button"
              @click="goToNextQuestion"
              class="rounded-xl bg-[#2D6BE4] px-7 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 cursor-pointer"
            >
              {{ currentIndex < questions.length - 1 ? `Soal ${currentIndex + 2} →` : 'Selesai Pembahasan ✓' }}
            </button>
          </div>
        </div>

        <!-- 3. Sidebar Kanan (Istilah Penting & Cara Mudah Mengingat) -->
        <div class="space-y-6">
          <!-- Card: Istilah Penting -->
          <div class="rounded-3xl bg-white p-6 shadow-xs space-y-4">
            <h3 class="text-sm font-black text-[#0A2540]">
              Istilah Penting
            </h3>

            <div class="space-y-3.5 text-xs divide-y divide-slate-100">
              <div
                v-for="(term, tIdx) in currentQuestion.terms"
                :key="tIdx"
                class="pt-2.5 first:pt-0"
              >
                <p class="font-extrabold text-[#0A2540]">
                  {{ term.name }}
                </p>
                <p class="mt-0.5 text-slate-500 leading-relaxed">
                  {{ term.desc }}
                </p>
              </div>
            </div>
          </div>

          <!-- Card: Cara Mudah Mengingat -->
          <div class="rounded-3xl bg-white p-6 shadow-xs space-y-3">
            <h3 class="text-sm font-black text-[#0A2540]">
              Cara Mudah Mengingat
            </h3>
            <p class="text-xs leading-relaxed text-slate-600">
              {{ currentQuestion.memoryTip }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
