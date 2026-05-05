import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ==========================================
// 🗺️ GET GEOJSON FROM DB
// ==========================================
router.get("/wards", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ward_no, geometry
      FROM wards_geo
    `);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => ({
        type: "Feature",
        properties: {
          ward_no: row.ward_no
        },
        geometry: JSON.parse(row.geometry)
      }))
    };

    res.json(geojson);

  } catch (err) {
    console.error("❌ Geo API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;