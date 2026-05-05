// ==========================================
// 📦 IMPORTS
// ==========================================
import express from "express";

const router = express.Router();

// ==========================================
// 📌 META DATA (DRIVES FULL DASHBOARD)
// ==========================================
router.get("/", (req, res) => {
  res.json({

    // ======================================
    // 🧠 MODELS (WITH LABELS)
    // ======================================
    models: [
      { key: "rf", label: "Random Forest" },
      { key: "cagr", label: "CAGR Model" },
      { key: "logistic", label: "Logistic Model" }
    ],

    // ======================================
    // 📅 YEARS (FOR DEMAND MAP)
    // ======================================
    years: [2021, 2026, 2030],

    // ======================================
    // 📈 FULL YEAR RANGE (FOR TRENDS)
    // ======================================
    yearRange: {
      start: 2011,
      end: 2030
    },

    // ======================================
    // 📥 DATASETS (DOWNLOAD PANEL)
    // ======================================
    datasets: [
      { key: "rf_2021", name: "RF Population 2021" },
      { key: "rf_2026", name: "RF Population 2026" },
      { key: "rf_2030", name: "RF Population 2030" },

      { key: "cagr_2021", name: "CAGR Population 2021" },
      { key: "cagr_2026", name: "CAGR Population 2026" },
      { key: "cagr_2030", name: "CAGR Population 2030" },

      { key: "logistic_2021", name: "Logistic Population 2021" },
      { key: "logistic_2026", name: "Logistic Population 2026" },
      { key: "logistic_2030", name: "Logistic Population 2030" },

      { key: "model_comparison", name: "Model Comparison Metrics" },
      { key: "demand_evaluation", name: "Demand Model Evaluation" },
      { key: "population_combined", name: "Population 2011–2030 (All Models)" },
      { key: "ml_population", name: "ML Population Predictions" }
    ],

    // ======================================
    // ⚙️ DEFAULTS (VERY USEFUL)
    // ======================================
    defaults: {
      model: "rf",
      year: 2026
    }

  });
});

export default router;