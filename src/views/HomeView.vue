<script setup>
import { ref, computed } from 'vue'
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
const tasks = ref(readStorage('equestTasks', []))

const isLoggedIn = computed(() => !!currentUser.value)

const latestTask = computed(() => {
  if (!Array.isArray(tasks.value) || tasks.value.length === 0) {
    return null
  }

  return [...tasks.value].sort(
    (a, b) => Number(b.id) - Number(a.id)
  )[0]
})

const continueTarget = computed(() => {
  if (!isLoggedIn.value) return '/login'

  if (!latestTask.value) return '/upload'

  return {
    path: '/answer-upload',
    query: { id: latestTask.value.id },
  }
})

function logout() {
  localStorage.removeItem('equestUser')
  currentUser.value = null
  router.push('/')
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
          <RouterLink to="/" class="text-blue-600">
            Beranda
          </RouterLink>

          <RouterLink to="/tasks" class="text-blue-900/50 hover:text-blue-600">
            Tugas Saya
          </RouterLink>

          <RouterLink to="/upload" class="text-blue-900/50 hover:text-blue-600">
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

        <!-- Langkah 4: Login atau profil pengguna -->
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
      <!-- Bagian utama -->
      <section class="grid items-center gap-6 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <img
            src="../assets/images/beranda.png"
            alt="Ilustrasi siswa belajar bersama robot AI"
            class="h-[300px] w-full object-cover sm:h-[380px] lg:h-[452px]"
          />
        </div>

        <div class="py-4 lg:col-span-2">
          <p class="text-xl font-bold text-blue-900/70">
            Halo, Selamat Datang!
          </p>

          <h1 class="mt-1 text-4xl font-extrabold leading-tight sm:text-5xl">
            Belajar Jadi Lebih Seru dengan EQuest!
          </h1>

          <p class="mt-3 text-lg leading-snug text-blue-900/70 sm:text-2xl">
            Kerjakan soal, dapatkan bantuan AI, dan kumpulkan reward menarik
            di setiap langkah belajarmu.
          </p>

          <div class="mt-8 flex justify-center">
            <RouterLink
              :to="isLoggedIn ? '/tasks' : '/login'"
              class="rounded-3xl bg-blue-600 px-12 py-5 text-center text-xl font-bold text-white transition hover:bg-blue-700 sm:text-3xl"
            >
              Mulai Belajar
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Statistik -->
      <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-2xl bg-white px-6 py-4">
          <p class="text-lg sm:text-2xl">Total XP:</p>
          <p class="text-4xl font-extrabold text-black sm:text-5xl">0</p>
        </div>

        <div class="rounded-2xl bg-white px-6 py-4">
          <p class="text-lg sm:text-2xl">Tiket Blind Box:</p>
          <p class="text-4xl font-extrabold text-black sm:text-5xl">0</p>
        </div>

        <div class="rounded-2xl bg-white px-6 py-4">
          <p class="text-lg sm:text-2xl">Hari Streak:</p>
          <p class="text-4xl font-extrabold text-black sm:text-5xl">0</p>
        </div>

        <div class="rounded-2xl bg-white px-6 py-4">
          <p class="text-lg sm:text-2xl">Soal Selesai:</p>
          <p class="text-4xl font-extrabold text-black sm:text-5xl">0</p>
        </div>
      </section>

      <!-- Lanjutkan belajar dan fitur -->
      <section class="grid gap-6 lg:grid-cols-[1.1fr_2.1fr]">
        <!-- Lanjutkan belajar -->
        <div>
          <h2 class="mb-3 text-2xl font-extrabold">
            Lanjutkan Belajar
          </h2>

          <div class="flex min-h-52 flex-col justify-between rounded-2xl bg-white p-6">
            <p class="break-words text-2xl font-bold sm:text-3xl">
              {{ latestTask ? latestTask.name : 'Mulai perjalanan belajarmu' }}
            </p>

            <div class="mt-5 flex justify-end">
              <RouterLink
                :to="continueTarget"
                class="rounded-2xl bg-blue-600 px-8 py-3 text-lg font-bold text-white hover:bg-blue-700 sm:text-2xl"
              >
                Lanjutkan
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Fitur -->
        <div>
          <h2 class="mb-3 text-2xl font-extrabold">Fitur</h2>

          <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <RouterLink
              to="/upload"
              class="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center transition hover:ring-2 hover:ring-blue-400"
            >
              <span class="text-5xl">📥</span>
              <h3 class="mt-3 font-bold sm:text-xl">Upload Soal</h3>
              <p class="mt-1 text-sm text-blue-900/70 sm:text-lg">
                Dari file/gambar
              </p>
            </RouterLink>

            <RouterLink
              to="/tasks"
              class="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center transition hover:ring-2 hover:ring-blue-400"
            >
              <span class="text-5xl">📝</span>
              <h3 class="mt-3 font-bold sm:text-xl">List Tugas</h3>
              <p class="mt-1 text-sm text-blue-900/70 sm:text-lg">
                Kerjakan soalmu
              </p>
            </RouterLink>

            <div class="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center">
              <span class="text-5xl">🎁</span>
              <h3 class="mt-3 font-bold sm:text-xl">Blind Box</h3>
              <p class="mt-1 text-sm text-blue-900/70 sm:text-lg">
                Tukar tiketmu
              </p>
            </div>

            <div class="flex min-h-52 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center">
              <span class="text-5xl">📊</span>
              <h3 class="mt-3 font-bold sm:text-xl">Progress</h3>
              <p class="mt-1 text-sm text-blue-900/70 sm:text-lg">
                Pantau Hasilmu
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>