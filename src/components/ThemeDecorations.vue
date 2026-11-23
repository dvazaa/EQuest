<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const activeTheme = ref('blue')
let observer = null

function syncTheme() {
  if (typeof document === 'undefined') return
  const attr = document.documentElement.getAttribute('data-equest-theme')
  activeTheme.value = attr || 'blue'
}

function handleThemeEvent(e) {
  if (e?.detail) {
    activeTheme.value = e.detail
  } else {
    syncTheme()
  }
}

onMounted(() => {
  syncTheme()
  window.addEventListener('equest-theme-changed', handleThemeEvent)
  window.addEventListener('equest-stats-updated', syncTheme)

  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      syncTheme()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-equest-theme'],
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('equest-theme-changed', handleThemeEvent)
  window.removeEventListener('equest-stats-updated', syncTheme)
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

const floatingPetals = [
  { left: '6%', delay: '0s', duration: '14s', size: 18, rotate: '15deg' },
  { left: '18%', delay: '3s', duration: '17s', size: 14, rotate: '-25deg' },
  { left: '34%', delay: '6s', duration: '15s', size: 16, rotate: '40deg' },
  { left: '64%', delay: '2s', duration: '16s', size: 15, rotate: '-18deg' },
  { left: '80%', delay: '5s', duration: '13s', size: 19, rotate: '28deg' },
  { left: '92%', delay: '1s', duration: '18s', size: 14, rotate: '-35deg' },
]
</script>

<template>
  <div
    v-if="activeTheme !== 'blue'"
    class="pointer-events-none fixed inset-0 overflow-hidden select-none"
    aria-hidden="true"
  >
    <!-- ===================== TEMA UNGU LAVENDER ===================== -->
    <template v-if="activeTheme === 'purple'">
      <!-- Ambient latar belakang di belakang konten utama -->
      <div class="fixed inset-0 z-10 overflow-hidden">
        <div class="absolute -left-24 top-16 h-72 w-72 rounded-full bg-purple-300/25 blur-3xl"></div>
        <div class="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl"></div>
      </div>

      <!-- Hiasan Bunga Lavender Sudut & Tepi (terlihat halus tanpa mengganggu klik/teks) -->
      <div class="fixed inset-0 z-30 overflow-hidden">
        <!-- Rangkaian Lavender Kiri Atas -->
        <svg
          viewBox="0 0 220 280"
          class="theme-sway-slow absolute -left-4 top-12 h-52 w-40 opacity-80 sm:h-64 sm:w-52"
          fill="none"
        >
          <!-- Tangkai & Daun -->
          <path d="M24 270 C36 205, 58 140, 84 62" stroke="#5E8C6A" stroke-width="3.2" stroke-linecap="round" />
          <path d="M18 272 C24 210, 32 150, 42 86" stroke="#6E9F79" stroke-width="2.6" stroke-linecap="round" />
          <path d="M32 272 C62 222, 92 175, 134 114" stroke="#5E8C6A" stroke-width="2.6" stroke-linecap="round" />
          <path d="M26 238 C10 212, 6 190, 14 172 C24 190, 30 212, 26 238Z" fill="#6E9F79" opacity="0.85" />
          <path d="M36 244 C56 226, 72 212, 82 198 C64 218, 48 234, 36 244Z" fill="#5E8C6A" opacity="0.8" />
          <!-- Kuncup Bunga Lavender Batang Tengah -->
          <ellipse cx="85" cy="54" rx="6" ry="8" transform="rotate(14 85 54)" fill="#7C3AED" />
          <ellipse cx="76" cy="68" rx="6" ry="7.5" transform="rotate(-18 76 68)" fill="#8B5CF6" />
          <ellipse cx="89" cy="70" rx="6" ry="7.5" transform="rotate(24 89 70)" fill="#6D28D9" />
          <ellipse cx="72" cy="83" rx="6.5" ry="8" transform="rotate(-20 72 83)" fill="#A78BFA" />
          <ellipse cx="85" cy="85" rx="6.5" ry="8" transform="rotate(20 85 85)" fill="#7C3AED" />
          <ellipse cx="66" cy="98" rx="6.5" ry="8" transform="rotate(-22 66 98)" fill="#6D28D9" />
          <ellipse cx="80" cy="100" rx="6.5" ry="8" transform="rotate(22 80 100)" fill="#8B5CF6" />
          <ellipse cx="62" cy="114" rx="6" ry="7.5" transform="rotate(-16 62 114)" fill="#A78BFA" />
          <ellipse cx="75" cy="116" rx="6" ry="7.5" transform="rotate(20 75 116)" fill="#7C3AED" />
          <ellipse cx="68" cy="130" rx="5.5" ry="7" fill="#C4B5FD" />
          <!-- Kuncup Batang Kiri -->
          <ellipse cx="42" cy="78" rx="5.5" ry="7" transform="rotate(8 42 78)" fill="#8B5CF6" />
          <ellipse cx="35" cy="92" rx="5.5" ry="7" transform="rotate(-18 35 92)" fill="#7C3AED" />
          <ellipse cx="47" cy="93" rx="5.5" ry="7" transform="rotate(18 47 93)" fill="#A78BFA" />
          <ellipse cx="33" cy="107" rx="5.5" ry="7" transform="rotate(-18 33 107)" fill="#6D28D9" />
          <ellipse cx="45" cy="109" rx="5.5" ry="7" transform="rotate(18 45 109)" fill="#8B5CF6" />
          <ellipse cx="38" cy="124" rx="5" ry="6.5" fill="#C4B5FD" />
          <!-- Kuncup Batang Kanan -->
          <ellipse cx="136" cy="108" rx="5.5" ry="7" transform="rotate(28 136 108)" fill="#8B5CF6" />
          <ellipse cx="123" cy="118" rx="5.5" ry="7" transform="rotate(-10 123 118)" fill="#7C3AED" />
          <ellipse cx="134" cy="126" rx="5.5" ry="7" transform="rotate(35 134 126)" fill="#A78BFA" />
          <ellipse cx="115" cy="132" rx="5.5" ry="7" transform="rotate(-8 115 132)" fill="#6D28D9" />
          <ellipse cx="126" cy="140" rx="5.5" ry="7" transform="rotate(30 126 140)" fill="#C4B5FD" />
        </svg>

        <!-- Rangkaian Lavender Kanan Bawah -->
        <svg
          viewBox="0 0 240 280"
          class="theme-sway-slow absolute -bottom-3 -right-4 h-56 w-48 opacity-85 sm:h-72 sm:w-60"
          fill="none"
        >
          <path d="M210 280 C186 210, 152 145, 114 58" stroke="#5E8C6A" stroke-width="3.5" stroke-linecap="round" />
          <path d="M222 280 C210 216, 198 158, 184 94" stroke="#6E9F79" stroke-width="2.8" stroke-linecap="round" />
          <path d="M198 280 C162 232, 118 192, 72 138" stroke="#5E8C6A" stroke-width="2.8" stroke-linecap="round" />
          <path d="M196 244 C172 222, 154 202, 146 184 C166 202, 184 222, 196 244Z" fill="#6E9F79" opacity="0.85" />
          <path d="M212 248 C228 224, 232 204, 224 186 C214 206, 208 228, 212 248Z" fill="#5E8C6A" opacity="0.8" />
          <!-- Batang Utama -->
          <ellipse cx="112" cy="50" rx="6.5" ry="8.5" transform="rotate(-18 112 50)" fill="#7C3AED" />
          <ellipse cx="110" cy="66" rx="6.5" ry="8" transform="rotate(-32 110 66)" fill="#A78BFA" />
          <ellipse cx="124" cy="62" rx="6.5" ry="8" transform="rotate(14 124 62)" fill="#6D28D9" />
          <ellipse cx="117" cy="82" rx="7" ry="8.5" transform="rotate(-30 117 82)" fill="#8B5CF6" />
          <ellipse cx="131" cy="78" rx="7" ry="8.5" transform="rotate(14 131 78)" fill="#7C3AED" />
          <ellipse cx="124" cy="98" rx="6.5" ry="8" transform="rotate(-28 124 98)" fill="#6D28D9" />
          <ellipse cx="138" cy="94" rx="6.5" ry="8" transform="rotate(16 138 94)" fill="#A78BFA" />
          <ellipse cx="132" cy="114" rx="6.5" ry="8" transform="rotate(-25 132 114)" fill="#8B5CF6" />
          <ellipse cx="145" cy="110" rx="6" ry="7.5" transform="rotate(18 145 110)" fill="#C4B5FD" />
          <!-- Batang Kanan -->
          <ellipse cx="183" cy="86" rx="5.5" ry="7.5" transform="rotate(-10 183 86)" fill="#7C3AED" />
          <ellipse cx="176" cy="100" rx="5.5" ry="7.5" transform="rotate(-24 176 100)" fill="#A78BFA" />
          <ellipse cx="190" cy="100" rx="5.5" ry="7.5" transform="rotate(18 190 100)" fill="#6D28D9" />
          <ellipse cx="180" cy="116" rx="6" ry="7.5" transform="rotate(-20 180 116)" fill="#8B5CF6" />
          <ellipse cx="194" cy="116" rx="6" ry="7.5" transform="rotate(18 194 116)" fill="#7C3AED" />
          <ellipse cx="188" cy="132" rx="5.5" ry="7" fill="#C4B5FD" />
          <!-- Batang Kiri -->
          <ellipse cx="68" cy="133" rx="6" ry="7.5" transform="rotate(-35 68 133)" fill="#8B5CF6" />
          <ellipse cx="70" cy="149" rx="6" ry="7.5" transform="rotate(-48 70 149)" fill="#A78BFA" />
          <ellipse cx="83" cy="141" rx="6" ry="7.5" transform="rotate(6 83 141)" fill="#6D28D9" />
          <ellipse cx="82" cy="161" rx="5.5" ry="7" transform="rotate(-45 82 161)" fill="#7C3AED" />
          <ellipse cx="94" cy="154" rx="5.5" ry="7" transform="rotate(8 94 154)" fill="#C4B5FD" />
        </svg>

        <!-- Kelopak Lavender Melayang Halus -->
        <div
          v-for="(p, idx) in floatingPetals"
          :key="'lav-' + idx"
          class="theme-petal-drift absolute top-0 opacity-60"
          :style="{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }"
        >
          <svg :width="p.size" :height="p.size" viewBox="0 0 24 24" fill="none" :style="{ transform: `rotate(${p.rotate})` }">
            <ellipse cx="12" cy="12" rx="5" ry="8.5" fill="#8B5CF6" fill-opacity="0.7" />
            <ellipse cx="12" cy="10" rx="2.5" ry="4.5" fill="#DDD6FE" fill-opacity="0.75" />
          </svg>
        </div>
      </div>
    </template>

    <!-- ===================== TEMA PINK SAKURA ===================== -->
    <template v-else-if="activeTheme === 'pink'">
      <!-- Ambient Glow -->
      <div class="fixed inset-0 z-10 overflow-hidden">
        <div class="absolute -right-20 top-12 h-80 w-80 rounded-full bg-pink-300/25 blur-3xl"></div>
        <div class="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-rose-300/25 blur-3xl"></div>
      </div>

      <div class="fixed inset-0 z-30 overflow-hidden">
        <!-- Ranting Sakura Kiri Atas -->
        <svg
          viewBox="0 0 320 220"
          class="theme-sway-slow absolute -left-4 top-12 h-44 w-64 opacity-85 sm:h-52 sm:w-80"
          fill="none"
        >
          <path d="M-10 38 C55 56, 118 76, 188 74 C228 73, 258 58, 286 42" stroke="#785147" stroke-width="5" stroke-linecap="round" />
          <path d="M84 62 C112 94, 134 118, 174 134" stroke="#785147" stroke-width="3.2" stroke-linecap="round" />
          <path d="M168 74 C194 48, 212 30, 232 16" stroke="#785147" stroke-width="2.6" stroke-linecap="round" />

          <!-- Bunga Sakura Utama (5 Kelopak Berlekuk) -->
          <g transform="translate(86, 62) scale(1.15)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#FBCFE8" stroke="#F472B6" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3.5" fill="#BE185D" />
            <circle cx="-3" cy="-2" r="1" fill="#FDE047" />
            <circle cx="3" cy="-2" r="1" fill="#FDE047" />
            <circle cx="0" cy="3" r="1" fill="#FDE047" />
          </g>
          <g transform="translate(174, 72) scale(1.25)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#FFE4E6" stroke="#F472B6" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3.5" fill="#DB2777" />
            <circle cx="-2.5" cy="-2.5" r="1" fill="#FDE047" />
            <circle cx="2.5" cy="-2" r="1" fill="#FDE047" />
          </g>
          <g transform="translate(232, 34) scale(0.9)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#F9A8D4" stroke="#EC4899" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3.5" fill="#9D174D" />
          </g>
          <g transform="translate(154, 128) scale(0.95)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#FBCFE8" stroke="#F472B6" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3.2" fill="#BE185D" />
          </g>
          <g transform="translate(34, 46) scale(0.85)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#F9A8D4" stroke="#F472B6" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3" fill="#BE185D" />
          </g>
          <!-- Kuncup Sakura -->
          <ellipse cx="284" cy="42" rx="6" ry="4" transform="rotate(-24 284 42)" fill="#F472B6" />
          <ellipse cx="182" cy="136" rx="6" ry="4" transform="rotate(18 182 136)" fill="#EC4899" />
        </svg>

        <!-- Ranting Sakura Kanan Bawah -->
        <svg
          viewBox="0 0 280 220"
          class="theme-sway-slow absolute -bottom-3 -right-4 h-44 w-56 opacity-85 sm:h-52 sm:w-72"
          fill="none"
        >
          <path d="M290 198 C220 170, 155 138, 76 120" stroke="#785147" stroke-width="4.8" stroke-linecap="round" />
          <path d="M196 164 C162 128, 144 96, 128 60" stroke="#785147" stroke-width="3" stroke-linecap="round" />
          <g transform="translate(194, 160) scale(1.2)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#FBCFE8" stroke="#F472B6" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3.5" fill="#BE185D" />
          </g>
          <g transform="translate(132, 86) scale(1.05)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#FFE4E6" stroke="#F472B6" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3.2" fill="#DB2777" />
          </g>
          <g transform="translate(88, 122) scale(0.9)">
            <path d="M0,-20 C6,-20 11,-12 7,-3 C15,-9 22,-5 19,3 C17,9 8,10 3,4 C9,12 6,21 -2,19 C-8,17 -8,9 -2,4 C-10,10 -19,7 -19,-1 C-19,-8 -10,-9 -3,-3 C-8,-12 -6,-20 0,-20Z" fill="#F9A8D4" stroke="#EC4899" stroke-width="0.9" />
            <circle cx="0" cy="0" r="3" fill="#9D174D" />
          </g>
          <ellipse cx="64" cy="118" rx="6" ry="4" transform="rotate(14 64 118)" fill="#F472B6" />
        </svg>

        <!-- Kelopak Bunga Sakura Jatuh & Melayang -->
        <div
          v-for="(p, idx) in floatingPetals"
          :key="'sak-' + idx"
          class="theme-petal-drift absolute top-0 opacity-75"
          :style="{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }"
        >
          <svg :width="p.size" :height="p.size" viewBox="0 0 24 24" fill="none" :style="{ transform: `rotate(${p.rotate})` }">
            <path
              d="M12 2 C15 6, 19 10, 17 16 C15.5 20, 13.5 21, 12 18.5 C10.5 21, 8.5 20, 7 16 C5 10, 9 6, 12 2 Z"
              fill="#F9A8D4"
              stroke="#F472B6"
              stroke-width="0.8"
            />
          </svg>
        </div>
      </div>
    </template>

    <!-- ===================== TEMA HIJAU MINT ===================== -->
    <template v-else-if="activeTheme === 'mint'">
      <div class="fixed inset-0 z-10 overflow-hidden">
        <div class="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl"></div>
        <div class="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-teal-300/25 blur-3xl"></div>
      </div>

      <div class="fixed inset-0 z-30 overflow-hidden">
        <!-- Rangkaian Daun Mint Kiri Atas -->
        <svg
          viewBox="0 0 220 220"
          class="theme-sway-slow absolute -left-3 top-12 h-44 w-44 opacity-80 sm:h-56 sm:w-56"
          fill="none"
        >
          <path d="M12 190 C44 140, 88 94, 152 46" stroke="#059669" stroke-width="3" stroke-linecap="round" />
          <path d="M46 144 C18 118, 18 82, 42 66 C60 88, 60 120, 46 144Z" fill="#34D399" stroke="#059669" stroke-width="1" />
          <path d="M74 114 C106 122, 136 106, 142 82 C114 78, 86 92, 74 114Z" fill="#6EE7B7" stroke="#059669" stroke-width="1" />
          <path d="M104 84 C84 54, 92 24, 118 18 C132 42, 124 68, 104 84Z" fill="#10B981" stroke="#047857" stroke-width="1" />
          <path d="M148 48 C174 36, 198 40, 206 58 C184 72, 160 66, 148 48Z" fill="#A7F3D0" stroke="#059669" stroke-width="1" />
        </svg>

        <!-- Rangkaian Daun Mint Kanan Bawah -->
        <svg
          viewBox="0 0 220 220"
          class="theme-sway-slow absolute -bottom-3 -right-3 h-48 w-48 opacity-80 sm:h-60 sm:w-60"
          fill="none"
        >
          <path d="M206 208 C170 154, 126 108, 62 56" stroke="#059669" stroke-width="3" stroke-linecap="round" />
          <path d="M168 156 C138 164, 108 148, 102 124 C130 120, 156 134, 168 156Z" fill="#34D399" stroke="#059669" stroke-width="1" />
          <path d="M132 120 C158 94, 158 60, 136 42 C116 66, 118 98, 132 120Z" fill="#10B981" stroke="#047857" stroke-width="1" />
          <path d="M98 86 C68 94, 38 80, 32 56 C58 50, 86 64, 98 86Z" fill="#6EE7B7" stroke="#059669" stroke-width="1" />
          <path d="M64 56 C42 36, 38 14, 54 6 C74 18, 76 40, 64 56Z" fill="#A7F3D0" stroke="#059669" stroke-width="1" />
        </svg>

        <!-- Daun Mint Melayang -->
        <div
          v-for="(p, idx) in floatingPetals"
          :key="'mint-' + idx"
          class="theme-petal-drift absolute top-0 opacity-65"
          :style="{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }"
        >
          <svg :width="p.size" :height="p.size" viewBox="0 0 24 24" fill="none" :style="{ transform: `rotate(${p.rotate})` }">
            <path d="M12 2 C17 6, 19 14, 12 21 C5 14, 7 6, 12 2 Z" fill="#34D399" fill-opacity="0.7" stroke="#059669" stroke-width="0.9" />
            <path d="M12 4 L12 19" stroke="#047857" stroke-width="0.8" />
          </svg>
        </div>
      </div>
    </template>

    <!-- ===================== TEMA MERAH APEL LUCU ===================== -->
    <template v-else-if="activeTheme === 'apple'">
      <div class="fixed inset-0 z-10 overflow-hidden">
        <div class="absolute -left-24 top-14 h-72 w-72 rounded-full bg-rose-300/25 blur-3xl"></div>
        <div class="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-red-200/30 blur-3xl"></div>
      </div>

      <div class="fixed inset-0 z-30 overflow-hidden">
        <!-- Sudut Kiri Atas: Apel Merah Lucu + Bunga Apel -->
        <svg
          viewBox="0 0 240 240"
          class="theme-sway-slow absolute -left-2 top-12 h-44 w-44 opacity-85 sm:h-52 sm:w-52"
          fill="none"
        >
          <path d="M-8 38 C52 44, 108 64, 168 92" stroke="#78350F" stroke-width="4" stroke-linecap="round" />
          <path d="M90 60 C118 82, 138 112, 152 146" stroke="#78350F" stroke-width="2.6" stroke-linecap="round" />
          <!-- Daun Apel -->
          <path d="M62 46 C44 18, 64 2, 86 16 C88 36, 74 44, 62 46Z" fill="#4ADE80" stroke="#16A34A" stroke-width="1.2" />
          <path d="M148 80 C172 64, 194 74, 188 94 C170 100, 154 90, 148 80Z" fill="#22C55E" stroke="#15803D" stroke-width="1.2" />
          <!-- Apel Merah Utama Lucu -->
          <g transform="translate(88, 106) rotate(-10)">
            <path d="M0,-24 C10,-30 30,-28 32,-4 C34,20 18,34 6,31 C2,30 -2,30 -6,31 C-18,34 -34,20 -32,-4 C-30,-28 -10,-30 0,-24Z" fill="#F43F5E" stroke="#E11D48" stroke-width="1.6" />
            <ellipse cx="-12" cy="-8" rx="6" ry="11" transform="rotate(-18 -12 -8)" fill="#FDA4AF" opacity="0.65" />
            <path d="M0,-24 C2,-35 6,-40 12,-42" stroke="#78350F" stroke-width="3.2" stroke-linecap="round" />
            <path d="M2,-32 C16,-44 30,-38 24,-24 C14,-20 4,-24 2,-32Z" fill="#4ADE80" stroke="#16A34A" stroke-width="1.2" />
            <!-- Wajah Lucu Mini pada Apel -->
            <circle cx="-10" cy="2" r="2.2" fill="#4C0519" />
            <circle cx="10" cy="2" r="2.2" fill="#4C0519" />
            <ellipse cx="-14" cy="7" rx="3.2" ry="1.8" fill="#FECDD3" opacity="0.8" />
            <ellipse cx="14" cy="7" rx="3.2" ry="1.8" fill="#FECDD3" opacity="0.8" />
            <path d="M-4 6 Q0 11 4 6" stroke="#4C0519" stroke-width="1.8" stroke-linecap="round" fill="none" />
          </g>
          <!-- Bunga Apel Putih Lucu -->
          <g transform="translate(154, 48) scale(0.95)">
            <circle cx="0" cy="-10" r="7" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="9.5" cy="-3" r="7" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="6" cy="8.5" r="7" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="-6" cy="8.5" r="7" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="-9.5" cy="-3" r="7" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="0" cy="0" r="4.5" fill="#FACC15" />
          </g>
        </svg>

        <!-- Sudut Kanan Bawah: Apel Merah & Potongan Apel -->
        <svg
          viewBox="0 0 240 240"
          class="theme-sway-slow absolute -bottom-2 -right-2 h-48 w-48 opacity-85 sm:h-56 sm:w-56"
          fill="none"
        >
          <!-- Apel Utuh -->
          <g transform="translate(166, 156) rotate(8)">
            <path d="M0,-24 C10,-30 30,-28 32,-4 C34,20 18,34 6,31 C2,30 -2,30 -6,31 C-18,34 -34,20 -32,-4 C-30,-28 -10,-30 0,-24Z" fill="#E11D48" stroke="#BE123C" stroke-width="1.6" />
            <ellipse cx="-11" cy="-8" rx="5.5" ry="10" transform="rotate(-16 -11 -8)" fill="#FDA4AF" opacity="0.6" />
            <path d="M0,-24 C-2,-34 -6,-39 -11,-41" stroke="#78350F" stroke-width="3.2" stroke-linecap="round" />
            <path d="M0,-31 C14,-44 28,-38 22,-24 C12,-20 3,-24 0,-31Z" fill="#4ADE80" stroke="#16A34A" stroke-width="1.2" />
            <circle cx="-9" cy="2" r="2.1" fill="#4C0519" />
            <circle cx="9" cy="2" r="2.1" fill="#4C0519" />
            <path d="M-4 6 Q0 10 4 6" stroke="#4C0519" stroke-width="1.7" stroke-linecap="round" fill="none" />
          </g>
          <!-- Potongan Setengah Apel -->
          <g transform="translate(106, 184) rotate(-14)">
            <path d="M0,-20 C8,-25 24,-23 26,-3 C28,16 15,28 5,25 C1,24 -1,24 -5,25 C-15,28 -28,16 -26,-3 C-24,-23 -8,-25 0,-20Z" fill="#FFE4E6" stroke="#E11D48" stroke-width="3" />
            <ellipse cx="-5" cy="1" rx="2" ry="3.2" transform="rotate(-12 -5 1)" fill="#78350F" />
            <ellipse cx="5" cy="1" rx="2" ry="3.2" transform="rotate(12 5 1)" fill="#78350F" />
          </g>
          <!-- Bunga Apel Kecil -->
          <g transform="translate(120, 120) scale(0.85)">
            <circle cx="0" cy="-10" r="6.5" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="9" cy="-3" r="6.5" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="6" cy="8" r="6.5" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="-6" cy="8" r="6.5" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="-9" cy="-3" r="6.5" fill="#FFF1F2" stroke="#FDA4AF" stroke-width="1" />
            <circle cx="0" cy="0" r="4" fill="#FACC15" />
          </g>
        </svg>

        <!-- Apel Mini & Kelopak Bunga Apel Melayang -->
        <div
          v-for="(p, idx) in floatingPetals"
          :key="'apl-' + idx"
          class="theme-petal-drift absolute top-0 opacity-75"
          :style="{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }"
        >
          <svg :width="p.size" :height="p.size" viewBox="0 0 24 24" fill="none" :style="{ transform: `rotate(${p.rotate})` }">
            <path d="M12 6 C15 4, 20 5, 20 12 C20 18, 15 21, 12 20 C9 21, 4 18, 4 12 C4 5, 9 4, 12 6Z" fill="#F43F5E" fill-opacity="0.75" />
            <path d="M12 6 C12 3, 14 2, 15 2" stroke="#78350F" stroke-width="1.5" stroke-linecap="round" />
            <ellipse cx="15" cy="4.5" rx="3" ry="1.6" fill="#4ADE80" />
          </svg>
        </div>
      </div>
    </template>

    <!-- ===================== TEMA KUNING DAISY LUCU ===================== -->
    <template v-else-if="activeTheme === 'daisy'">
      <div class="fixed inset-0 z-10 overflow-hidden">
        <div class="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl"></div>
        <div class="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-yellow-300/30 blur-3xl"></div>
      </div>

      <div class="fixed inset-0 z-30 overflow-hidden">
        <!-- Daisy Kiri Atas -->
        <svg
          viewBox="0 0 220 220"
          class="theme-sway-slow absolute -left-3 top-12 h-44 w-44 opacity-85 sm:h-52 sm:w-52"
          fill="none"
        >
          <path d="M24 210 C42 162, 62 126, 86 84" stroke="#65A30D" stroke-width="3" stroke-linecap="round" />
          <path d="M18 212 C56 176, 98 148, 146 124" stroke="#65A30D" stroke-width="2.6" stroke-linecap="round" />
          <path d="M44 176 C18 164, 14 142, 34 134 C46 148, 48 164, 44 176Z" fill="#84CC16" opacity="0.85" />
          <g transform="translate(88, 82)">
            <ellipse v-for="n in 8" :key="n" cx="0" cy="-18" rx="6.5" ry="13" :transform="`rotate(${n * 45})`" fill="#FFFFFF" stroke="#FDE047" stroke-width="1.2" />
            <circle cx="0" cy="0" r="10" fill="#FACC15" stroke="#EAB308" stroke-width="1.2" />
            <circle cx="-3" cy="-2" r="1.4" fill="#713F12" />
            <circle cx="3" cy="-2" r="1.4" fill="#713F12" />
            <path d="M-3 2 Q0 5 3 2" stroke="#713F12" stroke-width="1.4" stroke-linecap="round" />
          </g>
          <g transform="translate(148, 122) scale(0.75)">
            <ellipse v-for="n in 8" :key="n" cx="0" cy="-18" rx="6.5" ry="13" :transform="`rotate(${n * 45})`" fill="#FFFFFF" stroke="#FDE047" stroke-width="1.2" />
            <circle cx="0" cy="0" r="10" fill="#FACC15" stroke="#EAB308" stroke-width="1.2" />
          </g>
        </svg>

        <!-- Daisy Kanan Bawah -->
        <svg
          viewBox="0 0 220 220"
          class="theme-sway-slow absolute -bottom-3 -right-3 h-48 w-48 opacity-85 sm:h-56 sm:w-56"
          fill="none"
        >
          <path d="M196 212 C164 166, 136 130, 118 82" stroke="#65A30D" stroke-width="3" stroke-linecap="round" />
          <path d="M206 212 C166 184, 124 164, 74 148" stroke="#65A30D" stroke-width="2.6" stroke-linecap="round" />
          <g transform="translate(120, 86)">
            <ellipse v-for="n in 8" :key="n" cx="0" cy="-18" rx="6.5" ry="13" :transform="`rotate(${n * 45})`" fill="#FFFFFF" stroke="#FDE047" stroke-width="1.2" />
            <circle cx="0" cy="0" r="10" fill="#FACC15" stroke="#EAB308" stroke-width="1.2" />
            <circle cx="-3" cy="-2" r="1.4" fill="#713F12" />
            <circle cx="3" cy="-2" r="1.4" fill="#713F12" />
            <path d="M-3 2 Q0 5 3 2" stroke="#713F12" stroke-width="1.4" stroke-linecap="round" />
          </g>
          <g transform="translate(76, 146) scale(0.78)">
            <ellipse v-for="n in 8" :key="n" cx="0" cy="-18" rx="6.5" ry="13" :transform="`rotate(${n * 45})`" fill="#FFFFFF" stroke="#FDE047" stroke-width="1.2" />
            <circle cx="0" cy="0" r="10" fill="#FACC15" stroke="#EAB308" stroke-width="1.2" />
          </g>
        </svg>

        <!-- Bunga Daisy Melayang -->
        <div
          v-for="(p, idx) in floatingPetals"
          :key="'dsy-' + idx"
          class="theme-petal-drift absolute top-0 opacity-75"
          :style="{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }"
        >
          <svg :width="p.size" :height="p.size" viewBox="0 0 24 24" fill="none" :style="{ transform: `rotate(${p.rotate})` }">
            <ellipse cx="12" cy="5" rx="2.8" ry="4.5" fill="#FFFFFF" stroke="#FACC15" stroke-width="0.6" />
            <ellipse cx="19" cy="12" rx="4.5" ry="2.8" fill="#FFFFFF" stroke="#FACC15" stroke-width="0.6" />
            <ellipse cx="12" cy="19" rx="2.8" ry="4.5" fill="#FFFFFF" stroke="#FACC15" stroke-width="0.6" />
            <ellipse cx="5" cy="12" rx="4.5" ry="2.8" fill="#FFFFFF" stroke="#FACC15" stroke-width="0.6" />
            <circle cx="12" cy="12" r="3.5" fill="#FACC15" />
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>
