// Utility state management for EQuest

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
        name: 'Budi Santoso',
        email: 'budi.santoso@gmail.com',
        password: 'password123',
        avatar: '👨‍🎓',
        provider: 'email',
        createdAt: '01/10/2026',
      },
      {
        id: 2,
        name: 'Siti Rahmawati',
        email: 'siti.rahma@gmail.com',
        password: 'password123',
        avatar: '👩‍🎓',
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

// User Stats & Gamification
export function getStatsKey(email) {
  const normalized = email ? email.trim().toLowerCase() : 'guest'
  return `equestStats_${encodeURIComponent(normalized)}`
}

export const DEFAULT_BADGES = [
  {
    id: 'first_step',
    name: 'Langkah Pertama',
    icon: '🚀',
    desc: 'Mendaftar dan bergabung di EQuest',
    unlocked: true,
    unlockedAt: 'Hari ini',
  },
  {
    id: 'first_task',
    name: 'Pembelajar Aktif',
    icon: '📝',
    desc: 'Menyelesaikan soal pertama',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'lucky_box',
    name: 'Pemburu Harta',
    icon: '🎁',
    desc: 'Membuka Blind Box pertama kali',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    icon: '🔥',
    desc: 'Belajar 3 hari berturut-turut',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'ai_detective',
    name: 'Detektif AI',
    icon: '🤖',
    desc: 'Menganalisis soal dengan bantuan AI',
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'score_perfection',
    name: 'Bintang Kelas',
    icon: '⭐',
    desc: 'Mendapatkan nilai sempurna (100) pada tugas',
    unlocked: false,
    unlockedAt: null,
  },
]

export function getUserStats(email) {
  const key = getStatsKey(email)
  const fallback = {
    xp: 150,
    tickets: 3,
    streak: 3,
    streakHistory: [true, true, true, false, false, false, false],
    lastActiveDate: new Date().toISOString().split('T')[0],
    openedBoxes: 0,
    rewards: [
      {
        id: 1,
        name: 'Badge Siswa Perintis',
        icon: '🎖️',
        rarity: 'Rare',
        date: 'Hari ini',
      },
    ],
    badges: DEFAULT_BADGES,
  }

  const saved = readStorage(key, null)
  if (!saved) {
    writeStorage(key, fallback)
    return fallback
  }

  // Ensure all fields exist
  if (!saved.badges || !saved.badges.length) {
    saved.badges = DEFAULT_BADGES
  }
  if (saved.tickets === undefined) saved.tickets = 3
  if (saved.xp === undefined) saved.xp = 150
  if (saved.streak === undefined) saved.streak = 3

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

// User Tasks management
export function getTaskKey(email) {
  const normalized = email ? email.trim().toLowerCase() : 'guest'
  return `equestTasks_${encodeURIComponent(normalized)}`
}

export function getUserTasks(email) {
  const key = getTaskKey(email)
  let tasks = readStorage(key, null)

  // Migration from old legacy equestTasks if necessary
  if (tasks === null && localStorage.getItem('equestTasks') !== null) {
    tasks = readStorage('equestTasks', [])
    writeStorage(key, tasks)
    localStorage.removeItem('equestTasks')
  }

  if (tasks === null) {
    const seedTasks = [
      {
        id: 1730000001,
        name: 'Latihan Matematika - Aljabar & Persamaan Linear',
        fileName: 'Latihan_Aljabar_Dasar.pdf',
        questionCount: 2,
        uploadDate: new Date().toLocaleDateString('id-ID'),
        status: 'Sedang Dikerjakan',
        questionText:
          '1. Tentukan nilai x dari persamaan 2x + 6 = 14.\n2. Sederhanakan bentuk 3(x - 2) + 4x.',
        answer:
          '1. Tentukan nilai x dari persamaan 2x + 6 = 14\nJawaban: x = 4\nPenjelasan: Kurangkan kedua ruas dengan 6: 2x = 8, lalu bagi dengan 2 sehingga didapatkan x = 4.\n\n2. Sederhanakan bentuk 3(x - 2) + 4x\nJawaban: 7x - 6\nPenjelasan: Jabarkan kurung menjadi 3x - 6 + 4x, gabungkan suku sejenis 3x + 4x = 7x, sehingga menjadi 7x - 6.',
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
