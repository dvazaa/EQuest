<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserTasks,
  saveUserTasks,
  getUserStats,
  saveUserStats,
  buildQuestionsFromText,
  DEFAULT_DATABASE_QUESTIONS,
} from '../utils/equestState'

const router = useRouter()
const fileInput = ref(null)
const selectedFile = ref(null)
const questionText = ref('')
const isUploaded = ref(false)
const isAnalyzing = ref(false)
const errorMessage = ref('')

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
    isUploaded.value = true
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
    isUploaded.value = true
  }
}

function handleReset() {
  selectedFile.value = null
  isUploaded.value = false
  questionText.value = ''
  errorMessage.value = ''
}

async function handleContinue() {
  const user = getCurrentUser()
  if (!user?.email) {
    router.push('/login')
    return
  }

  const trimmedText = questionText.value.trim()
  if (!selectedFile.value && !trimmedText) {
    errorMessage.value = 'Silakan unggah file soal atau ketik teks soal terlebih dahulu.'
    return
  }

  errorMessage.value = ''
  isAnalyzing.value = true

  let extractedText = trimmedText
  // Jika pengguna mengunggah file .txt, baca isi teksnya secara langsung
  if (!extractedText && selectedFile.value?.raw && selectedFile.value.name.toLowerCase().endsWith('.txt')) {
    try {
      extractedText = (await selectedFile.value.raw.text()).trim()
    } catch (_) {
      // Abaikan jika gagal membaca teks
    }
  }

  // Bangun daftar soal sesuai persis dengan yang diketik pengguna
  let taskQuestions = extractedText
    ? buildQuestionsFromText(extractedText)
    : JSON.parse(JSON.stringify(DEFAULT_DATABASE_QUESTIONS))

  // Coba hubungi backend AI (/api/analyze) jika server aktif & memiliki Gemini API Key
  if (extractedText || selectedFile.value?.raw) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6000)

      const formData = new FormData()
      if (extractedText) formData.append('questionText', extractedText)
      if (selectedFile.value?.raw) formData.append('file', selectedFile.value.raw)

      const res = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          taskQuestions = data.questions
        }
      }
    } catch (_) {
      // Gunakan hasil buildQuestionsFromText lokal yang cepat dan akurat
    }
  }

  const email = user.email
  const existingTasks = getUserTasks(email)

  const newTaskId = Date.now()
  const shortTitle = extractedText
    ? `Soal: ${taskQuestions[0]?.question?.slice(0, 35) || 'Latihan'}${taskQuestions[0]?.question?.length > 35 ? '...' : ''}`
    : null
  const fileName = selectedFile.value?.name || shortTitle || 'soal_latihan.pdf'
  const fileType = selectedFile.value?.type || (extractedText ? 'TEKS' : 'PDF')
  const fileSize = selectedFile.value?.size || `${Math.max(1, Math.ceil((extractedText.length || 500) / 1024))} KB`

  const newTask = {
    id: newTaskId,
    name: fileName,
    fileName: fileName,
    fileSize: fileSize,
    fileType: fileType,
    rawQuestionText: extractedText,
    questionCount: taskQuestions.length,
    uploadDate: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status: 'Sedang Dikerjakan',
    remainingAttempts: 2,
    questions: taskQuestions,
    userScore: 0,
  }

  existingTasks.unshift(newTask)
  saveUserTasks(email, existingTasks)

  // Update statistik unggahan berkas & streak aktif pengguna ini
  const stats = getUserStats(email)
  stats.filesUploaded = (stats.filesUploaded || 0) + 1
  stats.activityMonth = (stats.activityMonth || 0) + 1
  if ((stats.streak || 0) === 0) {
    stats.streak = 1
  }
  saveUserStats(email, stats)

  isAnalyzing.value = false

  // Arahkan ke Desktop - 6 (Upload Jawaban)
  router.push({
    path: '/answer-upload',
    query: { taskId: newTaskId },
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1280px] px-6 pb-12 pt-6 sm:px-8">
      <!-- Judul Halaman -->
      <section class="mb-6">
        <h1 class="text-2xl font-semibold text-[#0A2540]">
          Upload Soal
        </h1>
        <p class="mt-1 text-xs text-slate-600 sm:text-sm">
          Unggah soal yang ingin kamu kerjakan dan pahami bersama AI
        </p>
      </section>

      <!-- Main Box Container Card -->
      <div class="rounded-3xl border border-[#C5E4FA] bg-white p-7 shadow-2xs sm:p-10">
        <div class="grid items-center gap-10 lg:grid-cols-[360px_1fr]">
          <!-- Robot Mascot -->
          <div class="flex items-center justify-center">
            <img
              src="../assets/images/robot_nunjuk.png"
              alt="Mascot EQuest"
              class="max-h-[340px] w-auto object-contain"
            />
          </div>

          <!-- Kanan: Form Upload / Status Uploaded -->
          <div>
            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- Kondisi 1: Tampilan File Berhasil Diunggah -->
            <div v-if="isUploaded" class="space-y-6">
              <div>
                <h2 class="text-lg font-semibold text-[#0A2540] sm:text-xl">
                  Soal Berhasil Diunggah
                </h2>
                <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                  File kamu siap diperiksa
                </p>
              </div>

              <!-- File Info Card -->
              <div class="flex items-center gap-5 rounded-2xl bg-[#EAF5FD] p-6">
                <div class="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-2xs">
                  <svg
                    class="h-7 w-7 text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div>
                  <p class="text-sm font-semibold text-[#0A2540] sm:text-base">
                    {{ selectedFile?.name }} &bull; {{ selectedFile?.type }} &bull; {{ selectedFile?.size }}
                  </p>
                </div>
              </div>

              <!-- Tombol Aksi -->
              <div class="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  @click="handleReset"
                  class="rounded-xl border border-[#2D6BE4] bg-white px-6 py-2.5 text-sm font-medium text-[#2D6BE4] transition hover:bg-sky-50 cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  @click="handleContinue"
                  class="rounded-xl bg-[#2D6BE4] px-7 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                >
                  Lanjutkan
                </button>
              </div>
            </div>

            <!-- Kondisi 2: Form Upload Awal -->
            <div v-else class="space-y-6">
              <div>
                <h2 class="text-lg font-semibold text-[#0A2540] sm:text-xl">
                  Unggah Soal Kamu
                </h2>
                <p class="mt-1 text-xs text-slate-500 sm:text-sm">
                  Pilih foto atau file tugas dari perangkatmu
                </p>
              </div>

              <!-- Dashed Drop Area -->
              <div
                @dragover.prevent
                @drop="handleDrop"
                class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#88B8EF] bg-transparent p-8 text-center transition hover:bg-sky-50/50"
              >
                <!-- Upload Cloud Icon -->
                <svg
                  class="h-12 w-12 text-[#2D6BE4]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p class="mt-3 text-sm font-semibold text-[#2D6BE4] sm:text-base">
                  Tarik dan letakkan file di sini
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  atau pilih file dari perangkat
                </p>

                <button
                  type="button"
                  @click="triggerFileInput"
                  class="mt-4 rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                >
                  Pilih File
                </button>

                <p class="mt-4 text-xs font-medium text-slate-400">
                  JPG, PNG, PDF &nbsp;|&nbsp; Maks 10 MB
                </p>
              </div>

              <!-- Input Alternatif Teks Soal -->
              <div class="space-y-2">
                <label class="text-xs font-medium text-[#0A2540]">
                  Atau tempel teks soal
                </label>
                <textarea
                  v-model="questionText"
                  rows="3"
                  placeholder="Ketik atau tempel soal disini (bisa 1 soal atau beberapa soal bernomor 1. 2. dst)..."
                  class="w-full rounded-2xl border border-slate-300 bg-[#F8FBFF] p-4 text-sm text-[#0f2852] outline-none transition focus:border-[#2D6BE4] focus:bg-white placeholder:text-slate-400"
                ></textarea>
              </div>

              <p
                v-if="errorMessage"
                class="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600"
              >
                ⚠️ {{ errorMessage }}
              </p>

              <!-- Tombol Lanjutkan -->
              <div class="flex justify-end pt-2">
                <button
                  type="button"
                  :disabled="isAnalyzing"
                  @click="handleContinue"
                  class="rounded-xl px-7 py-2.5 text-sm font-medium text-white transition shadow-sm"
                  :class="
                    selectedFile || questionText.trim()
                      ? 'bg-[#2D6BE4] hover:bg-blue-700 cursor-pointer'
                      : 'bg-[#A3C4F3] cursor-pointer hover:bg-[#2D6BE4]'
                  "
                >
                  {{ isAnalyzing ? 'Memproses Soal...' : 'Lanjutkan' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
