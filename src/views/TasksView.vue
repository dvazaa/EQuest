<script setup>
import { computed, ref, onMounted } from 'vue'
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
const tasks = ref([])
const searchQuery = ref('')
const selectedStatus = ref('Semua Status')

const isLoggedIn = computed(() => !!currentUser.value)

const statusOptions = [
  { label: 'Semua Status', value: 'Semua Status' },
  { label: 'Sedang Dikerjakan', value: 'Sedang Dikerjakan' },
  { label: 'Selesai', value: 'Selesai' },
]

function getTaskStorageKey() {
  const email = currentUser.value?.email?.trim().toLowerCase()

  return email
    ? `equestTasks_${encodeURIComponent(email)}`
    : 'equestTasks_guest'
}

function loadUserTasks() {
  const key = getTaskStorageKey()
  let saved = localStorage.getItem(key)

  // Pindahkan data tugas lama ke akun yang sedang digunakan,
  // jika akun tersebut belum memiliki daftar tugas tersendiri.
  if (saved === null && localStorage.getItem('equestTasks') !== null) {
    saved = localStorage.getItem('equestTasks')
    localStorage.setItem(key, saved)
    localStorage.removeItem('equestTasks')
  }

  try {
    const parsedTasks = JSON.parse(saved || '[]')
    tasks.value = Array.isArray(parsedTasks) ? parsedTasks : []
  } catch {
    tasks.value = []
  }
}

onMounted(() => {
  loadUserTasks()
})

const filteredTasks = computed(() => {
  return tasks.value.filter((task) => {
    const matchesSearch = (task.name || '')
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase())

    const matchesStatus =
      selectedStatus.value === 'Semua Status' ||
      task.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})

function uploadTask() {
  router.push('/upload')
}

function openTask(task) {
  router.push({
    path: '/task-choice',
    query: { id: task.id },
  })
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

    <main class="space-y-5 px-6 pb-8">
      <!-- Judul dan kontrol pencarian -->
      <section class="mb-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 class="text-3xl font-extrabold sm:text-4xl">
            Tugas Saya
          </h1>

          <p class="mt-3 text-lg text-blue-900/70 sm:text-2xl">
            Lihat dan lanjutkan tugas yang sedang atau pernah kamu kerjakan
          </p>
        </div>

        <div v-if="tasks.length > 0" class="flex flex-wrap gap-4">
          <label class="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              v-model="searchQuery"
              type="search"
              placeholder="Cari tugas..."
              class="w-48 outline-none"
            />
          </label>

          <select
            v-model="selectedStatus"
            class="rounded-2xl bg-white px-4 py-3 font-semibold outline-none"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </section>

      <!-- Tampilan jika belum ada tugas -->
      <section
        v-if="tasks.length === 0"
        class="grid min-h-[520px] items-center gap-8 rounded-2xl border border-blue-500 bg-white p-8 lg:grid-cols-2 lg:px-16"
      >
        <div class="flex items-center justify-center">
          <img
            src="../assets/images/robot_bingung.png"
            alt="Robot EQuest sedang bingung karena belum ada tugas"
            class="max-h-[380px] w-full object-contain"
          />
        </div>

        <div class="flex flex-col gap-8">
          <div>
            <h2 class="text-3xl font-extrabold sm:text-4xl">
              Belum ada tugas
            </h2>

            <p class="mt-4 text-lg text-blue-900/70 sm:text-xl">
              Mulai dengan mengunggah soal atau tugas untuk mendapatkan
              bantuan AI dan mulai belajar.
            </p>
          </div>

          <button
            type="button"
            @click="uploadTask"
            class="w-full rounded-2xl bg-blue-600 px-6 py-5 text-xl text-white transition hover:bg-blue-700 sm:text-2xl"
          >
            Upload Soal Sekarang
          </button>
        </div>
      </section>

      <!-- Daftar tugas -->
      <section v-else class="space-y-0">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="grid items-center gap-4 rounded-2xl border border-blue-500 bg-white px-6 py-4 sm:grid-cols-[minmax(0,1fr)_150px_188px]"
        >
          <div class="min-w-0">
            <h2 class="break-words text-xl font-bold sm:text-2xl">
              {{ task.name || task.fileName || 'Tugas tanpa nama' }}
            </h2>

            <p class="mt-1 text-base text-blue-900/70 sm:text-xl">
              {{ task.questionCount }} soal
              &nbsp; | &nbsp;
              Diunggah {{ task.uploadDate }}
            </p>
          </div>

          <div class="flex justify-start sm:justify-center">
            <span
              class="rounded-full px-3 py-1 text-center text-sm"
              :class="
                task.status === 'Selesai'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-blue-100 text-blue-600'
              "
            >
              {{ task.status }}
            </span>
          </div>

          <button
            type="button"
            @click="openTask(task)"
            class="rounded-xl px-5 py-3 text-lg transition sm:text-2xl"
            :class="
              task.status === 'Selesai'
                ? 'bg-sky-100 text-blue-600 hover:bg-sky-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            {{ task.status === 'Selesai' ? 'Lihat Hasil' : 'Periksa' }}
          </button>
        </div>

        <p
          v-if="filteredTasks.length === 0"
          class="rounded-2xl border border-blue-500 bg-white p-8 text-center text-lg text-blue-900/70"
        >
          Tidak ada tugas yang cocok dengan pencarian atau status tersebut.
        </p>
      </section>
    </main>
  </div>
</template>