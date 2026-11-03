import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

let pool = null

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'equest_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2500, // Timeout cepat 2.5 detik agar tidak menggantung jika MySQL XAMPP belum dinyalakan
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    })
  }
  return pool
}

export async function testDbConnection() {
  try {
    const db = getDbPool()
    const [rows] = await db.query('SELECT 1 + 1 AS result')
    return {
      connected: true,
      message: 'Koneksi database MySQL equest_db berhasil terhubung!',
    }
  } catch (error) {
    return {
      connected: false,
      message: `Database MySQL belum tersambung (${error.message}). Pastikan MySQL (XAMPP / MariaDB) sudah aktif.`,
    }
  }
}

export default getDbPool
