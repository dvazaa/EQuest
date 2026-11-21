<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import {
  getCurrentUser,
  getUserStats,
  useTicket,
  addXp,
  addTickets,
  addReward,
  COLLECTIBLE_FIGURES,
  SPECIAL_THEMES,
  unlockFigureForUser,
  unlockThemeForUser,
  setActiveThemeForUser,
} from '../utils/equestState'

import figureAppleImg from '../assets/images/figure_apple.jpg'
import figureWarriorImg from '../assets/images/figure_warrior.jpg'
import figureRoseImg from '../assets/images/figure_rose.jpg'

const figureImages = {
  apple: figureAppleImg,
  warrior: figureWarriorImg,
  rose: figureRoseImg,
}

const currentUser = ref(null)
const userStats = ref(null)
const isOpening = ref(false)
const showRewardModal = ref(false)
const lastReward = ref(null)
const alertNotice = ref('')

// Lemari Koleksi & Modal Detail Figure 3D
const isFigureModalOpen = ref(false)
const activeFigureId = ref('apple')
const viewMode3D = ref('mesh') // 'mesh' | 'photo'
const figureCanvas = ref(null)
const autoRotate = ref(true)
const zoomLevel = ref(1.05)
const isDragging = ref(false)
const photoTiltX = ref(-6)
const photoTiltY = ref(14)

let rotY = 0.35
let rotX = -0.14
let lastPointerX = 0
let lastPointerY = 0
let animationFrameId = null

function loadData() {
  currentUser.value = getCurrentUser()
  if (currentUser.value?.email) {
    userStats.value = getUserStats(currentUser.value.email)
  }
  window.dispatchEvent(new Event('equest-stats-updated'))
}

const ticketCount = computed(() => userStats.value?.tickets ?? 0)
const unlockedFigures = computed(() => userStats.value?.unlockedFigures || [])
const unlockedThemes = computed(() => userStats.value?.unlockedThemes || ['blue'])
const activeTheme = computed(() => userStats.value?.activeTheme || 'blue')

const activeFigureObj = computed(() => {
  return COLLECTIBLE_FIGURES.find((f) => f.id === activeFigureId.value) || COLLECTIBLE_FIGURES[0]
})

function isFigureUnlocked(figId) {
  return unlockedFigures.value.includes(figId)
}

function isThemeUnlocked(themeId) {
  return themeId === 'blue' || unlockedThemes.value.includes(themeId)
}

function handleSelectTheme(theme) {
  const email = currentUser.value?.email
  if (!email) return
  if (!isThemeUnlocked(theme.id)) {
    alertNotice.value = `Tema "${theme.name}" masih terkunci. Buka Mystery Blind Box untuk mendapatkan hadiah Tema Spesial!`
    return
  }
  setActiveThemeForUser(email, theme.id)
  loadData()
}

const possibleRewards = [
  { type: 'xp', name: '+ 50 XP', xp: 50, icon: '⭐', desc: 'Bonus pengalaman belajar ekstra' },
  { type: 'xp', name: '+ 100 XP', xp: 100, icon: '🌟', desc: 'Hadiah XP besar untuk akselerasi peringkat' },
  { type: 'ticket', name: '+ 1 Tiket', tickets: 1, icon: '🎟️', desc: 'Tiket gratis untuk membuka Blind Box lagi' },
  { type: 'badge', name: 'Badge', icon: '🎖️', desc: 'Pencapaian pemburu misteri' },
  { type: 'theme', name: 'Tema Spesial', icon: '🎨', desc: 'Membuka tema warna latar baru untuk website EQuest' },
  { type: 'figure', name: 'Figure Collection', icon: '🧸', desc: 'Miniatur koleksi figure 3D yang tersimpan di Lemari Koleksi' },
]

function handleOpenBox() {
  alertNotice.value = ''
  const email = currentUser.value?.email
  if (!email) return

  if (ticketCount.value <= 0) {
    alertNotice.value = 'Tiket kamu belum mencukupi. Selesaikan latihan soal terlebih dahulu untuk mendapatkan tiket.'
    return
  }

  const success = useTicket(email)
  if (!success) return

  isOpening.value = true

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * possibleRewards.length)
    const wonReward = { ...possibleRewards[randomIndex] }

    if (wonReward.type === 'figure') {
      const lockedPool = COLLECTIBLE_FIGURES.filter((f) => !unlockedFigures.value.includes(f.id))
      const pool = lockedPool.length > 0 ? lockedPool : COLLECTIBLE_FIGURES
      const chosen = pool[Math.floor(Math.random() * pool.length)]
      unlockFigureForUser(email, chosen.id)
      wonReward.figureId = chosen.id
      wonReward.name = `Figure: ${chosen.name}`
      wonReward.desc = chosen.desc
    } else if (wonReward.type === 'theme') {
      const extraThemes = SPECIAL_THEMES.filter((t) => !t.isDefault)
      const lockedThemes = extraThemes.filter((t) => !unlockedThemes.value.includes(t.id))
      const pool = lockedThemes.length > 0 ? lockedThemes : extraThemes
      const chosenTheme = pool[Math.floor(Math.random() * pool.length)]
      unlockThemeForUser(email, chosenTheme.id)
      wonReward.themeId = chosenTheme.id
      wonReward.name = `Tema Spesial: ${chosenTheme.name}`
      wonReward.desc = `Tema latar "${chosenTheme.name}" kini terbuka dan bisa kamu aktifkan di halaman Blind Box.`
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
      rarity: wonReward.type === 'figure' ? 'Legendary' : wonReward.type === 'theme' ? 'Epic' : wonReward.tickets ? 'Rare' : 'Common',
    })

    lastReward.value = wonReward
    isOpening.value = false
    showRewardModal.value = true
    loadData()
  }, 800)
}

function closeModal() {
  showRewardModal.value = false
  lastReward.value = null
}

function openFigureDetail(fig) {
  if (!isFigureUnlocked(fig.id)) {
    alertNotice.value = `Figure "${fig.name}" belum dimiliki. Buka Mystery Blind Box untuk mengoleksinya!`
    return
  }
  alertNotice.value = ''
  activeFigureId.value = fig.id
  viewMode3D.value = 'mesh'
  rotY = 0.35
  rotX = -0.14
  zoomLevel.value = 1.05
  photoTiltX.value = -6
  photoTiltY.value = 14
  isFigureModalOpen.value = true
}

function inspectWonFigure3D() {
  const figId = lastReward.value?.figureId || 'apple'
  closeModal()
  activeFigureId.value = figId
  viewMode3D.value = 'mesh'
  rotY = 0.35
  rotX = -0.14
  zoomLevel.value = 1.05
  isFigureModalOpen.value = true
}

function activateWonTheme() {
  const email = currentUser.value?.email
  if (email && lastReward.value?.themeId) {
    setActiveThemeForUser(email, lastReward.value.themeId)
    loadData()
  }
  closeModal()
}

function closeFigureModal() {
  isFigureModalOpen.value = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// ============================================================================
// 3D MESH ENGINE (Di-sculpt sesuai 3 Figure Koleksi: Apple, Star Fort, Rose)
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
    [cx, cy - ry, cz],
    [cx + rx, cy, cz],
    [cx, cy, cz + rz],
    [cx - rx, cy, cz],
    [cx, cy, cz - rz],
    [cx, cy + ry, cz],
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

function addPyramidPointed(parts, apex, baseCenter, radiusX, radiusZ, color) {
  const bx = baseCenter[0]
  const by = baseCenter[1]
  const bz = baseCenter[2]
  const b0 = [bx - radiusX, by, bz - radiusZ]
  const b1 = [bx + radiusX, by, bz - radiusZ]
  const b2 = [bx + radiusX, by, bz + radiusZ]
  const b3 = [bx - radiusX, by, bz + radiusZ]
  const center = [(apex[0] + bx) / 2, (apex[1] + by) / 2, (apex[2] + bz) / 2]

  ;[
    [apex, b0, b1],
    [apex, b1, b2],
    [apex, b2, b3],
    [apex, b3, b0],
  ].forEach(([p0, p1, p2]) => {
    const fc = [(p0[0] + p1[0] + p2[0]) / 3, (p0[1] + p1[1] + p2[1]) / 3, (p0[2] + p1[2] + p2[2]) / 3]
    const n = vecCross(vecSub(p1, p0), vecSub(p2, p0))
    parts.push({ points: vecDot(n, vecSub(fc, center)) >= 0 ? [p0, p1, p2] : [p0, p2, p1], color })
  })
  const nb = vecCross(vecSub(b1, b0), vecSub(b2, b0))
  parts.push({ points: vecDot(nb, vecSub(baseCenter, center)) >= 0 ? [b0, b1, b2, b3] : [b0, b3, b2, b1], color })
}

function buildFigureMesh(figureId) {
  const parts = []

  if (figureId === 'apple') {
    // 1. APPLE BOY FIGURE (Sesuai foto 1)
    // Kaki telanjang & celana pendek denim biru gelap
    addBoxPart(parts, -12, 74, 2, 12, 12, 18, [244, 198, 175])
    addBoxPart(parts, 12, 74, 2, 12, 12, 18, [244, 198, 175])
    addBoxPart(parts, -13, 55, 0, 20, 26, 22, [45, 78, 122])
    addBoxPart(parts, 13, 55, 0, 20, 26, 22, [45, 78, 122])
    addBoxPart(parts, 0, 44, 0, 42, 12, 24, [38, 68, 108])

    // Perut terlihat (crop top) & kaos merah New York + motif emas
    addBoxPart(parts, 0, 33, 0, 36, 12, 22, [245, 199, 176])
    addBoxPart(parts, 0, 15, 0, 40, 26, 24, [208, 36, 44])
    addBoxPart(parts, 0, 24, 12.5, 28, 6, 2, [238, 198, 72]) // siluet gedung emas
    addBoxPart(parts, -11, 20, 12.6, 5, 10, 2, [238, 198, 72])
    addBoxPart(parts, 4, 19, 12.6, 6, 11, 2, [238, 198, 72])

    // Lengan kiri & kanan + lengan kaos merah
    addBoxPart(parts, -25, 11, 0, 13, 14, 16, [208, 36, 44])
    addBoxPart(parts, 25, 11, 0, 13, 14, 16, [208, 36, 44])
    addBoxPart(parts, -27, 29, 2, 10, 24, 10, [245, 199, 176])
    addBoxPart(parts, 27, 29, 2, 10, 24, 10, [245, 199, 176])

    // Kepala & Wajah peach kemerahan
    addBoxPart(parts, 0, -24, 4, 48, 42, 38, [247, 208, 188])
    // Mata melirik & pipi merona
    addBoxPart(parts, -13, -22, 23.5, 9, 6, 2, [255, 255, 255])
    addBoxPart(parts, 13, -22, 23.5, 9, 6, 2, [255, 255, 255])
    addBoxPart(parts, -15, -22, 24.5, 5, 5, 2, [26, 24, 24])
    addBoxPart(parts, 11, -22, 24.5, 5, 5, 2, [26, 24, 24])
    addBoxPart(parts, -16, -15, 23, 8, 5, 1.5, [238, 152, 132])
    addBoxPart(parts, 16, -15, 23, 8, 5, 1.5, [238, 152, 132])

    // Poni rambut hitam
    addBoxPart(parts, 0, -40, 18, 46, 12, 14, [34, 34, 38])
    addBoxPart(parts, -20, -24, 8, 10, 32, 28, [34, 34, 38])
    addBoxPart(parts, 20, -24, 8, 10, 32, 28, [34, 34, 38])

    // Tudung Apel Merah Maroon + Daun Hijau + Tangkai Coklat
    addBoxPart(parts, 0, -34, -8, 60, 56, 44, [145, 42, 52])
    addBoxPart(parts, 0, -56, 2, 54, 16, 48, [158, 46, 56])
    addBoxPart(parts, 0, -67, -2, 6, 16, 6, [110, 72, 48]) // tangkai coklat
    addBoxPart(parts, -10, -70, 0, 14, 7, 10, [92, 174, 74]) // daun hijau

    // Kacamata hitam ikonik di dahi tudung apel + mata di dalamnya
    addBoxPart(parts, -12, -52, 25, 18, 13, 4, [24, 24, 28])
    addBoxPart(parts, 12, -52, 25, 18, 13, 4, [24, 24, 28])
    addBoxPart(parts, 0, -53, 25, 8, 4, 4, [24, 24, 28])
    addBoxPart(parts, -12, -52, 26.5, 10, 7, 2, [255, 255, 255])
    addBoxPart(parts, 12, -52, 26.5, 10, 7, 2, [255, 255, 255])
    addBoxPart(parts, -12, -52, 27.5, 5, 5, 1.5, [24, 24, 28])
    addBoxPart(parts, 12, -52, 27.5, 5, 5, 1.5, [24, 24, 28])
  } else if (figureId === 'warrior') {
    // 2. STAR FORT FIGURE (Sesuai foto 2 - Warrior Shelter Kardus Bintang)
    // Alas kotak & kaki telanjang
    addBoxPart(parts, 0, 78, 0, 62, 6, 46, [196, 174, 148])
    addBoxPart(parts, -11, 70, 2, 12, 12, 18, [242, 198, 175])
    addBoxPart(parts, 11, 70, 2, 12, 12, 18, [242, 198, 175])

    // Kostum Kotak Kardus Coklat Kraft ("FORT / KEEP OUT")
    addBoxPart(parts, 0, 34, 0, 44, 62, 28, [186, 154, 120])
    addBoxPart(parts, -6, 22, 15, 20, 9, 2, [156, 76, 72]) // plester merah
    addBoxPart(parts, 12, 34, 15, 12, 10, 2, [145, 110, 80]) // plester coklat
    addBoxPart(parts, -10, 50, 15, 18, 8, 2, [130, 52, 48]) // tulisan keep out

    // Tangan + Tulang Putih kecil
    addBoxPart(parts, -27, 26, 2, 10, 26, 10, [242, 198, 175])
    addBoxPart(parts, 27, 26, 2, 10, 26, 10, [242, 198, 175])
    addBoxPart(parts, 31, 40, 8, 16, 6, 6, [238, 234, 222]) // tulang kecil

    // Kepala & Wajah berbintik
    addBoxPart(parts, 0, -20, 4, 46, 38, 36, [244, 204, 182])
    addBoxPart(parts, -13, -18, 22.5, 9, 6, 2, [255, 255, 255])
    addBoxPart(parts, 13, -18, 22.5, 9, 6, 2, [255, 255, 255])
    addBoxPart(parts, -15, -18, 23.5, 5, 5, 2, [24, 24, 24])
    addBoxPart(parts, 11, -18, 23.5, 5, 5, 2, [24, 24, 24])
    addBoxPart(parts, 0, -34, 18, 44, 12, 14, [38, 38, 42]) // poni rambut hitam

    // Tudung Topeng Bintang Kardus 5 Sisi
    addBoxPart(parts, 0, -24, -8, 58, 52, 34, [188, 156, 122])
    addPyramidPointed(parts, [0, -82, 0], [0, -48, 0], 18, 14, [196, 165, 130]) // puncak bintang atas
    addBoxPart(parts, -38, -28, 0, 24, 22, 18, [182, 150, 116]) // sudut bintang kiri
    addBoxPart(parts, 38, -28, 0, 24, 22, 18, [182, 150, 116]) // sudut bintang kanan
    addBoxPart(parts, -26, -2, 2, 18, 16, 18, [174, 142, 108]) // sudut bawah kiri
    addBoxPart(parts, 26, -2, 2, 18, 16, 18, [174, 142, 108]) // sudut bawah kanan
    addBoxPart(parts, -18, -14, 14, 12, 10, 3, [145, 110, 80]) // tambalan kardus
  } else {
    // 3. ROSE PRINCE FIGURE (Sesuai foto 3 - Mawar Merah & Kawah Bulan)
    // Alas Kawah Bulan Abu-abu + Kawah cekungan
    addBoxPart(parts, 0, 74, 0, 70, 14, 62, [118, 128, 138])
    addBoxPart(parts, 0, 66, 0, 56, 6, 48, [104, 114, 124])
    addBoxPart(parts, -18, 65, 14, 10, 4, 10, [88, 96, 106])
    addBoxPart(parts, 18, 66, -10, 12, 4, 12, [88, 96, 106])

    // Kaki & Lilitan Tangkai Hijau di Kaki + Jubah Putih Pangeran
    addBoxPart(parts, -10, 60, 2, 10, 12, 14, [242, 198, 176])
    addBoxPart(parts, 10, 60, 2, 10, 12, 14, [242, 198, 176])
    addBoxPart(parts, -14, 58, 10, 18, 7, 10, [62, 104, 42]) // tangkai di kaki
    addBoxPart(parts, 0, 30, 0, 42, 52, 30, [236, 234, 224]) // jubah putih
    addBoxPart(parts, 22, 36, 10, 10, 44, 12, [242, 240, 232]) // kain panjang menjuntai

    // Tangkai Mawar Hijau Berduri dipeluk + Tangan
    addBoxPart(parts, -8, 12, 8, 10, 24, 10, [242, 198, 176])
    addBoxPart(parts, 4, 24, 17, 36, 8, 9, [62, 104, 42])
    addOctaPart(parts, -14, 24, 18, 4, 6, 4, [152, 42, 42]) // duri

    // Kelopak Daun Hijau Leher
    addBoxPart(parts, 0, 0, 2, 50, 8, 40, [54, 96, 38])

    // Kepala + Rambut Pirang Keemasan + Mata Sayu
    addBoxPart(parts, 0, -24, 5, 44, 38, 34, [244, 204, 182])
    addBoxPart(parts, -12, -22, 22.5, 9, 6, 2, [255, 255, 255])
    addBoxPart(parts, 12, -22, 22.5, 9, 6, 2, [255, 255, 255])
    addBoxPart(parts, -14, -22, 23.5, 5, 5, 2, [42, 28, 28])
    addBoxPart(parts, 14, -22, 23.5, 5, 5, 2, [42, 28, 28])
    addBoxPart(parts, 0, -37, 17, 40, 11, 14, [218, 165, 58]) // poni rambut pirang

    // Tudung Kelopak Mawar Merah Berlapis
    addBoxPart(parts, 0, -30, -8, 58, 52, 40, [145, 24, 34])
    addBoxPart(parts, -27, -28, 2, 14, 42, 34, [162, 28, 38])
    addBoxPart(parts, 27, -28, 2, 14, 42, 34, [162, 28, 38])
    addBoxPart(parts, 0, -54, -2, 46, 20, 42, [174, 34, 44])
    addOctaPart(parts, 0, -68, -2, 22, 16, 20, [132, 20, 30])
    addOctaPart(parts, -16, -58, 8, 14, 14, 14, [186, 40, 50])
    addOctaPart(parts, 16, -58, 8, 14, 14, 14, [186, 40, 50])
  }

  return parts
}

function rotatePoint(p, ay, ax) {
  const cosY = Math.cos(ay)
  const sinY = Math.sin(ay)
  const x1 = p[0] * cosY + p[2] * sinY
  const z1 = -p[0] * sinY + p[2] * cosY
  const y1 = p[1]

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
  const cssW = canvas.clientWidth || 380
  const cssH = canvas.clientHeight || 340
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
  }

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, cssW, cssH)

  const cx = cssW / 2
  const cy = cssH / 2 + 4
  const shadowGrad = ctx.createRadialGradient(cx, cy + 90 * zoomLevel.value, 10, cx, cy + 90 * zoomLevel.value, 90 * zoomLevel.value)
  shadowGrad.addColorStop(0, 'rgba(15, 40, 82, 0.22)')
  shadowGrad.addColorStop(1, 'rgba(15, 40, 82, 0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(cx, cy + 90 * zoomLevel.value, 85 * zoomLevel.value, 20 * zoomLevel.value, 0, 0, Math.PI * 2)
  ctx.fill()

  const mesh = buildFigureMesh(activeFigureId.value)
  const camDist = 360
  const fov = 300 * zoomLevel.value
  const lightKey = vecNorm([-0.45, -0.65, 0.72])
  const lightRim = vecNorm([0.55, 0.25, 0.45])

  const projectedFaces = []

  mesh.forEach((face) => {
    const tPts = face.points.map((p) => rotatePoint(p, rotY, rotX))
    const normal = vecNorm(vecCross(vecSub(tPts[1], tPts[0]), vecSub(tPts[2], tPts[0])))
    const faceCenter = [
      tPts.reduce((s, p) => s + p[0], 0) / tPts.length,
      tPts.reduce((s, p) => s + p[1], 0) / tPts.length,
      tPts.reduce((s, p) => s + p[2], 0) / tPts.length,
    ]

    const toCamera = vecSub([0, 0, camDist], faceCenter)
    if (vecDot(normal, toCamera) <= 0) return

    const diff1 = Math.max(0, vecDot(normal, lightKey))
    const diff2 = Math.max(0, vecDot(normal, lightRim))
    const intensity = Math.min(1.15, 0.44 + diff1 * 0.52 + diff2 * 0.16)

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
  if (!isFigureModalOpen.value || viewMode3D.value !== 'mesh') return
  if (autoRotate.value && !isDragging.value) {
    rotY += 0.014
  }
  render3DScene()
  animationFrameId = requestAnimationFrame(animate3D)
}

watch([isFigureModalOpen, viewMode3D], async ([open, mode]) => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (open && mode === 'mesh') {
    await nextTick()
    animationFrameId = requestAnimationFrame(animate3D)
  }
})

function handlePointerDown(e) {
  isDragging.value = true
  lastPointerX = e.clientX
  lastPointerY = e.clientY
}

function handlePointerMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - lastPointerX
  const dy = e.clientY - lastPointerY
  if (viewMode3D.value === 'mesh') {
    rotY += dx * 0.012
    rotX = Math.max(-0.85, Math.min(0.65, rotX + dy * 0.01))
  } else {
    photoTiltY.value = Math.max(-42, Math.min(42, photoTiltY.value + dx * 0.45))
    photoTiltX.value = Math.max(-30, Math.min(30, photoTiltX.value - dy * 0.45))
  }
  lastPointerX = e.clientX
  lastPointerY = e.clientY
}

function handlePointerUp() {
  isDragging.value = false
}

function resetCamera() {
  rotY = 0.35
  rotX = -0.14
  zoomLevel.value = 1.05
  photoTiltX.value = -6
  photoTiltY.value = 14
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#D8EDFB] text-[#0f2852] font-sans antialiased transition-colors duration-300">
    <Navbar />

    <main class="mx-auto max-w-[1280px] px-6 pb-14 pt-6 space-y-8 sm:px-8">
      <!-- Header sesuai permintaan: cukup Mystery Blind Box saja -->
      <section>
        <h1 class="text-2xl font-semibold text-[#0A2540]">
          Mystery Blind Box
        </h1>
        <p class="mt-1 text-xs text-slate-600 sm:text-sm">
          Gunakan tiket kamu untuk membuka blind box dan dapatkan hadiah menarik!
        </p>
      </section>

      <!-- Notifikasi -->
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

      <!-- Main Section: Gift Box & Info Hadiah + Tema Spesial -->
      <div class="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <!-- Kiri: Kado 3D & Tombol Buka -->
        <div class="flex flex-col items-center justify-center rounded-3xl border border-[#C5E4FA] bg-white p-8 shadow-2xs">
          <div
            class="transition-transform duration-500"
            :class="isOpening ? 'scale-105 animate-bounce' : 'hover:scale-105'"
          >
            <img
              src="../assets/images/gift_box.png"
              alt="Mystery Blind Box"
              class="h-[260px] w-auto drop-shadow-lg sm:h-[300px]"
            />
          </div>

          <button
            type="button"
            @click="handleOpenBox"
            :disabled="isOpening || ticketCount <= 0"
            class="mt-6 flex flex-col items-center justify-center rounded-xl bg-[#2D6BE4] px-10 py-3 text-center text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            <span class="text-sm font-medium sm:text-base">
              {{ isOpening ? 'Membuka...' : 'Buka Blind Box' }}
            </span>
            <span class="text-[11px] font-normal text-sky-100">
              1 Tiket
            </span>
          </button>
        </div>

        <!-- Kanan: Tiket, Daftar Hadiah, & Pilihan Tema Spesial -->
        <div class="space-y-5">
          <!-- Tiket Kamu -->
          <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs">
            <p class="text-xs font-medium text-slate-500 sm:text-sm">
              Tiket kamu :
            </p>
            <p class="mt-1.5 text-3xl font-semibold text-[#0A2540]">
              {{ ticketCount }}
            </p>
          </div>

          <!-- Kemungkinan Hadiah -->
          <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs space-y-3">
            <h2 class="text-sm font-semibold text-[#0A2540]">
              Kemungkinan Hadiah
            </h2>

            <ul class="space-y-2.5 text-xs text-slate-600 sm:text-sm">
              <li
                v-for="(item, idx) in possibleRewards"
                :key="idx"
                class="flex items-center justify-between gap-2"
              >
                <span>{{ item.name }}</span>
              </li>
            </ul>
          </div>

          <!-- Tema Spesial Latar Belakang -->
          <div class="rounded-2xl border border-[#C5E4FA] bg-white p-6 shadow-2xs space-y-3">
            <div>
              <h2 class="text-sm font-semibold text-[#0A2540]">
                Tema Spesial Latar
              </h2>
              <p class="mt-0.5 text-xs text-slate-500">
                Ubah warna latar website dengan hadiah tema dari Blind Box.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="theme in SPECIAL_THEMES"
                :key="theme.id"
                type="button"
                @click="handleSelectTheme(theme)"
                class="flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition cursor-pointer"
                :class="
                  activeTheme === theme.id
                    ? 'border-[#2D6BE4] bg-[#EAF5FD]/70 font-semibold text-[#0A2540]'
                    : isThemeUnlocked(theme.id)
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-[#C5E4FA]'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                "
              >
                <span
                  class="h-5 w-5 shrink-0 rounded-full border border-slate-200"
                  :class="theme.previewClass"
                ></span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[11px]">{{ theme.name }}</p>
                  <p class="text-[10px] text-slate-400">
                    <template v-if="activeTheme === theme.id">Dipakai</template>
                    <template v-else-if="isThemeUnlocked(theme.id)">Terbuka</template>
                    <template v-else>Terkunci</template>
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- LEMARI KOLEKSI FIGURE (ETALASE PAJANGAN) -->
      <section class="rounded-3xl border border-[#C5E4FA] bg-white p-6 shadow-2xs sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 class="text-base font-semibold text-[#0A2540] sm:text-lg">
              Lemari Koleksi Figure
            </h2>
            <p class="mt-0.5 text-xs text-slate-500">
              Etalase pajangan hadiah figure dari Mystery Blind Box. Klik figure yang sudah terbuka untuk melihat detail 3D-nya.
            </p>
          </div>
          <span class="rounded-full bg-[#EAF5FD] px-3.5 py-1 text-xs font-medium text-[#2D6BE4]">
            {{ unlockedFigures.length }} / {{ COLLECTIBLE_FIGURES.length }} Figure Terkumpul
          </span>
        </div>

        <!-- 3 Rak Etalase Pajangan -->
        <div class="mt-6 grid gap-5 sm:grid-cols-3">
          <button
            v-for="fig in COLLECTIBLE_FIGURES"
            :key="fig.id"
            type="button"
            @click="openFigureDetail(fig)"
            class="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#C5E4FA] border-b-8 border-b-[#DCEBFB] bg-gradient-to-b from-[#F8FBFF] to-[#EAF5FD]/60 p-6 text-center transition hover:border-[#2D6BE4] cursor-pointer"
          >
            <!-- Top Badge Status -->
            <div class="flex w-full items-center justify-between gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                :class="
                  isFigureUnlocked(fig.id)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200/80 text-slate-600'
                "
              >
                {{ isFigureUnlocked(fig.id) ? 'Terkumpul' : 'Terkunci' }}
              </span>
              <span class="text-[11px] text-slate-400">
                {{ fig.rarity }}
              </span>
            </div>

            <!-- Gambar Figure di Rak Etalase (Hitam Siluet jika belum dapat, Berwarna jika sudah dapat) -->
            <div class="relative my-5 flex h-44 w-full items-center justify-center">
              <div class="absolute bottom-1 h-4 w-28 rounded-full bg-slate-300/60 blur-[2px]"></div>
              <img
                :src="figureImages[fig.id]"
                :alt="isFigureUnlocked(fig.id) ? fig.name : 'Figure Misteri'"
                class="relative z-10 max-h-40 w-auto rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
                :class="
                  isFigureUnlocked(fig.id)
                    ? 'drop-shadow-md'
                    : 'brightness-0 contrast-200 opacity-75 select-none'
                "
              />
            </div>

            <!-- Nama & Petunjuk di Bawah Etalase -->
            <div class="w-full border-t border-slate-200/70 pt-3">
              <p class="text-sm font-semibold text-[#0A2540]">
                {{ isFigureUnlocked(fig.id) ? fig.name : '??? (Figure Misteri)' }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                <template v-if="isFigureUnlocked(fig.id)">
                  Klik untuk lihat detail 3D
                </template>
                <template v-else>
                  Didapat dari Mystery Blind Box
                </template>
              </p>
            </div>
          </button>
        </div>
      </section>
    </main>

    <!-- MODAL HADIAH TERBUKA -->
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
            Lihat Detail 3D di Lemari Koleksi
          </button>
          <button
            v-else-if="lastReward?.type === 'theme'"
            type="button"
            @click="activateWonTheme"
            class="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700 cursor-pointer"
          >
            Pakai Tema Sekarang
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

    <!-- MODAL DETAIL FIGURE 3D INTERAKTIF (Saat Figure di Etalase Diklik) -->
    <div
      v-if="isFigureModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      @click="closeFigureModal"
    >
      <div
        class="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-7 space-y-5"
        @click.stop
      >
        <!-- Header Modal -->
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-[#EAF5FD] px-2.5 py-0.5 text-[11px] font-medium text-[#2D6BE4]">
                {{ activeFigureObj.rarity }}
              </span>
              <span class="text-xs text-slate-400">
                {{ activeFigureObj.series }}
              </span>
            </div>
            <h3 class="mt-1 text-lg font-semibold text-[#0A2540]">
              {{ activeFigureObj.name }}
            </h3>
            <p class="mt-0.5 text-xs text-slate-500">
              {{ activeFigureObj.desc }}
            </p>
          </div>

          <button
            type="button"
            @click="closeFigureModal"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Tab Mode Tampilan 3D -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              @click="viewMode3D = 'mesh'"
              class="rounded-lg px-3.5 py-1.5 transition cursor-pointer"
              :class="viewMode3D === 'mesh' ? 'bg-white text-[#2D6BE4] shadow-2xs' : 'text-slate-600'"
            >
              Model 3D (Putar 360°)
            </button>
            <button
              type="button"
              @click="viewMode3D = 'photo'"
              class="rounded-lg px-3.5 py-1.5 transition cursor-pointer"
              :class="viewMode3D === 'photo' ? 'bg-white text-[#2D6BE4] shadow-2xs' : 'text-slate-600'"
            >
              Foto Asli (Tilt 3D)
            </button>
          </div>

          <div class="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              @click="zoomLevel = Math.max(0.75, Number((zoomLevel - 0.15).toFixed(2)))"
              class="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              @click="zoomLevel = Math.min(1.5, Number((zoomLevel + 0.15).toFixed(2)))"
              class="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              +
            </button>
            <button
              v-if="viewMode3D === 'mesh'"
              type="button"
              @click="autoRotate = !autoRotate"
              class="rounded-lg px-3 py-1 font-medium transition cursor-pointer"
              :class="autoRotate ? 'bg-[#2D6BE4] text-white' : 'border border-slate-200 text-slate-700'"
            >
              {{ autoRotate ? 'Auto-Putar: Aktif' : 'Auto-Putar: Mati' }}
            </button>
            <button
              type="button"
              @click="resetCamera"
              class="rounded-lg border border-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Area Viewport 3D -->
        <div
          class="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#C5E4FA] bg-gradient-to-b from-[#F8FBFF] to-[#EAF5FD]"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointerleave="handlePointerUp"
        >
          <canvas
            v-if="viewMode3D === 'mesh'"
            ref="figureCanvas"
            class="h-full w-full cursor-grab active:cursor-grabbing touch-none"
          ></canvas>

          <div
            v-else
            class="flex h-full w-full items-center justify-center p-6 cursor-grab active:cursor-grabbing touch-none"
          >
            <img
              :src="figureImages[activeFigureId]"
              :alt="activeFigureObj.name"
              class="max-h-64 w-auto rounded-2xl shadow-xl transition-transform duration-100 select-none pointer-events-none"
              :style="{
                transform: `perspective(900px) rotateX(${photoTiltX}deg) rotateY(${photoTiltY}deg) scale(${zoomLevel})`,
              }"
            />
          </div>

          <span class="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/85 px-3 py-1 text-[11px] text-slate-600 backdrop-blur-xs">
            Klik &amp; geser untuk memutar 3D
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
