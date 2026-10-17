<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

function logout() {
  localStorage.removeItem('equestUser')
  currentUser.value = null
  router.push('/')
}

const selectedFile = ref(null)
const questionText = ref('')
const errorMessage = ref('')
const isDragging = ref(false)


const maxFileSize = 10 * 1024 * 1024
const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']

const canContinue = computed(() => {
  return selectedFile.value !== null || questionText.value.trim().length > 0
})

const fileSize = computed(() => {
  if (!selectedFile.value) return ''

  const size = selectedFile.value.size

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(0)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
})

const fileType = computed(() => {
  if (!selectedFile.value) return ''

  const extension = selectedFile.value.name.split('.').pop()
  return extension.toUpperCase()
})

function handleFile(file) {
  errorMessage.value = ''

  if (!file) return

  const extension = file.name.split('.').pop().toLowerCase()

  if (!allowedExtensions.includes(extension)) {
    errorMessage.value = 'Format file harus JPG, PNG, atau PDF.'
    return
  }

  if (file.size > maxFileSize) {
    errorMessage.value = 'Ukuran file maksimal 10 MB.'
    return
  }

  if (file.size === 0) {
    errorMessage.value = 'File kosong. Silakan pilih file lain.'
    return
  }

  selectedFile.value = file
}

function handleFileInput(event) {
  handleFile(event.target.files[0])
  event.target.value = ''
}

function handleDrop(event) {
  isDragging.value = false
  handleFile(event.dataTransfer.files[0])
}

function goBack() {
  selectedFile.value = null
  errorMessage.value = ''
}

const isAnalyzing = ref(false)

async function continueUpload() {
  if (!canContinue.value || isAnalyzing.value) return

  errorMessage.value = ''
  isAnalyzing.value = true

  try {
    const formData = new FormData()

    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }

    if (questionText.value.trim()) {
      formData.append('questionText', questionText.value.trim())
    }

    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!response.ok || !result.answer) {
      throw new Error(result.message || 'Analisis soal gagal.')
    }

    const user = JSON.parse(localStorage.getItem('equestUser') || 'null')

    if (!user?.email) {
      throw new Error('Silakan login terlebih dahulu.')
    }

    const taskStorageKey = `equestTasks_${encodeURIComponent(
      user.email.trim().toLowerCase()
    )}`

    const savedTasks = JSON.parse(
      localStorage.getItem(taskStorageKey) || '[]'
    )

    const task = {
      id: Date.now(),
      name: selectedFile.value
        ? selectedFile.value.name
        : questionText.value.trim().slice(0, 50),
      questionCount: 1,
      uploadDate: new Date().toLocaleDateString('id-ID'),
      status: 'Sedang Dikerjakan',
      questionText: questionText.value.trim(),
      fileName: selectedFile.value?.name || '',
      answer: result.answer,
    }

    savedTasks.unshift(task)

    localStorage.setItem(taskStorageKey, JSON.stringify(savedTasks))

    await router.push('/tasks')
  } catch (error) {
    console.error('Gagal menganalisis soal:', error)
    errorMessage.value =
      error.message || 'Gagal menghubungkan ke Gemini. Coba lagi.'
  } finally {
    isAnalyzing.value = false
  }
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 text-blue-950">
    <!-- Navbar -->
    <header class="bg-sky-100 px-6 py-5">
      <nav class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <RouterLink to="/" class="flex items-center gap-3">
          <span class="text-5xl">📚</span>
          <span class="text-4xl font-extrabold text-black">EQuest</span>
        </RouterLink>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-lg font-bold">
          <RouterLink
            to="/"
            class="text-blue-900/50 hover:text-blue-600"
          >
            Beranda
          </RouterLink>

          <RouterLink
            to="/tasks"
            class="text-blue-900/50 hover:text-blue-600"
          >
            Tugas Saya
          </RouterLink>

          <RouterLink
            to="/upload"
            class="text-blue-600"
          >
            Upload Soal
          </RouterLink>

          <span class="cursor-not-allowed text-blue-900/40">
            Blind Box
          </span>

          <span class="cursor-not-allowed text-blue-900/40">
            Progress
          </span>

          <span class="cursor-not-allowed text-blue-900/40">
            Riwayat
          </span>
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

    <main class="px-6 pb-8 pt-5">
      <h1 class="text-3xl font-extrabold sm:text-4xl">Upload Soal</h1>
      <p class="mt-3 text-lg text-blue-900/70 sm:text-2xl">
        Unggah soal yang ingin kamu kerjakan dan pahami bersama AI
      </p>

      <!-- Panel upload -->
      <section
        class="mt-6 grid min-h-[650px] gap-6 rounded-2xl border border-blue-500 bg-white p-6 sm:p-8 lg:grid-cols-5 lg:items-center"
      >
        <!-- Ilustrasi robot -->
        <div class="flex items-center justify-center lg:col-span-2">
        <img
        src="../assets/images/robot_nunjuk.png"
        alt="Robot EQuest membantu mengunggah soal"
        class="max-h-[380px] w-full object-contain"
        />
        </div>

        <!-- Tampilan sebelum file dipilih -->
        <div v-if="!selectedFile" class="lg:col-span-3">
          <h2 class="text-2xl font-extrabold sm:text-3xl">
            Unggah Soal Kamu
          </h2>

          <p class="mt-2 text-lg text-blue-900/70">
            Pilih foto atau file tugas dari perangkatmu
          </p>

          <!-- Area pilih atau drop file -->
          <div
            class="mt-8 rounded-2xl border border-dashed border-blue-500 bg-sky-100/80 px-4 py-8 text-center transition sm:py-10"
            :class="{ 'bg-blue-100 ring-2 ring-blue-400': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mx-auto mb-4 block shrink-0"
            >
              <!-- Garis awan kiri -->
              <path d="M8 18H6.5a4.5 4.5 0 0 1-.5-8.97" />

              <!-- Garis atas awan dan sisi kanan -->
              <path d="M6 9.03A6 6 0 0 1 17.5 8.3 4.5 4.5 0 0 1 18 18h-2" />

              <!-- Batang panah -->
              <path d="M12 19V10" />

              <!-- Kepala panah -->
              <path d="m8.5 13.5 3.5-3.5 3.5 3.5" />
            </svg>

            <p class="mt-0 text-base font-bold text-blue-600 sm:text-xl">
              Tarik dan letakkan file di sini
            </p>

            <p class="mt-1 text-blue-900/70 sm:text-lg">
              atau pilih file dari perangkat
            </p>

            <label
              class="mx-auto mt-2 block w-fit cursor-pointer rounded-xl bg-blue-600 px-12 py-3 text-lg text-white hover:bg-blue-700"
            >
              Pilih File
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                class="hidden"
                @change="handleFileInput"
              />
            </label>

            <p class="mt-4 text-sm text-blue-900/70 sm:text-lg">
              JPG, PNG, PDF &nbsp; | &nbsp; Maks. 10 MB
            </p>
          </div>

          <label for="question-text" class="mt-5 block font-bold sm:text-lg">
            Atau tempel teks soal
          </label>

          <textarea
            id="question-text"
            v-model="questionText"
            rows="3"
            placeholder="Ketik atau tempel soal di sini..."
            class="mt-2 w-full resize-y rounded-2xl border-2 border-sky-200 px-4 py-3 outline-none placeholder:text-blue-800/50 focus:border-blue-400"
          ></textarea>

          <p v-if="errorMessage" class="mt-2 text-sm font-semibold text-red-600">
            {{ errorMessage }}
          </p>

          <div class="mt-4 flex justify-end">
            <button
              type="button"
              :disabled="!canContinue || isAnalyzing"
              class="rounded-xl px-8 py-3 text-lg text-white transition"
              :class="
                canContinue
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'cursor-not-allowed bg-blue-300'
              "
              @click="continueUpload"
            >
              {{ isAnalyzing ? 'Sedang Menganalisis...' : 'Lanjutkan' }}
            </button>
          </div>
        </div>

        <!-- Tampilan setelah file dipilih -->
        <div v-else class="flex min-h-[560px] flex-col lg:col-span-3">
          <h2 class="text-2xl font-extrabold sm:text-3xl">
            Soal Berhasil Diunggah
          </h2>

          <p class="mt-2 text-lg text-blue-900/70">
            File kamu siap diperiksa
          </p>

          <div
            class="mt-8 flex flex-wrap items-center gap-5 rounded-2xl border border-blue-500 bg-sky-100/80 p-5 sm:px-8 sm:py-7"
          >
            <div
              class="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-blue-400 bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="54"
                height="54"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8M8 17h8M8 9h2" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <p class="break-words text-base text-blue-900/75 sm:text-xl">
                {{ selectedFile.name }}
              </p>
              <p class="mt-1 text-sm text-blue-900/60">
                {{ fileType }} &bull; {{ formatBytes(selectedFile.size) }}
              </p>
            </div>

            <button
              type="button"
              class="text-sm font-semibold text-red-600 hover:underline"
              @click="goBack"
            >
              Hapus
            </button>
          </div>

          <p v-if="questionText.trim()" class="mt-5 text-sm text-blue-900/70">
            Teks soal tambahan sudah dimasukkan.
          </p>

          <p v-if="errorMessage" class="mt-3 text-sm font-semibold text-red-600">
            {{ errorMessage }}
          </p>

          <div class="mt-auto flex flex-wrap justify-end gap-4 pt-10">
            <button
              type="button"
              class="rounded-xl border border-blue-500 px-8 py-3 text-lg text-blue-600 hover:bg-sky-50"
              @click="goBack"
            >
              Kembali
            </button>

            <button
              type="button"
              class="rounded-xl bg-blue-600 px-8 py-3 text-lg text-white hover:bg-blue-700"
              @click="continueUpload"
            >
              {{ isAnalyzing ? 'Sedang Menganalisis...' : 'Lanjutkan' }}
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>