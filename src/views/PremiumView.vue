<script setup>
import { ref } from 'vue'
import Navbar from '../components/Navbar.vue'

const showLockedModal = ref(false)
const selectedPlanName = ref('')

const plans = [
  {
    id: 'free',
    name: 'Paket Gratis (Basic)',
    price: 'Rp 0',
    period: 'Selamanya',
    badge: 'Paket Kamu Saat Ini',
    isCurrent: true,
    isPopular: false,
    description: 'Cocok untuk mulai belajar harian dan mencoba bantuan AI EQuest.',
    features: [
      { text: 'Upload hingga 5 soal latihan per hari', included: true },
      { text: 'Koreksi jawaban otomatis dengan AI', included: true },
      { text: 'Kumpulkan XP, Streak, dan buka Blind Box standar', included: true },
      { text: 'Tanya AI tanpa batas kuota harian', included: false },
      { text: 'Bonus 2x XP & Tiket Blind Box eksklusif', included: false },
      { text: 'Unduh rangkuman pembahasan ke PDF', included: false },
    ],
  },
  {
    id: 'monthly',
    name: 'Premium Pelajar',
    price: 'Rp 9.000',
    period: '/ bulan',
    badge: 'Paling Populer',
    isCurrent: false,
    isPopular: true,
    description: 'Belajar bebas hambatan dengan kuota AI tanpa batas dan bonus poin ganda.',
    features: [
      { text: 'Upload soal & gambar tugas tanpa batas (Unlimited)', included: true },
      { text: 'Tanya jawab AI sepuasnya untuk semua pelajaran', included: true },
      { text: 'Bonus 2x lipat XP di setiap soal yang benar', included: true },
      { text: 'Tambahan +2 Tiket Mystery Blind Box setiap minggu', included: true },
      { text: 'Penjelasan AI lebih mendalam & bertahap', included: true },
      { text: 'Simpan & unduh pembahasan soal ke PDF', included: true },
    ],
  },
  {
    id: 'semester',
    name: 'Premium Semesteran',
    price: 'Rp 54.000',
    period: '/ 6 bulan',
    badge: 'Paket 6 Bulan',
    isCurrent: false,
    isPopular: false,
    description: 'Pilihan praktis untuk pendamping belajar selama satu semester penuh (6 bulan).',
    features: [
      { text: 'Semua keuntungan paket Premium Pelajar', included: true },
      { text: 'Upload soal & Tanya AI tanpa batas selama 6 bulan', included: true },
      { text: 'Bonus langsung 5 Tiket Blind Box saat aktivasi', included: true },
      { text: 'Lencana profil eksklusif "Supporter EQuest"', included: true },
      { text: 'Prioritas kecepatan respons server AI', included: true },
      { text: 'Pelindung Streak otomatis (Streak Freeze 2x/bulan)', included: true },
    ],
  },
]

function handleSelectLockedPlan(plan) {
  if (plan.isCurrent) return
  selectedPlanName.value = plan.name
  showLockedModal.value = true
}
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1200px] px-6 pb-14 pt-6 space-y-6">
      <!-- Banner Status Mentahan / Terkunci (Tema Ungu) -->
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50/90 px-5 py-3.5 shadow-2xs">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-purple-950">
              Fitur EQuest Premium (Pratinjau / Masih Dikunci)
            </p>
            <p class="text-xs text-purple-800">
              Halaman ini masih berupa rancangan awal (mentahan). Fitur pembayaran dan aktivasi langganan belum dibuka pada tahap ini.
            </p>
          </div>
        </div>
        <span class="rounded-full bg-purple-100 px-3.5 py-1 text-xs font-medium text-purple-800">
          Segera Hadir
        </span>
      </div>

      <!-- Header Halaman Premium (Simpel & Natural) -->
      <section class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs sm:p-8">
        <div class="max-w-2xl space-y-2.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-medium text-purple-700">
            EQuest Premium
          </span>
          <h1 class="text-xl font-semibold text-[#0A2540] sm:text-2xl">
            Belajar Tanpa Batas Kuota &amp; Raih Reward 2x Lebih Cepat
          </h1>
          <p class="text-xs leading-relaxed text-slate-600 sm:text-sm">
            Tingkatkan akunmu ke EQuest Premium untuk mengunggah soal sepuasnya, bertanya ke AI kapan saja untuk pelajaran apa pun, dan mengumpulkan tiket Blind Box lebih banyak.
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
            plan.isPopular
              ? 'border-2 border-purple-500 shadow-sm'
              : 'border-[#C5E4FA]'
          "
        >
          <div>
            <!-- Badge Paket -->
            <div class="flex items-center justify-between gap-2">
              <span
                class="rounded-full px-3 py-1 text-xs font-medium"
                :class="
                  plan.isCurrent
                    ? 'bg-emerald-100 text-emerald-800'
                    : plan.isPopular
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-800'
                "
              >
                {{ plan.badge }}
              </span>

              <span
                v-if="!plan.isCurrent"
                class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500"
              >
                Terkunci
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
          <div class="mt-6 pt-3">
            <button
              v-if="plan.isCurrent"
              type="button"
              disabled
              class="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-medium text-emerald-700 cursor-default"
            >
              ✓ Paket Aktif Saat Ini
            </button>

            <button
              v-else
              type="button"
              @click="handleSelectLockedPlan(plan)"
              class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 py-2.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100 cursor-pointer"
            >
              <span>Pilih {{ plan.name }} (Segera Hadir)</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Info Metode Pembayaran yang Direncanakan (Mentahan) -->
      <section class="rounded-2xl border border-dashed border-purple-200 bg-white/80 p-5 text-center">
        <p class="text-xs font-medium text-slate-500">
          Metode Pembayaran yang Akan Didukung (Tahap Selanjutnya)
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs font-medium text-slate-600">
          <span class="rounded-xl bg-white px-4 py-2 shadow-2xs border border-slate-100">QRIS</span>
          <span class="rounded-xl bg-white px-4 py-2 shadow-2xs border border-slate-100">GoPay / OVO / DANA</span>
          <span class="rounded-xl bg-white px-4 py-2 shadow-2xs border border-slate-100">Transfer Virtual Account Bank</span>
        </div>
      </section>
    </main>

    <!-- Modal Pemberitahuan Fitur Masih Dikunci -->
    <div
      v-if="showLockedModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      @click="showLockedModal = false"
    >
      <div
        class="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl space-y-4"
        @click.stop
      >
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-[#0A2540]">
          Fitur Premium Masih Dikunci
        </h3>
        <p class="text-xs leading-relaxed text-slate-600 sm:text-sm">
          Pendaftaran untuk <strong>{{ selectedPlanName }}</strong> saat ini masih berupa tampilan rancangan (mentahan) dan belum dapat melakukan transaksi pembayaran. Kamu tetap bisa menggunakan fitur belajar EQuest secara gratis!
        </p>
        <div class="pt-1">
          <button
            type="button"
            @click="showLockedModal = false"
            class="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-purple-700 cursor-pointer"
          >
            Mengerti, Kembali Belajar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
