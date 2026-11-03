// State Management EQuest sesuai skema SDD dan Desain Figma
const STORAGE_VERSION_KEY = 'equest_storage_version'
const CURRENT_STORAGE_VERSION = 'equest_v4_isolated'

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
