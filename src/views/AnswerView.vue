<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserTasks,
  updateTask,
  recordTaskCompletion,
  evaluateSingleAnswer,
  DEFAULT_DATABASE_QUESTIONS,
} from '../utils/equestState'

const route = useRoute()
const router = useRouter()

const taskId = route.query.id || '1'
const viewMode = ref(route.query.mode || 'eval') // 'study' | 'eval' | 'score'
const activeTab = ref('all') // 'all' | 'correct' | 'wrong'

const currentUser = ref(null)
const tasks = ref([])
const questions = ref([...DEFAULT_DATABASE_QUESTIONS])
const remainingAttempts = ref(2)
const isEditing = ref(false)
const correctionInputs = ref({})

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    tasks.value = getUserTasks(currentUser.value.email)
  }

  const existingTask = tasks.value.find((t) => String(t.id) === String(taskId))
  if (existingTask) {
    if (existingTask.questions && existingTask.questions.length) {
      questions.value = JSON.parse(JSON.stringify(existingTask.questions))
    }
    if (existingTask.remainingAttempts !== undefined) {
      remainingAttempts.value = existingTask.remainingAttempts
    }
  }

  // Initialize correction inputs for incorrect questions
  questions.value.forEach((q) => {
    if (!q.isCorrect) {
      correctionInputs.value[q.id] = q.userAnswer
    }
  })
}

onMounted(() => {
  loadData()
})

const task = computed(() => {
  return tasks.value.find((t) => String(t.id) === String(taskId)) || {
    fileName: 'soal_latihan.pdf',
    name: 'soal_latihan.pdf',
    questionCount: 10,
  }
})

const totalQuestions = computed(() => {
  return questions.value.length || 1
})

const correctCount = computed(() => {
  return questions.value.filter((q) => q.isCorrect).length
})

const wrongCount = computed(() => {
  return questions.value.filter((q) => !q.isCorrect).length
})

const totalScore = computed(() => {
  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

const earnedXp = computed(() => {
  return Math.max(10, correctCount.value * 10)
})

const earnedTickets = computed(() => {
  return totalScore.value >= 80 ? 1 : 0
})

const filteredQuestions = computed(() => {
  if (activeTab.value === 'correct') {
    return questions.value.filter((q) => q.isCorrect)
  }
  if (activeTab.value === 'wrong') {
    return questions.value.filter((q) => !q.isCorrect)
  }
  return questions.value
})

function goToExplanation(index) {
  router.push({
    path: '/explanation',
    query: { taskId, questionIndex: index },
  })
}

function handleFinishStudy() {
  const email = currentUser.value?.email
  if (email) {
    recordTaskCompletion(email, task.value, 20, 0)
    updateTask(email, taskId, {
      status: 'Selesai',
      userScore: 100,
    })
  }
  router.push('/tasks')
}

function handlePerbaikiJawaban() {
  if (!isEditing.value) {
    isEditing.value = true
    return
  }

  // Submit corrections
  if (remainingAttempts.value > 0) {
    remainingAttempts.value -= 1
  }

  // Check user answers against correct ones
  questions.value.forEach((q) => {
    if (!q.isCorrect && correctionInputs.value[q.id] !== undefined) {
      const rawInput = String(correctionInputs.value[q.id]).trim()
      if (rawInput) {
        q.userAnswer = rawInput
        q.isCorrect = evaluateSingleAnswer(rawInput, q.correctAnswer, q.question)
      }
    }
  })

  const email = currentUser.value?.email
  if (email) {
    updateTask(email, taskId, {
      questions: questions.value,
      remainingAttempts: remainingAttempts.value,
      userScore: totalScore.value,
    })
  }

  isEditing.value = false
  // Tampilkan Skor Akhir
  viewMode.value = 'score'
}

function handleClaimReward() {
  const email = currentUser.value?.email
  if (email) {
    recordTaskCompletion(email, task.value, earnedXp.value, earnedTickets.value)
    updateTask(email, taskId, {
      status: 'Selesai',
      userScore: totalScore.value,
    })
  }
  router.push('/blind-box')
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <!-- ========================================== -->
    <!-- KONDISI 1: SKOR AKHIR (Desktop - 14)       -->
    <!-- ========================================== -->
    <main v-if="viewMode === 'score'" class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header Skor Akhir -->
      <section class="mb-6">
        <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
          Skor Akhir
        </h1>
        <p class="mt-1 text-base text-slate-600 sm:text-lg">
          {{ task.fileName || 'jawaban_latihan.pdf' }} &nbsp;|&nbsp; {{ questions.length }} soal selesai dikerjakan
        </p>
      </section>

      <!-- Layout Skor Akhir: Robot | Donut Card | Rincian Perhitungan -->
      <div class="grid items-center gap-8 lg:grid-cols-[300px_340px_1fr]">
        <!-- Robot Mascot -->
        <div class="flex items-center justify-center">
          <img
            src="../assets/images/robot_nunjuk.png"
            alt="Mascot EQuest"
            class="max-h-[360px] w-auto object-contain"
          />
        </div>

        <!-- Donut Card (Tengah) -->
        <div class="flex flex-col items-center justify-between rounded-3xl bg-white p-7 text-center shadow-xs min-h-[440px]">
          <!-- Donut Progress -->
          <div class="relative flex h-44 w-44 items-center justify-center pt-2">
            <svg class="h-44 w-44 -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="#E2E8F0"
                stroke-width="12"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="#2D6BE4"
                stroke-width="12"
                fill="transparent"
                stroke-dasharray="301.59"
                :stroke-dashoffset="301.59 - (301.59 * totalScore) / 100"
                stroke-linecap="round"
                class="transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-4xl font-black text-[#0A2540]">{{ totalScore }}</span>
              <span class="text-xs font-bold text-slate-400">dari 100</span>
            </div>
          </div>

          <!-- Pesan Hebat -->
          <div class="space-y-1">
            <h2 class="text-lg font-black text-[#0A2540]">
              Hebat, {{ correctCount }} dari {{ questions.length }} benar!
            </h2>
            <p class="text-xs text-slate-500 leading-relaxed">
              {{
                wrongCount === 0
                  ? 'Luar biasa! Semua jawabanmu benar sempurna.'
                  : `Kamu sudah benar ${correctCount} jawaban. ${wrongCount} soal lagi bisa dipelajari ulang.`
              }}
            </p>
          </div>

          <!-- Bottom 2 Pills -->
          <div class="grid grid-cols-2 gap-3 w-full pt-3">
            <div class="rounded-2xl bg-[#EAF5FD] p-3 text-center">
              <p class="text-[11px] font-bold text-slate-500">XP didapat</p>
              <p class="text-lg font-black text-[#2D6BE4]">+{{ earnedXp }}</p>
            </div>
            <div class="rounded-2xl bg-[#EAF5FD] p-3 text-center">
              <p class="text-[11px] font-bold text-slate-500">Bonus tiket</p>
              <p class="text-lg font-black text-[#2D6BE4]">+{{ earnedTickets }}</p>
            </div>
          </div>
        </div>

        <!-- Rincian Perhitungan Card (Kanan) -->
        <div class="rounded-3xl bg-white p-7 shadow-xs space-y-5">
          <h2 class="text-base font-black text-[#0A2540]">
            Rincian Perhitungan
          </h2>

          <!-- Table -->
          <div class="text-xs">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2 font-bold text-slate-400">
              <span>Kategori</span>
              <div class="flex gap-8">
                <span>Hitungan</span>
                <span>Poin</span>
              </div>
            </div>

            <div class="divide-y divide-slate-100 font-semibold text-slate-700">
              <div class="flex items-center justify-between py-2.5">
                <div>
                  <p class="font-bold text-[#0A2540]">Jawaban benar</p>
                  <p class="text-[10px] text-slate-400">10 XP per soal</p>
                </div>
                <div class="flex gap-10">
                  <span>{{ correctCount }} &times; 10</span>
                  <span class="font-extrabold text-[#16A34A]">+{{ correctCount * 10 }} XP</span>
                </div>
              </div>

              <div class="flex items-center justify-between py-2.5">
                <div>
                  <p class="font-bold text-[#0A2540]">Perlu dipelajari ulang</p>
                  <p class="text-[10px] text-slate-400">Tanpa XP</p>
                </div>
                <div class="flex gap-10">
                  <span>{{ wrongCount }} &times; 0</span>
                  <span class="font-extrabold text-slate-500">0 XP</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total XP Banner -->
          <div class="flex items-center justify-between rounded-xl bg-[#EAF5FD] px-4 py-2.5 text-xs">
            <span class="font-black text-[#0A2540]">Total XP</span>
            <span class="font-black text-[#2D6BE4] text-sm">+{{ earnedXp }} XP</span>
          </div>

          <div class="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
            <span>Bonus skor minimal 80</span>
            <span class="font-bold text-[#0A2540]">+{{ earnedTickets }} Tiket Blind Box</span>
          </div>

          <!-- Poin per soal indicators -->
          <div>
            <p class="text-xs font-black text-[#0A2540] mb-2">Poin per soal</p>
            <div class="grid grid-cols-10 gap-1.5 text-center text-xs">
              <div
                v-for="q in questions"
                :key="q.id"
                class="rounded-lg p-1.5"
                :class="q.isCorrect ? 'bg-[#E1F7E9] text-[#16A34A]' : 'bg-slate-100 text-slate-400'"
              >
                <div class="font-black">{{ q.id }}</div>
                <div class="text-[10px] font-bold">{{ q.isCorrect ? '+10' : '0' }}</div>
              </div>
            </div>
            <!-- Legend -->
            <div class="mt-2.5 flex items-center gap-4 text-[11px] text-slate-500">
              <span class="flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-[#16A34A]"></span> Benar langsung
              </span>
              <span class="flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-[#2D6BE4]"></span> Diperbaiki
              </span>
              <span class="flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-slate-300"></span> Lihat jawaban
              </span>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center justify-between pt-3">
            <button
              type="button"
              @click="viewMode = 'study'"
              class="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              Lihat Jawaban
            </button>
            <button
              type="button"
              @click="handleClaimReward"
              class="rounded-xl bg-[#2D6BE4] px-7 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 cursor-pointer"
            >
              Ambil Hadiah
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ========================================== -->
    <!-- KONDISI 2: EVALUATION MODE (Desktop - 13)   -->
    <!-- ========================================== -->
    <main v-else-if="viewMode === 'eval'" class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header & File Pill -->
      <section class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Daftar Jawaban
          </h1>
          <p class="mt-1 text-base text-slate-600 sm:text-lg">
            Jawaban dari soal yang kamu unggah
          </p>
        </div>

        <div class="text-right">
          <div class="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 shadow-2xs">
            <span class="text-xl">📄</span>
            <div class="text-left">
              <p class="text-xs font-black text-[#0A2540]">{{ task.fileName || task.name || 'soal_latihan.pdf' }}</p>
              <p class="text-[11px] text-slate-400">{{ task.questionCount || 10 }} soal</p>
            </div>
          </div>
          <p class="mt-1 text-xs font-semibold text-slate-500">
            Sisa percobaan: {{ remainingAttempts }}
          </p>
        </div>
      </section>

      <!-- Main Box Container -->
      <div class="rounded-3xl bg-white p-7 shadow-xs space-y-6">
        <!-- Tabs Pill sesuai Desktop - 13 -->
        <div class="grid grid-cols-3 gap-3">
          <button
            type="button"
            @click="activeTab = 'all'"
            class="rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
            :class="
              activeTab === 'all'
                ? 'bg-[#2D6BE4] text-white shadow-xs'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            "
          >
            Semua ({{ questions.length }})
          </button>
          <button
            type="button"
            @click="activeTab = 'correct'"
            class="rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
            :class="
              activeTab === 'correct'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'border border-[#C6F0D6] text-[#16A34A] hover:bg-emerald-50'
            "
          >
            Benar ({{ correctCount }})
          </button>
          <button
            type="button"
            @click="activeTab = 'wrong'"
            class="rounded-xl py-2.5 text-xs font-bold transition cursor-pointer"
            :class="
              activeTab === 'wrong'
                ? 'bg-[#DC2626] text-white shadow-xs'
                : 'border border-[#FBD5D5] text-[#DC2626] hover:bg-red-50'
            "
          >
            Salah ({{ wrongCount }})
          </button>
        </div>

        <!-- List Soal Evaluated -->
        <div class="space-y-3.5">
          <div
            v-for="item in filteredQuestions"
            :key="item.id"
            class="rounded-2xl border p-4 transition"
            :class="
              item.isCorrect
                ? 'border-[#C6F0D6] bg-white'
                : 'border-[#FBD5D5] bg-[#FFFBFB]'
            "
          >
            <div class="flex items-start justify-between gap-4">
              <!-- Ikon + Pertanyaan -->
              <div class="flex items-start gap-3">
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                  :class="item.isCorrect ? 'bg-[#16A34A]' : 'bg-[#DC2626]'"
                >
                  {{ item.isCorrect ? '✓' : '✕' }}
                </span>
                <div>
                  <h3 class="text-sm font-extrabold text-[#0A2540]">
                    {{ item.id }}. {{ item.question }}
                  </h3>

                  <!-- Jawaban Pill Siswa -->
                  <div class="mt-2.5">
                    <span
                      class="inline-flex items-center gap-2 rounded-xl px-3.5 py-1 text-xs"
                      :class="
                        item.isCorrect
                          ? 'bg-[#E1F7E9] text-[#16A34A]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      "
                    >
                      <span class="font-extrabold">Jawabanmu</span>
                      <span class="font-bold">{{ item.userAnswer }}</span>
                    </span>
                  </div>

                  <!-- Hint & Retry Input jika salah -->
                  <div v-if="!item.isCorrect" class="mt-2 space-y-2">
                    <p class="text-xs font-semibold text-[#DC2626]">
                      {{ item.hint || 'Belum tepat. Mau coba perbaiki dulu?' }}
                    </p>

                    <div v-if="isEditing" class="flex items-center gap-2 pt-1">
                      <input
                        v-model="correctionInputs[item.id]"
                        type="text"
                        placeholder="Tuliskan jawaban perbaikan..."
                        class="w-80 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs text-[#0A2540] outline-none focus:border-[#2D6BE4]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- XP Badge di kanan -->
              <span
                class="rounded-full px-3 py-1 text-xs font-extrabold"
                :class="
                  item.isCorrect
                    ? 'bg-[#E1F7E9] text-[#16A34A]'
                    : 'bg-[#DDF0FD] text-[#2D6BE4]'
                "
              >
                {{ item.isCorrect ? '+10 XP' : '+10 XP jika benar' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi Bawah sesuai Desktop - 13 -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            @click="viewMode = 'study'"
            class="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            Lihat Jawaban Benar
          </button>

          <button
            type="button"
            @click="handlePerbaikiJawaban"
            class="rounded-xl bg-[#2D6BE4] px-8 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 cursor-pointer"
          >
            {{ isEditing ? 'Simpan & Periksa Ulang' : 'Perbaiki Jawaban' }}
          </button>
        </div>
      </div>
    </main>

    <!-- ========================================== -->
    <!-- KONDISI 3: STUDY MODE (Desktop - 10)       -->
    <!-- ========================================== -->
    <main v-else class="mx-auto max-w-[1360px] px-8 pb-12 pt-6">
      <!-- Header Daftar Jawaban -->
      <section class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Daftar Jawaban
          </h1>
          <p class="mt-1 text-base text-slate-600 sm:text-lg">
            Jawaban dari soal yang kamu unggah
          </p>
        </div>

        <div class="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 shadow-2xs">
          <span class="text-xl">📄</span>
          <div class="text-left">
            <p class="text-xs font-black text-[#0A2540]">{{ task.fileName || task.name || 'soal_latihan.pdf' }}</p>
            <p class="text-[11px] text-slate-400">{{ task.questionCount || 10 }} soal</p>
          </div>
        </div>
      </section>

      <!-- Main Box Container sesuai Desktop - 10 -->
      <div class="rounded-3xl bg-white p-7 shadow-xs space-y-4">
        <p class="text-xs font-black text-[#0A2540] uppercase tracking-wider">
          {{ questions.length }} Jawaban
        </p>

        <!-- List Soal Mode Belajar -->
        <div class="space-y-3">
          <div
            v-for="(item, idx) in questions"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-[#2D6BE4]"
          >
            <div class="flex items-center gap-4">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF5FD] text-xs font-black text-[#2D6BE4]">
                {{ idx + 1 }}
              </span>

              <div>
                <h3 class="text-sm font-extrabold text-[#0A2540]">
                  {{ item.question }}
                </h3>

                <div class="mt-1.5 inline-flex items-center gap-2 rounded-xl bg-[#E1F7E9] px-3 py-1 text-xs font-bold text-[#16A34A]">
                  <span>Jawaban</span>
                  <span class="font-extrabold text-[#0F6F32]">{{ item.correctAnswer }}</span>
                </div>
              </div>
            </div>

            <!-- Tombol Penjelasan -->
            <button
              type="button"
              @click="goToExplanation(idx)"
              class="rounded-xl border border-[#C5E4FA] bg-white px-5 py-2 text-xs font-bold text-[#2D6BE4] transition hover:bg-sky-50 cursor-pointer"
            >
              Penjelasan
            </button>
          </div>
        </div>
      </div>

      <!-- Tombol Selesai (Bawah Kanan) sesuai Desktop - 10 -->
      <div class="mt-6 flex justify-end">
        <button
          type="button"
          @click="handleFinishStudy"
          class="rounded-2xl bg-[#2D6BE4] px-10 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 cursor-pointer"
        >
          Selesai
        </button>
      </div>
    </main>
  </div>
</template>
