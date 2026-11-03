-- =====================================================================
-- PERANCANGAN BASIS DATA FISIK (PHYSICAL DATABASE DESIGN / PDM)
-- APLIKASI: EQuest (Sistem Pendamping Pengerjaan Tugas Berbasis AI)
-- Dokumen Acuan: Software Design Document (SDD) Bab 4.4 Entity Relationship Diagram
-- Mahasiswa: 11241026 - Diva Novaliza Fitriyani
-- Database Engine: MySQL / MariaDB (InnoDB, utf8mb4)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `equest_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `equest_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- 1. TABEL PENGGUNA
-- =====================================================================
DROP TABLE IF EXISTS `Pengguna`;
CREATE TABLE `Pengguna` (
  `id_pengguna` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'Pengguna',
  `foto_profil` VARCHAR(255) DEFAULT '👤',
  `tanggal_daftar` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `xp_total` INT DEFAULT 0,
  `tiket_total` INT DEFAULT 0,
  `status_akun` ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
  INDEX `idx_pengguna_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 2. TABEL STREAK
-- =====================================================================
DROP TABLE IF EXISTS `Streak`;
CREATE TABLE `Streak` (
  `id_streak` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `jumlah_hari` INT DEFAULT 0,
  `tanggal_terakhir` DATE DEFAULT NULL,
  `status` ENUM('aktif', 'freeze', 'putus') DEFAULT 'aktif',
  INDEX `idx_streak_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_streak_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 3. TABEL PROGRES_PENGGUNA
-- =====================================================================
DROP TABLE IF EXISTS `Progres_Pengguna`;
CREATE TABLE `Progres_Pengguna` (
  `id_progres` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `total_tugas` INT DEFAULT 0,
  `total_benar` INT DEFAULT 0,
  `total_salah` INT DEFAULT 0,
  `tanggal_diperbarui` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_progres_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_progres_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 4. TABEL REWARD
-- =====================================================================
DROP TABLE IF EXISTS `Reward`;
CREATE TABLE `Reward` (
  `id_reward` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_reward` VARCHAR(100) NOT NULL,
  `jenis` VARCHAR(50) NOT NULL COMMENT 'badge, xp, tiket, streak_shield, tema',
  `deskripsi` TEXT DEFAULT NULL,
  `tingkat_kelangkaan` VARCHAR(50) DEFAULT 'Common',
  `gambar_url` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 5. TABEL REWARD_PENGGUNA
-- =====================================================================
DROP TABLE IF EXISTS `Reward_Pengguna`;
CREATE TABLE `Reward_Pengguna` (
  `id_reward_pengguna` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `id_reward` INT NOT NULL,
  `jumlah` INT DEFAULT 1,
  `sumber` VARCHAR(100) DEFAULT 'Blind Box',
  `tanggal_diperoleh` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reward_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_rewpeng_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE,
  CONSTRAINT `fk_rewpeng_reward` FOREIGN KEY (`id_reward`) REFERENCES `Reward` (`id_reward`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 6. TABEL BLIND_BOX
-- =====================================================================
DROP TABLE IF EXISTS `Blind_Box`;
CREATE TABLE `Blind_Box` (
  `id_blind_box` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_blind_box` VARCHAR(100) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `biaya_tiket` INT DEFAULT 1,
  `gambar_url` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 7. TABEL BLIND_BOX_REWARD
-- =====================================================================
DROP TABLE IF EXISTS `Blind_Box_Reward`;
CREATE TABLE `Blind_Box_Reward` (
  `id_blind_box` INT NOT NULL,
  `id_reward` INT NOT NULL,
  `probabilitas` DECIMAL(5,2) DEFAULT 1.00,
  PRIMARY KEY (`id_blind_box`, `id_reward`),
  CONSTRAINT `fk_bbr_box` FOREIGN KEY (`id_blind_box`) REFERENCES `Blind_Box` (`id_blind_box`) ON DELETE CASCADE,
  CONSTRAINT `fk_bbr_reward` FOREIGN KEY (`id_reward`) REFERENCES `Reward` (`id_reward`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 8. TABEL KOLEKSI_PENGGUNA
-- =====================================================================
DROP TABLE IF EXISTS `Koleksi_Pengguna`;
CREATE TABLE `Koleksi_Pengguna` (
  `id_koleksi` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `id_reward` INT NOT NULL,
  `tanggal_diperoleh` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_koleksi_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_koleksi_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE,
  CONSTRAINT `fk_koleksi_reward` FOREIGN KEY (`id_reward`) REFERENCES `Reward` (`id_reward`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 9. TABEL TUGAS
-- =====================================================================
DROP TABLE IF EXISTS `Tugas`;
CREATE TABLE `Tugas` (
  `id_tugas` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `judul` VARCHAR(255) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `file_url` VARCHAR(255) DEFAULT NULL,
  `jenis_file` VARCHAR(50) DEFAULT 'pdf',
  `tanggal_upload` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `tipe` VARCHAR(50) DEFAULT 'Latihan',
  `batas_waktu` DATETIME DEFAULT NULL,
  `tingkat_kesulitan` VARCHAR(50) DEFAULT 'Sedang',
  `poin_xp` INT DEFAULT 10,
  `status` VARCHAR(50) DEFAULT 'Sedang Dikerjakan',
  INDEX `idx_tugas_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_tugas_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 10. TABEL JAWABAN
-- =====================================================================
DROP TABLE IF EXISTS `Jawaban`;
CREATE TABLE `Jawaban` (
  `id_jawaban` INT AUTO_INCREMENT PRIMARY KEY,
  `id_tugas` INT NOT NULL,
  `id_pengguna` INT NOT NULL,
  `isi_jawaban` TEXT NOT NULL,
  `versi` INT DEFAULT 1,
  `tanggal_kirim` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) DEFAULT 'Terkirim',
  INDEX `idx_jawaban_tugas` (`id_tugas`),
  INDEX `idx_jawaban_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_jawaban_tugas` FOREIGN KEY (`id_tugas`) REFERENCES `Tugas` (`id_tugas`) ON DELETE CASCADE,
  CONSTRAINT `fk_jawaban_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 11. TABEL KESEMPATAN_PERBAIKAN
-- =====================================================================
DROP TABLE IF EXISTS `Kesempatan_Perbaikan`;
CREATE TABLE `Kesempatan_Perbaikan` (
  `id_kesempatan` INT AUTO_INCREMENT PRIMARY KEY,
  `id_jawaban` INT NOT NULL,
  `jumlah_kesempatan` INT DEFAULT 3,
  `jumlah_terpakai` INT DEFAULT 0,
  `status` VARCHAR(50) DEFAULT 'Tersedia',
  INDEX `idx_kesempatan_jawaban` (`id_jawaban`),
  CONSTRAINT `fk_kesempatan_jawaban` FOREIGN KEY (`id_jawaban`) REFERENCES `Jawaban` (`id_jawaban`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 12. TABEL PEMERIKSAAN
-- =====================================================================
DROP TABLE IF EXISTS `Pemeriksaan`;
CREATE TABLE `Pemeriksaan` (
  `id_pemeriksaan` INT AUTO_INCREMENT PRIMARY KEY,
  `id_jawaban` INT NOT NULL,
  `hasil_awal` TEXT DEFAULT NULL,
  `tanggal_pemeriksaan` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) DEFAULT 'Selesai',
  INDEX `idx_pemeriksaan_jawaban` (`id_jawaban`),
  CONSTRAINT `fk_pemeriksaan_jawaban` FOREIGN KEY (`id_jawaban`) REFERENCES `Jawaban` (`id_jawaban`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 13. TABEL KOREKSI
-- =====================================================================
DROP TABLE IF EXISTS `Koreksi`;
CREATE TABLE `Koreksi` (
  `id_koreksi` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pemeriksaan` INT NOT NULL,
  `bagian_salah` TEXT DEFAULT NULL,
  `petunjuk_perbaikan` TEXT DEFAULT NULL,
  `revisi` INT DEFAULT 0,
  `hasil_akhir` VARCHAR(50) DEFAULT NULL,
  `tanggal_koreksi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) DEFAULT 'Selesai',
  INDEX `idx_koreksi_pemeriksaan` (`id_pemeriksaan`),
  CONSTRAINT `fk_koreksi_pemeriksaan` FOREIGN KEY (`id_pemeriksaan`) REFERENCES `Pemeriksaan` (`id_pemeriksaan`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 14. TABEL RIWAYAT_KESALAHAN
-- =====================================================================
DROP TABLE IF EXISTS `Riwayat_Kesalahan`;
CREATE TABLE `Riwayat_Kesalahan` (
  `id_riwayat` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `id_koreksi` INT DEFAULT NULL,
  `kategori` VARCHAR(100) DEFAULT NULL,
  `deskripsi_kesalahan` TEXT NOT NULL,
  `tanggal_terjadi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_riwayat_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_riwayat_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE,
  CONSTRAINT `fk_riwayat_koreksi` FOREIGN KEY (`id_koreksi`) REFERENCES `Koreksi` (`id_koreksi`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 15. TABEL PAKET_PREMIUM
-- =====================================================================
DROP TABLE IF EXISTS `Paket_Premium`;
CREATE TABLE `Paket_Premium` (
  `id_paket` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_paket` VARCHAR(100) NOT NULL,
  `durasi_hari` INT NOT NULL,
  `harga` DECIMAL(12,2) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `fitur` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 16. TABEL LANGGANAN_PREMIUM
-- =====================================================================
DROP TABLE IF EXISTS `Langganan_Premium`;
CREATE TABLE `Langganan_Premium` (
  `id_langganan` INT AUTO_INCREMENT PRIMARY KEY,
  `id_pengguna` INT NOT NULL,
  `id_paket` INT NOT NULL,
  `tanggal_mulai` DATE DEFAULT NULL,
  `tanggal_berakhir` DATE DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'aktif',
  INDEX `idx_langganan_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_langganan_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE,
  CONSTRAINT `fk_langganan_paket` FOREIGN KEY (`id_paket`) REFERENCES `Paket_Premium` (`id_paket`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================
-- 17. TABEL TRANSAKSI
-- =====================================================================
DROP TABLE IF EXISTS `Transaksi`;
CREATE TABLE `Transaksi` (
  `id_transaksi` INT AUTO_INCREMENT PRIMARY KEY,
  `id_langganan` INT NOT NULL,
  `id_pengguna` INT NOT NULL,
  `metode_pembayaran` VARCHAR(50) NOT NULL,
  `jumlah` DECIMAL(12,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Berhasil',
  `transaction_reference` VARCHAR(100) DEFAULT NULL,
  `tanggal_transaksi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_transaksi_pengguna` (`id_pengguna`),
  CONSTRAINT `fk_transaksi_langganan` FOREIGN KEY (`id_langganan`) REFERENCES `Langganan_Premium` (`id_langganan`) ON DELETE CASCADE,
  CONSTRAINT `fk_transaksi_pengguna` FOREIGN KEY (`id_pengguna`) REFERENCES `Pengguna` (`id_pengguna`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- DATA SEED AWAL
-- =====================================================================
INSERT INTO `Pengguna` (`id_pengguna`, `nama`, `email`, `password_hash`, `role`, `foto_profil`, `xp_total`, `tiket_total`) VALUES
(1, 'Diva Novaliza Fitriyani', 'diva@equest.ac.id', '$2a$10$wN7Kk5MvVv8q3R8U4u7n2eP8iM9A8x8u7n2eP8iM9A8x8u7n2eP8i', 'Mahasiswa', '👩‍🎓', 320, 10),
(2, 'Budi Santoso', 'budi.santoso@gmail.com', '$2a$10$wN7Kk5MvVv8q3R8U4u7n2eP8iM9A8x8u7n2eP8iM9A8x8u7n2eP8i', 'Pengguna', '👨‍🎓', 100, 2)
ON DUPLICATE KEY UPDATE `nama`=VALUES(`nama`);

INSERT INTO `Streak` (`id_streak`, `id_pengguna`, `jumlah_hari`, `tanggal_terakhir`, `status`) VALUES
(1, 1, 18, CURDATE(), 'aktif'),
(2, 2, 3, CURDATE(), 'aktif')
ON DUPLICATE KEY UPDATE `jumlah_hari`=VALUES(`jumlah_hari`);

INSERT INTO `Progres_Pengguna` (`id_progres`, `id_pengguna`, `total_tugas`, `total_benar`, `total_salah`) VALUES
(1, 1, 45, 42, 3),
(2, 2, 5, 4, 1)
ON DUPLICATE KEY UPDATE `total_tugas`=VALUES(`total_tugas`);

INSERT INTO `Blind_Box` (`id_blind_box`, `nama_blind_box`, `deskripsi`, `biaya_tiket`, `status`) VALUES
(1, 'Mystery Blind Box Utama', 'Buka kotak misteri dan dapatkan XP, tiket, badge, dan reward eksklusif!', 1, 'aktif')
ON DUPLICATE KEY UPDATE `nama_blind_box`=VALUES(`nama_blind_box`);

INSERT INTO `Reward` (`id_reward`, `nama_reward`, `jenis`, `deskripsi`, `tingkat_kelangkaan`) VALUES
(1, '+50 XP', 'xp', 'Bonus 50 XP ke profil belajarmu.', 'Common'),
(2, '+100 XP', 'xp', 'Bonus 100 XP untuk percepatan level.', 'Rare'),
(3, '+1 Tiket', 'tiket', '1 Tiket ekstra untuk membuka Blind Box lagi.', 'Common'),
(4, 'First Step Badge', 'badge', 'Selesaikan 1 Latihan soal.', 'Common'),
(5, '7 Days Streak Badge', 'badge', 'Belajar 7 hari berturut-turut.', 'Rare'),
(6, 'Problem Solver Badge', 'badge', 'Selesaikan 50 butir soal.', 'Epic'),
(7, 'Curious Mind Badge', 'badge', 'Unggah 50 file untuk dipelajari.', 'Epic'),
(8, 'Master Learner Badge', 'badge', 'Selesaikan 100 butir soal.', 'Legendary'),
(9, 'Tema Spesial', 'tema', 'Tema tampilan antarmuka eksklusif.', 'Epic'),
(10, 'Figure Collection Robot', 'figure', 'Figur koleksi digital Robot EQuest.', 'Legendary')
ON DUPLICATE KEY UPDATE `nama_reward`=VALUES(`nama_reward`);

INSERT INTO `Paket_Premium` (`id_paket`, `nama_paket`, `durasi_hari`, `harga`, `deskripsi`, `fitur`, `status`) VALUES
(1, 'Paket Pelajar Bulanan', 30, 29000.00, 'Akses penuh bantuan AI tanpa batas dan ekstra tiket.', 'Analisis tanpa batas, Kesempatan perbaikan bebas, 5 Tiket Blind Box', 'aktif'),
(2, 'Paket Semester Juara', 180, 129000.00, 'Hemat 30% untuk pendampingan belajar satu semester penuh.', 'Semua fitur Bulanan, Kecepatan prioritas, 30 Tiket Blind Box', 'aktif')
ON DUPLICATE KEY UPDATE `nama_paket`=VALUES(`nama_paket`);
