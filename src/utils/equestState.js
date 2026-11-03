// State Management EQuest sesuai skema SDD dan Desain Figma
const STORAGE_VERSION_KEY = 'equest_storage_version'
const CURRENT_STORAGE_VERSION = 'equest_v6_simple_ai'

// Bersihkan cache lama yang tercampur agar setiap akun benar-benar terisolasi
function ensureCleanStorageVersion() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
    if (savedVersion !== CURRENT_STORAGE_VERSION) {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (
          k &&
          (k.startsWith('equestStats_') ||
            k.startsWith('equestTasks_') ||
            k.startsWith('equestHistory_') ||
            k === 'equestTasks' ||
            k === 'equestUsers')
        ) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION)
    }
  } catch (e) {
    console.error('Error cleaning storage:', e)
  }
}

ensureCleanStorageVersion()

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (e) {
    console.error(`Error reading ${key}:`, e)
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Error writing ${key}:`, e)
  }
}

export const DEMO_EMAIL = 'diva.novaliza@equest.edu'

export function isDemoAccount(email) {
  return Boolean(email && email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase())
}

// User session management
export function getCurrentUser() {
  return readStorage('equestUser', null)
}

export function setCurrentUser(user) {
  writeStorage('equestUser', user)
}

export function logoutUser() {
  localStorage.removeItem('equestUser')
}

// Registered users management
export function getAllUsers() {
  const users = readStorage('equestUsers', [])
  if (!users || users.length === 0) {
    const seedUsers = [
      {
        id: 1,
        name: 'Diva Novaliza (Demo)',
        email: DEMO_EMAIL,
        password: 'password123',
        avatar: '👩‍🎓',
        provider: 'email',
        createdAt: '01/10/2026',
      },
    ]
    writeStorage('equestUsers', seedUsers)
    return seedUsers
  }
  return users
}

export function saveUser(user) {
  const users = getAllUsers()
  const normalizedEmail = user.email.trim().toLowerCase()
  const existingIndex = users.findIndex(
    (u) => u.email?.trim().toLowerCase() === normalizedEmail
  )

  const userData = {
    id: user.id || Date.now(),
    name: user.name || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    password: user.password || '',
    avatar: user.avatar || '👤',
    provider: user.provider || 'email',
    createdAt: new Date().toLocaleDateString('id-ID'),
  }

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...userData }
  } else {
    users.push(userData)
    // Inisialisasi akun baru benar-benar dari 0!
    initNewUserStats(normalizedEmail)
    initNewUserTasks(normalizedEmail)
    initNewUserHistory(normalizedEmail)
  }

  writeStorage('equestUsers', users)
  return userData
}

export function updateUserPassword(email, newPassword) {
  const users = getAllUsers()
  const normalizedEmail = email.trim().toLowerCase()
  const userIndex = users.findIndex(
    (u) => u.email?.trim().toLowerCase() === normalizedEmail
  )

  if (userIndex === -1) {
    return { success: false, message: 'Email tidak ditemukan dalam sistem.' }
  }

  users[userIndex].password = newPassword
  writeStorage('equestUsers', users)
  return { success: true, message: 'Kata sandi berhasil diperbarui.' }
}

// Google Auth - Mendukung Akun Google Nyata
export function loginWithGoogle(account) {
  const normalizedEmail = account.email.trim().toLowerCase()
  const users = getAllUsers()
  let user = users.find((u) => u.email?.trim().toLowerCase() === normalizedEmail)

  if (!user) {
    user = {
      id: Date.now(),
      name: account.name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      avatar: '🌐',
      provider: 'google',
      createdAt: new Date().toLocaleDateString('id-ID'),
    }
    users.push(user)
    writeStorage('equestUsers', users)
    // Akun Google baru mulai murni dari 0!
    initNewUserStats(normalizedEmail)
    initNewUserTasks(normalizedEmail)
    initNewUserHistory(normalizedEmail)
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '🌐',
    provider: 'google',
  }
  setCurrentUser(sessionUser)
  return sessionUser
}

export function getStatsKey(email) {
  const normalized = email ? email.trim().toLowerCase() : 'guest'
  return `equestStats_${encodeURIComponent(normalized)}`
}

export const DEFAULT_BADGES = [
  {
    id: 'first_step',
    name: 'First Step',
    iconImage: 'badge_1.png',
    desc: 'Selesaikan 1 Latihan',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'streak_7',
    name: '7 Days Streak',
    iconImage: 'badge_2.png',
    desc: 'Belajar 7 hari berturut-turut',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'problem_solver',
    name: 'Problem Solver',
    iconImage: 'badge_3.png',
    desc: 'Selesaikan 50 soal',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'curious_mind',
    name: 'Curious Mind',
    iconImage: 'badge_4.png',
    desc: 'Unggah 50 file untuk dipelajari',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'master_learner',
    name: 'Master Learner',
    iconImage: 'badge_5.png',
    desc: 'Selesaikan 100 soal',
    unlocked: false,
    unlockedAt: null,
  },
]

// Evaluasi syarat kelayakan badge secara akurat sesuai angka statistik pengguna
export function evaluateBadges(stats) {
  const completedLatihan = stats.completedLatihan ?? (stats.soalSelesai > 0 ? 1 : 0)
  const streak = stats.streak ?? 0
  const soalSelesai = stats.soalSelesai ?? 0
  const filesUploaded = stats.filesUploaded ?? 0

  return DEFAULT_BADGES.map((b) => {
    let isUnlocked = false
    if (b.id === 'first_step') {
      isUnlocked = completedLatihan >= 1 || soalSelesai >= 1
    } else if (b.id === 'streak_7') {
      isUnlocked = streak >= 7
    } else if (b.id === 'problem_solver') {
      // Hanya terbuka jika soalSelesai >= 50! (Jika 45 masih terkunci!)
      isUnlocked = soalSelesai >= 50
    } else if (b.id === 'curious_mind') {
      isUnlocked = filesUploaded >= 50
    } else if (b.id === 'master_learner') {
      isUnlocked = soalSelesai >= 100
    }

    return {
      ...b,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? b.unlockedAt || 'Tercapai' : null,
    }
  })
}

// Inisialisasi awal untuk akun
export function initNewUserStats(email) {
  const key = getStatsKey(email)

  if (isDemoAccount(email)) {
    const demoStats = {
      xp: 320,
      tickets: 10,
      streak: 18,
      soalSelesai: 45,
      completedLatihan: 2,
      filesUploaded: 5,
      activityMonth: 24,
      xpMonth: 135,
      openedBoxes: 3,
      badges: [],
      rewards: [
        {
          id: 1,
          name: 'XP Boost +50',
          icon: '⭐',
          rarity: 'Common',
          date: '12 Okt 2026',
        },
      ],
    }
    demoStats.badges = evaluateBadges(demoStats)
    writeStorage(key, demoStats)
    return demoStats
  }

  // Akun baru murni: mulai benar-benar dari 0!
  const freshStats = {
    xp: 0,
    tickets: 0,
    streak: 0,
    soalSelesai: 0,
    completedLatihan: 0,
    filesUploaded: 0,
    activityMonth: 0,
    xpMonth: 0,
    openedBoxes: 0,
    badges: [],
    rewards: [],
  }
  freshStats.badges = evaluateBadges(freshStats)
  writeStorage(key, freshStats)
  return freshStats
}

export function initUserStats(email) {
  return getUserStats(email)
}

export function getUserStats(email) {
  if (!email) {
    const empty = {
      xp: 0,
      tickets: 0,
      streak: 0,
      soalSelesai: 0,
      completedLatihan: 0,
      filesUploaded: 0,
      activityMonth: 0,
      xpMonth: 0,
      openedBoxes: 0,
      badges: evaluateBadges({}),
      rewards: [],
    }
    return empty
  }

  const key = getStatsKey(email)
  const saved = readStorage(key, null)

  if (!saved) {
    return initNewUserStats(email)
  }

  // Selalu sinkronkan status terbuka/terkunci badge berdasarkan capaian nyata
  saved.badges = evaluateBadges(saved)
  return saved
}

export function saveUserStats(email, stats) {
  if (!email) return
  stats.badges = evaluateBadges(stats)
  const key = getStatsKey(email)
  writeStorage(key, stats)
}

export function addXp(email, amount) {
  if (!email) return 0
  const stats = getUserStats(email)
  stats.xp = (stats.xp || 0) + amount
  stats.xpMonth = (stats.xpMonth || 0) + amount
  saveUserStats(email, stats)
  return stats.xp
}

export function addTickets(email, count) {
  if (!email) return 0
  const stats = getUserStats(email)
  stats.tickets = (stats.tickets || 0) + count
  saveUserStats(email, stats)
  return stats.tickets
}

export function useTicket(email) {
  if (!email) return false
  const stats = getUserStats(email)
  if (stats.tickets <= 0) return false
  stats.tickets -= 1
  stats.openedBoxes = (stats.openedBoxes || 0) + 1
  stats.activityMonth = (stats.activityMonth || 0) + 1
  saveUserStats(email, stats)
  return true
}

export function addReward(email, reward) {
  if (!email) return
  const stats = getUserStats(email)
  if (!stats.rewards) stats.rewards = []
  stats.rewards.unshift({
    id: Date.now(),
    ...reward,
    date: new Date().toLocaleDateString('id-ID'),
  })
  saveUserStats(email, stats)

  // Catat ke riwayat belajar pengguna
  addHistoryItem(email, {
    type: 'box',
    title: 'Membuka Blind Box',
    subtitle: `Hadiah: ${reward.name} | ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    badgeText: '-1 Tiket',
    badgeClass: 'bg-[#DDF0FD] text-[#2D6BE4]',
    hasAction: false,
  })
}

export function unlockBadge(email, badgeId) {
  if (!email) return false
  const stats = getUserStats(email)
  saveUserStats(email, stats)
  return true
}

// Pencatatan penyelesaian tugas secara utuh (Update Soal Selesai, Streak, XP, Tiket, Badge, & Riwayat)
export function recordTaskCompletion(email, task, earnedXp = 80, earnedTickets = 1) {
  if (!email || !task) return

  const stats = getUserStats(email)
  const wasAlreadyCompleted = task.status === 'Selesai'

  const qCount = Number(task.questionCount) || 10
  const correctCount = task.questions
    ? task.questions.filter((q) => q.isCorrect).length
    : Math.round(((task.userScore || 80) / 100) * qCount)

  if (!wasAlreadyCompleted) {
    const prevFirstStep = stats.badges?.find((b) => b.id === 'first_step')?.unlocked
    const prevProblemSolver = stats.badges?.find((b) => b.id === 'problem_solver')?.unlocked

    stats.soalSelesai = (stats.soalSelesai || 0) + qCount
    stats.completedLatihan = (stats.completedLatihan || 0) + 1
    stats.activityMonth = (stats.activityMonth || 0) + 1
    if ((stats.streak || 0) === 0) {
      stats.streak = 1
    }
    stats.xp = (stats.xp || 0) + earnedXp
    stats.xpMonth = (stats.xpMonth || 0) + earnedXp
    stats.tickets = (stats.tickets || 0) + earnedTickets

    saveUserStats(email, stats)

    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Tambahkan ke Riwayat Belajar
    addHistoryItem(email, {
      type: 'task',
      title: `Menyelesaikan ${task.fileName || task.name}`,
      subtitle: `${qCount} soal | ${correctCount} benar | ${timeStr}`,
      badgeText: `+${earnedXp} XP`,
      badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
      hasAction: true,
      taskId: task.id,
    })

    // Cek apakah badge First Step baru saja terbuka
    const newBadges = evaluateBadges(stats)
    const nowFirstStep = newBadges.find((b) => b.id === 'first_step')?.unlocked
    const nowProblemSolver = newBadges.find((b) => b.id === 'problem_solver')?.unlocked

    if (!prevFirstStep && nowFirstStep) {
      addHistoryItem(email, {
        type: 'badge',
        title: 'Badge baru: First Step',
        subtitle: `Selesaikan 1 Latihan | ${timeStr}`,
        badgeText: 'Badge',
        badgeClass: 'bg-[#F0E6FF] text-[#7C3AED]',
        hasAction: false,
      })
    }
    if (!prevProblemSolver && nowProblemSolver) {
      addHistoryItem(email, {
        type: 'badge',
        title: 'Badge baru: Problem Solver',
        subtitle: `Selesaikan 50 soal | ${timeStr}`,
        badgeText: 'Badge',
        badgeClass: 'bg-[#F0E6FF] text-[#7C3AED]',
        hasAction: false,
      })
    }
  }
}

// 10 Soal Basis Data sesuai Figma Desktop 10, 13, 14, 15
export const DEFAULT_DATABASE_QUESTIONS = [
  {
    id: 1,
    question: 'Apa kepanjangan dari SQL?',
    userAnswer: 'Structured Query Language',
    correctAnswer: 'Structured Query Language',
    isCorrect: true,
    points: 10,
    explanation:
      'SQL adalah bahasa standar untuk berkomunikasi dengan basis data relasional. Dengan SQL, kamu bisa mengambil, menambah, mengubah, dan menghapus data yang tersimpan di dalam tabel.',
    exampleCode: "SELECT nama\nFROM siswa\nWHERE kelas = '10A';",
    exampleCaption: 'Perintah ini meminta nama semua siswa yang ada di kelas 10A.',
    terms: [
      { name: 'Basis data relasional', desc: 'Data disimpan dalam tabel yang saling berhubungan.' },
      { name: 'Query', desc: 'Perintah yang kamu tulis untuk meminta atau mengubah data.' },
      { name: 'Tabel', desc: 'Kumpulan baris dan kolom tempat data disimpan.' },
    ],
    memoryTip:
      'SQL dibaca "es-kiu-el" atau "sikuel". Ingat tiga kata: Structured (terstruktur), Query (permintaan), Language (bahasa).',
  },
  {
    id: 2,
    question: 'Perintah SQL untuk mengambil data dari tabel?',
    userAnswer: 'SELECT',
    correctAnswer: 'SELECT',
    isCorrect: true,
    points: 10,
    explanation:
      'Perintah SELECT digunakan untuk memilih atau mengambil data dari satu atau beberapa tabel dalam basis data.',
    exampleCode: 'SELECT * FROM produk;',
    exampleCaption: 'Perintah ini mengambil seluruh baris dan kolom dari tabel produk.',
    terms: [
      { name: 'SELECT', desc: 'Perintah utama pengambilan data (DQL - Data Query Language).' },
    ],
    memoryTip: "Ingat kata 'Select' dalam bahasa Inggris yang artinya 'Pilih'.",
  },
  {
    id: 3,
    question: 'Apa fungsi utama primary key pada sebuah tabel?',
    userAnswer: 'Menyimpan data dalam jumlah besar',
    correctAnswer: 'Mengidentifikasi setiap baris data secara unik',
    isCorrect: false,
    hint: 'Belum tepat. Mau coba perbaiki dulu?',
    points: 10,
    explanation:
      'Primary key adalah kolom atau kombinasi kolom yang secara unik mengidentifikasi setiap baris (record) dalam sebuah tabel, sehingga tidak boleh ada nilai duplikat maupun NULL.',
    exampleCode: 'CREATE TABLE mahasiswa (\n  nim VARCHAR(10) PRIMARY KEY,\n  nama VARCHAR(50)\n);',
    exampleCaption: 'Kolom nim dijadikan primary key sehingga tiap mahasiswa memiliki identitas unik.',
    terms: [
      { name: 'Primary Key', desc: 'Kunci utama unik untuk setiap baris data tabel.' },
      { name: 'Unique', desc: 'Tidak boleh ada nilai yang sama dalam satu kolom.' },
    ],
    memoryTip:
      'Primary = Utama, Key = Kunci. Kunci utama yang membuat tiap baris tidak ada kembarannya.',
  },
  {
    id: 4,
    question: 'Relasi antara satu pelanggan dan banyak pesanan disebut?',
    userAnswer: 'One-to-Many',
    correctAnswer: 'One-to-Many',
    isCorrect: true,
    points: 10,
    explanation:
      'Relasi One-to-Many terjadi ketika satu baris pada tabel A dapat berhubungan dengan banyak baris pada tabel B, tetapi satu baris pada tabel B hanya berhubungan dengan satu baris pada tabel A.',
    exampleCode: '-- 1 Pelanggan -> Banyak Pesanan\nSELECT * FROM pesanan WHERE id_pelanggan = 1;',
    exampleCaption: 'Satu akun pembeli bisa melakukan puluhan transaksi pesanan.',
    terms: [
      { name: 'Kardinalitas', desc: 'Derajat relasi antar entitas (1:1, 1:N, M:N).' },
    ],
    memoryTip: '1 orang belanja banyak barang di keranjang = One to Many.',
  },
  {
    id: 5,
    question: 'Perintah untuk menghapus tabel beserta isinya?',
    userAnswer: 'DROP TABLE',
    correctAnswer: 'DROP TABLE',
    isCorrect: true,
    points: 10,
    explanation:
      'DROP TABLE menghapus struktur tabel beserta seluruh data di dalamnya secara permanen dari basis data.',
    exampleCode: 'DROP TABLE nilai_lama;',
    exampleCaption: 'Tabel nilai_lama akan hilang permanen beserta strukturnya.',
    terms: [
      { name: 'DROP', desc: 'Perintah DDL untuk menghapus objek basis data.' },
    ],
    memoryTip: 'Bedakan: DELETE menghapus isi baris, DROP menghapus sampai meja tabelnya roboh.',
  },
  {
    id: 6,
    question: 'Apa tujuan utama normalisasi basis data?',
    userAnswer: 'Mengurangi redundansi data',
    correctAnswer: 'Mengurangi redundansi data',
    isCorrect: true,
    points: 10,
    explanation:
      'Normalisasi bertujuan untuk meminimalkan duplikasi (redundansi) data dan menghindari anomali saat insert, update, dan delete.',
    exampleCode: '-- Bentuk normal 1NF, 2NF, 3NF, BCNF\n-- Memecah data redundant ke tabel relasi terpisah',
    exampleCaption: 'Membagi tabel besar menjadi tabel-tabel kecil yang saling berelasi logis.',
    terms: [
      { name: 'Redundansi', desc: 'Data berulang yang memboroskan ruang dan memicu ketidakkonsistenan.' },
    ],
    memoryTip: 'Normalisasi = Membuat basis data normal, rapi, dan bebas data ganda.',
  },
  {
    id: 7,
    question: 'Fungsi agregat untuk menghitung jumlah baris?',
    userAnswer: 'SUM()',
    correctAnswer: 'COUNT()',
    isCorrect: false,
    hint: 'Masih belum tepat. Coba sekali lagi!',
    points: 10,
    explanation:
      'COUNT() adalah fungsi agregat yang menghitung total jumlah baris data, sedangkan SUM() menjumlahkan nilai angka pada kolom tertentu.',
    exampleCode: 'SELECT COUNT(*) FROM siswa;',
    exampleCaption: 'Menghitung berapa banyak total siswa yang terdaftar.',
    terms: [
      { name: 'Fungsi Agregat', desc: 'Fungsi kalkulasi pada kumpulan nilai yang menghasilkan nilai tunggal.' },
    ],
    memoryTip: 'Count = Menghitung kuantitas/banyaknya. Sum = Menjumlahkan nominal/angka.',
  },
  {
    id: 8,
    question: 'Klausa SQL untuk memfilter hasil query?',
    userAnswer: 'WHERE',
    correctAnswer: 'WHERE',
    isCorrect: true,
    points: 10,
    explanation:
      'Klausa WHERE digunakan untuk memfilter baris yang memenuhi kondisi spesifik yang ditentukan.',
    exampleCode: 'SELECT * FROM produk WHERE harga < 50000;',
    exampleCaption: 'Menyaring hanya produk yang harganya di bawah Rp 50.000.',
    terms: [
      { name: 'WHERE', desc: 'Penyaring baris data berdasarkan kriteria logika.' },
    ],
    memoryTip: "Where = 'Di mana' kondisi tertentu terpenuhi.",
  },
  {
    id: 9,
    question: 'Foreign key digunakan untuk apa?',
    userAnswer: 'Menghubungkan dua tabel',
    correctAnswer: 'Menghubungkan dua tabel',
    isCorrect: true,
    points: 10,
    explanation:
      'Foreign key adalah kolom pada satu tabel yang merujuk pada Primary Key tabel lain untuk menjaga integritas referensial antar relasi.',
    exampleCode: 'FOREIGN KEY (id_pengguna) REFERENCES Pengguna(id_pengguna)',
    exampleCaption: 'Menghubungkan catatan tugas ke entitas pengguna yang membuatnya.',
    terms: [
      { name: 'Foreign Key', desc: 'Kunci tamu penghubung relasi tabel referensi.' },
    ],
    memoryTip: 'Foreign = Asing/tamu yang bertamu ke tabel lain untuk bersalaman (menghubungkan).',
  },
  {
    id: 10,
    question: 'Perintah untuk menambahkan data baru ke tabel?',
    userAnswer: 'INSERT INTO',
    correctAnswer: 'INSERT INTO',
    isCorrect: true,
    points: 10,
    explanation:
      'Perintah INSERT INTO digunakan untuk menyisipkan baris rekaman baru ke dalam tabel.',
    exampleCode: "INSERT INTO kelas (nama_kelas) VALUES ('IF-10');",
    exampleCaption: 'Menambahkan record kelas baru bernama IF-10.',
    terms: [
      { name: 'INSERT INTO', desc: 'Perintah DML untuk memasukkan data baru.' },
    ],
    memoryTip: 'Insert = Masukkan ke dalam tabel.',
  },
]

// User Tasks management (Terisolasi penuh per email!)
export function getTaskKey(email) {
  const normalized = email ? email.trim().toLowerCase() : 'guest'
  return `equestTasks_${encodeURIComponent(normalized)}`
}

export function initNewUserTasks(email) {
  const key = getTaskKey(email)

  if (isDemoAccount(email)) {
    const demoTasks = [
      {
        id: 1,
        name: 'soal_latihan.pdf',
        fileName: 'soal_latihan.pdf',
        fileSize: '245 KB',
        fileType: 'PDF',
        questionCount: 10,
        uploadDate: '12 Okt 2026',
        status: 'Sedang Dikerjakan',
        remainingAttempts: 2,
        questions: DEFAULT_DATABASE_QUESTIONS,
        userScore: 80,
      },
      {
        id: 2,
        name: 'Pemrograman_Modul 2.png',
        fileName: 'Pemrograman_Modul 2.png',
        fileSize: '1.2 MB',
        fileType: 'PNG',
        questionCount: 5,
        uploadDate: '10 Okt 2026',
        status: 'Selesai',
        userScore: 100,
        questions: DEFAULT_DATABASE_QUESTIONS.slice(0, 5),
      },
      {
        id: 3,
        name: 'Basis Data _Latihan.jpg',
        fileName: 'Basis Data _Latihan.jpg',
        fileSize: '820 KB',
        fileType: 'JPG',
        questionCount: 8,
        uploadDate: '8 Okt 2026',
        status: 'Sedang Dikerjakan',
        remainingAttempts: 3,
        questions: DEFAULT_DATABASE_QUESTIONS.slice(0, 8),
      },
      {
        id: 4,
        name: 'Matematika_UTS.png',
        fileName: 'Matematika_UTS.png',
        fileSize: '2.1 MB',
        fileType: 'PNG',
        questionCount: 10,
        uploadDate: '5 Okt 2026',
        status: 'Sedang Dikerjakan',
        remainingAttempts: 2,
        questions: DEFAULT_DATABASE_QUESTIONS,
      },
      {
        id: 5,
        name: 'JaringanKomputer_Kuis.pdf',
        fileName: 'JaringanKomputer_Kuis.pdf',
        fileSize: '340 KB',
        fileType: 'PDF',
        questionCount: 5,
        uploadDate: '1 Okt 2026',
        status: 'Selesai',
        userScore: 80,
        questions: DEFAULT_DATABASE_QUESTIONS.slice(0, 5),
      },
    ]
    writeStorage(key, demoTasks)
    return demoTasks
  }

  // Akun baru: daftar tugas 100% kosong!
  const emptyTasks = []
  writeStorage(key, emptyTasks)
  return emptyTasks
}

export function getUserTasks(email) {
  if (!email) return []
  const key = getTaskKey(email)
  const tasks = readStorage(key, null)

  if (tasks === null) {
    return initNewUserTasks(email)
  }

  return Array.isArray(tasks) ? tasks : []
}

export function saveUserTasks(email, tasks) {
  if (!email) return
  const key = getTaskKey(email)
  writeStorage(key, tasks)
}

export function updateTask(email, taskId, updates) {
  if (!email) return null
  const tasks = getUserTasks(email)
  const index = tasks.findIndex((t) => String(t.id) === String(taskId))
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates }
    saveUserTasks(email, tasks)
    return tasks[index]
  }
  return null
}

export function deleteTask(email, taskId) {
  if (!email) return []
  const tasks = getUserTasks(email)
  const filtered = tasks.filter((t) => String(t.id) !== String(taskId))
  saveUserTasks(email, filtered)
  return filtered
}

// Riwayat Belajar per Pengguna
export function getHistoryKey(email) {
  const normalized = email ? email.trim().toLowerCase() : 'guest'
  return `equestHistory_${encodeURIComponent(normalized)}`
}

export const DEMO_HISTORY_GROUPS = [
  {
    dateLabel: '12 Okt 2026',
    dayName: 'Senin',
    items: [
      {
        id: 1,
        type: 'task',
        title: 'Menyelesaikan soal_latihan.pdf',
        subtitle: '10 soal | 8 benar | 14.20',
        badgeText: '+40 XP',
        badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
        hasAction: true,
        taskId: 1,
      },
      {
        id: 2,
        type: 'box',
        title: 'Membuka Blind Box',
        subtitle: 'Hadiah: +50 XP | 13.05',
        badgeText: '-1 Tiket',
        badgeClass: 'bg-[#DDF0FD] text-[#2D6BE4]',
        hasAction: false,
      },
    ],
  },
  {
    dateLabel: '10 Okt 2026',
    dayName: 'Sabtu',
    items: [
      {
        id: 3,
        type: 'task',
        title: 'Menyelesaikan Pemrograman_Modul 2.png',
        subtitle: '5 soal | 5 benar | 19.42',
        badgeText: '+25 XP',
        badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
        hasAction: true,
        taskId: 2,
      },
      {
        id: 4,
        type: 'badge',
        title: 'Badge baru: 7 Days Streak',
        subtitle: 'Belajar 7 hari berturut-turut | 19.43',
        badgeText: 'Badge',
        badgeClass: 'bg-[#F0E6FF] text-[#7C3AED]',
        hasAction: false,
      },
    ],
  },
  {
    dateLabel: '1 Okt 2026',
    dayName: 'Kamis',
    items: [
      {
        id: 5,
        type: 'task',
        title: 'Menyelesaikan JaringanKomputer_Kuis.pdf',
        subtitle: '5 soal | 4 benar | 16.30',
        badgeText: '+20 XP',
        badgeClass: 'bg-[#E1F7E9] text-[#16A34A]',
        hasAction: true,
        taskId: 5,
      },
    ],
  },
]

export function initNewUserHistory(email) {
  const key = getHistoryKey(email)
  if (isDemoAccount(email)) {
    writeStorage(key, DEMO_HISTORY_GROUPS)
    return DEMO_HISTORY_GROUPS
  }
  const emptyHistory = []
  writeStorage(key, emptyHistory)
  return emptyHistory
}

export function getUserHistory(email) {
  if (!email) return []
  const key = getHistoryKey(email)
  const saved = readStorage(key, null)
  if (saved === null) {
    return initNewUserHistory(email)
  }
  return Array.isArray(saved) ? saved : []
}

export function addHistoryItem(email, item) {
  if (!email) return
  const groups = getUserHistory(email)
  const now = new Date()
  const dateLabel = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' })

  let todayGroup = groups.find((g) => g.dateLabel === dateLabel)
  if (!todayGroup) {
    todayGroup = {
      dateLabel,
      dayName,
      items: [],
    }
    groups.unshift(todayGroup)
  }

  todayGroup.items.unshift({
    id: Date.now() + Math.random(),
    ...item,
  })

  writeStorage(getHistoryKey(email), groups)
}

// ============================================================================
// SMART QUESTION PARSER, SOLVER, & ANSWER EVALUATOR
// Memastikan soal yang diketik pengguna selalu menghasilkan jawaban yang sesuai
// dengan soal yang ditanyakan (tidak pernah tertukar dengan soal lain!)
// ============================================================================

const KNOWLEDGE_BASE_QA = [
  {
    keywords: ['kepanjangan', 'sql'],
    mustInclude: ['sql'],
    correctAnswer: 'Structured Query Language',
    explanation:
      'SQL (Structured Query Language) adalah bahasa standar yang digunakan untuk mengakses, memanipulasi, dan mengelola data dalam basis data relasional (RDBMS).',
    exampleCode: "SELECT nama, nim FROM mahasiswa WHERE prodi = 'Informatika';",
    exampleCaption: 'Contoh query SQL untuk menampilkan mahasiswa program studi Informatika.',
    terms: [
      { name: 'Structured Query Language', desc: 'Bahasa deklaratif standar untuk basis data relasional.' },
      { name: 'RDBMS', desc: 'Relational Database Management System seperti MySQL dan PostgreSQL.' },
    ],
    memoryTip: 'Ingat 3 kata kunci SQL: Structured (Terstruktur), Query (Permintaan), Language (Bahasa).',
  },
  {
    keywords: ['perintah', 'sql', 'ambil', 'mengambil', 'menampilkan', 'data'],
    mustInclude: ['sql'],
    correctAnswer: 'SELECT',
    explanation:
      'Perintah SELECT termasuk dalam DQL (Data Query Language) yang berfungsi mengambil dan menampilkan data dari satu atau lebih tabel.',
    exampleCode: 'SELECT * FROM produk;',
    exampleCaption: 'Mengambil seluruh kolom dan baris dari tabel produk.',
    terms: [
      { name: 'SELECT', desc: 'Perintah utama untuk membaca atau mengambil data dari tabel.' },
    ],
    memoryTip: "Select artinya 'Pilih' — memilih data yang ingin ditampilkan.",
  },
  {
    keywords: ['primary key', 'kunci utama'],
    mustInclude: ['primary'],
    correctAnswer: 'Mengidentifikasi setiap baris data secara unik',
    explanation:
      'Primary Key adalah atribut atau kolom yang nilainya bersifat unik (tidak boleh sama/duplikat) dan tidak boleh kosong (NOT NULL) untuk membedakan setiap record pada tabel.',
    exampleCode: 'CREATE TABLE pengguna (\n  id_pengguna INT PRIMARY KEY,\n  email VARCHAR(150) UNIQUE\n);',
    exampleCaption: 'Kolom id_pengguna menjadi identitas unik tiap baris.',
    terms: [
      { name: 'Primary Key', desc: 'Identitas unik utama pada setiap baris tabel.' },
      { name: 'NOT NULL & UNIQUE', desc: 'Syarat mutlak Primary Key: wajib terisi dan tidak boleh ganda.' },
    ],
    memoryTip: 'Seperti NIM mahasiswa: setiap orang pasti punya 1 nomor unik dan tidak mungkin kembar.',
  },
  {
    keywords: ['foreign key', 'kunci tamu', 'kunci asing'],
    mustInclude: ['foreign'],
    correctAnswer: 'Menghubungkan dua tabel yang saling berelasi',
    explanation:
      'Foreign Key adalah atribut pada satu tabel yang merujuk ke Primary Key di tabel lain untuk menjaga integritas referensial antar tabel.',
    exampleCode: 'FOREIGN KEY (id_pengguna) REFERENCES Pengguna(id_pengguna)',
    exampleCaption: 'Menghubungkan tabel Tugas ke tabel Pengguna.',
    terms: [
      { name: 'Foreign Key', desc: 'Kunci penghubung relasi antar tabel dalam basis data.' },
    ],
    memoryTip: 'Foreign Key adalah jembatan penghubung dari tabel anak ke tabel induk.',
  },
  {
    keywords: ['normalisasi', 'basis data', 'database'],
    mustInclude: ['normalisasi'],
    correctAnswer: 'Mengurangi redundansi (duplikasi) data dan mencegah anomali',
    explanation:
      'Normalisasi adalah proses pengorganisasian struktur tabel dalam basis data (1NF, 2NF, 3NF, BCNF) agar bebas dari pengulangan data yang tidak perlu serta menghindari anomali insert, update, dan delete.',
    exampleCode: '-- Memisahkan tabel Transaksi dan tabel Pelanggan agar nama pelanggan tidak ditulis berulang',
    exampleCaption: 'Struktur tabel menjadi efisien dan konsisten.',
    terms: [
      { name: 'Redundansi Data', desc: 'Pengulangan data yang sama di banyak tempat.' },
      { name: 'Anomali', desc: 'Masalah ketidakkonsistenan saat mengubah atau menghapus data.' },
    ],
    memoryTip: 'Normalisasi = Merapikan tabel supaya tidak ada data yang dobel-dobel.',
  },
  {
    keywords: ['algoritma'],
    mustInclude: ['algoritma'],
    correctAnswer: 'Urutan langkah-langkah logis dan sistematis untuk menyelesaikan suatu masalah',
    explanation:
      'Algoritma adalah rangkaian instruksi yang terstruktur, jelas, dan berhingga untuk memecahkan suatu permasalahan atau mencapai tujuan tertentu dalam komputasi.',
    exampleCode: '1. Mulai\n2. Masukkan nilai panjang dan lebar\n3. Hitung Luas = panjang * lebar\n4. Tampilkan Luas\n5. Selesai',
    exampleCaption: 'Contoh algoritma berurutan untuk menghitung luas persegi panjang.',
    terms: [
      { name: 'Input & Output', desc: 'Data masukan yang diproses menjadi hasil keluaran.' },
      { name: 'Finiteness', desc: 'Algoritma harus berhenti setelah sejumlah langkah terbatas.' },
    ],
    memoryTip: 'Bayangkan algoritma seperti resep memasak: ada bahan (input) dan urutan langkah pasti sampai masakan jadi (output).',
  },
  {
    keywords: ['variabel', 'pemrograman'],
    mustInclude: ['variabel'],
    correctAnswer: 'Wadah atau tempat di memori untuk menyimpan nilai data yang dapat berubah',
    explanation:
      'Variabel adalah penanda identitas di dalam kode program yang digunakan untuk menampung suatu nilai (angka, teks, boolean) agar dapat dipanggil dan dimanipulasi kembali.',
    exampleCode: "let namaSiswa = 'Diva';\nlet skor = 100;",
    exampleCaption: 'Mendeklarasikan variabel namaSiswa dan skor.',
    terms: [
      { name: 'Deklarasi', desc: 'Proses memperkenalkan nama variabel ke dalam program.' },
      { name: 'Assignment', desc: 'Proses mengisi nilai ke dalam variabel menggunakan tanda =.' },
    ],
    memoryTip: 'Variabel itu seperti kotak berlabel nama yang bisa diisi barang di dalamnya.',
  },
  {
    keywords: ['tipe data'],
    mustInclude: ['tipe data'],
    correctAnswer: 'Klasifikasi jenis nilai yang dapat disimpan dalam variabel (seperti Integer, Float, String, Boolean)',
    explanation:
      'Tipe data menentukan jenis nilai yang disimpan pada memori serta operasi apa saja yang dapat dilakukan terhadap nilai tersebut, misalnya Integer (bilangan bulat), Float/Double (desimal), String (teks), dan Boolean (true/false).',
    exampleCode: 'int umur = 20;          // Integer\nfloat ipk = 3.85;       // Float\nstring prodi = "IF";    // String\nbool lulus = true;      // Boolean',
    exampleCaption: 'Empat tipe data dasar yang paling sering digunakan dalam pemrograman.',
    terms: [
      { name: 'Integer & Float', desc: 'Tipe data numerik untuk bilangan bulat dan bilangan pecahan.' },
      { name: 'String & Boolean', desc: 'Tipe data teks karakter dan nilai logika benar/salah.' },
    ],
    memoryTip: 'Ingat 4 sekawan: Int (Angka bulat), Float (Desimal), String (Teks), Bool (Benar/Salah).',
  },
  {
    keywords: ['array', 'larik'],
    mustInclude: ['array'],
    correctAnswer: 'Struktur data yang menyimpan kumpulan elemen bertipe sama dalam satu variabel berindeks',
    explanation:
      'Array (larik) memungkinkan kita menyimpan banyak nilai sekaligus dalam satu variabel yang diakses menggunakan nomor indeks (dimulai dari indeks 0).',
    exampleCode: "const buah = ['Apel', 'Jeruk', 'Mangga'];\nconsole.log(buah[0]); // Output: Apel",
    exampleCaption: 'Mengakses elemen pertama array menggunakan indeks ke-0.',
    terms: [
      { name: 'Indeks (Index)', desc: 'Nomor urut posisi elemen di dalam array, dimulai dari 0.' },
      { name: 'Elemen', desc: 'Nilai data yang tersimpan di dalam tiap slot array.' },
    ],
    memoryTip: 'Array seperti deretan loker bernomor urut mulai dari loker nomor 0.',
  },
  {
    keywords: ['perulangan', 'loop', 'for', 'while'],
    mustInclude: [],
    correctAnswer: 'Struktur kontrol untuk mengeksekusi blok kode secara berulang selama kondisi terpenuhi',
    explanation:
      'Perulangan (looping) seperti for, while, dan do-while digunakan untuk menjalankan instruksi yang sama berkali-kali secara otomatis tanpa harus menulis kode berulang-ulang.',
    exampleCode: 'for (let i = 1; i <= 5; i++) {\n  console.log("Langkah ke-" + i);\n}',
    exampleCaption: 'Mencetak teks sebanyak 5 kali dari 1 sampai 5.',
    terms: [
      { name: 'For Loop', desc: 'Perulangan dengan jumlah iterasi yang sudah diketahui jelas (counted loop).' },
      { name: 'While Loop', desc: 'Perulangan berdasarkan kondisi logika (uncounted loop).' },
    ],
    memoryTip: 'For = Ulangi sekian kali. While = Ulangi terus selama syaratnya masih benar.',
  },
  {
    keywords: ['percabangan', 'if', 'else', 'switch'],
    mustInclude: [],
    correctAnswer: 'Struktur kontrol untuk mengambil keputusan berdasarkan kondisi benar (true) atau salah (false)',
    explanation:
      'Percabangan (conditional statement) mengarahkan alur program untuk memilih blok instruksi mana yang harus dijalankan berdasarkan evaluasi syarat logika tertentu.',
    exampleCode: 'if (nilai >= 80) {\n  status = "Lulus Memuaskan";\n} else {\n  status = "Perlu Belajar Lagi";\n}',
    exampleCaption: 'Program mengecek apakah nilai mencapai minimal 80.',
    terms: [
      { name: 'Kondisi Boolean', desc: 'Ekspresi perbandingan yang menghasilkan nilai true atau false.' },
    ],
    memoryTip: 'If-Else persis seperti persimpangan jalan: Jika syarat terpenuhi belok kanan, jika tidak belok kiri.',
  },
  {
    keywords: ['html'],
    mustInclude: ['html'],
    correctAnswer: 'HyperText Markup Language, bahasa markup standar untuk menyusun struktur halaman web',
    explanation:
      'HTML (HyperText Markup Language) digunakan untuk membangun kerangka dasar halaman web menggunakan elemen tag seperti heading, paragraf, gambar, tabel, dan tautan.',
    exampleCode: '<h1>Selamat Datang di EQuest</h1>\n<p>Belajar jadi lebih seru bersama AI.</p>',
    exampleCaption: 'Contoh elemen judul (h1) dan paragraf (p) pada HTML.',
    terms: [
      { name: 'Tag & Elemen', desc: 'Penanda struktur dokumen web seperti <div>, <h1>, dan <p>.' },
    ],
    memoryTip: 'HTML adalah kerangka tulang halaman web, CSS adalah pakaiannya, dan JavaScript adalah otot penggeraknya.',
  },
  {
    keywords: ['css'],
    mustInclude: ['css'],
    correctAnswer: 'Cascading Style Sheets, bahasa untuk mengatur tampilan dan tata letak halaman web',
    explanation:
      'CSS (Cascading Style Sheets) berfungsi mempercantik tampilan elemen HTML seperti mengatur warna, ukuran font, jarak margin/padding, hingga layout responsif (Flexbox & Grid).',
    exampleCode: '.card {\n  background-color: #D8EDFB;\n  border-radius: 16px;\n  padding: 20px;\n}',
    exampleCaption: 'Mengatur warna latar biru muda dan sudut membulat pada elemen .card.',
    terms: [
      { name: 'Selector & Property', desc: 'Target elemen HTML yang dipilih beserta aturan gaya visualnya.' },
    ],
    memoryTip: 'CSS = Desainer interior yang memberi warna dan tata letak pada kerangka HTML.',
  },
  {
    keywords: ['sdlc', 'software development life cycle'],
    mustInclude: ['sdlc'],
    correctAnswer: 'Siklus hidup pengembangan perangkat lunak mulai dari perencanaan, analisis, desain, implementasi, pengujian, hingga pemeliharaan',
    explanation:
      'SDLC (Software Development Life Cycle) adalah tahapan sistematis dalam membangun perangkat lunak berkualitas tinggi agar sesuai kebutuhan pengguna dan selesai tepat waktu.',
    exampleCode: 'Planning -> Analysis (SRS) -> Design (SDD) -> Implementation (Coding) -> Testing -> Maintenance',
    exampleCaption: 'Enam tahapan utama dalam siklus pengembangan perangkat lunak (SDLC).',
    terms: [
      { name: 'SRS', desc: 'Software Requirements Specification (dokumen spesifikasi kebutuhan).' },
      { name: 'SDD', desc: 'Software Design Document (dokumen perancangan arsitektur & basis data).' },
    ],
    memoryTip: 'Ingat urutan: Rencanakan -> Analisis -> Desain -> Ngoding -> Uji Coba -> Rawat.',
  },
  {
    keywords: ['srs', 'software requirements specification'],
    mustInclude: ['srs'],
    correctAnswer: 'Software Requirements Specification, dokumen spesifikasi kebutuhan fungsional dan non-fungsional perangkat lunak',
    explanation:
      'SRS mendeskripsikan secara rinci apa saja fitur yang harus dimiliki sistem (Functional Requirements) serta batasan kualitas operasionalnya (Non-Functional Requirements) sebelum sistem dikodekan.',
    exampleCode: 'FR-01: Sistem dapat menerima unggahan file soal PDF/JPG\nNFR-01: Waktu respons sistem maksimal 5 detik',
    exampleCaption: 'Contoh penulisan kebutuhan fungsional dan non-fungsional di dalam SRS.',
    terms: [
      { name: 'Kebutuhan Fungsional', desc: 'Fitur dan layanan utama yang harus disediakan oleh sistem.' },
      { name: 'Kebutuhan Non-Fungsional', desc: 'Standar performa, keamanan, dan keandalan sistem.' },
    ],
    memoryTip: 'SRS menjawab pertanyaan "APA yang harus bisa dilakukan oleh aplikasi?"',
  },
  {
    keywords: ['sdd', 'software design document'],
    mustInclude: ['sdd'],
    correctAnswer: 'Software Design Document, dokumen rancangan teknis arsitektur, antarmuka, dan skema basis data perangkat lunak',
    explanation:
      'SDD menerjemahkan kebutuhan di SRS menjadi cetak biru teknis yang mencakup arsitektur sistem, diagram UML, Physical Data Model (tabel database), dan desain UI/UX.',
    exampleCode: 'Bab 1 Pendahuluan -> Bab 2 Arsitektur -> Bab 3 Desain Komponen -> Bab 4 Desain Data (PDM) -> Bab 5 Desain Antarmuka',
    exampleCaption: 'Struktur rancangan teknis pada dokumen SDD.',
    terms: [
      { name: 'Physical Data Model', desc: 'Skema fisik tabel basis data lengkap dengan tipe data, PK, dan FK.' },
    ],
    memoryTip: 'Jika SRS menjawab "APA", maka SDD menjawab "BAGAIMANA cara merancang dan membangunnya".',
  },
  {
    keywords: ['oop', 'object oriented', 'berorientasi objek'],
    mustInclude: [],
    correctAnswer: 'Paradigma pemrograman yang mengorganisasikan kode ke dalam Class dan Object (Enkapsulasi, Inheritance, Polimorfisme, Abstraksi)',
    explanation:
      'Pemrograman Berorientasi Objek (OOP) memodelkan komponen program sebagai objek yang memiliki atribut (properti/data) dan perilaku (method/fungsi).',
    exampleCode: 'class Mahasiswa {\n  constructor(nama, nim) {\n    this.nama = nama;\n    this.nim = nim;\n  }\n}',
    exampleCaption: 'Contoh pembuatan class Mahasiswa dalam OOP.',
    terms: [
      { name: 'Class & Object', desc: 'Class adalah cetak biru (blueprint), sedangkan Object adalah wujud nyatanya.' },
      { name: '4 Pilar OOP', desc: 'Encapsulation, Inheritance, Polymorphism, dan Abstraction.' },
    ],
    memoryTip: 'Class itu cetakan kue, sedangkan Object adalah kue-kue yang dihasilkan dari cetakan tersebut.',
  },
]

// Coba hitung ekspresi matematika jika soal berupa hitungan angka (dengan bahasa sederhana sehari-hari!)
function trySolveMathQuestion(rawQuestion) {
  const cleaned = rawQuestion
    .toLowerCase()
    .replace(/berapa(kah)?/g, '')
    .replace(/hasil\s+dari/g, '')
    .replace(/hitung(lah)?/g, '')
    .replace(/nilai\s+dari/g, '')
    .replace(/[?=]/g, '')
    .replace(/×/g, '*')
    .replace(/\bx\b/g, '*')
    .replace(/:/g, '/')
    .replace(/÷/g, '/')
    .replace(/ditambah/g, '+')
    .replace(/dikurang(i)?/g, '-')
    .replace(/dikali(kan)?/g, '*')
    .replace(/dibagi/g, '/')
    .trim()

  const mathMatch = cleaned.match(/(-?\d+(?:\.\d+)?(?:\s*[\+\-\*\/]\s*-?\d+(?:\.\d+)?)+)/)
  if (!mathMatch) return null

  const expr = mathMatch[1].trim()
  try {
    if (!/^[\d\s\.\+\-\*\/\(\)]+$/.test(expr)) return null
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)()
    if (typeof result === 'number' && Number.isFinite(result)) {
      const formattedResult = Number.isInteger(result) ? String(result) : result.toFixed(2)
      const prettyExpr = expr.replace(/\*/g, '×').replace(/\//g, '÷')

      // Buat penjelasan yang sangat sederhana dan ramah untuk semua kalangan
      let simpleStory = `Jika kita menghitung ${prettyExpr} langkah demi langkah, maka hasil akhirnya adalah ${formattedResult}.`
      const simpleAdd = expr.match(/^(\d+)\s*\+\s*(\d+)$/)
      const simpleSub = expr.match(/^(\d+)\s*\-\s*(\d+)$/)
      const simpleMul = expr.match(/^(\d+)\s*\*\s*(\d+)$/)
      const simpleDiv = expr.match(/^(\d+)\s*\/\s*(\d+)$/)

      if (simpleAdd) {
        simpleStory = `Bayangkan kamu punya ${simpleAdd[1]} buah apel, lalu ditambah lagi ${simpleAdd[2]} buah apel. Kalau dihitung semuanya bersama-sama, sekarang kamu punya ${formattedResult} buah apel.`
      } else if (simpleSub) {
        simpleStory = `Bayangkan mula-mula kamu punya ${simpleSub[1]} permen, lalu diberikan kepada temanmu sebanyak ${simpleSub[2]} permen. Maka sisa permen yang kamu miliki sekarang adalah ${formattedResult}.`
      } else if (simpleMul) {
        simpleStory = `Perkalian ${simpleMul[1]} × ${simpleMul[2]} artinya kita menjumlahkan angka ${simpleMul[2]} sebanyak ${simpleMul[1]} kali, sehingga hasilnya menjadi ${formattedResult}.`
      } else if (simpleDiv) {
        simpleStory = `Pembagian ${simpleDiv[1]} ÷ ${simpleDiv[2]} artinya membagi ${simpleDiv[1]} benda sama rata ke dalam ${simpleDiv[2]} kelompok, sehingga masing-masing mendapat ${formattedResult}.`
      }

      return {
        correctAnswer: formattedResult,
        explanation: simpleStory,
        exampleCode: `${prettyExpr} = ${formattedResult}`,
        exampleCaption: 'Cara hitung singkat dan hasilnya.',
        terms: [
          {
            name: 'Langkah Hitung',
            desc: `Menghitung ${prettyExpr} secara bertahap hingga mendapatkan angka ${formattedResult}.`,
          },
          {
            name: 'Urutan Hitung Dasar',
            desc: 'Jika ada tanda kali (×) atau bagi (÷), kerjakan lebih dulu sebelum tambah (+) dan kurang (-).',
          },
        ],
        memoryTip: 'Supaya mudah dan tidak keliru, bayangkan angkanya seperti benda nyata di sekitar kita (seperti buah atau jari tangan)!',
      }
    }
  } catch (e) {
    return null
  }
  return null
}

// Pecah teks input menjadi daftar kalimat soal (mendukung 1 soal maupun banyak soal bernomor)
export function parseRawQuestionsText(questionText) {
  if (!questionText || !questionText.trim()) return []
  const text = questionText.trim()

  // 1. Cek apakah ada penomoran baris seperti "1. ...", "2. ..." atau "1) ..."
  const numberedLines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (numberedLines.length > 1) {
    const cleanedLines = numberedLines
      .map((line) => line.replace(/^\s*(?:soal\s*)?\d+[\.\)\-:]\s*/i, '').trim())
      .filter((line) => line.length > 2)

    if (cleanedLines.length > 0) {
      return cleanedLines
    }
  }

  // 2. Cek apakah dipisahkan oleh penomoran inline "1. ... 2. ... 3. ..."
  const inlineSplit = text
    .split(/(?:^|\s+)\d+[\.\)]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)

  if (inlineSplit.length > 1) {
    return inlineSplit
  }

  // 3. Jika hanya 1 soal yang diketik pengguna
  const singleCleaned = text.replace(/^\s*(?:soal\s*)?\d+[\.\)\-:]\s*/i, '').trim()
  return [singleCleaned]
}

// Buat data pembahasan lengkap untuk 1 soal spesifik yang diketik pengguna
export function generateQuestionObject(rawQuestion, index = 0) {
  const qText = rawQuestion.trim()
  const lower = qText.toLowerCase()

  // 1. Cek apakah soal matematika / hitungan
  const mathSolution = trySolveMathQuestion(qText)
  if (mathSolution) {
    return {
      id: index + 1,
      question: qText,
      userAnswer: '',
      correctAnswer: mathSolution.correctAnswer,
      isCorrect: false,
      points: 10,
      hint: `Coba hitung kembali operasi (${mathSolution.exampleCode.split('=')[0].trim()}) dengan teliti.`,
      explanation: mathSolution.explanation,
      exampleCode: mathSolution.exampleCode,
      exampleCaption: mathSolution.exampleCaption,
      terms: mathSolution.terms,
      memoryTip: mathSolution.memoryTip,
    }
  }

  // 2. Cek di 10 soal default database terlebih dahulu jika cocok persis
  const exactDefault = DEFAULT_DATABASE_QUESTIONS.find(
    (dq) =>
      dq.question.toLowerCase() === lower ||
      lower.includes(dq.question.toLowerCase().replace('?', ''))
  )
  if (exactDefault) {
    return {
      ...JSON.parse(JSON.stringify(exactDefault)),
      id: index + 1,
      question: qText,
      userAnswer: '',
      isCorrect: false,
    }
  }

  // 3. Cek di Knowledge Base (CS, Pemrograman, Database, RPL/IPPL, Web)
  for (const item of KNOWLEDGE_BASE_QA) {
    const hasMustInclude =
      item.mustInclude.length === 0 ||
      item.mustInclude.some((kw) => lower.includes(kw))
    const matchCount = item.keywords.filter((kw) => lower.includes(kw)).length

    if (hasMustInclude && matchCount >= 1) {
      return {
        id: index + 1,
        question: qText,
        userAnswer: '',
        correctAnswer: item.correctAnswer,
        isCorrect: false,
        points: 10,
        hint: `Perhatikan konsep utama mengenai ${item.keywords[0].toUpperCase()} pada pertanyaan ini.`,
        explanation: item.explanation,
        exampleCode: item.exampleCode,
        exampleCaption: item.exampleCaption,
        terms: item.terms,
        memoryTip: item.memoryTip,
      }
    }
  }

  // 4. Analisis pintar topik dari kalimat pertanyaan pengguna dengan bahasa sederhana sehari-hari
  const topicCleaned = qText
    .replace(/^(apa\s+(itu|yang\s+dimaksud\s+dengan|fungsi\s+dari|fungsi|kepanjangan\s+dari|tujuan\s+dari|perbedaan\s+antara|arti\s+dari)|jelaskan\s+(tentang|apa\s+itu|mengenai|fungsi)?|sebutkan|bagaimana\s+cara|mengapa|siapa|dimana|kapan)\s+/i, '')
    .replace(/[?!.]+$/g, '')
    .trim()

  const subjectLabel = topicCleaned || qText.replace(/[?!.]+$/g, '').trim()

  return {
    id: index + 1,
    question: qText,
    userAnswer: '',
    correctAnswer: `${subjectLabel} adalah hal penting yang menjadi inti dari pembahasan soal ini sesuai konteks pelajarannya.`,
    isCorrect: false,
    points: 10,
    hint: `Coba ingat kembali pengertian dasar dari "${subjectLabel}" dengan kata-katamu sendiri.`,
    explanation: `Soal ini menanyakan tentang "${subjectLabel}". Secara sederhana, cara paling gampang memahaminya adalah melihat apa pengertian dasarnya, apa kegunaannya, dan bagaimana contohnya dalam kehidupan sehari-hari.`,
    exampleCode: `Inti pembahasan: memahami arti dan contoh nyata dari ${subjectLabel} di sekitar kita.`,
    exampleCaption: `Gambaran sederhana mengenai ${subjectLabel}.`,
    terms: [
      {
        name: subjectLabel.slice(0, 40),
        desc: `Topik utama yang sedang dibahas pada pertanyaan ini.`,
      },
      {
        name: 'Poin Utama',
        desc: 'Memahami pengertian dasar dengan bahasa sendiri yang mudah diingat.',
      },
    ],
    memoryTip: `Cara mudah mengingat "${subjectLabel}": bayangkan contoh nyatanya dalam kegiatan sehari-hari!`,
  }
}

// Bangun array questions dari teks soal yang diketik pengguna
export function buildQuestionsFromText(questionText) {
  const rawList = parseRawQuestionsText(questionText)
  if (rawList.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_DATABASE_QUESTIONS))
  }
  return rawList.map((rawQ, idx) => generateQuestionObject(rawQ, idx))
}

// Evaluasi apakah jawaban yang diketik pengguna untuk 1 soal bernilai benar
export function evaluateSingleAnswer(userAnswer, correctAnswer, questionText = '') {
  if (!userAnswer || !userAnswer.trim()) return false
  const u = userAnswer.trim().toLowerCase()
  const c = (correctAnswer || '').trim().toLowerCase()

  if (!u || u === '(belum diisi)') return false

  // 1. Jika sama persis atau saling memuat
  if (u === c || (u.length >= 2 && c.includes(u)) || (c.length >= 2 && u.includes(c))) {
    return true
  }

  // 2. Jika jawaban berupa angka (misal soal matematika)
  const uNum = u.match(/-?\d+(?:\.\d+)?/)
  const cNum = c.match(/^-?\d+(?:\.\d+)?$/)
  if (cNum && uNum && uNum[0] === cNum[0]) {
    return true
  }

  // 3. Cek kecocokan kata kunci bermakna (minimal 1-2 kata kunci penting cocok)
  const stopWords = new Set([
    'yang', 'untuk', 'dalam', 'pada', 'dari', 'dengan', 'adalah', 'merupakan',
    'atau', 'dan', 'di', 'ke', 'sebagai', 'secara', 'suatu', 'sebuah', 'data',
  ])
  const cWords = c
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w))

  if (cWords.length > 0) {
    const matchedWords = cWords.filter((w) => u.includes(w))
    const requiredMatches = cWords.length <= 2 ? 1 : Math.min(2, Math.ceil(cWords.length * 0.3))
    if (matchedWords.length >= requiredMatches) {
      return true
    }
  }

  // 4. Jika soal terbuka/deskriptif dan pengguna sudah menuliskan penjelasan yang relevan dengan topik soal
  const qWords = questionText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w))
  const touchesTopic = qWords.some((w) => u.includes(w))
  if (u.split(/\s+/).length >= 4 && (touchesTopic || c.includes('konsep/komponen penting'))) {
    return true
  }

  return false
}

// Terapkan jawaban yang diketik pengguna (baik dari bubble teks maupun input per nomor) ke daftar soal tugas
export function applyUserAnswersToQuestions(questions, rawAnswerText = '', perQuestionAnswers = {}) {
  const cloned = JSON.parse(JSON.stringify(questions || []))
  if (cloned.length === 0) return cloned

  // Pecah rawAnswerText jika pengguna mengetik di bubble utama
  let parsedLines = []
  if (rawAnswerText && rawAnswerText.trim()) {
    const text = rawAnswerText.trim()
    if (cloned.length === 1) {
      // Jika hanya 1 soal, seluruh teks di bubble adalah jawaban untuk soal nomor 1
      parsedLines = [text.replace(/^\s*(?:jawaban\s*)?\d*[\.\)\-:]?\s*/i, '').trim()]
    } else {
      // Jika banyak soal, pecah per baris atau per nomor (1. ..., 2. ...)
      const lines = text
        .split(/\n+/)
        .map((l) => l.replace(/^\s*(?:nomor\s*)?\d+[\.\)\-:]\s*/i, '').trim())
        .filter(Boolean)

      if (lines.length > 1) {
        parsedLines = lines
      } else {
        const inlineParts = text
          .split(/(?:^|\s+)\d+[\.\)]\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
        parsedLines = inlineParts.length > 1 ? inlineParts : [text]
      }
    }
  }

  return cloned.map((q, idx) => {
    const specificInput = perQuestionAnswers[q.id] ?? perQuestionAnswers[idx]
    const lineInput = parsedLines[idx]
    const chosenAnswer =
      (specificInput !== undefined && String(specificInput).trim() !== ''
        ? String(specificInput).trim()
        : lineInput !== undefined && String(lineInput).trim() !== ''
          ? String(lineInput).trim()
          : q.userAnswer || '') || '(Belum diisi)'

    const isCorrect = evaluateSingleAnswer(chosenAnswer, q.correctAnswer, q.question)

    return {
      ...q,
      userAnswer: chosenAnswer,
      isCorrect,
    }
  })
}
