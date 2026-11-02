<script setup>
import { ref } from 'vue'
import { getAllUsers, updateUserPassword } from '../utils/equestState'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  initialEmail: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'success'])

const step = ref(1) // 1: enter email, 2: enter new password, 3: success
const email = ref(props.initialEmail)
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')

function checkEmail() {
  errorMessage.value = ''
  const trimmed = email.value.trim().toLowerCase()
  if (!trimmed) {
    errorMessage.value = 'Silakan masukkan email Anda.'
    return
  }

  const users = getAllUsers()
  const exists = users.find((u) => u.email?.trim().toLowerCase() === trimmed)

  if (!exists) {
    errorMessage.value =
      'Email ini belum terdaftar. Pastikan email sudah benar atau daftar akun baru.'
    return
  }

  step.value = 2
}

function handleResetPassword() {
  errorMessage.value = ''

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Kata sandi baru minimal 8 karakter.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  const res = updateUserPassword(email.value, newPassword.value)
  if (!res.success) {
    errorMessage.value = res.message
    return
  }

  step.value = 3
  successMessage.value = 'Kata sandi berhasil diubah! Silakan login kembali.'
}

function handleDone() {
  emit('success', { email: email.value, password: newPassword.value })
  handleClose()
}

function handleClose() {
  step.value = 1
  newPassword.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
  >
    <div
      class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all sm:p-8"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-100 pb-4">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">🔐</span>
          <h2 class="text-xl font-bold text-gray-900">Reset Kata Sandi</h2>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <!-- Step 1: Input Email -->
      <div v-if="step === 1" class="mt-5">
        <p class="text-sm leading-relaxed text-gray-600">
          Masukkan alamat email akun EQuest kamu. Kami akan memeriksa akunmu untuk mereset kata sandi.
        </p>

        <form @submit.prevent="checkEmail" class="mt-5 space-y-4">
          <div>
            <label class="text-xs font-bold text-gray-700">Email Terdaftar</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="nama@email.com"
              class="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <p v-if="errorMessage" class="text-xs font-semibold text-red-600">
            {{ errorMessage }}
          </p>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="handleClose"
              class="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              class="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Cari Akun
            </button>
          </div>
        </form>
      </div>

      <!-- Step 2: Input New Password -->
      <div v-else-if="step === 2" class="mt-5">
        <div class="rounded-xl bg-sky-50 p-3 text-xs text-blue-900">
          Akun ditemukan untuk: <strong>{{ email }}</strong>
        </div>

        <form @submit.prevent="handleResetPassword" class="mt-4 space-y-4">
          <div>
            <label class="text-xs font-bold text-gray-700">Kata Sandi Baru</label>
            <input
              v-model="newPassword"
              type="password"
              required
              minlength="8"
              placeholder="Minimal 8 karakter"
              class="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-gray-700">Konfirmasi Kata Sandi Baru</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              placeholder="Ketik ulang kata sandi baru"
              class="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <p v-if="errorMessage" class="text-xs font-semibold text-red-600">
            {{ errorMessage }}
          </p>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="step = 1"
              class="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              type="submit"
              class="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Simpan Sandi Baru
            </button>
          </div>
        </form>
      </div>

      <!-- Step 3: Success -->
      <div v-else class="mt-6 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✅
        </div>
        <h3 class="mt-4 text-lg font-bold text-gray-900">Kata Sandi Diperbarui!</h3>
        <p class="mt-2 text-sm text-gray-600">
          Kata sandi baru kamu telah disimpan. Sekarang kamu bisa masuk dengan kata sandi yang baru.
        </p>

        <button
          type="button"
          @click="handleDone"
          class="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Masuk Sekarang
        </button>
      </div>
    </div>
  </div>
</template>
