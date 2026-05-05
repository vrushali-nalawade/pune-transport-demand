// ==========================================
// 📦 IMPORTS
// ==========================================
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ==========================================
// 📁 AVAILABLE DATASETS (CENTRAL CONFIG)
// ==========================================
const datasets = {
  // 🔥 Population Models
  rf_2021: "RF Population 2021",
  rf_2026: "RF Population 2026",
  rf_2030: "RF Population 2030",

  cagr_2021: "CAGR Population 2021",
  cagr_2026: "CAGR Population 2026",
  cagr_2030: "CAGR Population 2030",

  logistic_2021: "Logistic Population 2021",
  logistic_2026: "Logistic Population 2026",
  logistic_2030: "Logistic Population 2030",

  // 📊 ML + Evaluation
  model_comparison: "Model Comparison Metrics",
  demand_evaluation: "Demand Model Evaluation",

  // 📈 Combined datasets (IMPORTANT)
  population_combined: "Population 2011–2030 (All Models)",
  ml_population: "ML Population Predictions"
};

// ==========================================
// 📌 GET AVAILABLE DATASETS
// ==========================================
router.get("/", (req, res) => {
  const list = Object.entries(datasets).map(([key, label]) => ({
    table: key,
    name: label
  }));

  res.json(list);
});

// ==========================================
// 📥 DOWNLOAD CSV
// ==========================================
router.get("/:table", async (req, res) => {
  try {
    const { table } = req.params;

    if (!datasets[table]) {
      return res.status(400).json({
        error: "Invalid dataset"
      });
    }

    const result = await pool.query(`SELECT * FROM ${table}`);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: "No data found"
      });
    }

    const headers = Object.keys(result.rows[0]);

    // ==========================================
    // 🔥 SAFE CSV FORMATTER
    // ==========================================
    const formatValue = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(","),
      ...result.rows.map(row =>
        headers.map(h => formatValue(row[h])).join(",")
      )
    ];

    const csv = csvRows.join("\n");

    // ==========================================
    // 📤 RESPONSE
    // ==========================================
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${table}.csv`
    );

    res.send(csv);

  } catch (err) {
    console.error("❌ Download error:", err.message);

    res.status(500).json({
      error: "Failed to download file"
    });
  }
});

export default router;