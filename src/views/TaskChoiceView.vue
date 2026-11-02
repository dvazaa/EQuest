<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { getCurrentUser, getUserTasks } from '../utils/equestState'

const router = useRouter()
const route = useRoute()
const currentUser = ref(null)
const taskId = route.query.id
const currentTask = ref(null)

onMounted(() => {
  currentUser.value = getCurrentUser()
  if (!currentUser.value?.email) {
    router.push('/login')
    return
  }

  const tasks = getUserTasks(currentUser.value.email)
  currentTask.value = tasks.find((t) => String(t.id) === String(taskId)) || null
})

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
    <!-- Navbar -->
    <Navbar />

    <main class="mx-auto max-w-5xl px-6 pb-12 pt-4">
      <button
        type="button"
        @click="router.push('/tasks')"
        class="mb-6 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-xs hover:bg-sky-50 transition"
      >
        <span>←</span>
        <span>Kembali ke Tugas Saya</span>
      </button>

      <section class="text-center">
        <span class="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
          Metode Pembelajaran
        </span>

        <h1 class="mt-3 text-3xl font-black text-blue-950 sm:text-4xl">
          Soal Berhasil Diproses!
        </h1>

        <p class="mt-2 text-base text-blue-900/70 sm:text-lg">
          {{ currentTask ? `Materi: "${currentTask.name}"` : 'Pilih bagaimana kamu ingin mempelajari soal ini' }}
        </p>
      </section>

      <!-- 2 Options: Study Mode vs Self-Solve Mode -->
      <div class="mt-10 grid gap-6 md:grid-cols-2">
        <!-- Pilihan 1: Melihat Jawaban -->
        <article
          class="flex flex-col justify-between rounded-3xl border border-blue-200 bg-white p-6 sm:p-8 shadow-xs transition hover:border-blue-400 hover:shadow-lg hover:scale-[1.01]"
        >
          <div>
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-5xl mb-4">
              📖
            </div>

            <h2 class="text-2xl font-black text-blue-950">
              Lihat Jawaban & Pembahasan
            </h2>

            <p class="mt-3 leading-relaxed text-sm text-blue-900/70">
              Langsung pelajari pembahasan lengkap langkah demi langkah dari AI tanpa perlu mengunggah jawaban. Cocok untuk materi baru!
            </p>

            <div class="mt-6 rounded-2xl bg-sky-50 p-3.5 text-center text-xs font-bold text-blue-700 border border-sky-100">
              💡 Mode Belajar Cepat &bull; +20 XP Pembelajaran
            </div>
          </div>

          <button
            type="button"
            @click="viewAnswers"
            class="mt-8 w-full rounded-2xl border-2 border-blue-600 bg-white py-3.5 text-base font-bold text-blue-600 transition hover:bg-blue-50 cursor-pointer"
          >
            Buka Pembahasan Langsung →
          </button>
        </article>

        <!-- Pilihan 2: Kerjakan Sendiri & Dapat Hadiah -->
        <article
          class="flex flex-col justify-between rounded-3xl border-2 border-blue-600 bg-gradient-to-b from-white to-sky-50/50 p-6 sm:p-8 shadow-md transition hover:shadow-xl hover:scale-[1.01] relative overflow-hidden"
        >
          <div class="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-200/40 blur-xl"></div>

          <div>
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-5xl mb-4 shadow-xs">
              ✍️
            </div>

            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-black text-blue-950">
                Kerjakan Sendiri
              </h2>
              <span class="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-amber-950">
                Reward
              </span>
            </div>

            <p class="mt-3 leading-relaxed text-sm text-blue-900/70">
              Uji pemahamanmu! Kerjakan soal ini, upload foto atau ketik jawabanmu, lalu AI akan menilai kebenaran jawabanmu.
            </p>

            <div class="mt-6 rounded-2xl bg-green-50 p-3.5 text-center text-xs font-bold text-green-800 border border-green-200">
              🎁 Hadiah: +50 XP &bull; +1 Tiket Blind Box Misteri!
            </div>
          </div>

          <button
            type="button"
            @click="solveYourself"
            class="mt-8 w-full rounded-2xl bg-blue-600 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 cursor-pointer"
          >
            Kerjakan & Dapatkan Tiket →
          </button>
        </article>
      </div>
    </main>
  </div>
</template>
