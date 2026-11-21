<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  useTicket,
  addXp,
  addTickets,
  addReward,
} from '../utils/equestState'

const currentUser = ref(null)
const userStats = ref(null)
const isOpening = ref(false)
const showRewardModal = ref(false)
const lastReward = ref(null)
const alertNotice = ref('')

// 3D Collectible Figure Viewer State
const figureCanvas = ref(null)
const selectedFigureId = ref('astro')
const autoRotate = ref(true)
const zoomLevel = ref(1.05)
const isDragging = ref(false)

let rotY = 0.45
let rotX = -0.18
let lastPointerX = 0
let lastPointerY = 0
let animationFrameId = null

const figureModels = [
  {
    id: 'astro',
    name: 'Astro Bot EQuest',
    series: 'Seri 01 · Koleksi Biru',
    rarity: 'Rare',
    desc: 'Miniatur maskot belajar EQuest versi 3D dengan inti kristal cahaya dan antena pemindai.',
    accentBg: 'bg-[#EAF5FD] text-[#2D6BE4] border-blue-200',
  },
  {
    id: 'scholar',
    name: 'Star Scholar Figure',
    series: 'Seri 02 · Koleksi Ungu',
    rarity: 'Epic',
    desc: 'Figur 3D wisudawan bintang lengkap dengan topi toga mortarboard dan permata pengetahuan.',
    accentBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'owl',
    name: 'Cyber Owl Figure',
    series: 'Seri 03 · Koleksi Toska',
    rarity: 'Legendary',
    desc: 'Figur 3D burung hantu pintar dengan lensa kacamata futuristik dan sayap geometris.',
    accentBg: 'bg-teal-50 text-teal-700 border-teal-200',
  },
]

const currentFigure = computed(() => {
  return figureModels.find((f) => f.id === selectedFigureId.value) || figureModels[0]
})

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  }
  window.dispatchEvent(new Event('equest-stats-updated'))
}

const ticketCount = computed(() => userStats.value?.tickets ?? 0)

const collectedFiguresCount = computed(() => {
  const rewards = userStats.value?.rewards || []
  return rewards.filter((r) => String(r.name).toLowerCase().includes('figure')).length
})

const possibleRewards = [
  { type: 'xp', name: '+ 50 XP', xp: 50, icon: '⭐', desc: 'Bonus pengalaman belajar ekstra' },
  { type: 'xp', name: '+ 100 XP', xp: 100, icon: '🌟', desc: 'Hadiah XP besar untuk akselerasi rank' },
  { type: 'ticket', name: '+ 1 Tiket', tickets: 1, icon: '🎟️', desc: 'Tiket gratis untuk membuka Blind Box lagi' },
  { type: 'badge', name: 'Badge', icon: '🎖️', desc: 'Pencapaian eksklusif pemburu misteri' },
  { type: 'theme', name: 'Tema Spesial', icon: '🎨', desc: 'Koleksi tema antarmuka EQuest' },
  { type: 'figure', name: 'Figure Collection 3D', icon: '🤖', desc: 'Miniatur figur koleksi 3D interaktif yang bisa diputar 360°' },
]

function handleOpenBox() {
  alertNotice.value = ''
  const email = currentUser.value?.email
  if (!email) return

  if (ticketCount.value <= 0) {
    alertNotice.value = 'Tiket kamu belum mencukupi. Selesaikan latihan soal terlebih dahulu untuk mendapatkan tiket!'
    return
  }

  const success = useTicket(email)
  if (!success) return

  isOpening.value = true

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * possibleRewards.length)
    const wonReward = { ...possibleRewards[randomIndex] }

    if (wonReward.type === 'figure') {
      const randomFig = figureModels[Math.floor(Math.random() * figureModels.length)]
      wonReward.figureId = randomFig.id
      wonReward.name = `Figure 3D: ${randomFig.name}`
      selectedFigureId.value = randomFig.id
    }

    if (wonReward.xp) {
      addXp(email, wonReward.xp)
    }
    if (wonReward.tickets) {
      addTickets(email, wonReward.tickets)
    }

    addReward(email, {
      name: wonReward.name,
      icon: wonReward.icon,
      rarity: wonReward.type === 'figure' ? 'Legendary' : wonReward.tickets ? 'Rare' : 'Common',
    })

    lastReward.value = wonReward
    isOpening.value = false
    showRewardModal.value = true
    loadData()
  }, 850)
}

function closeModal() {
  showRewardModal.value = false
  lastReward.value = null
}

function inspectWonFigure3D() {
  if (lastReward.value?.figureId) {
    selectedFigureId.value = lastReward.value.figureId
  }
  closeModal()
  const el = document.getElementById('viewer-3d')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

// ============================================================================
// 3D CANVAS ENGINE (Software Projection + Normal Shading + Backface Culling)
// ============================================================================
function vecSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function vecCross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function vecDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function vecNorm(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

function addBoxPart(parts, cx, cy, cz, w, h, d, color) {
  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  const verts = [
    [cx - hw, cy - hh, cz - hd],
    [cx + hw, cy - hh, cz - hd],
    [cx + hw, cy + hh, cz - hd],
    [cx - hw, cy + hh, cz - hd],
    [cx - hw, cy - hh, cz + hd],
    [cx + hw, cy - hh, cz + hd],
    [cx + hw, cy + hh, cz + hd],
    [cx - hw, cy + hh, cz + hd],
  ]
  const rawFaces = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [0, 3, 7, 4],
    [1, 2, 6, 5],
  ]
  const center = [cx, cy, cz]
  rawFaces.forEach((idxs) => {
    const p0 = verts[idxs[0]]
    const p1 = verts[idxs[1]]
    const p2 = verts[idxs[2]]
    const p3 = verts[idxs[3]]
    const fc = [
      (p0[0] + p1[0] + p2[0] + p3[0]) / 4,
      (p0[1] + p1[1] + p2[1] + p3[1]) / 4,
      (p0[2] + p1[2] + p2[2] + p3[2]) / 4,
    ]
    const n = vecCross(vecSub(p1, p0), vecSub(p2, p0))
    const oriented = vecDot(n, vecSub(fc, center)) >= 0
      ? [p0, p1, p2, p3]
      : [p0, p3, p2, p1]
    parts.push({ points: oriented, color })
  })
}

function addOctaPart(parts, cx, cy, cz, rx, ry, rz, color) {
  const verts = [
    [cx, cy - ry, cz], // top 0
    [cx + rx, cy, cz], // right 1
    [cx, cy, cz + rz], // front 2
    [cx - rx, cy, cz], // left 3
    [cx, cy, cz - rz], // back 4
    [cx, cy + ry, cz], // bottom 5
  ]
  const rawFaces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 1],
    [5, 2, 1],
    [5, 3, 2],
    [5, 4, 3],
    [5, 1, 4],
  ]
  const center = [cx, cy, cz]
  rawFaces.forEach((idxs) => {
    const p0 = verts[idxs[0]]
    const p1 = verts[idxs[1]]
    const p2 = verts[idxs[2]]
    const fc = [
      (p0[0] + p1[0] + p2[0]) / 3,
      (p0[1] + p1[1] + p2[1]) / 3,
      (p0[2] + p1[2] + p2[2]) / 3,
    ]
    const n = vecCross(vecSub(p1, p0), vecSub(p2, p0))
    const oriented = vecDot(n, vecSub(fc, center)) >= 0 ? [p0, p1, p2] : [p0, p2, p1]
    parts.push({ points: oriented, color })
  })
}

function addPyramidPart(parts, cx, cy, cz, w, h, d, color) {
  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  const top = [cx, cy - hh, cz]
  const b0 = [cx - hw, cy + hh, cz - hd]
  const b1 = [cx + hw, cy + hh, cz - hd]
  const b2 = [cx + hw, cy + hh, cz + hd]
  const b3 = [cx - hw, cy + hh, cz + hd]
  const rawTris = [
    [top, b0, b1],
    [top, b1, b2],
    [top, b2, b3],
    [top, b3, b0],
  ]
  const center = [cx, cy, cz]
  rawTris.forEach(([p0, p1, p2]) => {
    const fc = [(p0[0] + p1[0] + p2[0]) / 3, (p0[1] + p1[1] + p2[1]) / 3, (p0[2] + p1[2] + p2[2]) / 3]
    const n = vecCross(vecSub(p1, p0), vecSub(p2, p0))
    const oriented = vecDot(n, vecSub(fc, center)) >= 0 ? [p0, p1, p2] : [p0, p2, p1]
    parts.push({ points: oriented, color })
  })
  // Base quad
  const baseCenter = [cx, cy + hh, cz]
  const nb = vecCross(vecSub(b1, b0), vecSub(b2, b0))
  const orientedBase = vecDot(nb, vecSub(baseCenter, center)) >= 0 ? [b0, b1, b2, b3] : [b0, b3, b2, b1]
  parts.push({ points: orientedBase, color })
}

function buildFigureMesh(figureId) {
  const parts = []

  if (figureId === 'astro') {
    // Pedestal biru & perak
    addBoxPart(parts, 0, 74, 0, 88, 12, 88, [30, 64, 175])
    addBoxPart(parts, 0, 65, 0, 74, 7, 74, [219, 234, 254])

    // Kaki & Sepatu
    addBoxPart(parts, -14, 55, 2, 16, 12, 22, [37, 99, 235])
    addBoxPart(parts, 14, 55, 2, 16, 12, 22, [37, 99, 235])
    addBoxPart(parts, -14, 41, 0, 12, 18, 12, [191, 219, 254])
    addBoxPart(parts, 14, 41, 0, 12, 18, 12, [191, 219, 254])

    // Badan + Inti Kristal + Jetpack
    addBoxPart(parts, 0, 14, 0, 44, 38, 28, [239, 246, 255])
    addBoxPart(parts, 0, 14, 15, 22, 18, 4, [59, 130, 246])
    addOctaPart(parts, 0, 14, 18, 7, 7, 5, [103, 232, 249])
    addBoxPart(parts, -9, 13, -18, 12, 26, 10, [30, 64, 175])
    addBoxPart(parts, 9, 13, -18, 12, 26, 10, [30, 64, 175])

    // Tangan
    addBoxPart(parts, -30, 14, 0, 12, 32, 14, [96, 165, 250])
    addBoxPart(parts, 30, 14, 0, 12, 32, 14, [96, 165, 250])
    addBoxPart(parts, -30, 32, 0, 10, 8, 12, [30, 64, 175])
    addBoxPart(parts, 30, 32, 0, 10, 8, 12, [30, 64, 175])

    // Kepala + Visor + Mata + Earcaps + Antena
    addBoxPart(parts, 0, -28, 0, 56, 40, 40, [248, 250, 252])
    addBoxPart(parts, 0, -28, 21, 44, 24, 4, [15, 23, 42])
    addBoxPart(parts, -11, -28, 23.5, 9, 9, 2.5, [56, 189, 248])
    addBoxPart(parts, 11, -28, 23.5, 9, 9, 2.5, [56, 189, 248])
    addBoxPart(parts, -31, -28, 0, 8, 18, 18, [37, 99, 235])
    addBoxPart(parts, 31, -28, 0, 8, 18, 18, [37, 99, 235])
    addBoxPart(parts, 0, -54, 0, 5, 14, 5, [148, 163, 184])
    addOctaPart(parts, 0, -64, 0, 8, 8, 8, [56, 189, 248])
  } else if (figureId === 'scholar') {
    // Pedestal ungu elegan
    addBoxPart(parts, 0, 74, 0, 88, 12, 88, [109, 40, 217])
    addBoxPart(parts, 0, 65, 0, 74, 7, 74, [237, 233, 254])

    // Jubah Akademik Bertingkat
    addBoxPart(parts, 0, 50, 0, 48, 24, 34, [91, 33, 182])
    addBoxPart(parts, 0, 24, 0, 40, 30, 28, [124, 58, 237])
    addBoxPart(parts, 0, 24, 15, 12, 28, 4, [250, 204, 21]) // selempang emas

    // Tangan + Buku kecil di tangan kanan
    addBoxPart(parts, -27, 22, 2, 11, 26, 12, [139, 92, 246])
    addBoxPart(parts, 27, 22, 6, 11, 26, 12, [139, 92, 246])
    addBoxPart(parts, 29, 32, 14, 16, 12, 6, [255, 255, 255])

    // Kepala
    addBoxPart(parts, 0, -14, 0, 48, 40, 38, [245, 243, 255])
    addBoxPart(parts, 0, -13, 20, 38, 20, 3.5, [30, 27, 75])
    addBoxPart(parts, -10, -13, 22.5, 8, 8, 2, [192, 132, 252])
    addBoxPart(parts, 10, -13, 22.5, 8, 8, 2, [192, 132, 252])

    // Topi Toga Wisuda (Mortarboard)
    addBoxPart(parts, 0, -37, 0, 42, 10, 34, [46, 16, 101])
    addBoxPart(parts, 0, -45, 0, 66, 6, 66, [30, 27, 75])
    addBoxPart(parts, 28, -32, 28, 5, 22, 5, [250, 204, 21]) // tali tassel

    // Bintang 3D melayang di atas topi
    addOctaPart(parts, 0, -64, 0, 10, 10, 10, [196, 181, 253])
  } else {
    // Cyber Owl Figure (Toska)
    addBoxPart(parts, 0, 74, 0, 88, 12, 88, [15, 118, 110])
    addBoxPart(parts, 0, 65, 0, 74, 7, 74, [204, 251, 241])

    // Cakar
    addBoxPart(parts, -14, 57, 6, 12, 8, 18, [245, 158, 11])
    addBoxPart(parts, 14, 57, 6, 12, 8, 18, [245, 158, 11])

    // Tubuh & Sayap Burung Hantu
    addBoxPart(parts, 0, 26, 0, 48, 52, 38, [20, 184, 166])
    addBoxPart(parts, 0, 30, 20, 32, 36, 4, [240, 253, 250])
    addBoxPart(parts, -29, 26, -2, 12, 42, 26, [13, 148, 136])
    addBoxPart(parts, 29, 26, -2, 12, 42, 26, [13, 148, 136])

    // Kepala & Telinga Lancip
    addBoxPart(parts, 0, -18, 0, 52, 38, 40, [45, 212, 191])
    addPyramidPart(parts, -20, -47, 0, 14, 20, 14, [15, 118, 110])
    addPyramidPart(parts, 20, -47, 0, 14, 20, 14, [15, 118, 110])

    // Kacamata Lensa Besar + Paruh Emas
    addBoxPart(parts, -13, -18, 21, 18, 18, 5, [15, 23, 42])
    addBoxPart(parts, 13, -18, 21, 18, 18, 5, [15, 23, 42])
    addBoxPart(parts, -13, -18, 24, 10, 10, 2.5, [94, 234, 212])
    addBoxPart(parts, 13, -18, 24, 10, 10, 2.5, [94, 234, 212])
    addOctaPart(parts, 0, -9, 23, 6, 8, 7, [251, 191, 36])
  }

  return parts
}

function rotatePoint(p, ay, ax) {
  // Rotasi Y
  const cosY = Math.cos(ay)
  const sinY = Math.sin(ay)
  const x1 = p[0] * cosY + p[2] * sinY
  const z1 = -p[0] * sinY + p[2] * cosY
  const y1 = p[1]

  // Rotasi X
  const cosX = Math.cos(ax)
  const sinX = Math.sin(ax)
  const y2 = y1 * cosX - z1 * sinX
  const z2 = y1 * sinX + z1 * cosX

  return [x1, y2, z2]
}

function render3DScene() {
  const canvas = figureCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.clientWidth || 420
  const cssH = canvas.clientHeight || 360
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
  }

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, cssW, cssH)

  // Bayangan lembut di lantai di bawah figur
  const cx = cssW / 2
  const cy = cssH / 2 + 8
  const shadowGrad = ctx.createRadialGradient(cx, cy + 92 * zoomLevel.value, 10, cx, cy + 92 * zoomLevel.value, 95 * zoomLevel.value)
  shadowGrad.addColorStop(0, 'rgba(15, 40, 82, 0.22)')
  shadowGrad.addColorStop(1, 'rgba(15, 40, 82, 0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(cx, cy + 92 * zoomLevel.value, 92 * zoomLevel.value, 22 * zoomLevel.value, 0, 0, Math.PI * 2)
  ctx.fill()

  const mesh = buildFigureMesh(selectedFigureId.value)
  const camDist = 360
  const fov = 320 * zoomLevel.value
  const lightKey = vecNorm([-0.45, -0.65, 0.72])
  const lightRim = vecNorm([0.55, 0.25, 0.45])

  const projectedFaces = []

  mesh.forEach((face) => {
    const tPts = face.points.map((p) => rotatePoint(p, rotY, rotX))
    const v0 = tPts[0]
    const v1 = tPts[1]
    const v2 = tPts[2]

    const normal = vecNorm(vecCross(vecSub(v1, v0), vecSub(v2, v0)))
    const faceCenter = [
      tPts.reduce((s, p) => s + p[0], 0) / tPts.length,
      tPts.reduce((s, p) => s + p[1], 0) / tPts.length,
      tPts.reduce((s, p) => s + p[2], 0) / tPts.length,
    ]

    // Culling sisi belakang
    const toCamera = vecSub([0, 0, camDist], faceCenter)
    if (vecDot(normal, toCamera) <= 0) return

    const diff1 = Math.max(0, vecDot(normal, lightKey))
    const diff2 = Math.max(0, vecDot(normal, lightRim))
    const intensity = Math.min(1.15, 0.42 + diff1 * 0.52 + diff2 * 0.16)

    const r = Math.min(255, Math.round(face.color[0] * intensity))
    const g = Math.min(255, Math.round(face.color[1] * intensity))
    const b = Math.min(255, Math.round(face.color[2] * intensity))

    const avgZ = tPts.reduce((s, p) => s + p[2], 0) / tPts.length
    const pts2d = tPts.map((p) => {
      const scale = fov / Math.max(80, camDist - p[2])
      return [cx + p[0] * scale, cy + p[1] * scale]
    })

    projectedFaces.push({ pts2d, avgZ, fill: `rgb(${r},${g},${b})` })
  })

  projectedFaces.sort((a, b) => a.avgZ - b.avgZ)

  projectedFaces.forEach((f) => {
    ctx.beginPath()
    f.pts2d.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = f.fill
    ctx.fill()
    ctx.strokeStyle = f.fill
    ctx.lineWidth = 0.75
    ctx.stroke()
  })

  ctx.restore()
}

function animate3D() {
  if (autoRotate.value && !isDragging.value) {
    rotY += 0.012
  }
  render3DScene()
  animationFrameId = requestAnimationFrame(animate3D)
}

function handlePointerDown(e) {
  isDragging.value = true
  lastPointerX = e.clientX
  lastPointerY = e.clientY
}

function handlePointerMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - lastPointerX
  const dy = e.clientY - lastPointerY
  rotY += dx * 0.012
  rotX = Math.max(-0.85, Math.min(0.65, rotX + dy * 0.01))
  lastPointerX = e.clientX
  lastPointerY = e.clientY
}

function handlePointerUp() {
  isDragging.value = false
}

function resetCamera() {
  rotY = 0.45
  rotX = -0.18
  zoomLevel.value = 1.05
}

onMounted(() => {
  loadData()
  animationFrameId = requestAnimationFrame(animate3D)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased">
    <Navbar />

    <main class="mx-auto max-w-[1200px] px-6 pb-14 pt-6 space-y-6">
      <!-- Header -->
      <section>
        <h1 class="text-xl font-semibold text-[#0A2540] sm:text-2xl">
          Mystery Blind Box &amp; Koleksi Figure 3D
        </h1>
        <p class="mt-1 text-xs text-slate-600 sm:text-sm">
          Gunakan tiket belajar kamu untuk membuka Blind Box dan kumpulkan hadiah XP, tiket, maupun Figure 3D yang bisa diputar 360°.
        </p>
      </section>

      <!-- Notifikasi jika tiket habis (Tema Biru Bersih) -->
      <div
        v-if="alertNotice"
        class="flex items-center justify-between gap-3 rounded-2xl border border-[#B8DCFA] bg-white px-5 py-3 text-xs font-medium text-[#0A2540] shadow-2xs sm:text-sm"
      >
        <span>{{ alertNotice }}</span>
        <button
          type="button"
          @click="alertNotice = ''"
          class="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Main Section: Buka Blind Box -->
      <div class="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <!-- Kiri: Area Gift Box -->
        <div class="flex flex-col items-center justify-center rounded-2xl border border-[#C5E4FA] bg-white p-8 shadow-2xs">
          <div
            class="transition-transform duration-500"
            :class="isOpening ? 'scale-105 animate-bounce' : 'hover:scale-105'"
          >
            <img
              src="../assets/images/gift_box.png"
              alt="Mystery Blind Box"
              class="h-[260px] w-auto drop-shadow-lg sm:h-[290px]"
            />
          </div>

          <button
            type="button"
            @click="handleOpenBox"
            :disabled="isOpening || ticketCount <= 0"
            class="mt-6 flex flex-col items-center justify-center rounded-xl bg-[#2D6BE4] px-10 py-3 text-center text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <span class="text-sm font-semibold sm:text-base">
              {{ isOpening ? 'Membuka...' : 'Buka Blind Box' }}
            </span>
            <span class="text-[11px] font-normal text-sky-100">
              Membutuhkan 1 Tiket
            </span>
          </button>
        </div>

        <!-- Kanan: Tiket & Kemungkinan Hadiah -->
        <div class="space-y-5">
          <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-slate-500">Tiket kamu saat ini</p>
                <p class="mt-1 text-3xl font-semibold text-[#0A2540]">
                  {{ ticketCount }} <span class="text-sm font-normal text-slate-500">Tiket</span>
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-500">Koleksi Figure</p>
                <p class="mt-1 text-xl font-semibold text-[#2D6BE4]">
                  {{ collectedFiguresCount }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs space-y-3">
            <h2 class="text-sm font-semibold text-[#0A2540]">
              Kemungkinan Hadiah
            </h2>

            <ul class="space-y-2.5 text-xs text-slate-600">
              <li
                v-for="(item, idx) in possibleRewards"
                :key="idx"
                class="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-[#F8FBFF]"
              >
                <span class="font-medium text-[#0A2540]">{{ item.name }}</span>
                <span v-if="item.type === 'figure'" class="rounded-full bg-[#EAF5FD] px-2 py-0.5 text-[10px] font-medium text-[#2D6BE4]">
                  3D View
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- INTERACTIVE 3D COLLECTIBLE FIGURE VIEWER (Putar 360 Derajat) -->
      <section id="viewer-3d" class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span class="inline-block rounded-full bg-[#EAF5FD] px-3 py-0.5 text-[11px] font-medium text-[#2D6BE4]">
              Preview Hadiah Blind Box 3D
            </span>
            <h2 class="mt-1 text-base font-semibold text-[#0A2540] sm:text-lg">
              Koleksi Figure 3D Interaktif
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Geser gambar figur di bawah dengan mouse atau sentuhan untuk memutar 360°.
            </p>
          </div>

          <!-- Tombol Pilih Karakter Figure 3D -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="fig in figureModels"
              :key="fig.id"
              type="button"
              @click="selectedFigureId = fig.id"
              class="rounded-xl border px-3.5 py-2 text-xs font-medium transition cursor-pointer"
              :class="
                selectedFigureId === fig.id
                  ? 'border-[#2D6BE4] bg-[#2D6BE4] text-white shadow-2xs'
                  : 'border-slate-200 bg-[#F8FBFF] text-slate-600 hover:border-[#C5E4FA] hover:text-[#0A2540]'
              "
            >
              {{ fig.name }}
            </button>
          </div>
        </div>

        <div class="mt-6 grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <!-- Canvas Viewport 3D -->
          <div class="relative overflow-hidden rounded-2xl border border-[#C5E4FA] bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE]">
            <canvas
              ref="figureCanvas"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointerleave="handlePointerUp"
              class="h-[340px] w-full cursor-grab active:cursor-grabbing touch-none sm:h-[380px]"
            ></canvas>

            <!-- Kontrol Kamera 3D -->
            <div class="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
              <span class="rounded-xl bg-white/85 px-3 py-1.5 text-[11px] font-medium text-slate-600 backdrop-blur-xs">
                Klik &amp; geser untuk memutar 3D
              </span>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="zoomLevel = Math.max(0.7, Number((zoomLevel - 0.15).toFixed(2)))"
                  class="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-[#0A2540] shadow-2xs hover:bg-white cursor-pointer"
                  title="Perkecil"
                >
                  −
                </button>
                <button
                  type="button"
                  @click="zoomLevel = Math.min(1.6, Number((zoomLevel + 0.15).toFixed(2)))"
                  class="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-[#0A2540] shadow-2xs hover:bg-white cursor-pointer"
                  title="Perbesar"
                >
                  +
                </button>
                <button
                  type="button"
                  @click="autoRotate = !autoRotate"
                  class="rounded-lg px-3 py-1 text-xs font-medium shadow-2xs transition cursor-pointer"
                  :class="autoRotate ? 'bg-[#2D6BE4] text-white' : 'bg-white/90 text-slate-700 hover:bg-white'"
                >
                  {{ autoRotate ? 'Auto-Putar: Aktif' : 'Auto-Putar: Mati' }}
                </button>
                <button
                  type="button"
                  @click="resetCamera"
                  class="rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-white cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <!-- Info Detail Figure Terpilih -->
          <div class="space-y-4 rounded-2xl border border-slate-100 bg-[#F8FBFF] p-6">
            <div class="flex items-center justify-between gap-2">
              <span class="rounded-full border px-3 py-0.5 text-[11px] font-medium" :class="currentFigure.accentBg">
                {{ currentFigure.rarity }}
              </span>
              <span class="text-xs text-slate-400">
                {{ currentFigure.series }}
              </span>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-[#0A2540]">
                {{ currentFigure.name }}
              </h3>
              <p class="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {{ currentFigure.desc }}
              </p>
            </div>

            <div class="space-y-2 border-t border-slate-200/70 pt-4 text-xs text-slate-600">
              <p class="font-medium text-[#0A2540]">Cara mendapatkan:</p>
              <p>Kumpulkan tiket dengan menyelesaikan soal di menu Upload Soal / Tugas Saya, lalu buka Mystery Blind Box untuk berpeluang mengoleksi seluruh seri Figure 3D.</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal Hadiah Terbuka -->
    <div
      v-if="showRewardModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
    >
      <div class="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl space-y-3">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF5FD] text-3xl">
          {{ lastReward?.icon || '🎁' }}
        </div>
        <h3 class="text-lg font-semibold text-[#0A2540]">
          Selamat!
        </h3>
        <p class="text-sm font-medium text-[#2D6BE4]">
          Kamu mendapatkan {{ lastReward?.name }}
        </p>
        <p class="text-xs text-slate-500">
          {{ lastReward?.desc }}
        </p>

        <div class="space-y-2 pt-3">
          <button
            v-if="lastReward?.type === 'figure'"
            type="button"
            @click="inspectWonFigure3D"
            class="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 cursor-pointer"
          >
            Lihat &amp; Putar Figure 3D Sekarang
          </button>
          <button
            type="button"
            @click="closeModal"
            class="w-full rounded-xl bg-[#2D6BE4] py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 cursor-pointer"
          >
            Ambil &amp; Simpan Hadiah
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
