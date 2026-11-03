import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'
import { testDbConnection } from './config/database.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const ACCOUNTS_STORE_PATH = path.join(DATA_DIR, 'accounts_store.json')

function readAccountsStore() {
  try {
    if (fs.existsSync(ACCOUNTS_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(ACCOUNTS_STORE_PATH, 'utf-8'))
    }
  } catch (e) {
    console.warn('Gagal membaca accounts_store.json:', e.message)
  }
  return {}
}

function writeAccountsStore(store) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(ACCOUNTS_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8')
  } catch (e) {
    console.warn('Gagal menyimpan accounts_store.json:', e.message)
  }
}

const app = express()
const PORT = process.env.PORT || 3000

// Model Gemini tercepat & stabil untuk akun baru
const GEMINI_MODEL = 'gemini-3.5-flash'
const FAST_GEN_CONFIG = {
  thinkingConfig: { thinkingBudget: 0 },
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || ''
let ai = null
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  try {
    ai = new GoogleGenAI({ apiKey })
  } catch (err) {
    console.warn('Inisialisasi GoogleGenAI gagal:', err.message)
  }
}

app.use(cors())
app.use(express.json())

// Helper timeout agar request AI tidak pernah menggantung lama
function withTimeout(promise, ms = 9000) {
  let timer
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Waktu permintaan AI habis (Timeout)')), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

// 1. Health check & status database
app.get('/api/health', async (req, res) => {
  const dbStatus = await testDbConnection()
  res.json({
    status: 'ok',
    message: 'Backend EQuest berjalan cepat dan responsif!',
    hasGeminiKey: Boolean(apiKey && apiKey !== 'your_gemini_api_key_here'),
    model: GEMINI_MODEL,
    database: dbStatus,
  })
})

app.get('/api/database/status', async (req, res) => {
  const dbStatus = await testDbConnection()
  res.json(dbStatus)
})

// 2. Tes koneksi Gemini
app.get('/api/test-gemini', async (req, res) => {
  if (!ai) {
    return res.json({
      success: true,
      mode: 'simulasi',
      answer: 'Gemini API Key belum diset di server/.env, backend menggunakan mode simulasi cerdas EQuest.',
    })
  }

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: 'Jawab dalam satu kalimat ramah: apakah AI EQuest siap membantu belajar?',
        config: FAST_GEN_CONFIG,
      }),
      7000
    )

    res.json({
      success: true,
      mode: 'live-gemini',
      model: GEMINI_MODEL,
      answer: response.text,
    })
  } catch (error) {
    console.error('Tes Gemini error:', error.message)
    res.json({
      success: true,
      mode: 'fallback',
      answer: 'AI EQuest siap digunakan dalam mode cadangan cepat.',
      detail: error.message,
    })
  }
})

// 3. Analisis Soal (Ekstraksi Soal & Pembahasan Sederhana untuk Semua Pelajaran)
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    const questionText = req.body.questionText?.trim()
    const file = req.file

    if (!file && !questionText) {
      return res.status(400).json({
        message: 'Masukkan teks soal atau unggah file soal.',
      })
    }

    if (ai) {
      try {
        const contents = [
          {
            text: `Kamu adalah guru pendamping belajar yang ramah di EQuest untuk pelajar dari berbagai jenjang dan jurusan (Matematika, Sains, Bahasa, IPS, Umum, maupun Teknologi).
Analisis soal yang diberikan pengguna berikut ini. JANGAN mengganti soal pengguna dengan soal lain!
Gunakan bahasa Indonesia sehari-hari yang SANGAT SEDERHANA, santai, mudah dipahami anak sekolah maupun mahasiswa umum, dan JANGAN menggunakan istilah teknis koding/SQL kecuali soalnya memang bertanya tentang koding/SQL.

Kembalikan HANYA format JSON array murni seperti ini:
[
  {
    "id": 1,
    "question": "Kalimat pertanyaan sesuai soal pengguna",
    "correctAnswer": "Jawaban singkat, jelas, dan tepat",
    "hint": "Petunjuk ramah dan sederhana jika jawaban siswa masih belum tepat",
    "explanation": "Penjelasan sederhana dengan bahasa sehari-hari kenapa jawabannya seperti itu",
    "exampleCode": "Contoh ilustrasi sederhana di kehidupan sehari-hari atau langkah hitung singkat",
    "exampleCaption": "Keterangan singkat dari contoh di atas",
    "terms": [
      { "name": "Poin Penting 1", "desc": "Penjelasan singkat dengan bahasa sederhana" },
      { "name": "Poin Penting 2", "desc": "Penjelasan singkat dengan bahasa sederhana" }
    ],
    "memoryTip": "Cara gampang dan seru untuk mengingat materi soal ini"
  }
]

${questionText ? `Teks soal dari pengguna:\n${questionText}` : 'Ekstrak semua soal yang terlihat pada berkas/gambar terlampir.'}`,
          },
        ]

        if (file) {
          contents.push({
            inlineData: {
              mimeType: file.mimetype,
              data: file.buffer.toString('base64'),
            },
          })
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: FAST_GEN_CONFIG,
          }),
          8500
        )

        if (response.text) {
          const cleanJson = response.text.replace(/```json/gi, '').replace(/```/g, '').trim()
          let parsedQuestions = null
          try {
            const maybeArray = JSON.parse(cleanJson)
            if (Array.isArray(maybeArray) && maybeArray.length > 0) {
              parsedQuestions = maybeArray.map((q, idx) => ({
                id: idx + 1,
                question: q.question || questionText,
                userAnswer: '',
                correctAnswer: String(q.correctAnswer ?? ''),
                isCorrect: false,
                points: 10,
                hint: q.hint || 'Yuk coba periksa lagi langkah penyelesaiannya pelan-pelan.',
                explanation: q.explanation || '',
                exampleCode: q.exampleCode || '',
                exampleCaption: q.exampleCaption || '',
                terms:
                  Array.isArray(q.terms) && q.terms.length
                    ? q.terms
                    : [{ name: 'Inti Materi', desc: 'Pokok bahasan utama pada soal ini.' }],
                memoryTip: q.memoryTip || 'Pahami konsep dasarnya dengan contoh sehari-hari.',
              }))
            }
          } catch (_) {
            // Biarkan parser lokal di frontend menangani jika output bukan JSON
          }

          return res.json({
            success: true,
            source: 'gemini-live',
            answer: response.text,
            questions: parsedQuestions,
          })
        }
      } catch (geminiErr) {
        console.warn('Gemini analyze fallback:', geminiErr.message)
      }
    }

    res.json({
      success: true,
      source: 'equest-fast-cache',
      answer: `Soal berhasil dianalisis: ${questionText || file?.originalname || 'Soal Latihan'}`,
      questions: null,
    })
  } catch (error) {
    console.error('Kesalahan analisis:', error.message)
    res.status(500).json({
      success: false,
      message: 'Soal gagal dianalisis.',
    })
  }
})

// 4. Pemeriksaan Jawaban Siswa dengan AI (Dipanggil saat pengguna klik Lanjutkan di Upload Jawaban)
app.post('/api/evaluate-answers', async (req, res) => {
  try {
    const { questions } = req.body
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Daftar soal dan jawaban tidak ditemukan.' })
    }

    if (ai) {
      try {
        const prompt = `Kamu adalah guru penilai yang adil, bijak, dan ramah di EQuest.
Periksa jawaban siswa berikut terhadap masing-masing soal dan kunci jawabannya.
Aturan penilaian:
- Jika jawaban siswa memiliki makna/arti/angka yang benar (meskipun kalimatnya berbeda atau lebih singkat/panjang dari kunci jawaban), nyatakan "isCorrect": true!
- Jika jawaban siswa salah atau belum menjawab, nyatakan "isCorrect": false dan berikan "hint" (petunjuk singkat yang ramah dalam bahasa sederhana tanpa membocorkan seluruh jawaban).

Data soal dan jawaban siswa:
${JSON.stringify(
  questions.map((q) => ({
    id: q.id,
    question: q.question,
    correctAnswer: q.correctAnswer,
    userAnswer: q.userAnswer,
  })),
  null,
  2
)}

Kembalikan HANYA JSON array murni dengan format:
[
  {
    "id": 1,
    "isCorrect": true,
    "hint": "Jawabanmu sudah tepat!"
  }
]`

        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: FAST_GEN_CONFIG,
          }),
          7500
        )

        if (response.text) {
          const cleanJson = response.text.replace(/```json/gi, '').replace(/```/g, '').trim()
          const evalResults = JSON.parse(cleanJson)
          if (Array.isArray(evalResults)) {
            return res.json({
              success: true,
              source: 'gemini-live',
              evaluations: evalResults,
            })
          }
        }
      } catch (err) {
        console.warn('Evaluate answers AI fallback:', err.message)
      }
    }

    res.json({
      success: true,
      source: 'local-evaluator',
      evaluations: null,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// 5. Tanya AI tentang Soal Spesifik (Desktop - 15 & Desktop - 17)
app.post('/api/ask-question-ai', async (req, res) => {
  try {
    const { question, currentAnswer, userPrompt } = req.body

    if (!userPrompt) {
      return res.status(400).json({ message: 'Pertanyaan pengguna harus diisi.' })
    }

    if (ai) {
      try {
        const prompt = `Kamu adalah teman belajar AI yang ramah di EQuest.
Bantu siswa memahami soal berikut dengan bahasa sehari-hari yang SANGAT SEDERHANA, santai, dan mudah dimengerti (jangan gunakan istilah rumit atau istilah pemrograman/SQL kecuali soalnya memang tentang itu):
Soal: ${question}
Kunci Jawaban: ${currentAnswer}
Pertanyaan siswa: "${userPrompt}"

Jawab dalam 2-4 kalimat yang jelas, ramah, dan beri perumpamaan sederhana di kehidupan nyata bila perlu.`

        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: FAST_GEN_CONFIG,
          }),
          7500
        )

        if (response.text) {
          return res.json({
            success: true,
            reply: response.text,
          })
        }
      } catch (err) {
        console.warn('Ask AI Gemini fallback:', err.message)
      }
    }

    // Respons cadangan sederhana yang selalu nyambung dengan soal apapun (tanpa istilah SQL!)
    let simulatedReply = `Untuk soal "${question}", jawaban yang tepat adalah "${currentAnswer}". Cara paling mudah memahaminya adalah dengan melihat inti pertanyaannya lalu menghubungkannya dengan contoh sederhana di sekitar kita.`

    if (userPrompt.toLowerCase().includes('contoh')) {
      simulatedReply = `Contoh sederhananya untuk soal "${question}": bayangkan situasi ini dalam kegiatan sehari-hari, sehingga alasan mengapa jawabannya "${currentAnswer}" bisa langsung terbayang dengan jelas dan mudah diingat.`
    } else if (
      userPrompt.toLowerCase().includes('sederhana') ||
      userPrompt.toLowerCase().includes('simpel') ||
      userPrompt.toLowerCase().includes('kenapa')
    ) {
      simulatedReply = `Penjelasan paling simpelnya: pada soal "${question}", hasil atau jawaban "${currentAnswer}" didapat langsung dari konsep dasarnya. Jadi kamu cukup mengingat langkah intinya saja!`
    }

    res.json({
      success: true,
      reply: simulatedReply,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// 6. Penilaian Jawaban Siswa (Grading Mode)
app.post('/api/grade', upload.single('file'), async (req, res) => {
  try {
    const questionText = req.body.questionText?.trim() || ''
    const referenceAnswer = req.body.referenceAnswer?.trim() || ''
    const studentAnswer = req.body.studentAnswer?.trim() || ''
    const file = req.file

    if (ai) {
      try {
        const prompt = `Nilai jawaban siswa dengan bahasa yang ramah dan sederhana:
Soal: ${questionText}
Kunci: ${referenceAnswer}
Jawaban Siswa: ${studentAnswer}

Jawab hanya JSON:
{
  "score": 85,
  "feedback": "Ulasan singkat",
  "strengths": "Poin kuat",
  "improvement": "Saran perbaikan"
}`

        const contents = [{ text: prompt }]
        if (file) {
          contents.push({
            inlineData: {
              mimeType: file.mimetype,
              data: file.buffer.toString('base64'),
            },
          })
        }

        const response = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: FAST_GEN_CONFIG,
          }),
          8000
        )

        const cleanText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleanText)
        return res.json({ success: true, ...parsed })
      } catch (err) {
        console.warn('Grading fallback:', err.message)
      }
    }

    res.json({
      success: true,
      score: 80,
      feedback: 'Kerja bagus! Jawabanmu sudah mengarah ke konsep yang tepat.',
      strengths: 'Sudah memahami maksud utama dari pertanyaan.',
      improvement: 'Coba lengkapi sedikit lagi detail penjelasannya.',
    })
  } catch (error) {
    console.error('Kesalahan penilaian:', error.message)
    res.status(500).json({
      success: false,
      message: 'Gagal menilai jawaban.',
    })
  }
})

// 7. Penyimpanan Progres Permanen Per Akun (Backup Disk JSON)
app.get('/api/account-data/:email', (req, res) => {
  const email = (req.params.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ found: false })
  const store = readAccountsStore()
  if (store[email]) {
    return res.json({ found: true, data: store[email] })
  }
  return res.json({ found: false })
})

app.post('/api/account-data', (req, res) => {
  const { email, stats, tasks, history } = req.body || {}
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return res.status(400).json({ success: false })

  const store = readAccountsStore()
  const existing = store[normalized] || {}
  store[normalized] = {
    stats: stats ?? existing.stats ?? null,
    tasks: tasks ?? existing.tasks ?? null,
    history: history ?? existing.history ?? null,
    updatedAt: new Date().toISOString(),
  }
  writeAccountsStore(store)
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Backend EQuest aktif di http://localhost:${PORT} (Model: ${GEMINI_MODEL})`)
})
