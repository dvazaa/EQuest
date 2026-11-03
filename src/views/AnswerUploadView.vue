<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { getCurrentUser, getUserTasks, updateTask } from '../utils/equestState'

const router = useRouter()
const route = useRoute()
const taskId = route.query.taskId || '1'

const fileInput = ref(null)
const selectedFile = ref(null)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (file) {
    selectedFile.value = {
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
      raw: file,
    }
  }
}

function handleDrop(event) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    selectedFile.value = {
      name: file.name,
      size: (file.size / 1024).toFixed(0) + ' KB',
      type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
      raw: file,
    }
  }
}

function handleStudyMode() {
  // Mode langsung melihat jawaban sesuai Desktop - 10
  router.push({
    path: '/answer',
    query: { id: taskId, mode: 'study' },
  })
}

function handleContinue() {
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
            Unggah jawaban jika kamu ingin mendapatkan poin!
          </p>
        </div>
      </section>

      <!-- Main Box Card sesuai Desktop - 6 -->
      <div class="rounded-3xl border border-[#C5E4FA] bg-white p-8 shadow-xs sm:p-12">
        <div class="grid items-center gap-10 lg:grid-cols-[400px_1fr]">
          <!-- Robot Mascot (Desktop - 6) -->
          <div class="flex items-center justify-center">
            <img
              src="../assets/images/robot_nunjuk.png"
              alt="Mascot EQuest"
              class="max-h-[380px] w-auto object-contain"
            />
          </div>

          <!-- Kanan: Upload Jawaban Area -->
          <div class="space-y-6">
            <div>
              <h2 class="text-2xl font-black text-[#0A2540] sm:text-3xl">
                Unggah Jawaban Kamu
              </h2>
              <p class="mt-1 text-sm text-slate-500 sm:text-base">
                Pilih foto atau file jawaban dari perangkatmu
              </p>
            </div>

            <!-- Hidden File Input -->
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              class="hidden"
              @change="handleFileChange"
            />

            <!-- Dashed Drop Area -->
            <div
              @dragover.prevent
              @drop="handleDrop"
              class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#88B8EF] bg-transparent p-10 text-center transition hover:bg-sky-50/50"
            >
              <!-- Cloud Upload Icon -->
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
                class="mt-4 rounded-xl bg-[#2D6BE4] px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
              >
                Pilih File
              </button>

              <p class="mt-4 text-xs font-semibold text-slate-400">
                JPG, PNG, PDF &nbsp;|&nbsp; Maks 10 MB
              </p>

              <p v-if="selectedFile" class="mt-2 text-xs font-bold text-green-600">
                ✓ File terpilih: {{ selectedFile.name }} ({{ selectedFile.size }})
              </p>
            </div>

            <!-- Bagian Bawah: Opsi Langsung Lihat Jawaban & Tombol Lanjutkan -->
            <div class="flex flex-wrap items-center justify-between gap-4 pt-4">
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
