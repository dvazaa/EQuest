-- =====================================================================
-- PERANCANGAN BASIS DATA FISIK (PHYSICAL DATABASE DESIGN / PDM)
-- APLIKASI: EQuest (Sistem Pendamping Pengerjaan Tugas Berbasis AI)
-- Dokumen Acuan: Software Requirements Specification (SRS) v1.0
-- Penyusun SRS: 11241026 - Diva Novaliza Fitriyani
-- Database Engine: MySQL / MariaDB (InnoDB, utf8mb4)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `equest_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `equest_db`;

-- Nonaktifkan pengecekan foreign key sementara untuk inisialisasi tabel
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. TABEL PENGGUNA (USERS)
-- Referensi SRS: FR-01 (Registrasi), FR-02 (Login), NFR-01, NFR-02 (Password Hash)
-- =====================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Password disimpan dalam bentuk hash bcrypt (NFR-02)',
  `avatar` VARCHAR(50) DEFAULT '👤',
  `role` ENUM('student', 'general') DEFAULT 'student',
  `provider` ENUM('local', 'google') DEFAULT 'local',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 2. TABEL STATISTIK & GAMIFIKASI PENGGUNA (USER_STATS)
-- Referensi SRS: FR-10 (Kesempatan Perbaikan), FR-12 (XP & Tiket), FR-14 (Progress), FR-15 (Streak)
-- =====================================================================
DROP TABLE IF EXISTS `user_stats`;
CREATE TABLE `user_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `xp` INT DEFAULT 0 COMMENT 'Total akumulasi Experience Point pengguna',
  `tickets` INT DEFAULT 0 COMMENT 'Tiket yang dimiliki untuk membuka Mystery Blind Box',
  `streak` INT DEFAULT 0 COMMENT 'Jumlah hari konsistensi belajar berturut-turut',
  `repair_chances_left` INT DEFAULT 3 COMMENT 'Kesempatan perbaikan kesalahan aktif yang dimiliki (FR-10)',
  `last_active_date` DATE DEFAULT NULL COMMENT 'Mencatat tanggal aktivitas terakhir untuk validasi streak',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_userstats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 3. TABEL TUGAS & SOAL (TASKS)
-- Referensi SRS: FR-03 (Mengunggah Tugas), FR-04 (Menganalisis Soal), NFR-03
-- =====================================================================
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL COMMENT 'Judul tugas atau nama berkas asli',
  `file_url` VARCHAR(255) DEFAULT NULL COMMENT 'Lokasi file foto atau PDF tugas yang diunggah (Cloudinary/Lokal)',
  `file_type` VARCHAR(20) DEFAULT NULL COMMENT 'Format file: jpg, png, pdf',
  `question_text` TEXT DEFAULT NULL COMMENT 'Teks hasil ekstraksi soal oleh sistem',
  `status` ENUM('uploaded', 'analyzed', 'in_progress', 'completed') DEFAULT 'uploaded',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tasks_user` (`user_id`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 4. TABEL BANTUAN & PENJELASAN AI (TASK_AI_ASSISTANCE)
-- Referensi SRS: FR-05 (Penjelasan Soal), FR-06 (Petunjuk Pengerjaan), FR-11 (Bantuan Berdasarkan Kemampuan)
-- =====================================================================
DROP TABLE IF EXISTS `task_ai_assistance`;
CREATE TABLE `task_ai_assistance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL UNIQUE,
  `concept_explanation` TEXT DEFAULT NULL COMMENT 'Penjelasan maksud atau konsep dasar soal (FR-05)',
  `hints` TEXT DEFAULT NULL COMMENT 'Petunjuk atau langkah pengerjaan tanpa jawaban akhir (FR-06)',
  `difficulty_level` ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT 'Tingkat bantuan sesuai kemampuan (FR-11)',
  `reference_solution` TEXT DEFAULT NULL COMMENT 'Solusi rujukan internal untuk pemeriksaan jawaban',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ai_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 5. TABEL PENGIRIMAN JAWABAN SISWA (TASK_SUBMISSIONS)
-- Referensi SRS: FR-07 (Kirim Jawaban), FR-08 (Periksa Jawaban), FR-09 (Koreksi), FR-10 (Perbaikan Jawaban)
-- =====================================================================
DROP TABLE IF EXISTS `task_submissions`;
CREATE TABLE `task_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `attempt_number` INT DEFAULT 1 COMMENT 'Percobaan ke-n dalam kesempatan perbaikan kesalahan (FR-10)',
  `submission_file_url` VARCHAR(255) DEFAULT NULL COMMENT 'Foto berkas lembar jawaban siswa',
  `student_answer_text` TEXT DEFAULT NULL COMMENT 'Teks jawaban yang diketik siswa',
  `is_correct` BOOLEAN DEFAULT FALSE COMMENT 'Status kebenaran jawaban setelah diperiksa AI (FR-08)',
  `score` INT DEFAULT NULL COMMENT 'Skor penilaian (0 - 100)',
  `correction_notes` TEXT DEFAULT NULL COMMENT 'Koreksi dan arahan perbaikan jika terdapat kesalahan (FR-09)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_submissions_task` (`task_id`),
  INDEX `idx_submissions_user` (`user_id`),
  CONSTRAINT `fk_submissions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 6. TABEL RIWAYAT KESALAHAN (MISTAKE_HISTORY)
-- Referensi SRS: FR-16 (Menampilkan Riwayat Kesalahan)
-- =====================================================================
DROP TABLE IF EXISTS `mistake_history`;
CREATE TABLE `mistake_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NOT NULL,
  `submission_id` INT DEFAULT NULL,
  `topic` VARCHAR(150) DEFAULT NULL COMMENT 'Topik atau materi yang mengalami kesalahan',
  `mistake_description` TEXT NOT NULL COMMENT 'Deskripsi bagian kesalahan yang dilakukan pengguna',
  `correction_guidance` TEXT NOT NULL COMMENT 'Arahan konsep yang perlu dipelajari kembali',
  `is_resolved` BOOLEAN DEFAULT FALSE COMMENT 'Apakah kesalahan sudah berhasil diperbaiki',
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mistakes_user` (`user_id`),
  CONSTRAINT `fk_mistakes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mistakes_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mistakes_sub` FOREIGN KEY (`submission_id`) REFERENCES `task_submissions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 7. TABEL RIWAYAT PENGERJAAN TUGAS (TASK_HISTORY)
-- Referensi SRS: FR-17 (Riwayat Pengerjaan), FR-12 (XP & Tiket), FR-18 (Melihat Jawaban Benar)
-- =====================================================================
DROP TABLE IF EXISTS `task_history`;
CREATE TABLE `task_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NOT NULL,
  `mode` ENUM('study_view', 'self_solve') DEFAULT 'self_solve' COMMENT 'study_view = langsung lihat kunci (tanpa reward), self_solve = mandiri (FR-18)',
  `final_score` INT DEFAULT NULL,
  `xp_earned` INT DEFAULT 0 COMMENT 'Jumlah XP yang didapat dari tugas ini (FR-12)',
  `tickets_earned` INT DEFAULT 0 COMMENT 'Jumlah Tiket yang didapat dari tugas ini (FR-12)',
  `attempts_used` INT DEFAULT 1 COMMENT 'Berapa kali perbaikan yang digunakan',
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_user` (`user_id`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 8. TABEL MYSTERY BLIND BOX & REWARD (COLLECTIBLES)
-- Referensi SRS: FR-13 (Mystery Blind Box & Collectible)
-- =====================================================================
DROP TABLE IF EXISTS `collectibles`;
CREATE TABLE `collectibles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nama item reward / lencana',
  `type` ENUM('badge', 'title', 'xp_pack', 'streak_shield', 'ticket_booster') NOT NULL,
  `icon` VARCHAR(50) DEFAULT '🎁',
  `rarity` ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  `description` TEXT DEFAULT NULL,
  `value_amount` INT DEFAULT 0 COMMENT 'Nilai bonus (misal: 100 untuk 100 XP)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 9. TABEL KOLEKSI PENGGUNA (USER_COLLECTIBLES)
-- Referensi SRS: FR-13 (Penyimpanan Collectible Pengguna)
-- =====================================================================
DROP TABLE IF EXISTS `user_collectibles`;
CREATE TABLE `user_collectibles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `collectible_id` INT NOT NULL,
  `obtained_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_collectibles_user` (`user_id`),
  CONSTRAINT `fk_usercol_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usercol_col` FOREIGN KEY (`collectible_id`) REFERENCES `collectibles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 10. TABEL LOG TRANSAKSI BLIND BOX (BLIND_BOX_LOGS)
-- Referensi SRS: FR-13 (Buka Mystery Blind Box Menggunakan Tiket)
-- =====================================================================
DROP TABLE IF EXISTS `blind_box_logs`;
CREATE TABLE `blind_box_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `collectible_id` INT NOT NULL,
  `ticket_cost` INT DEFAULT 1 COMMENT 'Jumlah tiket yang dipakai untuk membuka (default 1)',
  `opened_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_boxlogs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boxlogs_col` FOREIGN KEY (`collectible_id`) REFERENCES `collectibles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 11. TABEL PAKET PREMIUM (PREMIUM_PACKAGES)
-- Referensi SRS: FR-19 (Melihat Paket Premium), NFR-15
-- =====================================================================
DROP TABLE IF EXISTS `premium_packages`;
CREATE TABLE `premium_packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Contoh: Paket Bulanan Pelajar, Paket Semester',
  `price` DECIMAL(10, 2) NOT NULL COMMENT 'Harga berlangganan (Rupiah)',
  `duration_days` INT NOT NULL COMMENT 'Durasi aktif paket dalam hari',
  `description` TEXT DEFAULT NULL,
  `benefits_json` JSON DEFAULT NULL COMMENT 'Daftar manfaat paket dalam format JSON',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 12. TABEL LANGGANAN PENGGUNA (USER_SUBSCRIPTIONS)
-- Referensi SRS: FR-20 (Berlangganan Premium), FR-21 (Status Premium), NFR-16, NFR-17, NFR-18
-- =====================================================================
DROP TABLE IF EXISTS `user_subscriptions`;
CREATE TABLE `user_subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `package_id` INT NOT NULL,
  `status` ENUM('pending', 'active', 'expired', 'cancelled') DEFAULT 'pending',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL COMMENT 'Metode: QRIS, Transfer Bank, E-Wallet',
  `transaction_code` VARCHAR(100) DEFAULT NULL COMMENT 'Kode referensi transaksi dari payment gateway',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_subscriptions_user` (`user_id`),
  CONSTRAINT `fk_subs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subs_package` FOREIGN KEY (`package_id`) REFERENCES `premium_packages` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aktifkan kembali pengecekan foreign key
SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- SEED DATA AWAL (DEFAULT / DEMO DATA UNTUK PENGUJIAN)
-- =====================================================================

-- 1. Pengguna Demo (Password hash bcrypt default untuk "password123")
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `avatar`, `role`, `provider`) VALUES
(1, 'Diva Novaliza Fitriyani', 'diva@equest.ac.id', '$2a$10$wN7Kk5MvVv8q3R8U4u7n2eP8iM9A8x8u7n2eP8iM9A8x8u7n2eP8i', '👩‍🎓', 'student', 'local'),
(2, 'Budi Santoso', 'budi.santoso@gmail.com', '$2a$10$wN7Kk5MvVv8q3R8U4u7n2eP8iM9A8x8u7n2eP8iM9A8x8u7n2eP8i', '👨‍🎓', 'student', 'local')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Statistik Pengguna Awal
INSERT INTO `user_stats` (`user_id`, `xp`, `tickets`, `streak`, `repair_chances_left`, `last_active_date`) VALUES
(1, 250, 4, 5, 3, CURDATE()),
(2, 100, 2, 2, 3, CURDATE())
ON DUPLICATE KEY UPDATE `xp`=VALUES(`xp`);

-- 3. Daftar Reward Mystery Blind Box
INSERT INTO `collectibles` (`id`, `name`, `type`, `icon`, `rarity`, `description`, `value_amount`) VALUES
(1, 'Bonus XP Kilat (+50 XP)', 'xp_pack', '✨', 'common', 'Menambah 50 XP ke profil belajarmu secara instan.', 50),
(2, 'Bonus XP Jumbo (+150 XP)', 'xp_pack', '⚡', 'epic', 'Ledakan 150 XP untuk mempercepat kenaikan level.', 150),
(3, 'Tiket Keberuntungan (+2 Tiket)', 'ticket_booster', '🎟️', 'rare', 'Mendapatkan 2 tiket gratis untuk membuka Blind Box lagi.', 2),
(4, 'Shield Streak Beku', 'streak_shield', '🛡️', 'rare', 'Melindungi streak harianmu agar tidak putus saat terlewat 1 hari.', 1),
(5, 'Gelar: Pendekar Soal AI', 'title', '⚔️', 'epic', 'Gelar eksklusif bagi siswa yang giat memecahkan soal mandiri.', 0),
(6, 'Badge Emas: Pemburu Harta', 'badge', '👑', 'legendary', 'Lencana legenda terlangka dari Mystery Blind Box EQuest.', 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Daftar Paket Berlangganan Premium
INSERT INTO `premium_packages` (`id`, `name`, `price`, `duration_days`, `description`, `benefits_json`) VALUES
(1, 'Paket Pelajar Bulanan', 29000.00, 30, 'Akses penuh bantuan AI tanpa batas dan ekstra tiket blind box.', '["Unlimited analisis soal AI", "Kesempatan perbaikan kesalahan tak terbatas", "Bonus 5 Tiket Blind Box setiap bulan", "Bantuan adaptif AI tingkat lanjut"]'),
(2, 'Paket Semester Juara', 129000.00, 180, 'Hemat 30% untuk pendampingan belajar satu semester penuh.', '["Semua fitur Paket Bulanan", "Prioritas kecepatan respons AI", "Bonus 30 Tiket Blind Box", "Laporan analitik belajar komprehensif"]')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
