# DOKUMEN PERANCANGAN BASIS DATA FISIK (PHYSICAL DATA MODEL - PDM)
**Sistem Pendamping Pengerjaan Tugas Berbasis AI (EQuest)**  
*Berdasarkan Dokumen Software Requirements Specification (SRS) v1.0*  
*Penyusun: 11241026 - Diva Novaliza Fitriyani*

---

## 1. Ringkasan Arsitektur Basis Data
* **DBMS**: MySQL / MariaDB (Versi 8.0+ / 10.4+)
* **Storage Engine**: InnoDB (Mendukung transaksi ACID dan Integritas Relasional / Foreign Keys)
* **Karakter Set**: `utf8mb4` (Mendukung emoji avatar dan karakter teks internasional)
* **Collation**: `utf8mb4_unicode_ci`
* **Nama Database**: `equest_db`

---

## 2. Struktur Tabel Fisik & Kamus Data

### 2.1 Tabel `users`
Menyimpan kredensial dan identitas akun pengguna (Pelajar / Pengguna Umum).
*Referensi SRS: FR-01 (Registrasi), FR-02 (Login), NFR-01, NFR-02 (Keamanan Password Hash).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | Pengidentifikasi unik pengguna |
| `name` | `VARCHAR(100)` | NOT NULL | - | Nama lengkap pengguna |
| `email` | `VARCHAR(150)` | NOT NULL, UNIQUE, INDEX | - | Email aktif akun |
| `password_hash` | `VARCHAR(255)` | NOT NULL | - | Hash password menggunakan bcrypt (NFR-02) |
| `avatar` | `VARCHAR(50)` | NULL | `'👤'` | Ikon avatar pengguna |
| `role` | `ENUM('student','general')` | NOT NULL | `'student'` | Kategori pengguna |
| `provider` | `ENUM('local','google')` | NOT NULL | `'local'` | Metode autentikasi |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu registrasi |
| `updated_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE` | Waktu pembaharuan profil |

---

### 2.2 Tabel `user_stats`
Menyimpan parameter gamifikasi dan status kemajuan pengguna.
*Referensi SRS: FR-10 (Kesempatan Perbaikan), FR-12 (XP & Tiket), FR-14 (Progress), FR-15 (Streak).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID baris statistik |
| `user_id` | `INT` | NOT NULL, UNIQUE, FK (`users.id`) | - | Relasi ke tabel pengguna (CASCADE) |
| `xp` | `INT` | NOT NULL | `0` | Total Experience Points |
| `tickets` | `INT` | NOT NULL | `0` | Jumlah tiket Mystery Blind Box |
| `streak` | `INT` | NOT NULL | `0` | Jumlah hari belajar berturut-turut |
| `repair_chances_left` | `INT` | NOT NULL | `3` | Sisa kesempatan perbaikan tugas (FR-10) |
| `last_active_date` | `DATE` | NULL | NULL | Tanggal interaksi terakhir untuk validasi streak |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu inisialisasi statistik |
| `updated_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE` | Waktu perubahan statistik |

---

### 2.3 Tabel `tasks`
Menyimpan tugas/soal yang diunggah pengguna.
*Referensi SRS: FR-03 (Mengunggah Tugas), FR-04 (Menganalisis Soal), NFR-03 (Keamanan Data Tugas).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID tugas |
| `user_id` | `INT` | NOT NULL, FK (`users.id`), INDEX | - | Pengguna pemilik tugas |
| `title` | `VARCHAR(255)` | NOT NULL | - | Judul tugas / nama berkas asli |
| `file_url` | `VARCHAR(255)` | NULL | NULL | URL path berkas tugas di storage/Cloudinary |
| `file_type` | `VARCHAR(20)` | NULL | NULL | Ekstensi berkas (`jpg`, `png`, `pdf`) |
| `question_text` | `TEXT` | NULL | NULL | Teks soal hasil ekstraksi OCR / input pengguna |
| `status` | `ENUM('uploaded','analyzed','in_progress','completed')` | NOT NULL | `'uploaded'` | Status pengerjaan tugas |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu unggah tugas |
| `updated_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE` | Waktu pembaruan status |

---

### 2.4 Tabel `task_ai_assistance`
Menyimpan konten pendampingan cerdas yang dihasilkan oleh Google Gemini AI.
*Referensi SRS: FR-05 (Penjelasan Soal), FR-06 (Petunjuk Pengerjaan), FR-11 (Bantuan Berdasarkan Kemampuan).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID bantuan AI |
| `task_id` | `INT` | NOT NULL, UNIQUE, FK (`tasks.id`) | - | Relasi 1-to-1 dengan tugas (CASCADE) |
| `concept_explanation` | `TEXT` | NULL | NULL | Penjelasan konsep & maksud soal (FR-05) |
| `hints` | `TEXT` | NULL | NULL | Petunjuk / clue langkah pengerjaan (FR-06) |
| `difficulty_level` | `ENUM('easy','medium','hard')` | NOT NULL | `'medium'` | Tingkat kesulitan adaptif (FR-11) |
| `reference_solution` | `TEXT` | NULL | NULL | Rujukan solusi internal untuk validasi jawaban |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu AI selesai memproses |

---

### 2.5 Tabel `task_submissions`
Menyimpan percobaan pengiriman jawaban mandiri oleh siswa.
*Referensi SRS: FR-07 (Mengirim Jawaban), FR-08 (Memeriksa Jawaban), FR-09 (Koreksi), FR-10 (Perbaikan).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID pengiriman |
| `task_id` | `INT` | NOT NULL, FK (`tasks.id`), INDEX | - | Relasi ke tugas yang dikerjakan |
| `user_id` | `INT` | NOT NULL, FK (`users.id`), INDEX | - | Siswa yang mengerjakan |
| `attempt_number` | `INT` | NOT NULL | `1` | Percobaan ke-n (FR-10) |
| `submission_file_url` | `VARCHAR(255)` | NULL | NULL | Berkas foto lembar jawaban siswa |
| `student_answer_text` | `TEXT` | NULL | NULL | Teks jawaban yang diketik |
| `is_correct` | `BOOLEAN` | NOT NULL | `FALSE` | Status kebenaran dari AI (FR-08) |
| `score` | `INT` | NULL | NULL | Nilai kuantitatif hasil evaluasi (0-100) |
| `correction_notes` | `TEXT` | NULL | NULL | Ulasan kesalahan & petunjuk koreksi (FR-09) |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu pengiriman jawaban |

---

### 2.6 Tabel `mistake_history`
Menyimpan riwayat kesalahan yang pernah dilakukan pengguna untuk bahan evaluasi belajar ulang.
*Referensi SRS: FR-16 (Menampilkan Riwayat Kesalahan).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID riwayat kesalahan |
| `user_id` | `INT` | NOT NULL, FK (`users.id`), INDEX | - | Pengguna pemilik catatan |
| `task_id` | `INT` | NOT NULL, FK (`tasks.id`) | - | Terkait tugas mana |
| `submission_id` | `INT` | NULL, FK (`task_submissions.id`) | NULL | Terkait submission yang mana |
| `topic` | `VARCHAR(150)` | NULL | NULL | Topik / materi kesalahan |
| `mistake_description` | `TEXT` | NOT NULL | - | Bagian yang salah pada pengerjaan siswa |
| `correction_guidance` | `TEXT` | NOT NULL | - | Arahan konsep yang harus dipelajari ulang |
| `is_resolved` | `BOOLEAN` | NOT NULL | `FALSE` | Apakah sudah dipelajari/diperbaiki |
| `resolved_at` | `TIMESTAMP` | NULL | NULL | Waktu perbaikan berhasil |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu pencatatan kesalahan |

---

### 2.7 Tabel `task_history`
Arsip kronologis seluruh aktivitas penyelesaian soal.
*Referensi SRS: FR-17 (Menyimpan Riwayat Pengerjaan), FR-12 (XP & Tiket), FR-18 (Melihat Jawaban Benar).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID riwayat |
| `user_id` | `INT` | NOT NULL, FK (`users.id`), INDEX | - | Pengguna |
| `task_id` | `INT` | NOT NULL, FK (`tasks.id`) | - | Tugas terkait |
| `mode` | `ENUM('study_view','self_solve')` | NOT NULL | `'self_solve'` | Mode yang dipilih siswa (FR-18) |
| `final_score` | `INT` | NULL | NULL | Skor akhir |
| `xp_earned` | `INT` | NOT NULL | `0` | XP yang diperoleh (0 jika `study_view`) |
| `tickets_earned` | `INT` | NOT NULL | `0` | Tiket yang diperoleh (0 jika `study_view`) |
| `attempts_used` | `INT` | NOT NULL | `1` | Jumlah kesempatan yang dipakai |
| `completed_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu selesai |

---

### 2.8 Tabel `collectibles`
Master data hadiah, item, dan lencana yang dapat diperoleh dari Mystery Blind Box.
*Referensi SRS: FR-13 (Mystery Blind Box & Collectible).*

| Nama Kolom | Tipe Data Fisik | Constraint | Nilai Bawaan | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | PK, AUTO_INCREMENT | - | ID item |
| `name` | `VARCHAR(100)` | NOT NULL | - | Nama collectible / badge |
| `type` | `ENUM('badge','title','xp_pack','streak_shield','ticket_booster')` | NOT NULL | - | Jenis item |
| `icon` | `VARCHAR(50)` | NOT NULL | `'🎁'` | Ikon emoji / grafik |
| `rarity` | `ENUM('common','rare','epic','legendary')` | NOT NULL | `'common'` | Tingkat kelangkaan item |
| `description` | `TEXT` | NULL | NULL | Deskripsi manfaat item |
| `value_amount` | `INT` | NOT NULL | `0` | Nilai numerik (misal: nominal bonus XP) |
| `created_at` | `TIMESTAMP` | NOT NULL | `CURRENT_TIMESTAMP` | Waktu pembuatan item |

---

### 2.9 Tabel `user_collectibles` & `blind_box_logs`
* `user_collectibles`: Inventori hadiah yang dimiliki siswa (`user_id`, `collectible_id`, `obtained_at`).
* `blind_box_logs`: Log audit pembukaan blind box dengan pemotongan tiket (`user_id`, `collectible_id`, `ticket_cost`, `opened_at`).

---

### 2.10 Tabel `premium_packages` & `user_subscriptions`
Menyimpan katalog paket berlangganan dan status transaksi Premium pengguna.
*Referensi SRS: FR-19 (Paket Premium), FR-20 (Berlangganan), FR-21 (Status Premium).*

---

## 3. Relasi Antar Tabel (Entity Relationship Overview)
* `users` **1 ─── 1** `user_stats`
* `users` **1 ─── N** `tasks`
* `tasks` **1 ─── 1** `task_ai_assistance`
* `tasks` **1 ─── N** `task_submissions`
* `users` **1 ─── N** `task_submissions`
* `users` **1 ─── N** `mistake_history`
* `users` **1 ─── N** `task_history`
* `users` **1 ─── N** `user_collectibles` **N ─── 1** `collectibles`
* `users` **1 ─── N** `blind_box_logs`
* `users` **1 ─── N** `user_subscriptions` **N ─── 1** `premium_packages`
