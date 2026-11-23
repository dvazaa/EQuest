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
  unlockBlindBoxBadgeForUser,
  setActiveThemeForUser,
} from '../utils/equestState'

import figureAppleImg from '../assets/images/figure_apple.jpg'
import figureWarriorImg from '../assets/images/figure_warrior.jpg'
import figureRoseImg from '../assets/images/figure_rose.jpg'
import figureCapybaraImg from '../assets/images/capybara boba.jpg'
import figureGarfieldImg from '../assets/images/garfield.jpg'
import figureMinionDuoImg from '../assets/images/minions 1.jpg'
import figureMinionOneImg from '../assets/images/minions 2.jpg'
import figureStitchBoyImg from '../assets/images/stitch boy.jpg'
import figureStitchGirlImg from '../assets/images/stitch girl.jpg'
import figureToothlessImg from '../assets/images/toothless.jpg'

const figureImages = {
  apple: figureAppleImg,
  warrior: figureWarriorImg,
  rose: figureRoseImg,
  capybara: figureCapybaraImg,
  garfield: figureGarfieldImg,
  minion_duo: figureMinionDuoImg,
  minion_one: figureMinionOneImg,
  stitch_boy: figureStitchBoyImg,
  stitch_girl: figureStitchGirlImg,
  toothless: figureToothlessImg,
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
const zoomLevel = ref(1.08)
const isDragging = ref(false)
const photoTiltX = ref(-6)
const photoTiltY = ref(14)

let rotY = 0.25
let rotX = -0.10
let lastPointerX = 0
let lastPointerY = 0
let animationFrameId = null
const meshCache = {}

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
  { type: 'theme', name: 'Tema Spesial', icon: '🎨', desc: 'Membuka tema latar berhias bunga/apel untuk website EQuest' },
  { type: 'figure', name: 'Figure Collection', icon: '🧸', desc: 'Miniatur koleksi figure 3D eksklusif yang tersimpan di Lemari Koleksi' },
]

function handleOpenBox() {
  alertNotice.value = ''
  const email = currentUser.value?.email
  if (!email) return

  if (ticketCount.value <= 0) {
    alertNotice.value = 'Tiket kamu belum mencukupi. Selesaikan latihan soal untuk mendapatkan tiket!'
    return
  }

  const success = useTicket(email)
  if (!success) return

  isOpening.value = true

  setTimeout(() => {
    const lockedFigures = COLLECTIBLE_FIGURES.filter((f) => !unlockedFigures.value.includes(f.id))
    const lockedThemes = SPECIAL_THEMES.filter(
      (t) => !t.isDefault && !unlockedThemes.value.includes(t.id)
    )
    const hasMysteryBadge = Boolean(userStats.value?.blindBoxBadgeUnlocked)

    const eligibleRewards = possibleRewards.filter((r) => {
      if (r.type === 'figure') return lockedFigures.length > 0
      if (r.type === 'theme') return lockedThemes.length > 0
      if (r.type === 'badge') return !hasMysteryBadge
      return true
    })

    const randomIndex = Math.floor(Math.random() * eligibleRewards.length)
    const wonReward = { ...eligibleRewards[randomIndex] }

    if (wonReward.type === 'figure') {
      const chosen = lockedFigures[Math.floor(Math.random() * lockedFigures.length)]
      unlockFigureForUser(email, chosen.id)
      wonReward.figureId = chosen.id
      wonReward.name = `Figure: ${chosen.name}`
      wonReward.desc = chosen.desc
    } else if (wonReward.type === 'theme') {
      const chosenTheme = lockedThemes[Math.floor(Math.random() * lockedThemes.length)]
      unlockThemeForUser(email, chosenTheme.id)
      wonReward.themeId = chosenTheme.id
      wonReward.name = `Tema Spesial: ${chosenTheme.name}`
      wonReward.desc = `Tema "${chosenTheme.name}" dengan ${chosenTheme.ornamentLabel} kini terbuka dan bisa kamu aktifkan.`
    } else if (wonReward.type === 'badge') {
      unlockBlindBoxBadgeForUser(email)
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
  rotY = 0.25
  rotX = -0.10
  zoomLevel.value = 1.08
  photoTiltX.value = -6
  photoTiltY.value = 14
  isFigureModalOpen.value = true
}

function inspectWonFigure3D() {
  const figId = lastReward.value?.figureId || 'apple'
  closeModal()
  activeFigureId.value = figId
  viewMode3D.value = 'mesh'
  rotY = 0.25
  rotX = -0.10
  zoomLevel.value = 1.08
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
// SMOOTH HIGH-POLY 3D VINYL SCULPT ENGINE (Hirono Designer Art Toy Style)
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

function rotateLocal(p, pitch = 0, yaw = 0, roll = 0) {
  let [x, y, z] = p
  if (roll) {
    const c = Math.cos(roll)
    const s = Math.sin(roll)
    ;[x, y] = [x * c - y * s, x * s + y * c]
  }
  if (pitch) {
    const c = Math.cos(pitch)
    const s = Math.sin(pitch)
    ;[y, z] = [y * c - z * s, y * s + z * c]
  }
  if (yaw) {
    const c = Math.cos(yaw)
    const s = Math.sin(yaw)
    ;[x, z] = [x * c + z * s, -x * s + z * c]
  }
  return [x, y, z]
}

function orientFace(parts, points, refCenter, color, opts = {}) {
  if (points.length < 3) return
  const fc = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
    points.reduce((s, p) => s + p[2], 0) / points.length,
  ]
  const n = vecCross(vecSub(points[1], points[0]), vecSub(points[2], points[0]))
  const outward = vecDot(n, vecSub(fc, refCenter)) >= 0
  const oriented = outward ? points : [...points].reverse()
  parts.push({
    points: oriented,
    color,
    spec: opts.spec ?? 0.24,
    doubleSided: Boolean(opts.doubleSided),
  })
}

function addEllipsoid(parts, cx, cy, cz, rx, ry, rz, color, latSegs = 12, lonSegs = 18, opts = {}) {
  const { pitch = 0, yaw = 0, roll = 0, chubby = 0, appleDimple = false, squircle = 0, spec = 0.25 } = opts
  const rings = []

  for (let i = 0; i <= latSegs; i++) {
    const phi = (i / latSegs) * Math.PI
    const cosPhi = Math.cos(phi)
    const sinPhi = Math.sin(phi)
    const ring = []
    for (let j = 0; j < lonSegs; j++) {
      const theta = (j / lonSegs) * Math.PI * 2
      let cosT = Math.cos(theta)
      let sinT = Math.sin(theta)
      if (squircle > 0) {
        const exp = 2 / (2 + squircle)
        cosT = Math.sign(cosT) * Math.pow(Math.abs(cosT), exp)
        sinT = Math.sign(sinT) * Math.pow(Math.abs(sinT), exp)
      }
      let lx = rx * sinPhi * cosT
      let ly = -ry * cosPhi
      let lz = rz * sinPhi * sinT

      // Hirono chubby cheeks bulge on lower half of face
      if (chubby && cosPhi < 0) {
        const factor = 1 + chubby * Math.pow(-cosPhi, 0.85) * (1 - Math.abs(cosPhi))
        lx *= factor
        lz *= 1 + chubby * 0.45 * (1 - Math.abs(cosPhi))
      }

      // Apple crown & bottom organic curve
      if (appleDimple) {
        if (cosPhi > 0.72) {
          ly += (cosPhi - 0.72) * 28 * (1 - sinPhi * 0.7)
        }
        const widthTaper = 1.04 - (-cosPhi) * 0.14
        lx *= widthTaper
        lz *= widthTaper
      }

      const rot = rotateLocal([lx, ly, lz], pitch, yaw, roll)
      ring.push([cx + rot[0], cy + rot[1], cz + rot[2]])
    }
    rings.push(ring)
  }

  const center = [cx, cy, cz]
  for (let i = 0; i < latSegs; i++) {
    for (let j = 0; j < lonSegs; j++) {
      const nj = (j + 1) % lonSegs
      if (i === 0) {
        orientFace(parts, [rings[0][0], rings[1][nj], rings[1][j]], center, color, { spec })
      } else if (i === latSegs - 1) {
        orientFace(parts, [rings[i][j], rings[i][nj], rings[latSegs][0]], center, color, { spec })
      } else {
        orientFace(parts, [rings[i][j], rings[i][nj], rings[i + 1][nj], rings[i + 1][j]], center, color, { spec })
      }
    }
  }
}

function addLathePart(parts, cx, cy, cz, profileRings, color, lonSegs = 18, opts = {}) {
  const { pitch = 0, yaw = 0, roll = 0, squircle = 0, capTop = true, capBottom = true, spec = 0.24 } = opts
  const rings = profileRings.map(([ry, rx, rz, offZ = 0, offX = 0]) => {
    const pts = []
    for (let j = 0; j < lonSegs; j++) {
      const theta = (j / lonSegs) * Math.PI * 2
      let cosT = Math.cos(theta)
      let sinT = Math.sin(theta)
      if (squircle > 0) {
        const exp = 2 / (2 + squircle)
        cosT = Math.sign(cosT) * Math.pow(Math.abs(cosT), exp)
        sinT = Math.sign(sinT) * Math.pow(Math.abs(sinT), exp)
      }
      const rot = rotateLocal([offX + rx * cosT, ry, offZ + rz * sinT], pitch, yaw, roll)
      pts.push([cx + rot[0], cy + rot[1], cz + rot[2]])
    }
    return pts
  })

  const midY = profileRings.reduce((s, r) => s + r[0], 0) / profileRings.length
  const midRot = rotateLocal([0, midY, 0], pitch, yaw, roll)
  const refCenter = [cx + midRot[0], cy + midRot[1], cz + midRot[2]]

  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < lonSegs; j++) {
      const nj = (j + 1) % lonSegs
      orientFace(parts, [rings[i][j], rings[i][nj], rings[i + 1][nj], rings[i + 1][j]], refCenter, color, { spec })
    }
  }

  if (capTop && rings.length > 0) {
    const first = profileRings[0]
    const topRot = rotateLocal([first[4] || 0, first[0], first[3] || 0], pitch, yaw, roll)
    const tc = [cx + topRot[0], cy + topRot[1], cz + topRot[2]]
    for (let j = 0; j < lonSegs; j++) {
      const nj = (j + 1) % lonSegs
      orientFace(parts, [tc, rings[0][nj], rings[0][j]], refCenter, color, { spec })
    }
  }
  if (capBottom && rings.length > 0) {
    const last = profileRings[profileRings.length - 1]
    const botRot = rotateLocal([last[4] || 0, last[0], last[3] || 0], pitch, yaw, roll)
    const bc = [cx + botRot[0], cy + botRot[1], cz + botRot[2]]
    const lastRing = rings[rings.length - 1]
    for (let j = 0; j < lonSegs; j++) {
      const nj = (j + 1) % lonSegs
      orientFace(parts, [lastRing[j], lastRing[nj], bc], refCenter, color, { spec })
    }
  }
}

function addCapsule(parts, p1, p2, r1, r2, color, radialSegs = 12, opts = {}) {
  const { spec = 0.24 } = opts
  const axis = vecSub(p2, p1)
  const len = Math.hypot(axis[0], axis[1], axis[2]) || 1
  const dir = [axis[0] / len, axis[1] / len, axis[2] / len]
  const upRef = Math.abs(dir[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0]
  const tangent = vecNorm(vecCross(upRef, dir))
  const bitangent = vecNorm(vecCross(dir, tangent))

  const center = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2]
  const capRing = (origin, radius, sign) => {
    const ring = []
    for (let j = 0; j < radialSegs; j++) {
      const th = (j / radialSegs) * Math.PI * 2
      const c = Math.cos(th)
      const s = Math.sin(th)
      ring.push([
        origin[0] + (tangent[0] * c + bitangent[0] * s) * radius,
        origin[1] + (tangent[1] * c + bitangent[1] * s) * radius,
        origin[2] + (tangent[2] * c + bitangent[2] * s) * radius,
      ])
    }
    const domeTip = [
      origin[0] + dir[0] * radius * 0.72 * sign,
      origin[1] + dir[1] * radius * 0.72 * sign,
      origin[2] + dir[2] * radius * 0.72 * sign,
    ]
    return { ring, domeTip }
  }

  const c1 = capRing(p1, r1, -1)
  const c2 = capRing(p2, r2, 1)

  for (let j = 0; j < radialSegs; j++) {
    const nj = (j + 1) % radialSegs
    orientFace(parts, [c1.ring[j], c1.ring[nj], c2.ring[nj], c2.ring[j]], center, color, { spec })
    orientFace(parts, [c1.domeTip, c1.ring[nj], c1.ring[j]], center, color, { spec })
    orientFace(parts, [c2.ring[j], c2.ring[nj], c2.domeTip], center, color, { spec })
  }
}

function addCurvedPetal(parts, cx, cy, cz, w, h, cup, pitch, yaw, roll, color, opts = {}) {
  const { rows = 5, cols = 5, spec = 0.32 } = opts
  const grid = []
  for (let r = 0; r <= rows; r++) {
    const v = r / rows // 0 base -> 1 tip
    const rowPts = []
    const widthProfile = Math.sin(Math.pow(v, 0.72) * Math.PI * 0.92) * w
    for (let c = 0; c <= cols; c++) {
      const u = (c / cols) * 2 - 1 // -1 .. +1
      const lx = u * widthProfile * 0.5
      const ly = -v * h + Math.sin(v * Math.PI) * cup * 0.15
      const lz = Math.pow(u, 2) * cup * 0.6 + Math.pow(v, 1.6) * (-cup * 0.5)
      const rot = rotateLocal([lx, ly, lz], pitch, yaw, roll)
      rowPts.push([cx + rot[0], cy + rot[1], cz + rot[2]])
    }
    grid.push(rowPts)
  }

  const ref = [cx, cy, cz - 10]
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      orientFace(parts, [grid[r][c], grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c]], ref, color, {
        spec,
        doubleSided: true,
      })
    }
  }
}

function addStarHood(parts, cx, cy, cz, outerR, innerR, backZ, frontZ, holeR, color) {
  const segs = 30
  const frontHole = []
  const starRimFront = []
  const starRimBack = []
  const backApex = [cx, cy - 2, cz + backZ - 8]

  for (let i = 0; i < segs; i++) {
    const angle = -Math.PI / 2 + (i / segs) * Math.PI * 2
    // 5-pointed star radial modulation
    const starAngle = (angle + Math.PI / 2) * 5
    const t = (Math.cos(starAngle) + 1) / 2
    // Smooth star points without sharp jagged spikes
    const starR = innerR + (outerR - innerR) * Math.pow(t, 1.35)

    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    frontHole.push([cx + holeR * cosA, cy + holeR * 0.94 * sinA, cz + frontZ])
    starRimFront.push([cx + starR * cosA, cy + starR * sinA, cz + frontZ - 7])
    starRimBack.push([cx + starR * 0.86 * cosA, cy + starR * 0.86 * sinA, cz + backZ])
  }

  const center = [cx, cy, cz]
  for (let i = 0; i < segs; i++) {
    const ni = (i + 1) % segs
    // Front face collar around head opening
    orientFace(parts, [frontHole[i], frontHole[ni], starRimFront[ni], starRimFront[i]], center, color, { spec: 0.16, doubleSided: true })
    // Side beveled star rim
    orientFace(parts, [starRimFront[i], starRimFront[ni], starRimBack[ni], starRimBack[i]], center, color, { spec: 0.16 })
    // Rounded star back dome
    orientFace(parts, [starRimBack[i], starRimBack[ni], backApex], center, color, { spec: 0.16 })
  }
}

function addHironoFace(parts, cx, cy, cz, opts = {}) {
  const { freckles = false, hairColor = [36, 34, 38], cheekColor = [239, 152, 134] } = opts
  const skin = [248, 212, 192]
  const blushSkin = [245, 194, 174]

  // Rounded chubby Hirono head
  addEllipsoid(parts, cx, cy, cz, 23.5, 21, 20.5, skin, 14, 22, { chubby: 0.16, spec: 0.22 })

  // Cute round ears peeking out on sides if visible
  addEllipsoid(parts, cx - 22, cy + 2, cz, 4.5, 6, 4.5, blushSkin, 8, 12, { spec: 0.2 })
  addEllipsoid(parts, cx + 22, cy + 2, cz, 4.5, 6, 4.5, blushSkin, 8, 12, { spec: 0.2 })

  // Rosy chubby cheeks
  addEllipsoid(parts, cx - 12.5, cy + 5.5, cz + 16.5, 5.5, 3.6, 2.5, cheekColor, 8, 12, { pitch: 0.15, spec: 0.18 })
  addEllipsoid(parts, cx + 12.5, cy + 5.5, cz + 16.5, 5.5, 3.6, 2.5, cheekColor, 8, 12, { pitch: 0.15, spec: 0.18 })

  // Signature tiny rounded button nose
  addEllipsoid(parts, cx, cy + 3.2, cz + 20.2, 2.5, 2.1, 2.4, [238, 178, 156], 8, 12, { spec: 0.28 })

  // Pouty small lips
  addCapsule(parts, [cx - 3.8, cy + 9.5, cz + 18.6], [cx, cy + 8.8, cz + 19.2], 1.1, 1.1, [196, 114, 108], 8)
  addCapsule(parts, [cx, cy + 8.8, cz + 19.2], [cx + 3.8, cy + 9.5, cz + 18.6], 1.1, 1.1, [196, 114, 108], 8)

  // Melancholic expressive Hirono eyes (sclera + iris + white highlight)
  ;[-1, 1].forEach((side) => {
    const ex = cx + side * 9.5
    const ey = cy - 1
    const ez = cz + 18.2
    addEllipsoid(parts, ex, ey, ez, 4.6, 3.4, 2.2, [252, 252, 254], 8, 14, { yaw: side * 0.22, spec: 0.45 })
    addEllipsoid(parts, ex - side * 0.6, ey, ez + 1.3, 2.7, 2.7, 1.6, [30, 26, 28], 8, 12, { spec: 0.65 })
    addEllipsoid(parts, ex - side * 1.4, ey - 0.9, ez + 2.5, 0.9, 0.9, 0.7, [255, 255, 255], 6, 8, { spec: 0.85 })
    // Drooping upper eyelid / sad brow
    addCapsule(
      parts,
      [ex - side * 4.8, ey - 5.4, cz + 18.2],
      [ex + side * 3.8, ey - 6.6, cz + 19],
      0.9,
      0.9,
      hairColor,
      8
    )
  })

  if (freckles) {
    ;[
      [-14, 3.5],
      [-10.5, 5.2],
      [14, 3.5],
      [10.5, 5.2],
    ].forEach(([fx, fy]) => {
      addEllipsoid(parts, cx + fx, cy + fy, cz + 17.5, 0.8, 0.8, 0.8, [168, 102, 84], 5, 8)
    })
  }

  // Sculpted tapered bangs framing forehead
  for (let b = -3; b <= 3; b++) {
    const bx = cx + b * 4.5
    const tipY = cy - 6.5 - Math.abs(b) * 0.4 + (b % 2 === 0 ? 1.5 : -0.5)
    addCapsule(
      parts,
      [bx * 0.95, cy - 17, cz + 13],
      [cx + b * 5.2, tipY, cz + 18.5 - Math.abs(b) * 1.1],
      3.8,
      1.6,
      hairColor,
      10,
      { spec: 0.18 }
    )
  }
}

function buildFigureMesh(figureId) {
  if (meshCache[figureId]) return meshCache[figureId]
  const parts = []

  if (figureId === 'apple') {
    // 1. APPLE BOY FIGURE (Smooth Sculpted Hirono)
    const skin = [247, 209, 189]
    const denim = [46, 79, 124]
    const denimDark = [35, 62, 102]
    const shirtRed = [212, 38, 46]
    const gold = [240, 198, 72]
    const appleRed = [164, 36, 46]
    const appleDeep = [132, 24, 34]

    // Sleek circular collector pedestal
    addLathePart(
      parts,
      0,
      84,
      0,
      [
        [-5, 32, 32],
        [-3, 34, 34],
        [3, 34, 34],
        [5, 31, 31],
      ],
      [234, 242, 250],
      24,
      { spec: 0.45 }
    )

    // Smooth bare feet & rounded legs
    ;[-9.5, 9.5].forEach((lx) => {
      addCapsule(parts, [lx, 62, 0], [lx, 75, 1], 5.6, 5.2, skin, 12)
      addEllipsoid(parts, lx, 77.5, 4.5, 5.8, 3.8, 8.8, skin, 8, 14, { spec: 0.22 })
      // Rolled denim shorts leg
      addLathePart(
        parts,
        lx,
        54,
        0,
        [
          [-10, 8.2, 8.8],
          [0, 9.0, 9.5],
          [8, 8.5, 9.0],
          [11, 9.3, 9.8],
        ],
        denim,
        16
      )
    })
    // Denim shorts hip curve
    addEllipsoid(parts, 0, 44, 0, 18.5, 10.5, 13.5, denimDark, 10, 18)

    // Chubby exposed belly (crop t-shirt look)
    addEllipsoid(parts, 0, 34, 0.8, 16.5, 8.5, 12.8, skin, 10, 18)

    // Flared red NY t-shirt torso
    addLathePart(
      parts,
      0,
      16,
      0,
      [
        [-14, 12.5, 10],
        [-6, 16.5, 12.8],
        [4, 18.5, 14],
        [13, 19.8, 14.8],
      ],
      shirtRed,
      20,
      { spec: 0.2 }
    )

    // Golden New York skyline silhouette emblem on chest
    addCapsule(parts, [-10, 22, 13.8], [10, 22, 13.8], 1.4, 1.4, gold, 8)
    addCapsule(parts, [-6, 17, 13.8], [-6, 22, 13.8], 1.6, 1.6, gold, 8)
    addCapsule(parts, [0, 14.5, 13.6], [0, 22, 13.8], 1.9, 1.9, gold, 8)
    addCapsule(parts, [6, 17.5, 13.8], [6, 22, 13.8], 1.5, 1.5, gold, 8)

    // Rounded relaxed sleeves & chubby arms
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 16, 10, 0], [side * 22, 20, 1], 6.4, 7.2, shirtRed, 12)
      addCapsule(parts, [side * 21, 20, 1], [side * 24, 36, 3], 4.4, 3.9, skin, 12)
      addEllipsoid(parts, side * 24.5, 38.5, 3.8, 4.4, 4.4, 4.4, skin, 8, 12)
    })

    // Smooth Hirono face
    addHironoFace(parts, 0, -21, 5)

    // Rounded sculpted Apple Hood (curved back dome + plump side apple cheeks + crown lobes, framing the face)
    addEllipsoid(parts, 0, -28, -9, 29, 29, 24, appleRed, 14, 22, { appleDimple: true, spec: 0.36 })
    // Plump left & right apple lobes framing Hirono's face smoothly
    addEllipsoid(parts, -19, -25, 1, 13.5, 24, 17, appleRed, 12, 18, { roll: 0.14, spec: 0.36 })
    addEllipsoid(parts, 19, -25, 1, 13.5, 24, 17, appleRed, 12, 18, { roll: -0.14, spec: 0.36 })
    // Top apple crown crest with iconic apple indent
    addEllipsoid(parts, -11, -51, 0, 16, 11, 18, appleRed, 10, 16, { spec: 0.36 })
    addEllipsoid(parts, 11, -51, 0, 16, 11, 18, appleRed, 10, 16, { spec: 0.36 })
    addEllipsoid(parts, 0, -50, 2, 10, 6, 10, appleDeep, 8, 12)

    // Curved apple stem & organic curved green leaf
    addCapsule(parts, [0, -52, 0], [3, -68, -2], 2.5, 3.2, [108, 70, 44], 10)
    addCurvedPetal(parts, -2, -62, 1, 18, 22, 6, -0.35, 0.25, 1.05, [94, 178, 76], { rows: 5, cols: 5 })

    // Iconic rounded black sunglasses resting on top front of the apple hood
    const glassBlack = [26, 26, 30]
    addCapsule(parts, [-5, -45.5, 20.5], [5, -45.5, 20.5], 2.0, 2.0, glassBlack, 8)
    ;[-11.5, 11.5].forEach((gx) => {
      addEllipsoid(parts, gx, -45, 19.8, 8.8, 7.2, 4.2, glassBlack, 10, 16, { pitch: -0.18, spec: 0.65 })
      addEllipsoid(parts, gx, -45, 23.0, 5.2, 3.8, 1.6, [252, 252, 255], 8, 12, { pitch: -0.18, spec: 0.7 })
      addEllipsoid(parts, gx, -45, 24.1, 2.6, 2.6, 1.1, glassBlack, 6, 10, { spec: 0.85 })
    })
  } else if (figureId === 'warrior') {
    // 2. STAR FORT FIGURE (Smooth Sculpted Warrior Shelter)
    const skin = [245, 206, 184]
    const kraft = [188, 156, 122]
    const kraftDark = [164, 132, 98]
    const redTape = [168, 74, 68]
    const brownPatch = [142, 106, 76]

    // Rounded bevel cardboard square/squircle pedestal
    addLathePart(
      parts,
      0,
      82,
      0,
      [
        [-5, 34, 28],
        [-3, 35, 29],
        [4, 35, 29],
        [6, 33, 27],
      ],
      kraftDark,
      24,
      { squircle: 3.5, spec: 0.16 }
    )

    // Smooth bare feet & legs
    ;[-9, 9].forEach((lx) => {
      addCapsule(parts, [lx, 58, 0], [lx, 73, 1], 5.4, 5.0, skin, 12)
      addEllipsoid(parts, lx, 75.5, 4.2, 5.5, 3.6, 8.5, skin, 8, 14)
    })

    // Soft-edged kraft shelter body ("FORT / KEEP OUT")
    addLathePart(
      parts,
      0,
      36,
      0,
      [
        [-28, 17, 13],
        [-14, 20.5, 14.5],
        [10, 21.5, 15],
        [24, 21, 14.5],
        [26, 19.5, 13.5],
      ],
      kraft,
      24,
      { squircle: 4.5, spec: 0.14 }
    )
    // Red & brown craft tape patches molded onto body
    addCapsule(parts, [-10, 24, 14.8], [6, 22, 14.8], 3.2, 3.2, redTape, 10)
    addCapsule(parts, [7, 36, 14.8], [15, 38, 14.4], 3.6, 3.2, brownPatch, 10)
    addCapsule(parts, [-12, 48, 14.8], [0, 49, 14.8], 3.0, 3.0, redTape, 10)

    // Rounded arms + sculpted bone prop
    addCapsule(parts, [-19, 16, 1], [-24, 34, 4], 4.5, 4.0, skin, 12)
    addEllipsoid(parts, -24.5, 36.5, 4.5, 4.2, 4.2, 4.2, skin, 8, 12)

    addCapsule(parts, [19, 16, 1], [25, 32, 7], 4.5, 4.0, skin, 12)
    addEllipsoid(parts, 25.5, 34.5, 8, 4.3, 4.3, 4.3, skin, 8, 12)

    // Smooth dog/shelter bone held in right hand
    const boneWhite = [242, 238, 226]
    addCapsule(parts, [22, 35, 10], [34, 41, 14], 2.5, 2.5, boneWhite, 10, { spec: 0.25 })
    addEllipsoid(parts, 21.5, 34.5, 10, 3.4, 3.2, 3.2, boneWhite, 7, 10)
    addEllipsoid(parts, 34.5, 41.5, 14, 3.4, 3.2, 3.2, boneWhite, 7, 10)

    // Hirono face with freckles
    addHironoFace(parts, 0, -19, 4, { freckles: true })

    // Smooth sculpted 5-Pointed Star Cardboard Shelter Hood framing the face
    addStarHood(parts, 0, -21, -2, 46, 27, -22, 12, 21.5, kraft)
    // Back depth cushion & kraft patch
    addEllipsoid(parts, 0, -21, -14, 24, 24, 14, kraftDark, 10, 16)
    addCapsule(parts, [-22, -16, 10], [-14, -12, 11.5], 3.2, 3.2, brownPatch, 8)
  } else if (figureId === 'rose') {
    // 3. ROSE PRINCE FIGURE (Smooth Sculpted Le Petit Prince)
    const skin = [246, 209, 189]
    const robe = [242, 240, 232]
    const moonGrey = [126, 136, 148]
    const moonCrater = [98, 108, 120]
    const vineGreen = [66, 112, 46]
    const petalRed = [164, 28, 40]
    const petalBright = [188, 42, 54]
    const petalDeep = [128, 18, 28]

    // Rounded asteroid / moon planet base with sculpted crater rims
    addEllipsoid(parts, 0, 76, 0, 36, 15, 34, moonGrey, 14, 24, { spec: 0.14 })
    addLathePart(
      parts,
      -15,
      64,
      10,
      [
        [0, 6.5, 6.5],
        [2.5, 7.8, 7.8],
        [4.5, 5.2, 5.2],
      ],
      moonCrater,
      14,
      { pitch: 0.2 }
    )
    addLathePart(
      parts,
      17,
      65,
      -8,
      [
        [0, 7.2, 7.2],
        [2.5, 8.5, 8.5],
        [4.5, 5.5, 5.5],
      ],
      moonCrater,
      14,
      { pitch: -0.15 }
    )

    // Smooth bare feet + wrapped green vine
    ;[-8.5, 8.5].forEach((lx) => {
      addCapsule(parts, [lx, 49, 0], [lx, 61, 1], 4.8, 4.4, skin, 12)
      addEllipsoid(parts, lx, 63, 3.5, 5.2, 3.2, 7.5, skin, 8, 12)
    })
    addCapsule(parts, [-14, 59, 6], [-2, 62, 7], 2.2, 2.2, vineGreen, 8)
    addCapsule(parts, [-13, 55, -2], [-5, 59, 6], 2.0, 2.0, vineGreen, 8)

    // Flowing flared white Prince robe & draped long scarf
    addLathePart(
      parts,
      0,
      30,
      0,
      [
        [-23, 12.5, 10.5],
        [-12, 16, 12.5],
        [4, 20.5, 15.5],
        [19, 24, 18],
        [25, 25.5, 19],
      ],
      robe,
      24,
      { spec: 0.2 }
    )
    // Flowing diagonal prince cape/sash trailing down the right side
    addCapsule(parts, [14, 10, 8], [24, 52, 14], 4.5, 6.0, robe, 12, { spec: 0.22 })

    // Rounded arms hugging thorny green rose stem across chest
    addCapsule(parts, [-16, 11, 2], [-7, 25, 13.5], 4.4, 3.8, robe, 12)
    addEllipsoid(parts, -5, 26, 14.5, 4.0, 4.0, 4.0, skin, 8, 12)
    addCapsule(parts, [16, 11, 2], [9, 26, 13.5], 4.4, 3.8, robe, 12)
    addEllipsoid(parts, 7, 27, 14.5, 4.0, 4.0, 4.0, skin, 8, 12)

    // Thorny rose stem curved across arms
    addCapsule(parts, [-17, 24, 15], [16, 28, 15.5], 2.5, 2.5, vineGreen, 10)
    addEllipsoid(parts, -12, 23, 17.5, 1.8, 3.2, 2.0, petalRed, 6, 8)
    addEllipsoid(parts, 11, 26, 17.8, 1.8, 3.2, 2.0, petalRed, 6, 8)

    // Ring of 6 sculpted green sepal leaves at collar
    for (let s = 0; s < 6; s++) {
      const ang = (s / 6) * Math.PI * 2
      addCurvedPetal(
        parts,
        Math.sin(ang) * 12,
        4,
        Math.cos(ang) * 11,
        14,
        16,
        4,
        1.15,
        ang,
        0,
        vineGreen,
        { rows: 4, cols: 4 }
      )
    }

    // Golden-blonde Hirono face
    addHironoFace(parts, 0, -21, 5, { hairColor: [216, 166, 62] })

    // Organic blooming Red Rose Petal Hood wrapping around the head
    addEllipsoid(parts, 0, -26, -8, 25, 25, 21, petalDeep, 12, 18, { spec: 0.28 })
    // Outer ring of 7 sculpted red petals cradling the face
    for (let i = 0; i < 7; i++) {
      const a = 0.72 + (i / 6) * (Math.PI * 2 - 1.44)
      const col = i % 2 === 0 ? petalRed : petalBright
      addCurvedPetal(
        parts,
        Math.sin(a) * 23,
        -10,
        -4 + Math.cos(a) * 19,
        24,
        36,
        9,
        0.18,
        a + Math.PI,
        0,
        col,
        { rows: 5, cols: 5, spec: 0.32 }
      )
    }
    // Crown ring of 6 inner rose petals blooming upward
    for (let i = 0; i < 6; i++) {
      const a = 0.55 + (i / 5) * (Math.PI * 2 - 1.1)
      addCurvedPetal(
        parts,
        Math.sin(a) * 16,
        -34,
        -3 + Math.cos(a) * 14,
        20,
        26,
        8,
        0.38,
        a + Math.PI,
        0,
        petalBright,
        { rows: 5, cols: 5, spec: 0.34 }
      )
    }
    // Top rose bud swirl
    addEllipsoid(parts, 0, -49, -2, 14, 11, 13, petalDeep, 10, 14, { spec: 0.3 })
  } else if (figureId === 'capybara') {
    // 4. CAPYBARA BOBA FIGURE
    const fur = [208, 146, 94]
    const furDark = [174, 116, 70]
    const earDark = [96, 64, 50]
    const snout = [172, 118, 92]
    const blush = [228, 148, 132]
    const darkBrown = [54, 34, 26]
    const cupMilk = [234, 178, 124]
    const cupCream = [246, 232, 214]
    const lidWhite = [248, 246, 244]
    const strawWhite = [252, 252, 254]
    const bobaPearl = [68, 40, 28]

    // Collector base
    addLathePart(parts, 0, 84, 0, [[-4, 36, 36], [4, 36, 36]], [238, 244, 250], 24, { spec: 0.35 })

    // Tubuh Capybara membulat gembul (bentuk pear halus dari kepala hingga badan)
    addLathePart(
      parts,
      0,
      14,
      -2,
      [
        [-64, 10, 9],
        [-58, 20, 18],
        [-45, 29, 27],
        [-28, 34, 32],
        [-10, 38, 35],
        [14, 43, 39],
        [40, 44, 39],
        [56, 39, 34],
        [63, 28, 25],
      ],
      fur,
      26,
      { spec: 0.16 }
    )

    // Dua telinga coklat gelap di sudut atas kepala + cekungan telinga
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 22, -46, 0, 7.5, 8.2, 6.2, earDark, 10, 14, { roll: side * 0.45, spec: 0.2 })
      addEllipsoid(parts, side * 21, -45, 4.2, 4.5, 5.2, 2.2, darkBrown, 8, 10, { roll: side * 0.45 })
    })

    // Pipi merona hangat
    addEllipsoid(parts, -19, -22, 24, 7.5, 5.5, 3.0, blush, 8, 12, { yaw: -0.45, spec: 0.12 })
    addEllipsoid(parts, 19, -22, 24, 7.5, 5.5, 3.0, blush, 8, 12, { yaw: 0.45, spec: 0.12 })

    // Mata tersenyum melengkung (^)
    ;[-1, 1].forEach((side) => {
      const ex = side * 14.5
      const ey = -32
      addCapsule(parts, [ex - 3.6, ey + 1.5, 25], [ex, ey - 1.5, 26], 1.4, 1.4, darkBrown, 8)
      addCapsule(parts, [ex, ey - 1.5, 26], [ex + 3.6, ey + 1.5, 25], 1.4, 1.4, darkBrown, 8)
    })

    // Moncong oval taupe + lubang hidung & mulut terbuka kecil
    addEllipsoid(parts, 0, -19, 29.5, 11.5, 11.2, 8.8, snout, 12, 16, { spec: 0.2 })
    addEllipsoid(parts, -3.8, -24.5, 37.2, 1.8, 1.6, 1.4, darkBrown, 6, 8)
    addEllipsoid(parts, 3.8, -24.5, 37.2, 1.8, 1.6, 1.4, darkBrown, 6, 8)
    addCapsule(parts, [0, -23, 37.8], [0, -10, 37.5], 0.9, 0.9, [132, 84, 64], 8)
    addEllipsoid(parts, 0, -6.5, 30, 5.8, 4.0, 4.2, darkBrown, 8, 12)

    // Kaki depan-bawah coklat gelap berjari 3
    ;[-18, 18].forEach((fx) => {
      addEllipsoid(parts, fx, 75, 11, 9.5, 5.2, 12, earDark, 8, 14, { spec: 0.18 })
      ;[-4.5, 0, 4.5].forEach((tx) => {
        addEllipsoid(parts, fx + tx, 76, 21.5, 2.2, 2.5, 3.2, earDark, 6, 8)
      })
    })

    // Cup Boba Milk Tea + Sedotan Putih + Mutiara Tapioka
    addLathePart(
      parts,
      0,
      36,
      36,
      [
        [-20, 14.5, 14.5],
        [-8, 13.8, 13.8],
        [18, 10.6, 10.6],
      ],
      cupMilk,
      22,
      { spec: 0.35 }
    )
    addLathePart(
      parts,
      0,
      14,
      36,
      [
        [-5, 14.8, 14.8],
        [4, 14.3, 14.3],
      ],
      cupCream,
      22,
      { spec: 0.3 }
    )
    addLathePart(
      parts,
      0,
      9,
      36,
      [
        [-2.8, 13.6, 13.6],
        [0, 16.5, 16.5],
        [2.8, 16.5, 16.5],
      ],
      lidWhite,
      24,
      { spec: 0.45 }
    )
    // Sedotan putih langsung masuk ke mulut capybara
    addCapsule(parts, [0, -5, 31], [0, 9, 36], 2.2, 2.2, strawWhite, 12, { spec: 0.5 })
    // Mutiara boba di bagian bawah gelas
    ;[
      [-5, 42, 47],
      [0, 46, 47],
      [5, 41, 47],
      [-7, 36, 46.5],
      [2, 37, 48],
      [7, 47, 45],
      [-2, 50, 46],
    ].forEach(([bx, by, bz]) => {
      addEllipsoid(parts, bx, by, bz, 2.4, 2.4, 2.0, bobaPearl, 6, 8, { spec: 0.4 })
    })

    // Lengan gemuk + Telapak tangan memeluk gelas boba
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 29, 12, 12], [side * 19, 28, 30], 11.5, 8.5, furDark, 14)
      addEllipsoid(parts, side * 15, 29, 37, 6.2, 5.5, 5.2, earDark, 8, 12)
      ;[-2.2, 0, 2.2].forEach((dy) => {
        addCapsule(parts, [side * 14, 29 + dy, 39], [side * 10.5, 29 + dy, 41.5], 1.3, 1.1, earDark, 6)
      })
    })
  } else if (figureId === 'garfield') {
    // 5. GARFIELD LAZY CAT FIGURE
    const orange = [252, 162, 34]
    const orangeDeep = [234, 144, 24]
    const muzzleYellow = [255, 224, 72]
    const pinkNose = [244, 152, 178]
    const black = [28, 26, 28]
    const white = [252, 252, 254]

    addLathePart(parts, 0, 82, 0, [[-4, 42, 34], [4, 42, 34]], [238, 244, 250], 24, { spec: 0.35 })

    // Badan oranye Garfield duduk santai
    addLathePart(
      parts,
      0,
      36,
      -4,
      [
        [-28, 18, 15],
        [-12, 23, 20],
        [14, 27, 23],
        [34, 28, 24],
        [42, 24, 21],
      ],
      orange,
      24,
      { spec: 0.25 }
    )

    // Dua kaki depan & telapak besar berjari 3
    ;[-16.5, 16.5].forEach((lx) => {
      addCapsule(parts, [lx * 0.85, 22, 6], [lx, 62, 14], 9.5, 10.5, orange, 14)
      addEllipsoid(parts, lx, 70, 21, 13.5, 8.8, 14, orange, 10, 16, { spec: 0.25 })
      ;[-5.5, 0, 5.5].forEach((tx) => {
        addCapsule(parts, [lx + tx, 69, 31], [lx + tx, 73, 33], 0.9, 0.9, orangeDeep, 6)
      })
    })

    // Dua paha & telapak belakang menyamping + belang hitam
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 26, 48, -6, 11.5, 18, 14, orange, 10, 16, { roll: side * 0.25, spec: 0.25 })
      addEllipsoid(parts, side * 38, 69, 2, 14, 8.5, 11, orange, 10, 14, { yaw: side * 0.3, spec: 0.25 })
      for (let s = 0; s < 3; s++) {
        addCapsule(parts, [side * 22, 38 + s * 6, -12], [side * 34, 40 + s * 6, -4], 1.5, 1.5, black, 8)
      }
    })

    // Ekor belang melingkar ke belakang kanan
    addCapsule(parts, [14, 58, -18], [28, 36, -24], 5.5, 6.2, orange, 12)
    addCapsule(parts, [28, 36, -24], [24, 18, -18], 6.2, 6.8, black, 12)

    // Kepala Garfield bulat lebar + pipi kuning besar
    addEllipsoid(parts, 0, -24, 0, 31, 27, 25, orange, 14, 24, { spec: 0.26 })
    // Telinga tegak berujung belang hitam
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 13, -53, -2, 11, 14, 7.5, orange, 10, 14, { roll: side * 0.22, spec: 0.25 })
      addEllipsoid(parts, side * 13, -58, -1.5, 7.2, 6.5, 4.5, black, 8, 10, { roll: side * 0.22 })
      // 3 Jambul rambut samping khas Garfield
      ;[-0.35, -0.05, 0.25].forEach((ang, idx) => {
        addCapsule(
          parts,
          [side * 25, -42 + idx * 3, 2],
          [side * (36 - idx * 2), -49 + idx * 4.5, 2],
          2.0,
          1.2,
          black,
          8
        )
      })
    })

    // Dua mata putih menempel + kelopak mengantuk oranye + pupil hitam
    ;[-1, 1].forEach((side) => {
      const ex = side * 9.5
      addEllipsoid(parts, ex, -21, 20.5, 9.8, 9.2, 5.2, white, 10, 16, { spec: 0.65 })
      // Kelopak mengantuk menutupi separuh atas mata
      addEllipsoid(parts, ex, -27, 21.8, 10.2, 6.6, 5.8, orange, 10, 16, { pitch: 0.22, spec: 0.28 })
      // Pupil hitam mengintip dari balik kelopak
      addEllipsoid(parts, ex - side * 2.5, -21.5, 25.0, 2.8, 2.5, 1.5, black, 8, 10, { spec: 0.8 })
    })

    // Pipi kuning W-muzzle lebar melengkung ke samping
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 13, -11, 20.5, 15.5, 9.5, 8.5, muzzleYellow, 10, 16, { roll: side * 0.22, spec: 0.26 })
      addEllipsoid(parts, side * 25, -18, 16, 7.5, 8.5, 6.5, muzzleYellow, 8, 12, { roll: -side * 0.2, spec: 0.26 })
    })
    // Hidung pink oval
    addEllipsoid(parts, 0, -15, 27.5, 4.8, 3.8, 3.6, pinkNose, 8, 12, { spec: 0.45 })
  } else if (figureId === 'minion_duo') {
    // 6. MINION GOGGLES FIGURE (Mata Dua & Overalls Denim)
    const yellow = [252, 216, 38]
    const denim = [54, 122, 176]
    const denimDark = [38, 92, 142]
    const silver = [198, 204, 212]
    const strapDark = [44, 38, 36]
    const irisBrown = [158, 78, 24]
    const shoeDark = [46, 36, 32]
    const white = [254, 254, 255]
    const black = [22, 22, 24]

    addLathePart(parts, 0, 82, 0, [[-4, 36, 34], [4, 36, 34]], [238, 244, 250], 24, { spec: 0.35 })

    // Tubuh kapsul Minion kuning bulat halus
    addLathePart(
      parts,
      0,
      0,
      0,
      [
        [-58, 9, 8],
        [-50, 24, 22],
        [-34, 31, 28],
        [-12, 32, 29],
        [14, 32, 29],
        [34, 31, 28],
        [48, 24, 22],
        [55, 11, 10],
      ],
      yellow,
      28,
      { spec: 0.32 }
    )

    // Baju kodok denim biru + saku dada & tali selempang
    addLathePart(
      parts,
      0,
      0,
      0,
      [
        [14, 32.8, 29.8],
        [34, 32, 29],
        [48, 25, 23],
        [56, 13, 12],
      ],
      denim,
      28,
      { spec: 0.18 }
    )
    addLathePart(
      parts,
      0,
      10,
      3.5,
      [
        [-6, 18, 27],
        [6, 19, 27.5],
      ],
      denim,
      20,
      { spec: 0.18 }
    )
    // Saku depan & logo Gru
    addEllipsoid(parts, 0, 24, 29.8, 9.5, 8.5, 2.4, denimDark, 8, 14)
    addEllipsoid(parts, 0, 23, 31.8, 4.4, 4.4, 1.2, black, 8, 10)
    // Tali denim & kancing hitam
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 16, 8, 27], [side * 30, -2, 14], 2.8, 2.8, denimDark, 10)
      addEllipsoid(parts, side * 16, 8.5, 29.2, 2.2, 2.2, 1.4, black, 6, 8)
    })

    // Celana pendek & sepatu coklat gelap
    ;[-9.5, 9.5].forEach((lx) => {
      addCapsule(parts, [lx, 52, 0], [lx, 67, 0], 6.8, 6.2, denimDark, 12)
      addEllipsoid(parts, lx, 73, 4.5, 7.8, 5.2, 11.2, shoeDark, 10, 14, { spec: 0.45 })
    })

    // Lengan kuning masuk ke saku samping
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 31, 12, 2], [side * 35, 34, 6], 5.2, 5.5, yellow, 12)
      addCapsule(parts, [side * 35, 34, 6], [side * 28, 42, 14], 5.5, 4.8, yellow, 12)
    })

    // Tali kacamata hitam melingkari kepala
    addLathePart(
      parts,
      0,
      -26,
      0,
      [
        [-4.5, 32.5, 29.5],
        [4.5, 32.5, 29.5],
      ],
      strapDark,
      28,
      { spec: 0.25 }
    )

    // Dua kacamata perak besar + mata coklat ekspresif
    ;[-1, 1].forEach((side) => {
      const gx = side * 12.2
      addLathePart(
        parts,
        gx,
        -26,
        24,
        [
          [-4, 13.5, 13.5],
          [4, 13.5, 13.5],
        ],
        silver,
        22,
        { pitch: Math.PI / 2, spec: 0.72 }
      )
      addEllipsoid(parts, gx, -26, 26.5, 10.5, 10.5, 5.2, white, 10, 16, { spec: 0.6 })
      addEllipsoid(parts, gx, -26, 30.8, 5.4, 5.4, 2.2, irisBrown, 8, 14, { spec: 0.65 })
      addEllipsoid(parts, gx, -26, 32.5, 2.7, 2.7, 1.3, black, 6, 10, { spec: 0.85 })
      addEllipsoid(parts, gx - 1.8, -28, 33.4, 1.3, 1.3, 0.8, white, 5, 8, { spec: 0.9 })
    })

    // Senyum manis + helai rambut belah tengah di atas kepala
    addCapsule(parts, [-9, -3, 27.5], [0, 0, 29], 1.1, 1.1, [146, 98, 22], 8)
    addCapsule(parts, [0, 0, 29], [9, -3, 27.5], 1.1, 1.1, [146, 98, 22], 8)
    ;[-1, 1].forEach((side) => {
      for (let h = 0; h < 3; h++) {
        addCapsule(parts, [side * (2 + h * 3), -57, 2], [side * (12 + h * 5), -65 + h * 2, 0], 1.0, 0.5, black, 6)
      }
    })
  } else if (figureId === 'minion_one') {
    // 7. MINION POINTING FIGURE (Mata Satu, Tunjuk Jari ke Atas)
    const yellow = [252, 206, 34]
    const denim = [54, 126, 182]
    const denimDark = [38, 94, 144]
    const silver = [202, 208, 216]
    const strapDark = [42, 38, 36]
    const gloveBlack = [36, 40, 46]
    const irisBrown = [158, 78, 24]
    const white = [254, 254, 255]
    const black = [22, 22, 24]

    addLathePart(parts, 0, 82, 0, [[-4, 38, 34], [4, 38, 34]], [238, 244, 250], 24, { spec: 0.35 })

    // Tubuh Minion gembul pendek
    addLathePart(
      parts,
      0,
      4,
      0,
      [
        [-54, 9, 8],
        [-44, 25, 22],
        [-28, 31, 28],
        [-6, 32, 29],
        [18, 33, 30],
        [38, 30, 27],
        [52, 20, 18],
      ],
      yellow,
      28,
      { spec: 0.32 }
    )

    // Baju kodok denim + saku & logo Gru + tali
    addLathePart(
      parts,
      0,
      4,
      0,
      [
        [14, 33.8, 30.8],
        [36, 31.5, 28.5],
        [50, 22, 20],
        [56, 13, 12],
      ],
      denim,
      28,
      { spec: 0.18 }
    )
    addLathePart(
      parts,
      0,
      14,
      3.5,
      [
        [-6, 18, 27],
        [6, 19, 27.5],
      ],
      denim,
      20
    )
    addEllipsoid(parts, 0, 28, 30.5, 9, 8, 2.2, denimDark, 8, 12)
    addEllipsoid(parts, 0, 27, 32.3, 4.2, 4.2, 1.2, black, 8, 10)
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 16, 12, 28], [side * 30, 2, 15], 2.8, 2.8, denimDark, 10)
      addEllipsoid(parts, side * 16, 12.5, 29.5, 2.2, 2.2, 1.4, black, 6, 8)
    })

    // Celana & sepatu hitam mengkilap
    ;[-9.5, 9.5].forEach((lx) => {
      addCapsule(parts, [lx, 54, 0], [lx, 68, 0], 6.6, 6.0, denimDark, 12)
      addEllipsoid(parts, lx, 74, 4.5, 7.6, 5.0, 10.8, gloveBlack, 10, 14, { spec: 0.55 })
    })

    // Tangan kanan bertolak pinggang (sarung tangan hitam)
    addCapsule(parts, [-30, 18, 2], [-40, 29, 4], 4.8, 4.5, yellow, 12)
    addCapsule(parts, [-40, 29, 4], [-34, 40, 10], 4.6, 4.6, yellow, 12)
    addEllipsoid(parts, -32, 42, 12, 6.5, 6.5, 6.5, gloveBlack, 8, 12, { spec: 0.4 })

    // Tangan kiri terangkat tinggi menunjuk satu jari ke atas
    addCapsule(parts, [29, 14, 2], [38, -2, 4], 4.8, 4.5, yellow, 12)
    addCapsule(parts, [38, -2, 4], [40, -24, 6], 4.5, 4.5, yellow, 12)
    addEllipsoid(parts, 40, -28, 6, 6.8, 6.2, 6.2, gloveBlack, 8, 12, { spec: 0.45 })
    addCapsule(parts, [40, -32, 6], [40, -52, 6], 3.2, 2.6, gloveBlack, 10, { spec: 0.45 })

    // Kacamata tunggal besar di tengah wajah + tali hitam
    addLathePart(parts, 0, -24, 0, [[-4.8, 32.8, 29.8], [4.8, 32.8, 29.8]], strapDark, 28)
    addLathePart(parts, 0, -24, 24, [[-4.5, 17, 17], [4.5, 17, 17]], silver, 26, { pitch: Math.PI / 2, spec: 0.72 })
    addEllipsoid(parts, 0, -24, 26.5, 13.5, 13.5, 5.8, white, 12, 18, { spec: 0.6 })
    addEllipsoid(parts, 0, -24, 31.2, 6.6, 6.6, 2.4, irisBrown, 10, 14, { spec: 0.65 })
    addEllipsoid(parts, 0, -24, 33.0, 3.2, 3.2, 1.4, black, 8, 10, { spec: 0.85 })
    addEllipsoid(parts, -2.4, -26.5, 34.0, 1.6, 1.6, 0.9, white, 5, 8, { spec: 0.9 })

    // Mulut terbuka tertawa + gigi putih & lidah merah
    addEllipsoid(parts, 0, 2, 27.5, 12.5, 5.8, 4.2, [132, 36, 48], 8, 14)
    addEllipsoid(parts, 0, 4.5, 29.2, 8, 2.6, 2.2, [212, 76, 86], 6, 10)
    addCapsule(parts, [-9, -1.5, 30], [9, -1.5, 30], 2.2, 2.2, white, 8)
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 2, -52, 2], [side * 12, -60, 0], 1.0, 0.5, black, 6)
    })
  } else if (figureId === 'stitch_boy') {
    // 8. STITCH BLUE FIGURE (Ceria Merentangkan Tangan)
    const blue = [72, 138, 216]
    const blueDeep = [54, 114, 188]
    const aqua = [142, 212, 218]
    const noseNavy = [26, 40, 96]
    const earPink = [234, 132, 158]
    const mouthRed = [212, 92, 108]
    const clawDark = [24, 30, 48]
    const white = [252, 252, 254]
    const black = [20, 20, 26]

    addLathePart(parts, 0, 82, 0, [[-4, 38, 34], [4, 38, 34]], [238, 244, 250], 24, { spec: 0.35 })

    // Badan Stitch biru + perut oval biru muda
    addLathePart(
      parts,
      0,
      36,
      0,
      [
        [-24, 16, 14],
        [-8, 22, 18],
        [14, 24, 20],
        [30, 20, 17],
      ],
      blue,
      24,
      { spec: 0.24 }
    )
    addEllipsoid(parts, 0, 38, 12.5, 16.5, 21, 9.5, aqua, 12, 16, { spec: 0.2 })

    // Kaki pendek biru & 4 kuku gelap tiap kaki
    ;[-12.5, 12.5].forEach((lx) => {
      addCapsule(parts, [lx, 56, 0], [lx, 71, 2], 9.2, 8.8, blue, 12)
      addEllipsoid(parts, lx, 73, 5.5, 10.5, 6.2, 11.5, blue, 8, 14)
      ;[-6, -2, 2, 6].forEach((tx) => {
        addEllipsoid(parts, lx + tx, 74, 16, 1.8, 2.2, 3.0, clawDark, 6, 8)
      })
    })

    // Dua lengan terbuka gembira + cakar gelap
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 19, 18, 2], [side * 38, 6, 6], 7.8, 7.2, blue, 12)
      addEllipsoid(parts, side * 41, 4, 7, 7.5, 7.2, 6.8, blue, 8, 12)
      ;[-4, 0, 4].forEach((cyOff, idx) => {
        addEllipsoid(parts, side * 46, 2 + cyOff, 8 + idx * 0.5, 1.8, 1.8, 1.8, clawDark, 5, 8)
      })
    })

    // Kepala bulat besar Stitch + jambul kepala
    addEllipsoid(parts, 0, -20, 2, 30, 24, 25, blue, 14, 24, { chubby: 0.14, spec: 0.26 })
    addCapsule(parts, [0, -43, 4], [-3, -51, 5], 2.8, 1.4, blueDeep, 8)
    addCapsule(parts, [2, -43, 4], [5, -50, 3], 2.4, 1.2, blueDeep, 8)

    // Bercak mata biru muda + mata hitam mengkilap + highlight putih
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 14, -22, 21.5, 9.8, 11.2, 4.5, aqua, 10, 14, { roll: -side * 0.18 })
      addEllipsoid(parts, side * 13.5, -22, 24.5, 7.2, 8.6, 3.4, black, 10, 14, { spec: 0.85 })
      addEllipsoid(parts, side * 12, -25.5, 27.2, 2.4, 2.8, 1.4, white, 6, 8, { spec: 0.9 })
    })

    // Hidung bulat besar biru tua
    addEllipsoid(parts, 0, -21, 27.5, 8.2, 6.4, 5.8, noseNavy, 10, 14, { spec: 0.45 })

    // Mulut terbuka tersenyum lebar + lidah merah & gigi putih
    addEllipsoid(parts, 0, -6, 21.5, 19.5, 9.5, 6.5, [62, 24, 34], 10, 16)
    addEllipsoid(parts, 0, -4, 24.2, 11.5, 4.2, 4.2, mouthRed, 8, 12)
    ;[-11, -5.5, 0, 5.5, 11].forEach((gx) => {
      addEllipsoid(parts, gx, -12, 25.5, 2.2, 2.4, 1.6, white, 6, 8)
    })

    // Telinga Stitch raksasa lebar mengarah ke atas-luar (bagian luar biru, dalam pink)
    ;[-1, 1].forEach((side) => {
      addCurvedPetal(parts, side * 26, -18, 2, 28, 52, 8, 0.15, side * -0.4, side * 0.58, blue, { rows: 6, cols: 5, spec: 0.24 })
      addCurvedPetal(parts, side * 26, -18, 4.2, 20, 44, 6, 0.15, side * -0.35, side * 0.58, earPink, { rows: 5, cols: 5, spec: 0.22 })
    })
  } else if (figureId === 'stitch_girl') {
    // 9. ANGEL PINK FIGURE (Lilo & Stitch - Antena + Bunga Sepatu Pink)
    const pink = [238, 128, 172]
    const pinkLight = [248, 184, 212]
    const noseLilac = [156, 108, 168]
    const eyeDark = [34, 26, 56]
    const clawPink = [184, 42, 92]
    const hibiscus = [238, 72, 138]
    const stamenYellow = [252, 214, 46]
    const white = [254, 254, 255]

    addLathePart(parts, 0, 82, 0, [[-4, 38, 34], [4, 38, 34]], [238, 244, 250], 24, { spec: 0.35 })

    // Badan ramping ceria pink Angel + perut pink muda + tanda V putih di dada
    addLathePart(
      parts,
      0,
      36,
      0,
      [
        [-22, 13, 12],
        [-6, 17.5, 15],
        [14, 20, 17],
        [30, 17, 15],
      ],
      pink,
      24,
      { roll: -0.08, spec: 0.26 }
    )
    addEllipsoid(parts, 0, 39, 11.2, 13.5, 19, 8.2, pinkLight, 10, 16)
    addCapsule(parts, [-6, 22, 16.5], [0, 27, 17.5], 2.0, 1.5, white, 8)
    addCapsule(parts, [6, 22, 16.5], [0, 27, 17.5], 2.0, 1.5, white, 8)

    // Kaki menjejak & kaki satu melangkah ceria
    addCapsule(parts, [-9, 58, 2], [-10, 72, 3], 7.5, 7.2, pink, 12)
    addEllipsoid(parts, -10, 74, 6, 8.5, 5.2, 9.5, pink, 8, 12)
    addCapsule(parts, [11, 56, 0], [18, 66, -4], 7.2, 6.8, pink, 12)
    addEllipsoid(parts, 20, 67, -2, 8.0, 5.0, 8.8, pink, 8, 12)
    ;[-4, 0, 4].forEach((tx) => {
      addEllipsoid(parts, -10 + tx, 75, 14.5, 1.4, 1.6, 2.0, clawPink, 5, 8)
    })

    // Tangan kanan menyapa di samping kepala, tangan kiri terentang ceria
    addCapsule(parts, [-14, 18, 2], [-27, 2, 6], 6.5, 6.2, pink, 12)
    addEllipsoid(parts, -29, -1, 7, 6.5, 6.2, 5.8, pink, 8, 12)
    addCapsule(parts, [15, 19, 2], [32, 6, 10], 6.5, 6.2, pink, 12)
    addEllipsoid(parts, 35, 3, 12, 6.5, 6.2, 5.8, pink, 8, 12)

    // Kepala Angel + mata besar berbulu mata + hidung ungu lilac + senyum cerah
    addEllipsoid(parts, 0, -18, 2, 28, 22, 23, pink, 14, 24, { chubby: 0.14, spec: 0.28 })
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 13.5, -19, 20, 9.5, 10.5, 4.2, pinkLight, 10, 14, { roll: -side * 0.18 })
      addEllipsoid(parts, side * 13, -19, 22.8, 7.2, 8.6, 3.2, eyeDark, 10, 14, { spec: 0.85 })
      addEllipsoid(parts, side * 11.5, -22, 25.4, 2.5, 2.8, 1.4, white, 6, 8, { spec: 0.9 })
      // Bulu mata lentik Angel
      addCapsule(parts, [side * 18, -24, 22], [side * 24, -27, 20], 1.1, 0.7, eyeDark, 6)
    })
    addEllipsoid(parts, 0, -17, 25.5, 6.8, 5.4, 4.8, noseLilac, 10, 14, { spec: 0.45 })
    addEllipsoid(parts, 0, -5, 20.5, 13.5, 5.5, 4.8, [186, 62, 92], 8, 14)

    // Telinga lebar pink
    ;[-1, 1].forEach((side) => {
      addCurvedPetal(parts, side * 24, -18, 1, 25, 48, 7, 0.15, side * -0.38, side * 0.54, pink, { rows: 5, cols: 5, spec: 0.25 })
      addCurvedPetal(parts, side * 24, -18, 3.2, 17, 40, 5, 0.15, side * -0.34, side * 0.54, pinkLight, { rows: 5, cols: 5 })
    })

    // Dua antena panjang melengkung khas Angel
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 10, -38, 0], [side * 24, -46, -6], 2.5, 2.2, pink, 8)
      addCapsule(parts, [side * 24, -46, -6], [side * 34, -8, -10], 2.2, 2.0, pink, 8)
      addCapsule(parts, [side * 34, -8, -10], [side * 40, 26, -4], 2.0, 2.5, pink, 8)
    })

    // Bunga sepatu (Hibiscus) 5 kelopak merah muda cerah + putik kuning di kepala
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2
      addCurvedPetal(
        parts,
        -6 + Math.cos(a) * 4,
        -42 + Math.sin(a) * 3,
        12,
        14,
        16,
        3.5,
        -0.45,
        0,
        a,
        hibiscus,
        { rows: 4, cols: 4, spec: 0.35 }
      )
    }
    addCapsule(parts, [-6, -43, 14], [-3, -55, 22], 1.2, 0.9, stamenYellow, 8)
    addEllipsoid(parts, -3, -56, 22.5, 2.8, 2.4, 2.4, stamenYellow, 6, 8)
  } else if (figureId === 'toothless') {
    // 10. TOOTHLESS NIGHT FURY FIGURE
    const black = [44, 44, 42]
    const blackScale = [60, 60, 58]
    const eyeGreen = [196, 224, 114]
    const clawCream = [220, 198, 152]
    const white = [252, 252, 254]
    const pupilDark = [14, 14, 16]

    addLathePart(parts, 0, 82, 0, [[-4, 44, 34], [4, 44, 34]], [238, 244, 250], 24, { spec: 0.35 })

    // Tubuh naga duduk manis hitam pekat halus
    addLathePart(
      parts,
      0,
      36,
      0,
      [
        [-22, 16, 15],
        [-4, 20, 19],
        [18, 24, 22],
        [36, 24, 22],
      ],
      black,
      24,
      { spec: 0.25 }
    )

    // Empat kaki duduk + cakar krem di tiap jari
    ;[-12.5, 12.5].forEach((lx) => {
      addCapsule(parts, [lx * 0.9, 26, 10], [lx, 66, 14], 7.8, 8.2, black, 12)
      addEllipsoid(parts, lx, 71, 18, 9.2, 6.2, 10.5, black, 8, 12)
      ;[-4.5, -1.5, 1.5, 4.5].forEach((cx) => {
        addEllipsoid(parts, lx + cx, 73, 27.5, 1.6, 2.0, 3.0, clawCream, 6, 8)
      })
    })
    ;[-24, 24].forEach((hx) => {
      addEllipsoid(parts, hx, 54, -2, 10, 16, 13, black, 10, 14)
      addEllipsoid(parts, hx + Math.sign(hx) * 3, 70, 4, 9, 5.5, 10, black, 8, 12)
      ;[-3, 0, 3].forEach((cx) => {
        addEllipsoid(parts, hx + Math.sign(hx) * 3 + cx, 72, 13.5, 1.5, 1.8, 2.6, clawCream, 5, 8)
      })
    })

    // Ekor naga hitam melengkung ke kanan + sirip ekor melebar
    addCapsule(parts, [14, 62, -16], [42, 64, -8], 5.5, 4.2, black, 10)
    addCapsule(parts, [42, 64, -8], [58, 56, 2], 4.2, 2.8, black, 10)
    addCurvedPetal(parts, 58, 55, 2, 18, 22, 3, 1.25, -0.6, 0.4, blackScale, { rows: 4, cols: 4 })

    // Sayap kelelawar terbuka ke kiri dan kanan
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 16, 18, -4], [side * 46, 2, -6], 3.8, 2.6, black, 10)
      addCapsule(parts, [side * 46, 2, -6], [side * 58, 16, -2], 2.5, 1.8, black, 8)
      addCurvedPetal(parts, side * 38, 28, -4, 42, 38, 5, 0.1, side * 0.15, side * -0.45, black, { rows: 5, cols: 5, spec: 0.22 })
    })

    // Kepala Toothless lebar & bulat + punuk sisik dahi
    addEllipsoid(parts, 0, -22, 6, 30, 22, 25, black, 14, 24, { chubby: 0.12, spec: 0.28 })
    for (let s = 0; s < 3; s++) {
      addEllipsoid(parts, 0, -40 + s * 3.5, 16 + s * 3.5, 2.8, 2.2, 2.8, blackScale, 6, 8)
    }

    // Dua mata hijau-kuning besar berkilau + pupil hitam besar + kilau putih
    ;[-1, 1].forEach((side) => {
      addEllipsoid(parts, side * 13.5, -22, 24.5, 9.6, 9.2, 4.5, eyeGreen, 10, 16, { yaw: side * 0.25, spec: 0.55 })
      addEllipsoid(parts, side * 13.0, -22, 27.8, 5.6, 6.2, 2.2, pupilDark, 8, 12, { yaw: side * 0.25, spec: 0.85 })
      addEllipsoid(parts, side * 11.2, -24.5, 29.5, 1.8, 1.8, 1.0, white, 5, 8, { spec: 0.9 })
    })

    // Dua telinga tanduk besar di atas kepala + 2 tonjolan dalam + 4 sirip pipi
    ;[-1, 1].forEach((side) => {
      addCapsule(parts, [side * 16, -38, 2], [side * 20, -60, -2], 8.5, 4.5, black, 12)
      addCapsule(parts, [side * 7, -42, 4], [side * 9, -50, 4], 3.5, 2.2, blackScale, 8)
      addEllipsoid(parts, side * 32, -26, 2, 9.5, 4.8, 4.5, blackScale, 8, 12, { roll: side * 0.35 })
      addEllipsoid(parts, side * 30, -16, 4, 8.2, 4.5, 4.2, blackScale, 8, 12, { roll: side * 0.15 })
    })
  }

  meshCache[figureId] = parts
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

  // Studio Spotlight Glow & Soft Floor Shadow
  const studioGlow = ctx.createRadialGradient(cx, cy - 20, 20, cx, cy, 175 * zoomLevel.value)
  studioGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  studioGlow.addColorStop(1, 'rgba(234, 245, 253, 0)')
  ctx.fillStyle = studioGlow
  ctx.fillRect(0, 0, cssW, cssH)

  const shadowGrad = ctx.createRadialGradient(
    cx,
    cy + 94 * zoomLevel.value,
    10,
    cx,
    cy + 94 * zoomLevel.value,
    92 * zoomLevel.value
  )
  shadowGrad.addColorStop(0, 'rgba(15, 40, 82, 0.24)')
  shadowGrad.addColorStop(1, 'rgba(15, 40, 82, 0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(cx, cy + 94 * zoomLevel.value, 86 * zoomLevel.value, 20 * zoomLevel.value, 0, 0, Math.PI * 2)
  ctx.fill()

  const mesh = buildFigureMesh(activeFigureId.value)
  const camDist = 370
  const fov = 305 * zoomLevel.value
  const lightKey = vecNorm([-0.42, -0.68, 0.72])
  const lightRim = vecNorm([0.55, 0.28, -0.45])
  const viewDir = [0, 0, 1]
  const halfVec = vecNorm([lightKey[0] + viewDir[0], lightKey[1] + viewDir[1], lightKey[2] + viewDir[2]])

  const projectedFaces = []

  mesh.forEach((face) => {
    const tPts = face.points.map((p) => rotatePoint(p, rotY, rotX))
    let normal = vecNorm(vecCross(vecSub(tPts[1], tPts[0]), vecSub(tPts[2], tPts[0])))
    const faceCenter = [
      tPts.reduce((s, p) => s + p[0], 0) / tPts.length,
      tPts.reduce((s, p) => s + p[1], 0) / tPts.length,
      tPts.reduce((s, p) => s + p[2], 0) / tPts.length,
    ]

    const toCamera = vecSub([0, 0, camDist], faceCenter)
    const camDot = vecDot(normal, toCamera)
    if (camDot <= 0) {
      if (!face.doubleSided) return
      normal = [-normal[0], -normal[1], -normal[2]]
    }

    // Half-Lambert soft matte + Satin Vinyl Specular Highlight
    const diffKey = Math.max(0, vecDot(normal, lightKey)) * 0.5 + 0.5
    const diffRim = Math.max(0, vecDot(normal, lightRim))
    const specDot = Math.max(0, vecDot(normal, halfVec))
    const specBoost = Math.pow(specDot, 16) * (face.spec ?? 0.24) * 75

    const intensity = 0.50 + Math.pow(diffKey, 1.45) * 0.58 + diffRim * 0.16

    const r = Math.min(255, Math.round(face.color[0] * intensity + specBoost))
    const g = Math.min(255, Math.round(face.color[1] * intensity + specBoost))
    const b = Math.min(255, Math.round(face.color[2] * intensity + specBoost))

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
    ctx.lineWidth = 0.55
    ctx.stroke()
  })

  ctx.restore()
}

function animate3D() {
  if (!isFigureModalOpen.value || viewMode3D.value !== 'mesh') return
  if (autoRotate.value && !isDragging.value) {
    rotY += 0.013
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
  rotY = 0.25
  rotX = -0.10
  zoomLevel.value = 1.08
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
          Gunakan tiket kamu untuk membuka blind box dan dapatkan figure 3D maupun tema hiasan spesial!
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
                Ubah warna latar &amp; hiasan bunga/daun di seluruh website dengan hadiah Blind Box.
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
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200"
                  :class="theme.previewClass"
                >
                  <!-- Mini Apple Icon (Merah Apel Lucu) -->
                  <svg v-if="theme.id === 'apple'" class="h-4 w-4 text-rose-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 6c2-1.2 6-1 6 4 0 5-3 8.5-6 7.5C9 18.5 6 15 6 10c0-5 4-5.2 6-4z" />
                    <path d="M12 6c.4-2 1.5-3 3-3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" />
                  </svg>
                  <!-- Mini Lavender Icon -->
                  <svg v-else-if="theme.id === 'purple'" class="h-4 w-4 text-purple-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c1.2 1.2 1.2 2.8 0 4-1.2-1.2-1.2-2.8 0-4zm-3 3.5c1.5.5 2.4 1.8 2 3.2-1.5-.5-2.4-1.8-2-3.2zm6 0c-1.5.5-2.4 1.8-2 3.2 1.5-.5 2.4-1.8 2-3.2zm-3 3c1.3 1.2 1.3 2.8 0 4-1.3-1.2-1.3-2.8 0-4z" />
                    <path d="M12 13v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                  <!-- Mini Sakura Blossom Icon -->
                  <svg v-else-if="theme.id === 'pink'" class="h-4 w-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c1.6 0 2.8 2 1.8 4.2 2-1.5 4-.5 3.4 1.5-.5 1.5-2.6 1.8-3.8.5 1.5 2 .7 4.2-1.4 3.8-1.5-.4-1.6-2.4-.2-3.6-1.9 1.4-4 .7-4-1.2 0-1.8 2.2-2 3.8-.6-1.2-2.2-.8-4.6.4-4.6z" />
                  </svg>
                  <!-- Mini Mint Leaf Icon -->
                  <svg v-else-if="theme.id === 'mint'" class="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 4C11 4 6 8.5 6 15c0 1.4.4 2.7 1 3.8L16 9.8l-7.2 9.8c1 .4 2.1.4 3.2.4 5 0 9-4 9-9V4h-4z" />
                  </svg>
                  <!-- Mini Daisy Icon -->
                  <svg v-else-if="theme.id === 'daisy'" class="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="5.5" r="2.6" fill="#FFFFFF" stroke="#EAB308" stroke-width="1" />
                    <circle cx="18.5" cy="12" r="2.6" fill="#FFFFFF" stroke="#EAB308" stroke-width="1" />
                    <circle cx="12" cy="18.5" r="2.6" fill="#FFFFFF" stroke="#EAB308" stroke-width="1" />
                    <circle cx="5.5" cy="12" r="2.6" fill="#FFFFFF" stroke="#EAB308" stroke-width="1" />
                    <circle cx="12" cy="12" r="3.4" fill="#FACC15" />
                  </svg>
                  <!-- Classic Star Icon -->
                  <svg v-else class="h-3.5 w-3.5 text-[#2D6BE4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3l2.4 5.2 5.6.8-4 3.9.9 5.6L12 15.8 7.1 18.5l.9-5.6-4-3.9 5.6-.8L12 3z" />
                  </svg>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[11px]">{{ theme.name }}</p>
                  <p class="truncate text-[9px] font-normal text-slate-400">
                    <template v-if="activeTheme === theme.id">Dipakai • {{ theme.ornamentLabel }}</template>
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

        <!-- Rak Etalase Pajangan (10 Figure Koleksi) -->
        <div class="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
              Model 3D HD (Putar 360°)
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
