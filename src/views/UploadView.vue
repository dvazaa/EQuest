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
  DEFAULT_DATABASE_QUESTIONS,
} from '../utils/equestState'

const router = useRouter()
const fileInput = ref(null)
const selectedFile = ref(null)
const questionText = ref('')
const isUploaded = ref(false)

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
}

async function handleContinue() {
  const user = getCurrentUser()
  if (!user?.email) {
    router.push('/login')
    return
  }

  const email = user.email
  const existingTasks = getUserTasks(email)

  const newTaskId = Date.now()
  const fileName =
    selectedFile.value?.name ||
    (questionText.value.trim() ? 'Soal_Teks_Latihan.txt' : 'soal_latihan.pdf')
  const fileType = selectedFile.value?.type || 'PDF'
  const fileSize = selectedFile.value?.size || '245 KB'

  const newTask = {
    id: newTaskId,
    name: fileName,
    fileName: fileName,
    fileSize: fileSize,
    fileType: fileType,
    questionCount: 10,
    uploadDate: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status: 'Sedang Dikerjakan',
    remainingAttempts: 2,
    questions: JSON.parse(JSON.stringify(DEFAULT_DATABASE_QUESTIONS)),
    userScore: 80,
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

    <main class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Judul Halaman sesuai Desktop - 4 & 5 -->
      <section class="mb-6">
        <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
          Upload Soal
        </h1>
        <p class="mt-1 text-base text-slate-600 sm:text-lg">
          Unggah soal yang ingin kamu kerjakan dan pahami bersama AI
        </p>
      </section>

      <!-- Main Box Container Card -->
      <div class="rounded-3xl border border-[#C5E4FA] bg-white p-8 shadow-xs sm:p-12">
        <div class="grid items-center gap-10 lg:grid-cols-[400px_1fr]">
          <!-- Robot Mascot (Desktop - 4 & 5) -->
          <div class="flex items-center justify-center">
            <img
              src="../assets/images/robot_nunjuk.png"
              alt="Mascot EQuest"
              class="max-h-[380px] w-auto object-contain"
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

            <!-- Kondisi 1: Tampilan File Berhasil Diunggah (Desktop - 5) -->
            <div v-if="isUploaded" class="space-y-6">
              <div>
                <h2 class="text-2xl font-black text-[#0A2540] sm:text-3xl">
                  Soal Berhasil Diunggah
                </h2>
                <p class="mt-1 text-sm text-slate-500 sm:text-base">
                  File kamu siap diperiksa
                </p>
              </div>

              <!-- File Info Card (Desktop - 5) -->
              <div class="flex items-center gap-5 rounded-2xl bg-[#EAF5FD] p-6 sm:p-8">
                <div class="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white shadow-2xs">
                  <svg
                    class="h-8 w-8 text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div>
                  <p class="text-base font-bold text-[#0A2540] sm:text-lg">
                    {{ selectedFile?.name }} &bull; {{ selectedFile?.type }} &bull; {{ selectedFile?.size }}
                  </p>
                </div>
              </div>

              <!-- Tombol Aksi (Desktop - 5) -->
              <div class="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  @click="handleReset"
                  class="rounded-xl border border-[#2D6BE4] bg-white px-7 py-3 text-sm font-bold text-[#2D6BE4] transition hover:bg-sky-50"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  @click="handleContinue"
                  class="rounded-xl bg-[#2D6BE4] px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                >
                  Lanjutkan
                </button>
              </div>
            </div>

            <!-- Kondisi 2: Form Upload Awal (Desktop - 4) -->
            <div v-else class="space-y-6">
              <div>
                <h2 class="text-2xl font-black text-[#0A2540] sm:text-3xl">
                  Unggah Soal Kamu
                </h2>
                <p class="mt-1 text-sm text-slate-500 sm:text-base">
                  Pilih foto atau file tugas dari perangkatmu
                </p>
              </div>

              <!-- Dashed Drop Area (Desktop - 4) -->
              <div
                @dragover.prevent
                @drop="handleDrop"
                class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#88B8EF] bg-transparent p-8 text-center transition hover:bg-sky-50/50"
              >
                <!-- Upload Cloud Icon -->
                <svg
                  class="h-14 w-14 text-[#2D6BE4]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p class="mt-3 text-base font-bold text-[#2D6BE4]">
                  Tarik dan letakkan file di sini
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  atau pilih file dari perangkat
                </p>

                <button
                  type="button"
                  @click="triggerFileInput"
                  class="mt-4 rounded-xl bg-[#2D6BE4] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                >
                  Pilih File
                </button>

                <p class="mt-4 text-xs font-semibold text-slate-400">
                  JPG, PNG, PDF &nbsp;|&nbsp; Maks 10 MB
                </p>
              </div>

              <!-- Input Alternatif Teks Soal (Desktop - 4) -->
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#0A2540]">
                  Atau tempel teks soal
                </label>
                <textarea
                  v-model="questionText"
                  rows="3"
                  placeholder="Ketik atau tempel soal disini..."
                  class="w-full rounded-2xl border border-slate-300 p-4 text-sm text-[#0f2852] outline-none transition focus:border-[#2D6BE4] placeholder:text-slate-400"
                ></textarea>
              </div>

              <!-- Tombol Lanjutkan -->
              <div class="flex justify-end pt-2">
                <button
                  type="button"
                  @click="handleContinue"
                  class="rounded-xl px-8 py-3 text-sm font-bold text-white transition shadow-sm"
                  :class="
                    selectedFile || questionText.trim()
                      ? 'bg-[#2D6BE4] hover:bg-blue-700 cursor-pointer'
                      : 'bg-[#A3C4F3] cursor-pointer hover:bg-[#2D6BE4]'
                  "
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
