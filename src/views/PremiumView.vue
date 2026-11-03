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
    price: 'Rp 29.000',
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
    price: 'Rp 129.000',
    period: '/ 6 bulan',
    badge: 'Hemat 25%',
    isCurrent: false,
    isPopular: false,
    description: 'Pilihan hemat untuk pendamping belajar selama satu semester penuh.',
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

    <main class="mx-auto max-w-[1360px] px-8 pb-14 pt-6 space-y-8">
      <!-- Banner Status Mentahan / Terkunci (Progress 50%) -->
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-4 shadow-2xs">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-xl">
            🔒
          </span>
          <div>
            <p class="text-sm font-black text-amber-950">
              Fitur EQuest Premium (Pratinjau / Masih Dikunci)
            </p>
            <p class="text-xs text-amber-800">
              Halaman ini masih berupa rancangan awal (mentahan). Fitur pembayaran dan aktivasi langganan belum dibuka pada tahap ini.
            </p>
          </div>
        </div>
        <span class="rounded-full bg-amber-200/80 px-4 py-1.5 text-xs font-extrabold text-amber-900">
          Segera Hadir
        </span>
      </div>

      <!-- Header Halaman Premium -->
      <section class="flex flex-col items-center justify-between gap-6 rounded-3xl bg-white p-8 shadow-xs lg:flex-row sm:p-10">
        <div class="max-w-2xl space-y-3">
          <div class="inline-flex items-center gap-2 rounded-full bg-[#EAF5FD] px-4 py-1.5 text-xs font-extrabold text-[#2D6BE4]">
            <span>👑</span>
            <span>EQuest Premium</span>
          </div>
          <h1 class="text-3xl font-black text-[#0A2540] sm:text-4xl">
            Belajar Tanpa Batas Kuota &amp; Raih Reward 2x Lebih Cepat!
          </h1>
          <p class="text-sm leading-relaxed text-slate-600 sm:text-base">
            Tingkatkan akunmu ke EQuest Premium untuk mengunggah soal sepuasnya, bertanya ke AI kapan saja untuk pelajaran apa pun, dan mengumpulkan tiket Blind Box lebih banyak.
          </p>
        </div>

        <div class="flex items-center justify-center">
          <img
            src="../assets/images/robot_nunjuk.png"
            alt="Mascot EQuest Premium"
            class="max-h-[170px] w-auto object-contain"
          />
        </div>
      </section>

      <!-- 3 Kartu Pilihan Paket Langganan -->
      <section class="grid gap-6 lg:grid-cols-3">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex flex-col justify-between rounded-3xl border bg-white p-7 shadow-xs transition"
          :class="
            plan.isPopular
              ? 'border-2 border-[#2D6BE4] shadow-md'
              : 'border-[#C5E4FA]'
          "
        >
          <div>
            <!-- Badge Paket -->
            <div class="flex items-center justify-between gap-2">
              <span
                class="rounded-full px-3.5 py-1 text-xs font-extrabold"
                :class="
                  plan.isCurrent
                    ? 'bg-emerald-100 text-emerald-800'
                    : plan.isPopular
                      ? 'bg-[#2D6BE4] text-white'
                      : 'bg-amber-100 text-amber-800'
                "
              >
                {{ plan.badge }}
              </span>

              <span
                v-if="!plan.isCurrent"
                class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500"
              >
                🔒 Terkunci
              </span>
            </div>

            <!-- Nama & Harga -->
            <h2 class="mt-4 text-xl font-black text-[#0A2540]">
              {{ plan.name }}
            </h2>
            <div class="mt-2 flex items-baseline gap-1">
              <span class="text-3xl font-black text-[#0A2540]">{{ plan.price }}</span>
              <span class="text-xs font-bold text-slate-500">{{ plan.period }}</span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-slate-500">
              {{ plan.description }}
            </p>

            <!-- Daftar Fitur -->
            <ul class="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
              <li
                v-for="(feat, fIdx) in plan.features"
                :key="fIdx"
                class="flex items-start gap-2.5"
                :class="feat.included ? 'text-[#0A2540] font-semibold' : 'text-slate-400 line-through'"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                  :class="
                    feat.included
                      ? 'bg-[#E1F7E9] text-[#16A34A]'
                      : 'bg-slate-100 text-slate-400'
                  "
                >
                  {{ feat.included ? '✓' : '✕' }}
                </span>
                <span>{{ feat.text }}</span>
              </li>
            </ul>
          </div>

          <!-- Tombol Aksi (Dibuat Terkunci / Mentahan untuk Paket Berbayar) -->
          <div class="mt-8 pt-4">
            <button
              v-if="plan.isCurrent"
              type="button"
              disabled
              class="w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-extrabold text-emerald-700 cursor-default"
            >
              ✓ Paket Aktif Saat Ini
            </button>

            <button
              v-else
              type="button"
              @click="handleSelectLockedPlan(plan)"
              class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 py-3 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200 cursor-pointer"
            >
              <span>🔒</span>
              <span>Pilih {{ plan.name }} (Segera Hadir)</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Info Metode Pembayaran yang Direncanakan (Mentahan) -->
      <section class="rounded-3xl border border-dashed border-[#88B8EF] bg-white/80 p-6 text-center">
        <p class="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Metode Pembayaran yang Akan Didukung (Tahap Selanjutnya)
        </p>
        <div class="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-500">
          <span class="rounded-xl bg-white px-4 py-2 shadow-2xs">🔒 QRIS</span>
          <span class="rounded-xl bg-white px-4 py-2 shadow-2xs">🔒 GoPay / OVO / DANA</span>
          <span class="rounded-xl bg-white px-4 py-2 shadow-2xs">🔒 Transfer Virtual Account Bank</span>
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
        class="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl space-y-4"
        @click.stop
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
          🔒
        </div>
        <h3 class="text-xl font-black text-[#0A2540]">
          Fitur Premium Masih Dikunci
        </h3>
        <p class="text-xs leading-relaxed text-slate-600 sm:text-sm">
          Pendaftaran untuk <strong>{{ selectedPlanName }}</strong> saat ini masih berupa tampilan rancangan (mentahan) dan belum dapat melakukan transaksi pembayaran. Kamu tetap bisa menggunakan fitur belajar EQuest secara gratis!
        </p>
        <div class="pt-2">
          <button
            type="button"
            @click="showLockedModal = false"
            class="w-full rounded-xl bg-[#2D6BE4] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
          >
            Mengerti, Kembali Belajar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
