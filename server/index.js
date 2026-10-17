import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
const PORT = 3000

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
})

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend EQuest berjalan!',
    })
})

app.get('/api/test-gemini', async (req, res) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: 'Jawab singkat: apakah kamu berfungsi?',
        })

        res.json({
            success: true,
            answer: response.text,
        })
    } catch (error) {
        console.error('Tes Gemini gagal:', error.message)

        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
})

app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        const questionText = req.body.questionText?.trim()
        const file = req.file

        if (!file && !questionText) {
            return res.status(400).json({
                message: 'Masukkan teks soal atau unggah file soal.',
            })
        }

        if (file) {
            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'application/pdf',
            ]

            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    message: 'Format file harus JPG, PNG, atau PDF.',
                })
            }
        }

        const contents = [
            {
                text: `Kamu adalah asisten belajar EQuest. Baca soal dari teks, gambar, atau PDF yang diberikan.

ATURAN:
1. Identifikasi setiap soal yang benar-benar terlihat atau tertulis.
2. Jangan mengarang soal atau informasi yang tidak tersedia.
3. Untuk setiap soal, berikan jawaban singkat yang langsung menjawab pertanyaan.
4. Berikan penjelasan ringkas yang membantu pengguna memahami jawaban.
5. Jika soal tidak terbaca atau instruksinya tidak jelas, nyatakan dengan jujur.
6. Jika terdapat beberapa soal, pisahkan setiap soal dengan format yang sama.
7. Jangan membuat pendahuluan panjang atau analisis umum yang tidak diperlukan.
8. Jangan menggunakan tabel Markdown.
9. Gunakan bahasa Indonesia yang jelas dan mudah dipahami.
10. Jangan memasukkan seluruh analisis ke dalam bagian Jawaban. Pisahkan Jawaban dan Penjelasan.

FORMAT WAJIB UNTUK SETIAP SOAL:

1. [Tuliskan pertanyaan soal]
Jawaban: [Jawaban singkat dan tepat]
Penjelasan: [Penjelasan singkat tentang alasan jawaban tersebut]

2. [Tuliskan pertanyaan soal]
Jawaban: [Jawaban singkat dan tepat]
Penjelasan: [Penjelasan singkat tentang alasan jawaban tersebut]

Ulangi format tersebut untuk semua soal yang tersedia. Nomor harus berurutan.

Jika hanya terdapat satu soal, cukup gunakan nomor 1.

${questionText ? `Teks soal tambahan:\n${questionText}` : ''}`,
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

        const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
        })

        if (!response.text) {
            return res.status(500).json({
                success: false,
                message: 'AI tidak menghasilkan jawaban. Silakan coba lagi.',
            })
        }

        res.json({
            success: true,
            answer: response.text,
        })
    } catch (error) {
        console.error('Kesalahan analisis Gemini:', error.message)

        res.status(500).json({
            success: false,
            message:
                'Soal gagal dianalisis. Periksa konfigurasi API key dan coba lagi.',
        })
    }
})

app.listen(PORT, () => {
    console.log(`Backend EQuest berjalan di http://localhost:${PORT}`)
})