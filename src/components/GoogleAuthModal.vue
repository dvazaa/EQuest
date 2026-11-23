<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  loginWithGoogle,
  readStorage,
  getCleanGoogleClientId,
  startGoogleOAuthSelectAccount,
} from '../utils/equestState'

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

const googleEmail = ref('')
const googleName = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const isOAuthLoading = ref(false)
const savedGoogleAccounts = ref([])

const googleClientId = computed(() => getCleanGoogleClientId())

onMounted(() => {
  // Ambil akun google asli yang pernah login di perangkat ini
  savedGoogleAccounts.value = readStorage('equestGoogleAccounts', [])
})

function isValidGoogleOrStudentEmail(email) {
  const parts = String(email || '').trim().toLowerCase().split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false
  const domain = parts[1]
  return (
    domain === 'gmail.com' ||
    domain === 'googlemail.com' ||
    domain === 'student.itk.ac.id' ||
    domain.endsWith('.ac.id') ||
    domain.endsWith('.sch.id')
  )
}

function persistAndSignInGoogleAccount(accountData) {
  const email = accountData.email.trim().toLowerCase()
  const existing = readStorage('equestGoogleAccounts', [])
  const foundIdx = existing.findIndex((a) => a.email.toLowerCase() === email)
  if (foundIdx === -1) {
    existing.unshift(accountData)
    localStorage.setItem('equestGoogleAccounts', JSON.stringify(existing.slice(0, 3)))
  } else {
    existing[foundIdx] = accountData
    localStorage.setItem('equestGoogleAccounts', JSON.stringify(existing))
  }

  loginWithGoogle(accountData)
  emit('success')
  emit('close')
  router.push('/')
}

function triggerRealGooglePopup() {
  errorMessage.value = ''
  if (!googleClientId.value) {
    errorMessage.value =
      'VITE_GOOGLE_CLIENT_ID belum diatur di file .env sehingga pemilih akun Google perangkat belum aktif.'
    return
  }

  isOAuthLoading.value = true
  startGoogleOAuthSelectAccount({
    onSuccess: () => {
      isOAuthLoading.value = false
      emit('success')
      emit('close')
      router.push('/')
    },
    onCancel: () => {
      isOAuthLoading.value = false
    },
    onError: (err) => {
      isOAuthLoading.value = false
      errorMessage.value = err?.message || 'Tidak dapat membuka pemilih akun Google perangkat.'
    },
  })
}

function handleGoogleLogin(emailToUse, nameToUse) {
  errorMessage.value = ''
  const email = (emailToUse || googleEmail.value).trim().toLowerCase()
  const name = (nameToUse || googleName.value).trim()

  if (!email) {
    errorMessage.value = 'Silakan masukkan alamat email Google kamu.'
    return
  }

  if (!isValidGoogleOrStudentEmail(email)) {
    errorMessage.value =
      'Gunakan alamat email Google asli (@gmail.com / @googlemail.com) atau email sekolah/kampus (.ac.id / .sch.id).'
    return
  }

  isLoading.value = true

  setTimeout(() => {
    const accountData = {
      email,
      name: name || email.split('@')[0],
      avatar: '🌐',
    }

    isLoading.value = false
    persistAndSignInGoogleAccount(accountData)
  }, 400)
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
          @click="$emit('close')"
          class="rounded-xl p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="mt-5 space-y-4">
        <p class="text-xs text-gray-500">
          Gunakan akun Google asli milikmu untuk masuk ke EQuest secara aman.
        </p>

        <!-- Tombol OAuth 2.0 Pilih Akun Google Perangkat (Aktif jika VITE_GOOGLE_CLIENT_ID diatur) -->
        <button
          v-if="googleClientId"
          type="button"
          :disabled="isOAuthLoading"
          @click="triggerRealGooglePopup"
          class="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-200 bg-blue-50/70 py-3 text-xs font-semibold text-blue-900 shadow-2xs transition hover:bg-blue-100/70 disabled:opacity-50 cursor-pointer"
        >
          <span>{{ isOAuthLoading ? 'Membuka jendela akun Google...' : 'Pilih Akun Google di Perangkat Ini →' }}</span>
        </button>
        <p v-else class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          Untuk menampilkan popup pilih akun Google langsung dari perangkat, atur <code class="font-mono text-slate-800">VITE_GOOGLE_CLIENT_ID</code> pada file <code class="font-mono text-slate-800">.env</code>.
        </p>

        <!-- Akun yang pernah digunakan sebelumnya (jika ada) -->
        <div v-if="savedGoogleAccounts.length > 0" class="space-y-2">
          <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Akun Google yang Pernah Masuk:
          </p>
          <button
            v-for="acc in savedGoogleAccounts"
            :key="acc.email"
            type="button"
            @click="handleGoogleLogin(acc.email, acc.name)"
            class="flex w-full items-center justify-between rounded-2xl border border-gray-200 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {{ acc.name?.charAt(0).toUpperCase() || 'G' }}
              </span>
              <div>
                <p class="text-xs font-bold text-gray-800">{{ acc.name }}</p>
                <p class="text-[11px] text-gray-500">{{ acc.email }}</p>
              </div>
            </div>
            <span class="text-xs font-bold text-blue-600">Pilih →</span>
          </button>
        </div>

        <!-- Form Masuk dengan Akun Google Asli -->
        <div class="space-y-3 pt-2">
          <div>
            <label class="block text-xs font-bold text-gray-700">
              Email Google (Gmail) Kamu:
            </label>
            <input
              v-model="googleEmail"
              type="email"
              placeholder="contoh: diva@gmail.com"
              class="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700">
              Nama Lengkap:
            </label>
            <input
              v-model="googleName"
              type="text"
              placeholder="contoh: Diva Novaliza"
              class="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <p v-if="errorMessage" class="text-xs font-bold text-red-500">
            ⚠️ {{ errorMessage }}
          </p>

          <button
            type="button"
            @click="handleGoogleLogin()"
            :disabled="isLoading || !googleEmail.trim()"
            class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <span v-if="isLoading">Menghubungkan...</span>
            <span v-else>Lanjutkan dengan Akun Google</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
