<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  activatePremiumPlan,
} from '../utils/equestState'

const router = useRouter()

const currentUser = ref(null)
const userStats = ref(null)

const showCheckoutModal = ref(false)
const checkoutStep = ref('form') // 'form' | 'success'
const selectedPlan = ref(null)
const selectedPayment = ref('QRIS Instan')
const checkoutResult = ref(null)
const checkoutError = ref('')

const paymentMethods = [
  { id: 'QRIS Instan', label: 'QRIS Instan', desc: 'Scan cepat semua e-wallet & m-banking' },
  { id: 'GoPay / OVO / DANA', label: 'GoPay / OVO / DANA', desc: 'Pembayaran dompet digital otomatis' },
  { id: 'Virtual Account Bank', label: 'Virtual Account Bank', desc: 'BCA, BNI, BRI, Mandiri Virtual Account' },
]

function loadUserData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  } else {
    userStats.value = { tickets: 0, xp: 0, premiumPlan: 'free', isPremium: false }
  }
}

onMounted(() => {
  loadUserData()
})

const currentPlanId = computed(() => userStats.value?.premiumPlan || 'free')

const activePlanName = computed(() => {
  if (currentPlanId.value === 'semester') return 'Premium Semesteran'
  if (currentPlanId.value === 'monthly') return 'Premium Pelajar'
  return 'Paket Gratis (Basic)'
})

const plans = [
  {
    id: 'free',
    name: 'Paket Gratis (Basic)',
    price: 'Rp 0',
    period: 'Selamanya',
    badge: 'Dasar',
    isPopular: false,
    bonusTickets: 0,
    bonusXp: 0,
    description: 'Cocok untuk mulai belajar harian dan mencoba bantuan AI EQuest.',
    features: [
      { text: 'Upload hingga 5 soal latihan per hari', included: true },
      { text: 'Koreksi jawaban otomatis dengan AI', included: true },
      { text: 'Kumpulkan XP, Streak, dan buka Blind Box standar', included: true },
      { text: 'Tanya AI tanpa batas kuota harian', included: false },
      { text: 'Bonus 2x XP & +1 Tiket ekstra per latihan', included: false },
      { text: 'Bonus langsung Tiket Mystery Blind Box saat beli', included: false },
    ],
  },
  {
    id: 'monthly',
    name: 'Premium Pelajar',
    price: 'Rp 9.000',
    period: '/ bulan',
    badge: 'Paling Populer',
    isPopular: true,
    bonusTickets: 3,
    bonusXp: 50,
    description: 'Belajar bebas hambatan dengan kuota AI tanpa batas dan bonus tiket Blind Box langsung.',
    features: [
      { text: 'Bonus langsung +3 Tiket Mystery Blind Box setiap pembelian', included: true },
      { text: 'Bonus +50 XP instan saat aktivasi paket', included: true },
      { text: 'Bonus 2x lipat XP & +1 Tiket ekstra setiap latihan selesai', included: true },
      { text: 'Upload soal & gambar tugas tanpa batas (Unlimited)', included: true },
      { text: 'Tanya jawab AI sepuasnya untuk semua pelajaran', included: true },
      { text: 'Penjelasan AI lebih mendalam & unduh ke PDF', included: true },
    ],
  },
  {
    id: 'semester',
    name: 'Premium Semesteran',
    price: 'Rp 54.000',
    period: '/ 6 bulan',
    badge: 'Paket 6 Bulan',
    isPopular: false,
    bonusTickets: 10,
    bonusXp: 150,
    description: 'Pilihan praktis untuk pendamping belajar 6 bulan penuh dengan paket tiket maksimal.',
    features: [
      { text: 'Bonus langsung +10 Tiket Mystery Blind Box saat pembelian', included: true },
      { text: 'Bonus +150 XP instan & 2x XP selama 6 bulan', included: true },
      { text: 'Tambahan +1 Tiket ekstra di setiap latihan selesai', included: true },
      { text: 'Upload soal & Tanya AI tanpa batas semua pelajaran', included: true },
      { text: 'Prioritas kecepatan respons server AI', included: true },
      { text: 'Pelindung Streak otomatis (Streak Freeze 2x/bulan)', included: true },
    ],
  },
]

function openCheckout(plan) {
  if (plan.id === 'free') return
  selectedPlan.value = plan
  checkoutStep.value = 'form'
  checkoutResult.value = null
  checkoutError.value = ''
  showCheckoutModal.value = true
}

function handleConfirmPurchase() {
  if (!currentUser.value?.email) {
    checkoutError.value = 'Silakan masuk ke akun EQuest terlebih dahulu sebelum membeli paket Premium.'
    return
  }
  if (!selectedPlan.value) return

  const res = activatePremiumPlan(
    currentUser.value.email,
    selectedPlan.value.id,
    selectedPayment.value
  )

  if (!res.success) {
    checkoutError.value = res.message || 'Gagal mengaktifkan paket Premium.'
    return
  }

  checkoutResult.value = res
  userStats.value = getUserStats(currentUser.value.email)
  window.dispatchEvent(new Event('equest-stats-updated'))
  checkoutStep.value = 'success'
}

function goToBlindBox() {
  showCheckoutModal.value = false
  router.push('/blind-box')
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased transition-colors duration-300">
    <Navbar />

    <main class="mx-auto max-w-[1200px] px-6 pb-14 pt-6 space-y-6">
      <!-- Banner Status Langganan & Bonus Tiket Blind Box -->
      <div
        class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-2xs"
        :class="
          userStats?.isPremium
            ? 'border-purple-300 bg-purple-50/95'
            : 'border-purple-200 bg-white/95'
        "
      >
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="
              userStats?.isPremium
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700'
            "
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
            </svg>
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-semibold text-[#0A2540]">
                Status Akun: {{ activePlanName }}
              </p>
              <span
                v-if="userStats?.isPremium"
                class="rounded-full bg-purple-600 px-2.5 py-0.5 text-[11px] font-medium text-white"
              >
                Aktif
              </span>
            </div>
            <p class="mt-0.5 text-xs text-slate-600">
              <template v-if="userStats?.isPremium">
                Bonus aktif: 2x XP &amp; +1 Tiket Blind Box ekstra di setiap latihan yang selesai{{ userStats?.premiumActivatedAt ? ` • Diaktifkan ${userStats.premiumActivatedAt}` : '' }}.
              </template>
              <template v-else>
                Aktifkan paket Premium untuk langsung mendapatkan Tiket Mystery Blind Box, XP tambahan, dan fitur belajar tanpa batas.
              </template>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div class="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-medium text-purple-800">
            Tiket Blind Box: <span class="font-semibold">{{ userStats?.tickets ?? 0 }} Tiket</span>
          </div>
          <RouterLink
            to="/blind-box"
            class="rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-2xs transition hover:bg-purple-700"
          >
            Buka Blind Box
          </RouterLink>
        </div>
      </div>

      <!-- Header Halaman Premium -->
      <section class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs sm:p-8">
        <div class="max-w-2xl space-y-2.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-medium text-purple-700">
            EQuest Premium Aktif
          </span>
          <h1 class="text-xl font-semibold text-[#0A2540] sm:text-2xl">
            Belajar Tanpa Batas Kuota &amp; Raih Tiket Blind Box Instan
          </h1>
          <p class="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Pilih paket EQuest Premium untuk mengunggah soal sepuasnya, menikmati bonus 2x XP setiap selesai latihan, serta langsung mendapatkan tambahan Tiket Mystery Blind Box di akunmu.
          </p>
        </div>
      </section>

      <!-- 3 Kartu Pilihan Paket Langganan -->
      <section class="grid gap-5 lg:grid-cols-3">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-2xs transition"
          :class="
            currentPlanId === plan.id
              ? 'border-2 border-purple-600 shadow-sm'
              : plan.isPopular
                ? 'border-2 border-purple-400 shadow-sm'
                : 'border-[#C5E4FA]'
          "
        >
          <div>
            <!-- Badge Paket -->
            <div class="flex items-center justify-between gap-2">
              <span
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="
                  currentPlanId === plan.id
                    ? 'bg-emerald-100 text-emerald-800'
                    : plan.isPopular
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-800'
                "
              >
                {{ currentPlanId === plan.id ? 'Paket Aktif' : plan.badge }}
              </span>

              <span
                v-if="plan.bonusTickets > 0"
                class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700"
              >
                +{{ plan.bonusTickets }} Tiket Blind Box
              </span>
            </div>

            <!-- Nama & Harga -->
            <h2 class="mt-4 text-base font-semibold text-[#0A2540] sm:text-lg">
              {{ plan.name }}
            </h2>
            <div class="mt-1.5 flex items-baseline gap-1">
              <span class="text-2xl font-semibold text-[#0A2540]">{{ plan.price }}</span>
              <span class="text-xs text-slate-500">{{ plan.period }}</span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-slate-500">
              {{ plan.description }}
            </p>

            <!-- Daftar Fitur -->
            <ul class="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
              <li
                v-for="(feat, fIdx) in plan.features"
                :key="fIdx"
                class="flex items-start gap-2.5"
                :class="feat.included ? 'text-[#0A2540]' : 'text-slate-400 line-through'"
              >
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold mt-0.5"
                  :class="
                    feat.included
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-400'
                  "
                >
                  {{ feat.included ? '✓' : '✕' }}
                </span>
                <span>{{ feat.text }}</span>
              </li>
            </ul>
          </div>

          <!-- Tombol Aksi -->
          <div class="mt-6 pt-3 space-y-2">
            <template v-if="plan.id === 'free'">
              <button
                type="button"
                disabled
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-medium text-slate-600 cursor-default"
              >
                {{ currentPlanId === 'free' ? '✓ Paket Aktif Saat Ini' : 'Paket Dasar Gratis' }}
              </button>
            </template>

            <template v-else>
              <div
                v-if="currentPlanId === plan.id"
                class="rounded-xl border border-emerald-200 bg-emerald-50 py-1.5 text-center text-[11px] font-medium text-emerald-700"
              >
                ✓ Paket Sedang Aktif di Akunmu
              </div>
              <button
                type="button"
                @click="openCheckout(plan)"
                class="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition cursor-pointer"
                :class="
                  plan.isPopular || currentPlanId === plan.id
                    ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700'
                    : 'border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100'
                "
              >
                <span v-if="currentPlanId === plan.id">
                  Beli Lagi / Tambah +{{ plan.bonusTickets }} Tiket
                </span>
                <span v-else>
                  Beli &amp; Aktifkan (+{{ plan.bonusTickets }} Tiket)
                </span>
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- Info Metode Pembayaran yang Tersedia -->
      <section class="rounded-2xl border border-purple-200 bg-white/90 p-5 text-center shadow-2xs">
        <p class="text-xs font-medium text-slate-500">
          Metode Pembayaran yang Didukung
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs font-medium text-slate-700">
          <span class="rounded-xl bg-purple-50/70 px-4 py-2 border border-purple-100">QRIS Instan</span>
          <span class="rounded-xl bg-purple-50/70 px-4 py-2 border border-purple-100">GoPay / OVO / DANA</span>
          <span class="rounded-xl bg-purple-50/70 px-4 py-2 border border-purple-100">Transfer Virtual Account Bank</span>
        </div>
      </section>
    </main>

    <!-- Modal Pembayaran & Klaim Tiket Premium -->
    <div
      v-if="showCheckoutModal && selectedPlan"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
      @click="showCheckoutModal = false"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-purple-100 bg-white p-6 shadow-2xl space-y-4"
        @click.stop
      >
        <!-- Step 1: Konfirmasi Pembelian -->
        <template v-if="checkoutStep === 'form'">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="rounded-full bg-purple-100 px-3 py-0.5 text-[11px] font-medium text-purple-700">
                Aktivasi Langganan
              </span>
              <h3 class="mt-2 text-lg font-semibold text-[#0A2540]">
                {{ selectedPlan.name }}
              </h3>
            </div>
            <button
              type="button"
              @click="showCheckoutModal = false"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Ringkasan Harga & Bonus Tiket -->
          <div class="rounded-xl border border-purple-200 bg-purple-50/80 p-4 space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-600">
              <span>Total Pembayaran</span>
              <span class="text-base font-semibold text-[#0A2540]">
                {{ selectedPlan.price }} <span class="text-xs font-normal text-slate-500">{{ selectedPlan.period }}</span>
              </span>
            </div>
            <div class="flex items-center justify-between border-t border-purple-200/70 pt-2 text-xs">
              <span class="text-purple-900 font-medium">Bonus Langsung Saat Beli</span>
              <span class="rounded-full bg-purple-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                +{{ selectedPlan.bonusTickets }} Tiket &amp; +{{ selectedPlan.bonusXp }} XP
              </span>
            </div>
          </div>

          <!-- Pilih Metode Pembayaran -->
          <div class="space-y-2">
            <p class="text-xs font-medium text-slate-600">Pilih Metode Pembayaran</p>
            <div class="space-y-2">
              <button
                v-for="method in paymentMethods"
                :key="method.id"
                type="button"
                @click="selectedPayment = method.id"
                class="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition cursor-pointer"
                :class="
                  selectedPayment === method.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                "
              >
                <div>
                  <p class="text-xs font-semibold text-[#0A2540]">{{ method.label }}</p>
                  <p class="text-[11px] text-slate-500">{{ method.desc }}</p>
                </div>
                <span
                  class="flex h-4 w-4 items-center justify-center rounded-full border text-[10px]"
                  :class="
                    selectedPayment === method.id
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-slate-300'
                  "
                >
                  {{ selectedPayment === method.id ? '✓' : '' }}
                </span>
              </button>
            </div>
          </div>

          <div
            v-if="checkoutError"
            class="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700"
          >
            {{ checkoutError }}
          </div>

          <div class="flex flex-col gap-2 pt-1">
            <button
              v-if="currentUser"
              type="button"
              @click="handleConfirmPurchase"
              class="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-purple-700 cursor-pointer"
            >
              Bayar &amp; Klaim +{{ selectedPlan.bonusTickets }} Tiket Sekarang
            </button>
            <RouterLink
              v-else
              to="/login"
              class="block w-full rounded-xl bg-[#2D6BE4] py-2.5 text-center text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Masuk Akun untuk Membeli Premium
            </RouterLink>
            <button
              type="button"
              @click="showCheckoutModal = false"
              class="w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </template>

        <!-- Step 2: Berhasil Aktif & Dapat Tiket -->
        <template v-else>
          <div class="text-center space-y-3">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 class="text-lg font-semibold text-[#0A2540]">
              {{ checkoutResult?.planName }} Berhasil Aktif!
            </h3>
            <p class="text-xs leading-relaxed text-slate-600">
              Pembayaran via <strong>{{ checkoutResult?.paymentMethod }}</strong> berhasil diproses. Keuntungan Premium kini langsung aktif di akunmu.
            </p>

            <div class="grid grid-cols-2 gap-2.5 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-center">
              <div>
                <p class="text-[11px] text-slate-500">Bonus Tiket Diterima</p>
                <p class="mt-0.5 text-base font-semibold text-purple-700">
                  +{{ checkoutResult?.bonusTickets }} Tiket
                </p>
              </div>
              <div>
                <p class="text-[11px] text-slate-500">Bonus XP</p>
                <p class="mt-0.5 text-base font-semibold text-[#2D6BE4]">
                  +{{ checkoutResult?.bonusXp }} XP
                </p>
              </div>
            </div>

            <p class="text-xs font-medium text-[#0A2540]">
              Total Tiket Blind Box Kamu Sekarang:
              <span class="text-purple-700">{{ checkoutResult?.totalTickets }} Tiket</span>
            </p>

            <div class="flex flex-col gap-2 pt-2">
              <button
                type="button"
                @click="goToBlindBox"
                class="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-purple-700 cursor-pointer"
              >
                Buka Mystery Blind Box Sekarang
              </button>
              <button
                type="button"
                @click="showCheckoutModal = false"
                class="w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
