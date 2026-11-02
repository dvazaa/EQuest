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

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABEL USERS
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

-- 2. TABEL USER_STATS
DROP TABLE IF EXISTS `user_stats`;
CREATE TABLE `user_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `xp` INT DEFAULT 0,
  `tickets` INT DEFAULT 0,
  `streak` INT DEFAULT 0,
  `repair_chances_left` INT DEFAULT 3 COMMENT 'Kesempatan perbaikan kesalahan aktif (FR-10)',
  `last_active_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_userstats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABEL TASKS
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(255) DEFAULT NULL,
  `file_type` VARCHAR(20) DEFAULT NULL,
  `question_text` TEXT DEFAULT NULL,
  `status` ENUM('uploaded', 'analyzed', 'in_progress', 'completed') DEFAULT 'uploaded',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tasks_user` (`user_id`),
  CONSTRAINT `fk_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABEL TASK_AI_ASSISTANCE
DROP TABLE IF EXISTS `task_ai_assistance`;
CREATE TABLE `task_ai_assistance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL UNIQUE,
  `concept_explanation` TEXT DEFAULT NULL COMMENT 'Penjelasan maksud atau konsep dasar soal (FR-05)',
  `hints` TEXT DEFAULT NULL COMMENT 'Petunjuk langkah pengerjaan tanpa jawaban akhir (FR-06)',
  `difficulty_level` ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  `reference_solution` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ai_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABEL TASK_SUBMISSIONS
DROP TABLE IF EXISTS `task_submissions`;
CREATE TABLE `task_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `attempt_number` INT DEFAULT 1 COMMENT 'Percobaan ke-n dalam kesempatan perbaikan kesalahan (FR-10)',
  `submission_file_url` VARCHAR(255) DEFAULT NULL,
  `student_answer_text` TEXT DEFAULT NULL,
  `is_correct` BOOLEAN DEFAULT FALSE,
  `score` INT DEFAULT NULL,
  `correction_notes` TEXT DEFAULT NULL COMMENT 'Koreksi dan arahan perbaikan jika salah (FR-09)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_submissions_task` (`task_id`),
  INDEX `idx_submissions_user` (`user_id`),
  CONSTRAINT `fk_submissions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABEL MISTAKE_HISTORY
DROP TABLE IF EXISTS `mistake_history`;
CREATE TABLE `mistake_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NOT NULL,
  `submission_id` INT DEFAULT NULL,
  `topic` VARCHAR(150) DEFAULT NULL,
  `mistake_description` TEXT NOT NULL,
  `correction_guidance` TEXT NOT NULL,
  `is_resolved` BOOLEAN DEFAULT FALSE,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mistakes_user` (`user_id`),
  CONSTRAINT `fk_mistakes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mistakes_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mistakes_sub` FOREIGN KEY (`submission_id`) REFERENCES `task_submissions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABEL TASK_HISTORY
DROP TABLE IF EXISTS `task_history`;
CREATE TABLE `task_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `task_id` INT NOT NULL,
  `mode` ENUM('study_view', 'self_solve') DEFAULT 'self_solve',
  `final_score` INT DEFAULT NULL,
  `xp_earned` INT DEFAULT 0,
  `tickets_earned` INT DEFAULT 0,
  `attempts_used` INT DEFAULT 1,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_user` (`user_id`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABEL COLLECTIBLES
DROP TABLE IF EXISTS `collectibles`;
CREATE TABLE `collectibles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('badge', 'title', 'xp_pack', 'streak_shield', 'ticket_booster') NOT NULL,
  `icon` VARCHAR(50) DEFAULT '🎁',
  `rarity` ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  `description` TEXT DEFAULT NULL,
  `value_amount` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABEL USER_COLLECTIBLES
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

-- 10. TABEL BLIND_BOX_LOGS
DROP TABLE IF EXISTS `blind_box_logs`;
CREATE TABLE `blind_box_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `collectible_id` INT NOT NULL,
  `ticket_cost` INT DEFAULT 1,
  `opened_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_boxlogs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boxlogs_col` FOREIGN KEY (`collectible_id`) REFERENCES `collectibles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. TABEL PREMIUM_PACKAGES
DROP TABLE IF EXISTS `premium_packages`;
CREATE TABLE `premium_packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `duration_days` INT NOT NULL,
  `description` TEXT DEFAULT NULL,
  `benefits_json` JSON DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. TABEL USER_SUBSCRIPTIONS
DROP TABLE IF EXISTS `user_subscriptions`;
CREATE TABLE `user_subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `package_id` INT NOT NULL,
  `status` ENUM('pending', 'active', 'expired', 'cancelled') DEFAULT 'pending',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `transaction_code` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_subscriptions_user` (`user_id`),
  CONSTRAINT `fk_subs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subs_package` FOREIGN KEY (`package_id`) REFERENCES `premium_packages` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- SEED DATA AWAL
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `avatar`, `role`, `provider`) VALUES
(1, 'Diva Novaliza Fitriyani', 'diva@equest.ac.id', '$2a$10$wN7Kk5MvVv8q3R8U4u7n2eP8iM9A8x8u7n2eP8iM9A8x8u7n2eP8i', '👩‍🎓', 'student', 'local'),
(2, 'Budi Santoso', 'budi.santoso@gmail.com', '$2a$10$wN7Kk5MvVv8q3R8U4u7n2eP8iM9A8x8u7n2eP8iM9A8x8u7n2eP8i', '👨‍🎓', 'student', 'local')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `user_stats` (`user_id`, `xp`, `tickets`, `streak`, `repair_chances_left`, `last_active_date`) VALUES
(1, 250, 4, 5, 3, CURDATE()),
(2, 100, 2, 2, 3, CURDATE())
ON DUPLICATE KEY UPDATE `xp`=VALUES(`xp`);

INSERT INTO `collectibles` (`id`, `name`, `type`, `icon`, `rarity`, `description`, `value_amount`) VALUES
(1, 'Bonus XP Kilat (+50 XP)', 'xp_pack', '✨', 'common', 'Menambah 50 XP ke profil belajarmu secara instan.', 50),
(2, 'Bonus XP Jumbo (+150 XP)', 'xp_pack', '⚡', 'epic', 'Ledakan 150 XP untuk mempercepat kenaikan level.', 150),
(3, 'Tiket Keberuntungan (+2 Tiket)', 'ticket_booster', '🎟️', 'rare', 'Mendapatkan 2 tiket gratis untuk membuka Blind Box lagi.', 2),
(4, 'Shield Streak Beku', 'streak_shield', '🛡️', 'rare', 'Melindungi streak harianmu agar tidak putus saat terlewat 1 hari.', 1),
(5, 'Gelar: Pendekar Soal AI', 'title', '⚔️', 'epic', 'Gelar eksklusif bagi siswa yang giat memecahkan soal mandiri.', 0),
(6, 'Badge Emas: Pemburu Harta', 'badge', '👑', 'legendary', 'Lencana legenda terlangka dari Mystery Blind Box EQuest.', 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `premium_packages` (`id`, `name`, `price`, `duration_days`, `description`, `benefits_json`) VALUES
(1, 'Paket Pelajar Bulanan', 29000.00, 30, 'Akses penuh bantuan AI tanpa batas dan ekstra tiket blind box.', '["Unlimited analisis soal AI", "Kesempatan perbaikan kesalahan tak terbatas", "Bonus 5 Tiket Blind Box setiap bulan", "Bantuan adaptif AI tingkat lanjut"]'),
(2, 'Paket Semester Juara', 129000.00, 180, 'Hemat 30% untuk pendampingan belajar satu semester penuh.', '["Semua fitur Paket Bulanan", "Prioritas kecepatan respons AI", "Bonus 30 Tiket Blind Box", "Laporan analitik belajar komprehensif"]')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
