// ==========================================
// 📦 IMPORTS
// ==========================================
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ==========================================
// 🧠 HELPER: CLEAN NUMBERS
// ==========================================
const toNumber = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

// ==========================================
// 📊 MODEL COMPARISON (MAIN)
// ==========================================
router.get("/comparison", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM model_comparison"
    );

    if (!result.rows || result.rows.length === 0) {
      return res.json([]);
    }

    // 🔥 NORMALIZE DATA
    let data = result.rows.map((row) => ({
      Model: row.model || row.Model,
      MAE: toNumber(row.mae || row.MAE),
      RMSE: toNumber(row.rmse || row.RMSE),
      R2: toNumber(row.r2 || row.R2)
    }));

    // 🔥 SORT BEST MODEL FIRST (LOW RMSE)
    data.sort((a, b) => a.RMSE - b.RMSE);

    res.json(data);

  } catch (err) {
    console.error("❌ Error fetching model comparison:", err.message);

    res.status(500).json({
      error: "Failed to fetch model comparison"
    });
  }
});

// ==========================================
// 📈 DEMAND MODEL EVALUATION
// ==========================================
router.get("/evaluation", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM demand_evaluation"
    );

    if (!result.rows || result.rows.length === 0) {
      return res.json([]);
    }

    // 🔥 NORMALIZE
    const data = result.rows.map((row) => ({
      Model: row.model || row.Model,
      Year: row.year || row.Year,
      MAE: toNumber(row.mae || row.MAE),
      RMSE: toNumber(row.rmse || row.RMSE),
      R2: toNumber(row.r2 || row.R2),
      Accuracy: toNumber(
        row["Accuracy(±10%)"] ||
        row.accuracy ||
        row.accuracy_10 ||
        0
      )
    }));

    res.json(data);

  } catch (err) {
    console.error("❌ Error fetching evaluation:", err.message);

    res.status(500).json({
      error: "Failed to fetch evaluation data"
    });
  }
});

// ==========================================
// 📌 GET AVAILABLE MODELS
// ==========================================
router.get("/list", (req, res) => {
  res.json(["rf", "cagr", "logistic"]);
});

export default router;