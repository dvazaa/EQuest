<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GoogleAuthModal from '../components/GoogleAuthModal.vue'
import { getAllUsers, saveUser, initUserStats } from '../utils/equestState'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isGoogleModalOpen = ref(false)

function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = 'Kata sandi minimal 8 karakter.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  if (!agreeTerms.value) {
    errorMessage.value = 'Kamu harus menyetujui Syarat & Ketentuan.'
    return
  }

  const normalizedEmail = email.value.trim().toLowerCase()
  const users = getAllUsers()

  const emailExists = users.some(
    (user) => user.email?.trim().toLowerCase() === normalizedEmail
  )

  if (emailExists) {
    errorMessage.value = 'Email sudah terdaftar. Silakan masuk.'
    return
  }

  const newUser = {
    id: Date.now(),
    name: name.value.trim(),
    email: normalizedEmail,
    password: password.value,
    avatar: '🎓',
    provider: 'email',
  }

  saveUser(newUser)
  initUserStats(normalizedEmail)

  successMessage.value = 'Registrasi berhasil! Mengarahkan ke halaman Login...'

  setTimeout(() => {
    router.push('/login')
  }, 1000)
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 px-6 py-8 text-blue-950 sm:px-10">
    <!-- Panah kembali -->
    <RouterLink
      to="/"
      class="mb-8 inline-flex items-center gap-2 text-blue-900/50 transition hover:text-blue-600 font-semibold"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      <span>Kembali ke Beranda</span>
    </RouterLink>

    <!-- Logo -->
    <div class="mb-8">
      <RouterLink to="/" class="inline-flex items-center gap-3">
        <span class="text-5xl">📚</span>
        <span class="text-4xl font-extrabold text-blue-950">EQuest</span>
      </RouterLink>
    </div>

    <main class="mx-auto mt-0 grid max-w-7xl items-start gap-10 lg:grid-cols-2 lg:gap-8">
      <!-- Informasi sebelah kiri -->
      <section class="lg:-mt-2 lg:pr-10">
        <h1 class="text-4xl font-extrabold leading-tight sm:text-5xl">
          Belajar Jadi Lebih Seru dengan EQuest!
        </h1>

        <p class="mt-6 max-w-lg text-lg leading-snug text-blue-900/75">
          Buat akun untuk mengerjakan soal dengan bantuan AI dan kumpulkan
          reward di setiap langkah belajarmu.
        </p>

        <div class="mt-8 space-y-8">
          <div class="flex items-start gap-4">
            <span class="text-3xl">⭐</span>
            <div>
              <h2 class="text-xl font-bold">Kumpulkan XP & Naik Level</h2>
              <p class="mt-1 text-sm text-blue-900/70">
                Dapatkan poin di setiap soal yang berhasil kamu pahami.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <span class="text-3xl">🎁</span>
            <div>
              <h2 class="text-xl font-bold">Buka Blind Box Misteri</h2>
              <p class="mt-1 text-sm text-blue-900/70">
                Tukar tiket belajarmu dengan lencana, XP, dan hadiah unik.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <span class="text-3xl">🔥</span>
            <div>
              <h2 class="text-xl font-bold">Jaga Streak Harian</h2>
              <p class="mt-1 text-sm text-blue-900/70">
                Belajar konsisten setiap hari dan raih badge eksklusif.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Form registrasi -->
      <section class="w-full">
        <p class="mb-2 text-right text-sm text-blue-900/75">
          Sudah punya akun?
          <RouterLink to="/login" class="font-bold text-blue-600 hover:underline">
            Masuk Sekarang
          </RouterLink>
        </p>

        <div class="rounded-3xl border border-blue-200 bg-white shadow-xl shadow-blue-500/5">
          <form class="p-6 sm:p-8" @submit.prevent="handleRegister">
            <h2 class="text-2xl font-extrabold text-blue-950">Buat Akun Baru</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Isi data diri untuk mulai belajar bersama EQuest.
            </p>

            <div class="mt-5">
              <label for="register-name" class="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <input
                id="register-name"
                v-model="name"
                type="text"
                placeholder="Contoh: Farhan Pratama"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div class="mt-4">
              <label for="register-email" class="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Email
              </label>
              <input
                id="register-email"
                v-model="email"
                type="email"
                placeholder="nama@email.com"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div class="mt-4">
              <label for="register-password" class="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Kata Sandi
              </label>
              <input
                id="register-password"
                v-model="password"
                type="password"
                placeholder="Minimal 8 karakter"
                minlength="8"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div class="mt-4">
              <label for="register-confirm" class="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Konfirmasi Kata Sandi
              </label>
              <input
                id="register-confirm"
                v-model="confirmPassword"
                type="password"
                placeholder="Ulangi kata sandi"
                minlength="8"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <label class="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-blue-900/75 cursor-pointer">
              <input
                v-model="agreeTerms"
                type="checkbox"
                required
                class="mt-0.5 h-4 w-4 shrink-0 rounded accent-blue-600"
              />
              <span>
                Saya menyetujui
                <a href="#" class="font-bold text-blue-600 underline">Syarat &amp; Ketentuan</a>
                dan
                <a href="#" class="font-bold text-blue-600 underline">Kebijakan Privasi</a>
                EQuest.
              </span>
            </label>

            <p v-if="errorMessage" class="mt-4 text-xs font-bold text-red-600">
              {{ errorMessage }}
            </p>

            <p v-if="successMessage" class="mt-4 text-xs font-bold text-green-700">
              {{ successMessage }}
            </p>

            <button
              type="submit"
              class="mt-6 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 cursor-pointer"
            >
              Daftar Sekarang
            </button>
          </form>

          <div class="relative border-t border-blue-100 px-6 pb-8 pt-7 sm:px-8">
            <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-xs font-semibold text-blue-900/60">
              atau daftar dengan
            </span>

            <!-- Tombol Daftar dengan Google Aktif! -->
            <button
              type="button"
              @click="isGoogleModalOpen = true"
              class="flex w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-white py-3.5 text-sm font-bold text-blue-950 shadow-xs transition hover:bg-sky-50/60 cursor-pointer"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.32 21.41 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.32 2.59 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Daftar dengan Google</span>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Google Sign In Modal -->
    <GoogleAuthModal
      :is-open="isGoogleModalOpen"
      mode="register"
      @close="isGoogleModalOpen = false"
    />
  </div>
</template>
