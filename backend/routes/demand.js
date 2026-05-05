// ==========================================
// 📦 IMPORTS
// ==========================================
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ==========================================
// 🧠 DEMAND CALCULATION (fallback)
// ==========================================
const computeDemand = (population, stops) => {
  population = Number(population) || 0;
  stops = Number(stops) || 0;
  return stops > 0 ? population / stops : population * 0.05;
};

// ==========================================
// 📊 GET DEMAND DATA
// ==========================================
router.get("/", async (req, res) => {
  const { model = "rf", year = "2026" } = req.query;

  const allowedModels = ["rf", "cagr", "logistic"];
  const allowedYears = ["2021", "2026", "2030"];

  try {
    // ==========================================
    // 🔒 VALIDATION
    // ==========================================
    if (!allowedModels.includes(model)) {
      return res.status(400).json({ error: "Invalid model" });
    }

    if (!allowedYears.includes(year)) {
      return res.status(400).json({ error: "Invalid year" });
    }

    const demandTable = `demand_${model}_${year}`;
    const baseTable = `${model}_${year}`;

    let rows = [];

    // ==========================================
    // 🔥 TRY ML DEMAND TABLE
    // ==========================================
    try {
      const result = await pool.query(`
        SELECT 
          CAST(d.ward_no AS INTEGER) AS ward_no,
          w.ward_name,
          d.population,
          d.bus_stop_count,
          d.predicted_demand
        FROM ${demandTable} d
        LEFT JOIN wards_2011 w
        ON CAST(d.ward_no AS INTEGER) = CAST(w.ward_no AS INTEGER)
      `);

      console.log(`✅ Using ML table: ${demandTable}`);
      rows = result.rows;

    } catch (err) {
      // ==========================================
      // ⚠️ FALLBACK: COMPUTE DEMAND
      // ==========================================
      console.log("⚠️ Falling back to computed demand");

      const result = await pool.query(`
        SELECT 
          CAST(b.ward_no AS INTEGER) AS ward_no,
          w.ward_name,
          b.population,
          b.bus_stop_count
        FROM ${baseTable} b
        LEFT JOIN wards_2011 w
        ON CAST(b.ward_no AS INTEGER) = CAST(w.ward_no AS INTEGER)
      `);

      rows = result.rows.map((row) => ({
        ...row,
        predicted_demand: computeDemand(
          row.population,
          row.bus_stop_count
        )
      }));
    }

    // ==========================================
    // ⚠️ NO DATA
    // ==========================================
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: `No data found for ${model} ${year}`
      });
    }

    // ==========================================
    // 🎯 FORMAT RESPONSE
    // ==========================================
    const data = rows.map((row) => ({
      ward: row.ward_name || `Ward ${row.ward_no}`,
      ward_no: Number(row.ward_no),
      population: Number(row.population) || 0,
      bus_stops: Number(row.bus_stop_count) || 0,
      predicted_demand: Number(row.predicted_demand) || 0
    }));

    // 🔍 DEBUG (remove later)
    console.log("📊 Sample Output:", data.slice(0, 5));

    res.json(data);

  } catch (err) {
    console.error("❌ Demand API error:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

// ==========================================
// ✅ EXPORT
// ==========================================
export default router;