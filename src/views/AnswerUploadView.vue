<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserTasks,
  updateTask,
  applyUserAnswersToQuestions,
  DEFAULT_DATABASE_QUESTIONS,
} from '../utils/equestState'

const router = useRouter()
const route = useRoute()
const taskId = route.query.taskId || '1'

const fileInput = ref(null)
const selectedFile = ref(null)
const answerText = ref('')
const perQuestionInputs = ref({})
const showPerQuestionBubble = ref(false)
const errorMessage = ref('')

const currentUser = ref(null)
const currentTask = ref(null)

onMounted(() => {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    const userTasks = getUserTasks(currentUser.value.email)
    currentTask.value =
      userTasks.find((t) => String(t.id) === String(taskId)) || userTasks[0] || null
  }
})

const taskQuestions = computed(() => {
  return currentTask.value?.questions || DEFAULT_DATABASE_QUESTIONS
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (file) {
    selectedFile.value = {
      name: file.name,
      size: Math.max(1, Math.round(file.size / 1024)) + ' KB',
      type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
      raw: file,
    }
    errorMessage.value = ''
  }
}

function handleDrop(event) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    selectedFile.value = {
      name: file.name,
      size: Math.max(1, Math.round(file.size / 1024)) + ' KB',
      type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
      raw: file,
    }
    errorMessage.value = ''
  }
}

function hasAnyTypedAnswer() {
  if (answerText.value.trim().length > 0) return true
  return Object.values(perQuestionInputs.value).some(
    (v) => v && String(v).trim().length > 0
  )
}

function handleStudyMode() {
  // Mode langsung melihat jawaban sesuai Desktop - 10
  router.push({
    path: '/answer',
    query: { id: taskId, mode: 'study' },
  })
}

async function handleContinue() {
  const typed = hasAnyTypedAnswer()
  if (!selectedFile.value && !typed) {
    errorMessage.value =
      'Silakan ketik jawabanmu pada bubble jawaban di bawah atau unggah file jawaban terlebih dahulu.'
    return
  }

  errorMessage.value = ''
  const email = currentUser.value?.email

  if (email && currentTask.value) {
    let rawTextFromAnswerFile = answerText.value.trim()
    if (
      !rawTextFromAnswerFile &&
      selectedFile.value?.raw &&
      selectedFile.value.name.toLowerCase().endsWith('.txt')
    ) {
      try {
        rawTextFromAnswerFile = (await selectedFile.value.raw.text()).trim()
      } catch (_) {
        // ignore
      }
    }

    let updatedQuestions = currentTask.value.questions || DEFAULT_DATABASE_QUESTIONS

    if (typed || rawTextFromAnswerFile) {
      // Evaluasi jawaban yang diketik pengguna terhadap soal tugas tersebut
      updatedQuestions = applyUserAnswersToQuestions(
        updatedQuestions,
        rawTextFromAnswerFile,
        perQuestionInputs.value
      )
    } else if (selectedFile.value) {
      // Jika mengunggah file gambar/PDF jawaban pada soal kustom yang belum punya userAnswer
      updatedQuestions = updatedQuestions.map((q) => {
        if (!q.userAnswer) {
          return {
            ...q,
            userAnswer: q.correctAnswer,
            isCorrect: true,
          }
        }
        return q
      })
    }

    const totalQ = updatedQuestions.length || 1
    const correctQ = updatedQuestions.filter((q) => q.isCorrect).length
    const calculatedScore = Math.round((correctQ / totalQ) * 100)

    updateTask(email, taskId, {
      questions: updatedQuestions,
      userScore: calculatedScore,
    })
  }

  // Mode periksa / evaluasi jawaban sesuai Desktop - 13
  router.push({
    path: '/answer',
    query: { id: taskId, mode: 'eval' },
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Back Arrow + Header sesuai Desktop - 6 -->
      <section class="mb-6 flex items-start gap-4">
        <button
          type="button"
          @click="router.back()"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs transition hover:bg-slate-50 cursor-pointer"
        >
          <svg class="h-6 w-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Upload Jawaban
          </h1>
          <p class="mt-1 text-base text-slate-600 sm:text-lg">
            Unggah atau ketik jawabanmu jika kamu ingin mendapatkan poin!
          </p>
        </div>
      </section>

      <!-- Main Box Card sesuai Desktop - 6 -->
      <div class="rounded-3xl border border-[#C5E4FA] bg-white p-8 shadow-xs sm:p-12">
        <div class="grid items-center gap-10 lg:grid-cols-[380px_1fr]">
          <!-- Robot Mascot (Desktop - 6) -->
          <div class="flex items-center justify-center">
            <img
              src="../assets/images/robot_nunjuk.png"
              alt="Mascot EQuest"
              class="max-h-[380px] w-auto object-contain"
            />
          </div>

          <!-- Kanan: Upload & Bubble Ketik Jawaban Area -->
          <div class="space-y-6">
            <div>
              <h2 class="text-2xl font-black text-[#0A2540] sm:text-3xl">
                Unggah atau Ketik Jawaban Kamu
              </h2>
              <p class="mt-1 text-sm text-slate-500 sm:text-base">
                Pilih file jawaban dari perangkatmu atau ketik langsung pada bubble di bawah
              </p>
            </div>

            <!-- Preview Soal yang Sedang Dikerjakan agar tidak tertukar -->
            <div
              v-if="taskQuestions.length > 0"
              class="rounded-2xl border border-[#C5E4FA] bg-[#EAF5FD] p-4 space-y-2"
            >
              <div class="flex items-center justify-between">
                <p class="text-xs font-extrabold uppercase tracking-wider text-[#2D6BE4]">
                  📋 Soal yang Sedang Kamu Kerjakan ({{ taskQuestions.length }} Soal)
                </p>
                <span class="text-[11px] font-bold text-slate-500">
                  {{ currentTask?.fileName || 'Latihan' }}
                </span>
              </div>
              <ul class="max-h-28 overflow-y-auto space-y-1 text-xs font-semibold text-[#0A2540] pr-2">
                <li v-for="(q, idx) in taskQuestions" :key="q.id || idx">
                  <span class="font-black text-[#2D6BE4]">{{ idx + 1 }}.</span> {{ q.question }}
                </li>
              </ul>
            </div>

            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.txt"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- Dashed Drop Area -->
            <div
              @dragover.prevent
              @drop="handleDrop"
              class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#88B8EF] bg-transparent p-7 text-center transition hover:bg-sky-50/50"
            >
              <!-- Cloud Upload Icon -->
              <svg
                class="h-12 w-12 text-[#2D6BE4]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>

              <p class="mt-2.5 text-base font-bold text-[#2D6BE4]">
                Tarik dan letakkan file jawaban di sini
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                atau pilih file dari perangkat
              </p>

              <button
                type="button"
                @click="triggerFileInput"
                class="mt-3.5 rounded-xl bg-[#2D6BE4] px-7 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
              >
                Pilih File
              </button>

              <p class="mt-3 text-xs font-semibold text-slate-400">
                JPG, PNG, PDF &nbsp;|&nbsp; Maks 10 MB
              </p>

              <p v-if="selectedFile" class="mt-2 rounded-xl bg-green-50 px-4 py-1.5 text-xs font-bold text-green-700">
                ✓ File terpilih: {{ selectedFile.name }} ({{ selectedFile.size }})
              </p>
            </div>

            <!-- BUBBLE KETIK JAWABAN LANGSUNG -->
            <div class="space-y-3 rounded-2xl border border-[#C5E4FA] bg-[#F4FAFF] p-5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <label class="flex items-center gap-2 text-xs font-black text-[#0A2540] sm:text-sm">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#2D6BE4] text-xs text-white">💬</span>
                  Atau ketik jawaban kamu di sini
                </label>

                <button
                  v-if="taskQuestions.length > 1"
                  type="button"
                  @click="showPerQuestionBubble = !showPerQuestionBubble"
                  class="text-xs font-bold text-[#2D6BE4] underline hover:text-blue-700 cursor-pointer"
                >
                  {{ showPerQuestionBubble ? 'Gunakan 1 kolom teks gabungan' : 'Ketik per nomor soal (' + taskQuestions.length + ' soal)' }}
                </button>
              </div>

              <!-- Mode 1: Ketik per nomor soal (jika > 1 soal dan diaktifkan) -->
              <div v-if="showPerQuestionBubble && taskQuestions.length > 1" class="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                <div
                  v-for="(q, idx) in taskQuestions"
                  :key="q.id || idx"
                  class="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5"
                >
                  <p class="text-xs font-bold text-[#0A2540]">
                    {{ idx + 1 }}. {{ q.question }}
                  </p>
                  <input
                    v-model="perQuestionInputs[q.id]"
                    type="text"
                    :placeholder="`Ketik jawaban untuk soal nomor ${idx + 1}...`"
                    class="w-full rounded-xl border border-slate-300 bg-[#F8FBFF] px-3.5 py-2 text-xs text-[#0f2852] outline-none transition focus:border-[#2D6BE4] focus:bg-white"
                  />
                </div>
              </div>

              <!-- Mode 2: Bubble Textarea Utama -->
              <div v-else>
                <textarea
                  v-model="answerText"
                  rows="3"
                  :placeholder="
                    taskQuestions.length === 1
                      ? `Ketik jawabanmu untuk soal: &quot;${taskQuestions[0]?.question}&quot;...`
                      : 'Ketik atau tempel jawabanmu di sini (jika lebih dari 1 soal, pisahkan dengan baris baru atau nomor 1. 2. dst)...'
                  "
                  class="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-[#0f2852] shadow-2xs outline-none transition focus:border-[#2D6BE4] placeholder:text-slate-400"
                ></textarea>
              </div>
            </div>

            <p
              v-if="errorMessage"
              class="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600"
            >
              ⚠️ {{ errorMessage }}
            </p>

            <!-- Bagian Bawah: Opsi Langsung Lihat Jawaban & Tombol Lanjutkan -->
            <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div>
                <p class="text-xs font-bold text-[#0A2540]">
                  Atau mau langsung melihat jawaban
                </p>
                <button
                  type="button"
                  @click="handleStudyMode"
                  class="mt-2 rounded-xl border border-[#2D6BE4] bg-white px-6 py-2.5 text-xs font-bold text-[#2D6BE4] transition hover:bg-sky-50 cursor-pointer"
                >
                  Lihat jawaban
                </button>
              </div>

              <div>
                <button
                  type="button"
                  @click="handleContinue"
                  class="rounded-xl bg-[#2D6BE4] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
