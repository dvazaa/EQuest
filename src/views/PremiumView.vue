<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  activatePremiumPlan,
  cancelPremiumPlan,
  TICKET_PACKS,
  purchaseTicketPack,
} from '../utils/equestState'

const router = useRouter()

const currentUser = ref(null)
const userStats = ref(null)

// Modal & Alur Pembayaran Multi-Langkah
const showCheckoutModal = ref(false)
const checkoutStep = ref('select_method') // 'select_method' | 'payment' | 'success'
const checkoutType = ref('plan') // 'plan' | 'ticket'
const selectedPlan = ref(null)
const selectedPayment = ref('GoPay / OVO / DANA / ShopeePay')
const selectedEwallet = ref('GoPay')
const selectedBank = ref('BCA')

// Data Tagihan & Status Pembayaran (Step 2)
const invoiceId = ref('')
const countdownSeconds = ref(900)
let timerInterval = null

const ewalletPhone = ref('')
const hasConfirmedTransfer = ref(false)
const copiedVa = ref(false)
const isVerifying = ref(false)
const isCreatingSnap = ref(false)
const snapMode = ref('midtrans_sandbox_simulator')
const snapToken = ref('')

const checkoutResult = ref(null)
const checkoutError = ref('')

const paymentMethods = [
  { id: 'GoPay / OVO / DANA / ShopeePay', label: 'GoPay / OVO / DANA / ShopeePay', desc: 'Pilih GoPay, OVO, DANA, atau ShopeePay' },
  { id: 'Virtual Account Bank', label: 'Virtual Account Bank', desc: 'Transfer BCA, BNI, BRI, atau Mandiri VA' },
]

const ewalletProviders = ['GoPay', 'OVO', 'DANA', 'ShopeePay']
const bankProviders = [
  { name: 'BCA', vaNumber: '8801 2026 9000 1124' },
  { name: 'BNI', vaNumber: '8808 2026 9000 4412' },
  { name: 'BRI', vaNumber: '8802 2026 9000 7781' },
  { name: 'Mandiri', vaNumber: '8809 2026 9000 5539' },
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

onUnmounted(() => {
  stopCountdown()
})

const currentPlanId = computed(() => userStats.value?.premiumPlan || 'free')

const activePlanName = computed(() => {
  if (currentPlanId.value === 'semester') return 'Premium Semesteran'
  if (currentPlanId.value === 'monthly') return 'Premium Pelajar'
  return 'Paket Gratis (Basic)'
})

const activeVaNumber = computed(() => {
  const found = bankProviders.find((b) => b.name === selectedBank.value)
  return found ? found.vaNumber : bankProviders[0].vaNumber
})

const formattedCountdown = computed(() => {
  const mins = String(Math.floor(countdownSeconds.value / 60)).padStart(2, '0')
  const secs = String(countdownSeconds.value % 60).padStart(2, '0')
  return `${mins}:${secs}`
})

const plans = [
  {
    id: 'free',
    name: 'Paket Gratis (Basic)',
    price: 'Rp 0',
    priceAmount: 0,
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
    priceAmount: 9000,
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
    priceAmount: 54000,
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

function startCountdown() {
  stopCountdown()
  countdownSeconds.value = 900
  timerInterval = setInterval(() => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value -= 1
    } else {
      stopCountdown()
    }
  }, 1000)
}

function stopCountdown() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function openCheckout(item, type = 'plan') {
  if (type === 'plan' && item.id === 'free') return
  stopCountdown()
  checkoutType.value = type
  selectedPlan.value =
    type === 'ticket'
      ? {
          id: item.id,
          name: item.name,
          price: item.price,
          priceAmount: item.priceAmount,
          period: 'Pembelian Sekali',
          bonusTickets: item.tickets,
          bonusXp: item.bonusXp,
        }
      : item
  checkoutStep.value = 'select_method'
  checkoutResult.value = null
  checkoutError.value = ''
  ewalletPhone.value = ''
  hasConfirmedTransfer.value = false
  copiedVa.value = false
  isVerifying.value = false
  showCheckoutModal.value = true
}

function closeCheckoutModal() {
  if (isVerifying.value) return
  stopCountdown()
  showCheckoutModal.value = false
}

function loadMidtransSnapScript(clientKey, isProduction = false) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window unavailable'))
    if (window.snap) return resolve(window.snap)

    const scriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'

    const existing = document.querySelector(`script[src="${scriptUrl}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.snap))
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Midtrans Snap JS')))
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve(window.snap)
    script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap JS'))
    document.head.appendChild(script)
  })
}

async function createInvoiceAndProceed() {
  if (!currentUser.value?.email) {
    checkoutError.value = 'Silakan masuk ke akun EQuest terlebih dahulu sebelum membuat tagihan pembayaran.'
    return
  }
  if (!selectedPlan.value) return

  checkoutError.value = ''
  hasConfirmedTransfer.value = false
  copiedVa.value = false
  isCreatingSnap.value = true

  let tokenResponse = null
  try {
    const resp = await fetch('http://localhost:3000/api/payment/midtrans-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: selectedPlan.value.id,
        planName: selectedPlan.value.name,
        priceAmount: selectedPlan.value.priceAmount,
        paymentChannel: selectedPayment.value,
        customerName: currentUser.value.name || 'Pelajar EQuest',
        customerEmail: currentUser.value.email,
      }),
    })
    if (resp.ok) {
      tokenResponse = await resp.json()
    }
  } catch (_) {
    // Backend sedang offline -> lanjutkan menggunakan simulator Midtrans Snap lokal
  }

  isCreatingSnap.value = false

  if (tokenResponse?.mode === 'midtrans_live_snap' && tokenResponse?.snapToken && tokenResponse?.clientKey) {
    invoiceId.value = tokenResponse.orderId
    snapMode.value = 'midtrans_live_snap'
    snapToken.value = tokenResponse.snapToken
    try {
      const snap = await loadMidtransSnapScript(tokenResponse.clientKey, tokenResponse.isProduction)
      if (snap?.pay) {
        snap.pay(tokenResponse.snapToken, {
          onSuccess: (result) => {
            const payload = {
              invoiceId: result?.order_id || tokenResponse.orderId,
              payerInfo: currentUser.value.email,
            }
            const res =
              checkoutType.value === 'ticket'
                ? purchaseTicketPack(
                    currentUser.value.email,
                    selectedPlan.value.id,
                    `Midtrans (${result?.payment_type || 'Snap'})`,
                    payload
                  )
                : activatePremiumPlan(
                    currentUser.value.email,
                    selectedPlan.value.id,
                    `Midtrans (${result?.payment_type || 'Snap'})`,
                    payload
                  )
            if (res.success) {
              checkoutResult.value = res
              userStats.value = getUserStats(currentUser.value.email)
              window.dispatchEvent(new Event('equest-stats-updated'))
              checkoutStep.value = 'success'
            }
          },
          onPending: () => {
            checkoutError.value = 'Pembayaran berstatus pending di Midtrans. Selesaikan pembayaran terlebih dahulu.'
          },
          onError: () => {
            checkoutError.value = 'Terjadi kesalahan saat memproses pembayaran melalui Midtrans.'
          },
          onClose: () => {
            checkoutError.value = 'Popup pembayaran Midtrans ditutup sebelum transaksi selesai.'
          },
        })
        return
      }
    } catch (_) {
      // Fallback ke popup Sandbox Snap internal jika snap.js gagal dimuat
    }
  }

  snapMode.value = 'midtrans_sandbox_simulator'
  invoiceId.value = tokenResponse?.orderId || `EQ-MID-${Math.floor(100000 + Math.random() * 900000)}`
  snapToken.value = tokenResponse?.snapToken || `SNAP-SIM-${invoiceId.value}`
  checkoutStep.value = 'payment'
  startCountdown()
}

async function copyVaNumber() {
  const cleanVa = activeVaNumber.value.replace(/\s+/g, '')
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(cleanVa)
    }
    copiedVa.value = true
    setTimeout(() => {
      copiedVa.value = false
    }, 2000)
  } catch {
    copiedVa.value = true
    setTimeout(() => {
      copiedVa.value = false
    }, 2000)
  }
}

function handleVerifyPayment() {
  checkoutError.value = ''

  if (!currentUser.value?.email) {
    checkoutError.value = 'Silakan masuk ke akun EQuest terlebih dahulu.'
    return
  }
  if (!selectedPlan.value) return

  const cleanPhone = ewalletPhone.value.replace(/\D/g, '')

  if (selectedPayment.value === 'GoPay / OVO / DANA / ShopeePay' && cleanPhone.length < 10) {
    checkoutError.value = `Masukkan nomor HP akun ${selectedEwallet.value} yang terdaftar (minimal 10 digit) terlebih dahulu.`
    return
  }

  if (!hasConfirmedTransfer.value) {
    checkoutError.value =
      'Silakan selesaikan pembayaran dan centang konfirmasi status pembayaran sebelum melanjutkan.'
    return
  }

  let methodDetail = selectedPayment.value
  let payerSummary = currentUser.value.name || currentUser.value.email

  if (selectedPayment.value === 'GoPay / OVO / DANA / ShopeePay') {
    methodDetail = `${selectedEwallet.value} (${cleanPhone})`
    payerSummary = `${payerSummary} • ${cleanPhone}`
  } else if (selectedPayment.value === 'Virtual Account Bank') {
    methodDetail = `Virtual Account ${selectedBank.value}`
  }

  isVerifying.value = true
  setTimeout(() => {
    const detailsPayload = {
      invoiceId: invoiceId.value,
      payerInfo: payerSummary,
    }
    const res =
      checkoutType.value === 'ticket'
        ? purchaseTicketPack(
            currentUser.value.email,
            selectedPlan.value.id,
            methodDetail,
            detailsPayload
          )
        : activatePremiumPlan(
            currentUser.value.email,
            selectedPlan.value.id,
            methodDetail,
            detailsPayload
          )

    isVerifying.value = false
    stopCountdown()

    if (!res.success) {
      checkoutError.value = res.message || 'Gagal memverifikasi pembayaran.'
      return
    }

    checkoutResult.value = res
    userStats.value = getUserStats(currentUser.value.email)
    window.dispatchEvent(new Event('equest-stats-updated'))
    checkoutStep.value = 'success'
  }, 1200)
}

function handleCancelPremium() {
  if (!currentUser.value?.email) return
  cancelPremiumPlan(currentUser.value.email)
  userStats.value = getUserStats(currentUser.value.email)
  window.dispatchEvent(new Event('equest-stats-updated'))
}

function goToBlindBox() {
  closeCheckoutModal()
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
                Bonus aktif: 2x XP &amp; +1 Tiket Blind Box ekstra di setiap latihan selesai{{ userStats?.premiumActivatedAt ? ` • Diaktifkan ${userStats.premiumActivatedAt}` : '' }}.
              </template>
              <template v-else>
                Pilih paket dan selesaikan pembayaran untuk mengaktifkan Premium serta klaim bonus Tiket Mystery Blind Box.
              </template>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div class="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-medium text-purple-800">
            Tiket Blind Box: <span class="font-semibold">{{ userStats?.tickets ?? 0 }} Tiket</span>
          </div>
          <button
            v-if="userStats?.isPremium"
            type="button"
            @click="handleCancelPremium"
            class="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          >
            Batalkan / Reset ke Paket Gratis
          </button>
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
            EQuest Premium
          </span>
          <h1 class="text-xl font-semibold text-[#0A2540] sm:text-2xl">
            Belajar Tanpa Batas Kuota &amp; Raih Tiket Blind Box Instan
          </h1>
          <p class="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Pilih paket EQuest Premium atau beli tiket Blind Box tambahan melalui GoPay, OVO, DANA, ShopeePay, atau Virtual Account Bank.
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
                  Perpanjang / Beli Lagi (+{{ plan.bonusTickets }} Tiket)
                </span>
                <span v-else>
                  Pilih Paket &amp; Lanjut Bayar
                </span>
              </button>
            </template>
          </div>
        </div>
      </section>

      <!-- Pembelian Tiket Blind Box Tambahan (Top-Up Tiket) -->
      <section class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs sm:p-7 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span class="rounded-full bg-purple-100 px-3 py-0.5 text-[11px] font-medium text-purple-700">
              Top-Up Tiket Gacha
            </span>
            <h2 class="mt-1.5 text-base font-semibold text-[#0A2540] sm:text-lg">
              Beli Tiket Mystery Blind Box Tambahan
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Ingin gacha lebih banyak untuk melengkapi koleksi figure 3D dan tema? Beli paket tiket langsung di sini!
            </p>
          </div>
          <div class="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-medium text-purple-800">
            Tiketmu Saat Ini: <span class="font-semibold">{{ userStats?.tickets ?? 0 }} Tiket</span>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div
            v-for="pack in TICKET_PACKS"
            :key="pack.id"
            class="flex flex-col justify-between rounded-2xl border border-purple-200 bg-purple-50/40 p-5 transition hover:border-purple-400"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="rounded-full bg-purple-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  +{{ pack.tickets }} Tiket
                </span>
                <span class="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-100">
                  {{ pack.badge }}
                </span>
              </div>
              <h3 class="mt-3 text-sm font-semibold text-[#0A2540] sm:text-base">
                {{ pack.name }}
              </h3>
              <p class="mt-1 text-xl font-semibold text-[#0A2540]">
                {{ pack.price }}
              </p>
              <p class="mt-1.5 text-xs leading-relaxed text-slate-600">
                {{ pack.desc }}
              </p>
              <p class="mt-2 text-[11px] font-medium text-purple-700">
                Bonus tambahan: +{{ pack.bonusXp }} XP
              </p>
            </div>

            <button
              type="button"
              @click="openCheckout(pack, 'ticket')"
              class="mt-4 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-2xs transition hover:bg-purple-700 cursor-pointer"
            >
              Beli Paket Tiket
            </button>
          </div>
        </div>
      </section>

      <!-- Info Metode Pembayaran yang Tersedia -->
      <section class="rounded-2xl border border-purple-200 bg-white/90 p-5 text-center shadow-2xs">
        <p class="text-xs font-medium text-slate-500">
          Metode Pembayaran yang Didukung
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs font-medium text-slate-700">
          <span class="rounded-xl bg-purple-50/70 px-4 py-2 border border-purple-100">GoPay / OVO / DANA / ShopeePay</span>
          <span class="rounded-xl bg-purple-50/70 px-4 py-2 border border-purple-100">Transfer Virtual Account Bank</span>
        </div>
      </section>
    </main>

    <!-- Modal Pembayaran Multi-Langkah -->
    <div
      v-if="showCheckoutModal && selectedPlan"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      @click="closeCheckoutModal"
    >
      <div
        class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-purple-100 bg-white p-6 shadow-2xl space-y-4"
        @click.stop
      >
        <!-- Indikator Langkah Pembayaran -->
        <div v-if="checkoutStep !== 'success'" class="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2 text-xs font-medium">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
              :class="checkoutStep === 'select_method' ? 'bg-purple-600 text-white' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ checkoutStep === 'select_method' ? '1' : '✓' }}
            </span>
            <span :class="checkoutStep === 'select_method' ? 'text-[#0A2540] font-semibold' : 'text-slate-500'">
              Pilih Metode
            </span>
            <span class="text-slate-300">→</span>
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
              :class="checkoutStep === 'payment' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'"
            >
              2
            </span>
            <span :class="checkoutStep === 'payment' ? 'text-[#0A2540] font-semibold' : 'text-slate-500'">
              Bayar &amp; Verifikasi
            </span>
          </div>

          <button
            type="button"
            @click="closeCheckoutModal"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- STEP 1: PILIH METODE PEMBAYARAN -->
        <template v-if="checkoutStep === 'select_method'">
          <div>
            <span class="rounded-full bg-purple-100 px-3 py-0.5 text-[11px] font-medium text-purple-700">
              Rincian Pesanan
            </span>
            <h3 class="mt-2 text-lg font-semibold text-[#0A2540]">
              {{ selectedPlan.name }}
            </h3>
          </div>

          <div class="rounded-xl border border-purple-200 bg-purple-50/80 p-4 space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-600">
              <span>Nominal Tagihan</span>
              <span class="text-base font-semibold text-[#0A2540]">
                {{ selectedPlan.price }} <span class="text-xs font-normal text-slate-500">{{ selectedPlan.period }}</span>
              </span>
            </div>
            <div class="flex items-center justify-between border-t border-purple-200/70 pt-2 text-xs">
              <span class="font-medium text-purple-900">Bonus Setelah Pembayaran Lunas</span>
              <span class="rounded-full bg-purple-600 px-2.5 py-0.5 text-[11px] font-medium text-white">
                +{{ selectedPlan.bonusTickets }} Tiket &amp; +{{ selectedPlan.bonusXp }} XP
              </span>
            </div>
          </div>

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

          <!-- Pilihan Provider Jika E-Wallet -->
          <div v-if="selectedPayment === 'GoPay / OVO / DANA / ShopeePay'" class="space-y-1.5">
            <p class="text-xs font-medium text-slate-600">Pilih Dompet Digital</p>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                v-for="ew in ewalletProviders"
                :key="ew"
                type="button"
                @click="selectedEwallet = ew"
                class="rounded-xl border py-2 text-xs font-medium transition cursor-pointer"
                :class="
                  selectedEwallet === ew
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                "
              >
                {{ ew }}
              </button>
            </div>
          </div>

          <!-- Pilihan Bank Jika Virtual Account -->
          <div v-if="selectedPayment === 'Virtual Account Bank'" class="space-y-1.5">
            <p class="text-xs font-medium text-slate-600">Pilih Bank Tujuan</p>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="bank in bankProviders"
                :key="bank.name"
                type="button"
                @click="selectedBank = bank.name"
                class="rounded-xl border py-2 text-xs font-medium transition cursor-pointer"
                :class="
                  selectedBank === bank.name
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                "
              >
                {{ bank.name }}
              </button>
            </div>
          </div>

          <!-- Info Privasi & Keamanan Midtrans Snap -->
          <div class="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[11px] text-emerald-900">
            <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p>
              <strong>Terhubung ke Midtrans Payment Gateway:</strong> Kredensial rekening, PIN e-wallet, dan Server Key diisolasi aman di sisi server tanpa menyimpan data pembayaran sensitif di aplikasi EQuest.
            </p>
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
              :disabled="isCreatingSnap"
              @click="createInvoiceAndProceed"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60 cursor-pointer"
            >
              <span v-if="isCreatingSnap" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <span>{{ isCreatingSnap ? 'Menghubungkan ke Midtrans Snap...' : 'Buat Tagihan Midtrans Snap →' }}</span>
            </button>
            <RouterLink
              v-else
              to="/login"
              class="block w-full rounded-xl bg-[#2D6BE4] py-2.5 text-center text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Masuk Akun untuk Melanjutkan Pembayaran
            </RouterLink>
            <button
              type="button"
              @click="closeCheckoutModal"
              class="w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </template>

        <!-- STEP 2: INSTRUKSI TAGIHAN, BAYAR & VERIFIKASI -->
        <template v-else-if="checkoutStep === 'payment'">
          <!-- Header Midtrans Snap Tagihan & Countdown -->
          <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-200 bg-purple-50/70 px-4 py-3">
            <div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="rounded bg-[#0A2540] px-1.5 py-0.5 text-[10px] font-medium text-white">Midtrans Snap</span>
                <span class="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800">Sandbox Mode</span>
              </div>
              <p class="mt-1 text-[11px] text-slate-500">Order ID: <span class="font-semibold text-[#0A2540]">{{ invoiceId }}</span></p>
              <p class="text-sm font-semibold text-[#0A2540]">
                Total Bayar: {{ selectedPlan.price }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[11px] text-slate-500">Batas Waktu Bayar</p>
              <p class="font-mono text-sm font-semibold text-purple-700">
                {{ formattedCountdown }}
              </p>
            </div>
          </div>

          <!-- Instruksi Spesifik E-Wallet -->
          <div
            v-if="selectedPayment === 'GoPay / OVO / DANA / ShopeePay'"
            class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-[#0A2540]">Pembayaran via {{ selectedEwallet }}</span>
              <span class="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
                {{ selectedEwallet }}
              </span>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600">
                Nomor HP Terdaftar di {{ selectedEwallet }} <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="ewalletPhone"
                type="tel"
                placeholder="Contoh: 081234567890"
                class="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-[#0A2540] outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <!-- Instruksi Spesifik Virtual Account Bank -->
          <div
            v-else
            class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-[#0A2540]">Virtual Account {{ selectedBank }}</span>
              <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-[#2D6BE4]">
                a.n. EQuest Edu Indonesia
              </span>
            </div>
            <div class="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
              <span class="font-mono text-sm font-semibold text-[#0A2540]">
                {{ activeVaNumber }}
              </span>
              <button
                type="button"
                @click="copyVaNumber"
                class="rounded-lg bg-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700 transition hover:bg-purple-200 cursor-pointer"
              >
                {{ copiedVa ? '✓ Tersalin' : 'Salin Nomor VA' }}
              </button>
            </div>
            <p class="text-[11px] text-slate-500">
              Transfer tepat sebesar <strong>{{ selectedPlan.price }}</strong> melalui ATM / Mobile Banking {{ selectedBank }} ke nomor VA di atas.
            </p>
          </div>

          <!-- Konfirmasi Otomatis Status Pembayaran -->
          <label class="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-[#0A2540] cursor-pointer">
            <input
              v-model="hasConfirmedTransfer"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-slate-300 accent-purple-600"
            />
            <span>
              {{
                selectedPayment === 'GoPay / OVO / DANA / ShopeePay'
                  ? 'Saya menyetujui permintaan pembayaran langsung ke nomor HP e-wallet di atas.'
                  : 'Saya sudah mentransfer sesuai nominal ke Nomor Virtual Account di atas.'
              }}
            </span>
          </label>

          <div
            v-if="checkoutError"
            class="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700"
          >
            {{ checkoutError }}
          </div>

          <div class="flex flex-col gap-2 pt-1">
            <button
              type="button"
              :disabled="isVerifying"
              @click="handleVerifyPayment"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60 cursor-pointer"
            >
              <span v-if="isVerifying" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <span>
                {{
                  isVerifying
                    ? 'Mengecek status transaksi otomatis...'
                    : selectedPayment === 'GoPay / OVO / DANA / ShopeePay'
                      ? 'Kirim Tagihan & Cek Status Otomatis'
                      : 'Cek Status Pembayaran Otomatis'
                }}
              </span>
            </button>
            <button
              type="button"
              :disabled="isVerifying"
              @click="checkoutStep = 'select_method'; checkoutError = ''"
              class="w-full rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            >
              ← Ubah Metode Pembayaran
            </button>
          </div>
        </template>

        <!-- STEP 3: PEMBAYARAN TERVERIFIKASI & PAKET AKTIF -->
        <template v-else>
          <div class="text-center space-y-3">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 class="text-lg font-semibold text-[#0A2540]">
              Pembayaran Terverifikasi &amp; {{ checkoutResult?.planName }} Berhasil Diproses!
            </h3>
            <p class="text-xs leading-relaxed text-slate-600">
              Tagihan <strong>{{ checkoutResult?.invoiceId }}</strong> melalui <strong>{{ checkoutResult?.paymentMethod }}</strong> ({{ checkoutResult?.payerInfo }}) berhasil diverifikasi.
            </p>

            <div class="grid grid-cols-2 gap-2.5 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-center">
              <div>
                <p class="text-[11px] text-slate-500">Tiket Blind Box Diterima</p>
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
                @click="closeCheckoutModal"
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
