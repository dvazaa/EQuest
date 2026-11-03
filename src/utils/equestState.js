// State Management EQuest sesuai skema SDD dan Desain Figma
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

// User session management
export function getCurrentUser() {
  const user = readStorage('equestUser', null)
  if (!user) {
    // Default logged in user untuk kemudahan pengujian demo sesuai Figma
    const demoUser = {
      id: 1,
      name: 'Diva Novaliza',
      email: 'diva.novaliza@equest.edu',
      avatar: '👩‍🎓',
      provider: 'email',
    }
    setCurrentUser(demoUser)
    return demoUser
  }
  return user
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
        name: 'Diva Novaliza',
        email: 'diva.novaliza@equest.edu',
        password: 'password123',
        avatar: '👩‍🎓',
        provider: 'email',
        createdAt: '01/10/2026',
      },
      {
        id: 2,
        name: 'Budi Santoso',
        email: 'budi.santoso@gmail.com',
        password: 'password123',
        avatar: '👨‍🎓',
        provider: 'email',
        createdAt: '05/10/2026',
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

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user }
  } else {
    users.push({
      id: user.id || Date.now(),
      name: user.name || 'Pengguna EQuest',
      email: normalizedEmail,
      password: user.password || '',
      avatar: user.avatar || '👤',
      provider: user.provider || 'email',
      createdAt: new Date().toLocaleDateString('id-ID'),
    })
  }

  writeStorage('equestUsers', users)
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

// Google Auth Simulation
export function loginWithGoogle(account) {
  const normalizedEmail = account.email.trim().toLowerCase()
  const users = getAllUsers()
  let user = users.find((u) => u.email?.trim().toLowerCase() === normalizedEmail)

  if (!user) {
    user = {
      id: Date.now(),
      name: account.name || 'Pengguna Google',
      email: normalizedEmail,
      avatar: account.avatar || '🌐',
      provider: 'google',
      createdAt: new Date().toLocaleDateString('id-ID'),
    }
    users.push(user)
    writeStorage('equestUsers', users)
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '🌐',
    provider: 'google',
  }
  setCurrentUser(sessionUser)
  initUserStats(sessionUser.email)
  return sessionUser
}

// User Stats & Gamification matching Desktop - 8 & Desktop - 1
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
    unlocked: true,
    unlockedAt: '1 Okt 2026',
  },
  {
    id: 'streak_7',
    name: '7 Days Streak',
    iconImage: 'badge_2.png',
    desc: 'Belajar 7 hari berturut-turut',
    unlocked: true,
    unlockedAt: '10 Okt 2026',
  },
  {
    id: 'problem_solver',
    name: 'Problem Solver',
    iconImage: 'badge_3.png',
    desc: 'Selesaikan 50 soal',
    unlocked: true,
    unlockedAt: '12 Okt 2026',
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

export function getUserStats(email) {
  const key = getStatsKey(email)
  const fallback = {
    xp: 320,
    tickets: 10,
    streak: 18,
    soalSelesai: 45,
    activityMonth: 24,
    xpMonth: 135,
    openedBoxes: 3,
    badges: DEFAULT_BADGES,
    rewards: [
      {
        id: 1,
        name: 'XP Boost +50',
        icon: '⭐',
        rarity: 'Common',
        date: '12 Okt 2026',
      },
      {
        id: 2,
        name: 'Tiket Tambahan +1',
        icon: '🎟️',
        rarity: 'Rare',
        date: '10 Okt 2026',
      },
    ],
  }

  const saved = readStorage(key, null)
  if (!saved) {
    writeStorage(key, fallback)
    return fallback
  }

  // Ensure fields match Figma defaults if previously missing
  if (saved.xp === undefined) saved.xp = 320
  if (saved.tickets === undefined) saved.tickets = 10
  if (saved.streak === undefined) saved.streak = 18
  if (saved.soalSelesai === undefined) saved.soalSelesai = 45
  if (!saved.badges || saved.badges.length !== 5) {
    saved.badges = DEFAULT_BADGES
  }

  return saved
}

export function initUserStats(email) {
  return getUserStats(email)
}

export function saveUserStats(email, stats) {
  const key = getStatsKey(email)
  writeStorage(key, stats)
}

export function addXp(email, amount) {
  const stats = getUserStats(email)
  stats.xp = (stats.xp || 0) + amount
  saveUserStats(email, stats)
  return stats.xp
}

export function addTickets(email, count) {
  const stats = getUserStats(email)
  stats.tickets = (stats.tickets || 0) + count
  saveUserStats(email, stats)
  return stats.tickets
}

export function useTicket(email) {
  const stats = getUserStats(email)
  if (stats.tickets <= 0) return false
  stats.tickets -= 1
  stats.openedBoxes = (stats.openedBoxes || 0) + 1
  saveUserStats(email, stats)
  return true
}

export function addReward(email, reward) {
  const stats = getUserStats(email)
  if (!stats.rewards) stats.rewards = []
  stats.rewards.unshift({
    id: Date.now(),
    ...reward,
    date: new Date().toLocaleDateString('id-ID'),
  })
  saveUserStats(email, stats)
}

export function unlockBadge(email, badgeId) {
  const stats = getUserStats(email)
  const badge = stats.badges?.find((b) => b.id === badgeId)
  if (badge && !badge.unlocked) {
    badge.unlocked = true
    badge.unlockedAt = new Date().toLocaleDateString('id-ID')
    saveUserStats(email, stats)
    return true
  }
  return false
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

// User Tasks management matching Desktop - 2
export function getTaskKey(email) {
  const normalized = email ? email.trim().toLowerCase() : 'guest'
  return `equestTasks_${encodeURIComponent(normalized)}`
}

export function getUserTasks(email) {
  const key = getTaskKey(email)
  let tasks = readStorage(key, null)

  if (tasks === null) {
    const seedTasks = [
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
    writeStorage(key, seedTasks)
    return seedTasks
  }

  return Array.isArray(tasks) ? tasks : []
}

export function saveUserTasks(email, tasks) {
  const key = getTaskKey(email)
  writeStorage(key, tasks)
}

export function updateTask(email, taskId, updates) {
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
  const tasks = getUserTasks(email)
  const filtered = tasks.filter((t) => String(t.id) !== String(taskId))
  saveUserTasks(email, filtered)
  return filtered
}
