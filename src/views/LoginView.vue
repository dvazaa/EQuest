<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')

function handleLogin() {
  errorMessage.value = ''

  let users = []

  try {
    users = JSON.parse(localStorage.getItem('equestUsers') || '[]')
  } catch {
    errorMessage.value = 'Data akun bermasalah. Silakan coba lagi.'
    return
  }

  const user = users.find(
    (item) =>
      item.email?.toLowerCase() === email.value.trim().toLowerCase() &&
      item.password === password.value
  )

  if (!user) {
    errorMessage.value = 'Email atau kata sandi salah. Periksa kembali atau daftar akun terlebih dahulu.'
    return
  }

  localStorage.setItem(
    'equestUser',
    JSON.stringify({
      email: user.email,
      name: user.name,
    })
  )

  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-sky-100 px-6 py-8 text-blue-950">
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
      <section class="lg:-mt-2 lg:pr-4">
        <h1 class="text-4xl font-extrabold leading-tight sm:text-5xl">
          Selamat Datang Kembali!
        </h1>

        <p class="mt-5 max-w-lg text-lg leading-snug text-blue-900/75">
          Masuk untuk melanjutkan belajar, mengerjakan soal dengan bantuan AI,
          dan mengumpulkan reward.
        </p>

        <div class="mt-10 space-y-10">
          <div>
            <h2 class="text-xl font-bold">Lanjutkan Belajarmu</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Soal terakhir masih menunggu.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-bold">Jaga streak-mu</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Tukar tiketmu dengan hadiah menarik.
            </p>
          </div>

          <div>
            <h2 class="text-xl font-bold">Tukar tiket</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Buka Blind Box dan dapatkan hadiah.
            </p>
          </div>
        </div>
      </section>

      <!-- Form login -->
      <section class="w-full">
        <p class="mb-2 text-right text-sm text-blue-900/75">
          Belum punya akun?
          <RouterLink
            to="/register"
            class="font-bold text-blue-600 hover:underline"
          >
            Daftar
          </RouterLink>
        </p>

        <div class="rounded-2xl border border-blue-300 bg-white">
          <form class="p-6 sm:p-8" @submit.prevent="handleLogin">
            <h2 class="text-2xl font-extrabold">Masuk</h2>
            <p class="mt-1 text-sm text-blue-900/70">
              Masukkan email dan kata sandimu.
            </p>

            <div class="mt-9">
              <label for="login-email" class="text-sm font-semibold">
                Email
              </label>
              <input
                id="login-email"
                v-model="email"
                type="email"
                placeholder="nama@email.com"
                required
                class="mt-2 w-full rounded-xl border border-blue-200 bg-sky-50/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div class="mt-9">
              <div class="flex items-center justify-between gap-3">
                <label for="login-password" class="text-sm font-semibold">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  class="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>

              <input
                id="login-password"
                v-model="password"
                type="password"
                placeholder="Minimal 8 karakter"
                minlength="8"
                required
                class="mt-2 w-full rounded-xl border border-blue-200 bg-sky-50/70 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <label class="mt-6 flex items-center gap-3 text-sm text-blue-900/75">
              <input type="checkbox" class="h-4 w-4 accent-blue-600" />
              Ingat saya di perangkat ini
            </label>

            <p v-if="errorMessage" class="mt-4 text-sm text-red-600">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="mt-12 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm text-white transition hover:bg-blue-700 sm:mx-auto sm:block sm:w-2/3"
            >
              Masuk
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
              Masuk dengan Google
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>