<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

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
const taskId = route.query.id

function logout() {
  localStorage.removeItem('equestUser')
  currentUser.value = null
  router.push('/')
}

function viewAnswers() {
  router.push({
    path: '/answer',
    query: { id: taskId },
  })
}

function solveYourself() {
  router.push({
    path: '/answer-upload',
    query: { id: taskId },
  })
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
          <RouterLink to="/" class="text-blue-900/50 hover:text-blue-600">
            Beranda
          </RouterLink>

          <RouterLink to="/tasks" class="text-blue-900/50 hover:text-blue-600">
            Tugas Saya
          </RouterLink>

          <RouterLink to="/upload" class="text-blue-900/50 hover:text-blue-600">
            Upload Soal
          </RouterLink>

          <span class="cursor-not-allowed text-blue-900/40">Blind Box</span>
          <span class="cursor-not-allowed text-blue-900/40">Progress</span>
          <span class="cursor-not-allowed text-blue-900/40">Riwayat</span>
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

    <main class="px-6 pb-10 pt-5">
      <button
        type="button"
        @click="router.push('/tasks')"
        class="mb-6 rounded-xl border border-blue-300 bg-white px-5 py-3 font-semibold hover:bg-sky-50"
      >
        ← Kembali ke Tugas Saya
      </button>

      <section class="mx-auto max-w-5xl">
        <div class="text-center">
          <h1 class="text-3xl font-extrabold sm:text-4xl">
            Soal Berhasil Dianalisis!
          </h1>

          <p class="mt-3 text-lg text-blue-900/70 sm:text-xl">
            Sekarang, bagaimana kamu ingin belajar?
          </p>
        </div>

        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <!-- Pilihan melihat jawaban -->
          <article
            class="flex flex-col rounded-3xl border border-blue-300 bg-white p-6 sm:p-8"
          >
            <div class="flex h-24 items-center justify-center text-7xl">
              📖
            </div>

            <h2 class="mt-5 text-2xl font-extrabold">
              Lihat Jawaban
            </h2>

            <p class="mt-3 flex-1 leading-relaxed text-blue-900/70">
              Langsung lihat jawaban yang benar beserta penjelasannya
              tanpa perlu mengerjakan sendiri.
            </p>

            <div class="mt-5 rounded-xl bg-sky-100 px-4 py-3 text-center font-semibold text-blue-700">
              Mode belajar · Tanpa poin
            </div>

            <button
              type="button"
              @click="viewAnswers"
              class="mt-5 rounded-xl border border-blue-500 px-5 py-4 font-bold text-blue-600 transition hover:bg-sky-50"
            >
              Lihat Jawaban
            </button>
          </article>

          <!-- Pilihan mengerjakan sendiri -->
          <article
            class="flex flex-col rounded-3xl border border-blue-500 bg-white p-6 sm:p-8"
          >
            <div class="flex h-24 items-center justify-center text-7xl">
              ✍️
            </div>

            <h2 class="mt-5 text-2xl font-extrabold">
              Kerjakan Sendiri
            </h2>

            <p class="mt-3 flex-1 leading-relaxed text-blue-900/70">
              Coba jawab soal terlebih dahulu, lalu unggah jawabanmu
              untuk diperiksa AI dan berkesempatan mendapatkan poin.
            </p>

            <div class="mt-5 rounded-xl bg-green-100 px-4 py-3 text-center font-semibold text-green-800">
              Kesempatan koreksi: 5 kali
            </div>

            <button
              type="button"
              @click="solveYourself"
              class="mt-5 rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700"
            >
              Kerjakan Sendiri
            </button>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>