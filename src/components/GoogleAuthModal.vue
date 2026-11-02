<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithGoogle } from '../utils/equestState'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'login', // 'login' or 'register'
  },
})

const emit = defineEmits(['close', 'success'])
const router = useRouter()

const isCustom = ref(false)
const customName = ref('')
const customEmail = ref('')
const isLoading = ref(false)

const predefinedAccounts = [
  {
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    avatar: '👨‍🎓',
  },
  {
    name: 'Siti Rahmawati',
    email: 'siti.rahma@gmail.com',
    avatar: '👩‍🎓',
  },
  {
    name: 'Dimas Pratama',
    email: 'dimas.pratama@gmail.com',
    avatar: '🧑‍💻',
  },
]

function selectAccount(account) {
  isLoading.value = true
  setTimeout(() => {
    loginWithGoogle(account)
    isLoading.value = false
    emit('success')
    emit('close')
    router.push('/')
  }, 500)
}

function handleCustomSubmit() {
  if (!customEmail.value.trim() || !customName.value.trim()) return
  selectAccount({
    name: customName.value.trim(),
    email: customEmail.value.trim().toLowerCase(),
    avatar: '✨',
  })
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity"
  >
    <div
      class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl transition-all sm:p-8"
      @click.stop
    >
      <!-- Header with Google Logo -->
      <div class="flex items-center justify-between border-b border-gray-100 pb-4">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" viewBox="0 0 24 24">
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
          <span class="text-lg font-bold text-gray-800">
            {{ mode === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google' }}
          </span>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="mt-5">
        <p class="text-sm text-gray-600">
          Pilih akun Google Anda untuk melanjutkan belajar di
          <span class="font-bold text-blue-900">EQuest</span>.
        </p>

        <!-- Quick Select Accounts -->
        <div v-if="!isCustom" class="mt-4 space-y-2.5">
          <button
            v-for="account in predefinedAccounts"
            :key="account.email"
            type="button"
            :disabled="isLoading"
            @click="selectAccount(account)"
            class="flex w-full items-center gap-3.5 rounded-2xl border border-gray-200 p-3.5 text-left transition hover:border-blue-500 hover:bg-sky-50/50"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl shadow-xs">
              {{ account.avatar }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold text-gray-900">{{ account.name }}</p>
              <p class="truncate text-xs text-gray-500">{{ account.email }}</p>
            </div>
            <span class="text-gray-400">→</span>
          </button>

          <!-- Custom Account Trigger -->
          <button
            type="button"
            @click="isCustom = true"
            class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            <span>➕</span>
            <span>Gunakan akun Google lainnya</span>
          </button>
        </div>

        <!-- Custom Account Form -->
        <form v-else @submit.prevent="handleCustomSubmit" class="mt-4 space-y-3">
          <div>
            <label class="text-xs font-bold text-gray-700">Nama Akun Google</label>
            <input
              v-model="customName"
              type="text"
              required
              placeholder="Contoh: Rian Hidayat"
              class="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label class="text-xs font-bold text-gray-700">Email Google (@gmail.com)</label>
            <input
              v-model="customEmail"
              type="email"
              required
              placeholder="nama@gmail.com"
              class="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="isCustom = false"
              class="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              {{ isLoading ? 'Menghubungkan...' : 'Lanjutkan' }}
            </button>
          </div>
        </form>

        <p v-if="isLoading" class="mt-4 text-center text-xs text-blue-600 animate-pulse font-medium">
          Menghubungkan ke layanan Google OAuth...
        </p>
      </div>
    </div>
  </div>
</template>
