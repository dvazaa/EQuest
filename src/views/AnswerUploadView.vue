<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedFile = ref(null)
const errorMessage = ref('')
const isDragging = ref(false)
const maxFileSize = 10 * 1024 * 1024
const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const currentUser = ref(readStorage('equestUser', null))
const isLoggedIn = ref(!!currentUser.value)

function logout() {
  localStorage.removeItem('equestUser')
  currentUser.value = null
  isLoggedIn.value = false
  router.push('/')
}

function handleFile(file) {
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

  selectedFile.value = file
  errorMessage.value = ''
}

function handleFileInput(event) {
  handleFile(event.target.files?.[0])
}

function handleDrop(event) {
  isDragging.value = false
  handleFile(event.dataTransfer.files?.[0])
}

function removeFile() {
  selectedFile.value = null
  errorMessage.value = ''
}

function continueUpload() {
  if (!selectedFile.value) {
    errorMessage.value = 'Pilih file jawaban terlebih dahulu.'
    return
  }

  alert('File jawaban siap dikirim. Fitur pemeriksaan AI akan dihubungkan pada tahap berikutnya.')
}

function viewAnswer() {
  router.push('/answer')
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
            class="text-blue-600"
          >
            Tugas Saya
          </RouterLink>

          <RouterLink
            to="/upload"
            class="text-blue-900/50 hover:text-blue-600"
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

    <main class="px-6 pb-8">
      <!-- Judul -->
      <div class="mb-8 flex items-center gap-5">
        <button
          type="button"
          @click="router.push('/tasks')"
          aria-label="Kembali ke Tugas Saya"
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl hover:bg-sky-50"
        >
          ←
        </button>

        <div>
          <h1 class="text-3xl font-extrabold sm:text-4xl">
            Upload Jawaban
          </h1>
          <p class="mt-2 text-lg text-blue-900/70 sm:text-2xl">
            Unggah jawaban jika kamu ingin mendapatkan poin!
          </p>
        </div>
      </div>

      <!-- Konten utama -->
      <section class="grid min-h-[650px] items-center gap-8 rounded-2xl border border-blue-500 bg-white p-6 lg:grid-cols-[0.8fr_1.6fr] lg:p-10">
        <!-- Robot -->
        <div class="flex items-center justify-center">
          <img
            src="../assets/images/robot_nunjuk.png"
            alt="Robot EQuest"
            class="max-h-[380px] w-full object-contain"
          />
        </div>

        <!-- Area upload -->
        <div class="flex h-full flex-col">
          <h2 class="text-2xl font-extrabold sm:text-3xl">
            Unggah Jawaban Kamu
          </h2>
          <p class="mt-2 text-base text-blue-900/70 sm:text-xl">
            Pilih foto atau file jawaban dari perangkatmu
          </p>

          <div
            v-if="!selectedFile"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            class="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-blue-500 bg-sky-100 p-6 text-center transition"
            :class="isDragging ? 'ring-2 ring-blue-500' : ''"
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
              class="mb-4 block shrink-0 text-black"
            >
              <path d="M8 18H6.5a4.5 4.5 0 0 1-.5-8.97" />
              <path d="M6 9.03A6 6 0 0 1 17.5 8.3 4.5 4.5 0 0 1 18 18h-2" />
              <path d="M12 19V10" />
              <path d="m8.5 13.5 3.5-3.5 3.5 3.5" />
            </svg>

            <p class="text-lg font-bold text-blue-600 sm:text-2xl">
              Tarik dan letakkan file di sini
            </p>
            <p class="mt-1 text-base text-blue-900/70 sm:text-xl">
              atau pilih file dari perangkat
            </p>

            <label class="mt-3 cursor-pointer rounded-xl bg-blue-500 px-10 py-3 text-xl text-white hover:bg-blue-600">
              Pilih File
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                class="hidden"
                @change="handleFileInput"
              />
            </label>

            <p class="mt-4 text-base text-blue-900/70 sm:text-xl">
              JPG, PNG, PDF &nbsp; | &nbsp; Maks 10 MB
            </p>
          </div>

          <!-- File terpilih -->
          <div
            v-else
            class="mt-8 flex min-h-[180px] flex-wrap items-center gap-4 rounded-2xl border border-blue-500 bg-sky-100 p-6"
          >
            <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-blue-400 bg-white text-4xl">
              📄
            </div>

            <div class="min-w-0 flex-1">
              <p class="break-all text-lg font-medium">
                {{ selectedFile.name }}
              </p>
              <p class="mt-1 text-sm text-blue-900/70">
                {{ selectedFile.name.split('.').pop().toUpperCase() }}
                · {{ (selectedFile.size / 1024).toFixed(0) }} KB
              </p>
            </div>

            <button
              type="button"
              @click="removeFile"
              class="text-red-600 hover:underline"
            >
              Hapus
            </button>
          </div>

          <p v-if="errorMessage" class="mt-3 text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-col items-start gap-3">
              <p class="font-bold sm:text-xl">
                Atau mau langsung melihat jawaban
              </p>
              <button
                type="button"
                @click="viewAnswer"
                class="rounded-xl border border-blue-500 px-4 py-3 text-lg text-blue-600 hover:bg-sky-50"
              >
                Lihat jawaban
              </button>
            </div>

            <button
              type="button"
              @click="continueUpload"
              :disabled="!selectedFile"
              class="rounded-xl px-8 py-4 text-lg text-white transition"
              :class="selectedFile ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-blue-300'"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>