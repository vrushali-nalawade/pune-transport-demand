// ==========================================
// 📦 IMPORTS
// ==========================================
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// ==========================================
// 🔐 DATABASE CONNECTION (FINAL FIX)
// ==========================================
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ==========================================
// 🧪 TEST CONNECTION
// ==========================================
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err.message));