# DOKUMEN PERANCANGAN BASIS DATA FISIK (PHYSICAL DATA MODEL - PDM)
**Sistem Pendamping Pengerjaan Tugas Berbasis AI (EQuest)**  
*Berdasarkan Software Design Document (SDD) Bab 4.4 Halaman 35 & Software Requirements Specification (SRS)*  
*Penyusun: 11241026 - Diva Novaliza Fitriyani*

---

## 1. Ringkasan Arsitektur Basis Data Fisik
* **DBMS**: MySQL / MariaDB (Versi 8.0+ / 10.4+)
* **Storage Engine**: InnoDB (Mendukung transaksi ACID dan Integritas Relasional / Foreign Keys)
* **Karakter Set**: `utf8mb4` (Mendukung emoji avatar dan karakter teks internasional)
* **Collation**: `utf8mb4_unicode_ci`
* **Nama Database**: `equest_db`
* **Total Entitas Fisik**: **17 Tabel Relasional** (Sesuai SDD Bab 4.4 Halaman 35)

---

## 2. Struktur 17 Tabel Relasional Fisik

### 2.1 Kelompok Pengguna & Gamifikasi

#### 1. Tabel `Pengguna`
Menyimpan data akun pengguna dan statistik utama.
* Primary Key: `id_pengguna` (INT, AUTO_INCREMENT)
* Atribut: `nama`, `email`, `password_hash`, `role`, `foto_profil`, `tanggal_daftar`, `xp_total`, `tiket_total`, `status_akun`.

#### 2. Tabel `Streak`
Mencatat konsistensi hari belajar pengguna.
* Primary Key: `id_streak` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)` ON DELETE CASCADE
* Atribut: `jumlah_hari`, `tanggal_terakhir`, `status` (`aktif`, `freeze`, `putus`).

#### 3. Tabel `Progres_Pengguna`
Menyimpan akumulasi kemajuan tugas dan tingkat akurasi belajar.
* Primary Key: `id_progres` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)` ON DELETE CASCADE
* Atribut: `total_tugas`, `total_benar`, `total_salah`, `rata_rata_skor`, `waktu_belajar_menit`, `terakhir_diperbarui`.

---

### 2.2 Kelompok Reward, Blind Box & Koleksi

#### 4. Tabel `Reward`
Master data hadiah (XP booster, tiket gratis, lencana).
* Primary Key: `id_reward` (INT, AUTO_INCREMENT)
* Atribut: `nama_reward`, `tipe_reward` (`xp`, `tiket`, `badge`, `tema`, `figur`), `nilai_reward`, `deskripsi`, `ikon_url`.

#### 5. Tabel `Reward_Pengguna`
Log kepemilikan hadiah yang didapat siswa.
* Primary Key: `id_reward_pengguna` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)`, `id_reward` -> `Reward(id_reward)`
* Atribut: `tanggal_didapat`, `status_klaim`.

#### 6. Tabel `Blind_Box`
Katalog jenis mystery blind box.
* Primary Key: `id_blind_box` (INT, AUTO_INCREMENT)
* Atribut: `nama_box`, `biaya_tiket`, `tingkat_kelangkaan`, `status_tersedia`.

#### 7. Tabel `Blind_Box_Reward`
Tabel relasi (many-to-many) isi hadiah di dalam setiap box beserta peluang probabilitasnya.
* Primary Key: `id_blind_box_reward` (INT, AUTO_INCREMENT)
* Foreign Key: `id_blind_box` -> `Blind_Box(id_blind_box)`, `id_reward` -> `Reward(id_reward)`
* Atribut: `probabilitas_persen`.

#### 8. Tabel `Koleksi_Pengguna`
Menyimpan koleksi figur 3D robot AI hasil buka box.
* Primary Key: `id_koleksi` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)`
* Atribut: `nama_figur`, `gambar_url`, `tanggal_peroleh`.

---

### 2.3 Kelompok Tugas, Jawaban & Pemeriksaan AI

#### 9. Tabel `Tugas`
Menyimpan data berkas soal yang diunggah siswa.
* Primary Key: `id_tugas` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)` ON DELETE CASCADE
* Atribut: `judul_tugas`, `nama_file`, `tipe_file`, `ukuran_file`, `url_file`, `jumlah_soal`, `status` (`unggah`, `proses`, `selesai`), `tanggal_unggah`.

#### 10. Tabel `Jawaban`
Menyimpan rincian butir soal, kunci jawaban AI, dan teks jawaban siswa.
* Primary Key: `id_jawaban` (INT, AUTO_INCREMENT)
* Foreign Key: `id_tugas` -> `Tugas(id_tugas)` ON DELETE CASCADE
* Atribut: `nomor_soal`, `teks_soal`, `jawaban_siswa`, `kunci_jawaban`, `penjelasan_konsep`, `apakah_benar`, `poin_soal`.

#### 11. Tabel `Kesempatan_Perbaikan`
Mencatat sisa kesempatan percobaan revisi siswa (maks. 2-3 kali).
* Primary Key: `id_kesempatan` (INT, AUTO_INCREMENT)
* Foreign Key: `id_tugas` -> `Tugas(id_tugas)`
* Atribut: `percobaan_ke`, `sisa_kesempatan`, `tanggal_perbaikan`.

#### 12. Tabel `Pemeriksaan`
Hasil evaluasi menyeluruh dari asisten AI.
* Primary Key: `id_pemeriksaan` (INT, AUTO_INCREMENT)
* Foreign Key: `id_tugas` -> `Tugas(id_tugas)`
* Atribut: `skor_akhir`, `total_soal_benar`, `total_soal_salah`, `xp_diberikan`, `tiket_diberikan`, `umpan_balik_umum`, `tanggal_pemeriksaan`.

#### 13. Tabel `Koreksi`
Koreksi mendalam per butir soal yang salah beserta tips & petunjuk (*hint*).
* Primary Key: `id_koreksi` (INT, AUTO_INCREMENT)
* Foreign Key: `id_jawaban` -> `Jawaban(id_jawaban)`
* Atribut: `bagian_salah`, `petunjuk_perbaikan`, `contoh_kode_query`, `istilah_penting`.

#### 14. Tabel `Riwayat_Kesalahan`
Log pola kesalahan untuk dipelajari ulang di kemudian hari.
* Primary Key: `id_riwayat` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)`
* Atribut: `topik_materi`, `deskripsi_kesalahan`, `rekomendasi_belajar`, `status_dipelajari`, `tanggal_catat`.

---

### 2.4 Kelompok Layanan Premium & Transaksi

#### 15. Tabel `Paket_Premium`
Pilihan paket berlangganan fitur ekstra.
* Primary Key: `id_paket` (INT, AUTO_INCREMENT)
* Atribut: `nama_paket`, `durasi_hari`, `harga`, `fitur_deskripsi`.

#### 16. Tabel `Langganan_Premium`
Status aktif paket premium pada akun pengguna.
* Primary Key: `id_langganan` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)`, `id_paket` -> `Paket_Premium(id_paket)`
* Atribut: `tanggal_mulai`, `tanggal_berakhir`, `status_aktif`.

#### 17. Tabel `Transaksi`
Catatan transaksi pembayaran berlangganan.
* Primary Key: `id_transaksi` (INT, AUTO_INCREMENT)
* Foreign Key: `id_pengguna` -> `Pengguna(id_pengguna)`, `id_paket` -> `Paket_Premium(id_paket)`
* Atribut: `kode_transaksi`, `total_bayar`, `metode_bayar`, `status_transaksi` (`pending`, `berhasil`, `gagal`), `waktu_transaksi`.

---

## 3. Lokasi Berkas Implementasi pada Repositori
* **DDL SQL Siap Eksekusi**: [`database/equest_physical_schema.sql`](file:///c:/Users/Asus/OneDrive/Desktop/IPPL/equest/database/equest_physical_schema.sql) dan [`server/database/schema.sql`](file:///c:/Users/Asus/OneDrive/Desktop/IPPL/equest/server/database/schema.sql)
* **Koneksi Database Backend**: [`server/config/database.js`](file:///c:/Users/Asus/OneDrive/Desktop/IPPL/equest/server/config/database.js)
* **Konfigurasi Environment**: [`server/.env.example`](file:///c:/Users/Asus/OneDrive/Desktop/IPPL/equest/server/.env.example)
