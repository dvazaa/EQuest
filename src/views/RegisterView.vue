<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

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
  let users = []

  try {
    users = JSON.parse(localStorage.getItem('equestUsers') || '[]')
  } catch {
    errorMessage.value = 'Data akun tidak dapat dibaca. Coba lagi.'
    return
  }

  if (!Array.isArray(users)) {
    errorMessage.value = 'Data akun tidak valid. Coba lagi.'
    return
  }

  const emailExists = users.some(
    (user) => user.email?.toLowerCase() === normalizedEmail
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
  }

  try {
    users.push(newUser)
    localStorage.setItem('equestUsers', JSON.stringify(users))
  } catch {
    errorMessage.value = 'Akun gagal disimpan di browser. Coba lagi.'
    return
  }

  successMessage.value = 'Registrasi berhasil! Mengarahkan ke halaman Login.'

  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 px-6 py-8 text-blue-950 sm:px-10">
    <!-- Panah kembali -->
    <RouterLink
      to="/"
      class="mb-8 inline-flex items-center gap-2 text-blue-900/50 transition hover:text-blue-600"
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
        <span class="text-4xl font-extrabold text-black">EQuest</span>
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

        <div class="mt-8 space-y-10">
          <div>
            <h2 class="text-xl font-bold">Kumpulkan XP</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Dapatkan poin di setiap soal yang selesai.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-bold">Buka Blind Box</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Tukar tiketmu dengan hadiah menarik.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-bold">Jaga Streak</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Belajar setiap hari dan raih badge.
            </p>
          </div>
        </div>
      </section>

      <!-- Form registrasi -->
      <section class="w-full">
        <p class="mb-2 text-right text-sm text-blue-900/75">
          Sudah punya akun?
          <RouterLink to="/login" class="font-bold text-blue-600 hover:underline">
            Masuk
          </RouterLink>
        </p>

        <div class="rounded-2xl border border-blue-300 bg-white">
          <form class="p-6 sm:p-8" @submit.prevent="handleRegister">
            <h2 class="text-2xl font-extrabold">Buat Akun</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Isi data diri untuk mulai belajar.
            </p>

            <div class="mt-4">
              <label for="register-name" class="text-sm font-semibold">Nama Lengkap</label>
              <input
                id="register-name"
                v-model="name"
                type="text"
                placeholder="Masukkan nama lengkapmu"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div class="mt-3">
              <label for="register-email" class="text-sm font-semibold">Email</label>
              <input
                id="register-email"
                v-model="email"
                type="email"
                placeholder="nama@email.com"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div class="mt-3">
              <label for="register-password" class="text-sm font-semibold">Kata Sandi</label>
              <input
                id="register-password"
                v-model="password"
                type="password"
                placeholder="Minimal 8 karakter"
                minlength="8"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div class="mt-3">
              <label for="register-confirm" class="text-sm font-semibold">Konfirmasi Kata Sandi</label>
              <input
                id="register-confirm"
                v-model="confirmPassword"
                type="password"
                placeholder="Ulangi kata sandi"
                minlength="8"
                required
                class="mt-1.5 w-full rounded-xl border border-blue-200 bg-sky-50/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <label class="mt-8 flex items-start gap-3 text-xs leading-relaxed text-blue-900/75">
              <input
                v-model="agreeTerms"
                type="checkbox"
                required
                class="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
              />
              <span>
                Saya setuju dengan
                <a href="#" class="font-semibold text-blue-600 underline">Syarat &amp; Ketentuan</a>
                dan
                <a href="#" class="font-semibold text-blue-600 underline">Kebijakan Privasi</a>
                EQuest.
              </span>
            </label>

            <p v-if="errorMessage" class="mt-4 text-sm text-red-600">
              {{ errorMessage }}
            </p>

            <p v-if="successMessage" class="mt-4 text-sm text-green-700">
              {{ successMessage }}
            </p>

            <button
              type="submit"
              class="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm text-white transition hover:bg-blue-700 sm:mx-auto sm:block sm:w-2/3"
            >
              Daftar
            </button>
          </form>

          <div class="relative border-t border-blue-100 px-6 pb-8 pt-7 sm:px-8">
            <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-xs text-blue-900/70">
              atau
            </span>

            <button
              type="button"
              class="mx-auto block w-full rounded-xl border border-blue-200 px-4 py-4 text-sm hover:bg-sky-50 sm:w-2/3"
            >
              Daftar dengan Google
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>