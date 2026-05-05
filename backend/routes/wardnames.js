// ==========================================
// 📦 IMPORTS
// ==========================================
import { pool } from "../db.js";

// ==========================================
// 🧠 LOAD WARD NAME MAP (2011)
// ==========================================
const loadWardNames = async () => {
  const res = await pool.query(`
    SELECT ward_no, ward_name
    FROM wards_2011
  `);

  const map = {};

  res.rows.forEach((r) => {
    map[Number(r.ward_no)] = r.ward_name;
  });

  console.log("✅ wards_2011 loaded:", Object.keys(map).length);
  return map;
};

// ==========================================
// 🧠 LOAD GEO WARD NUMBERS
// ==========================================
const loadGeoWards = async () => {
  const res = await pool.query(`
    SELECT ward_no
    FROM wards_geo
  `);

  const set = new Set();

  res.rows.forEach((r) => {
    set.add(Number(r.ward_no));
  });

  console.log("✅ wards_geo loaded:", set.size);
  return set;
};

// ==========================================
// 🚀 TEST MAPPING
// ==========================================
const run = async () => {
  console.log("🚀 Testing DB Ward Mapping...\n");

  try {
    const nameMap = await loadWardNames();
    const geoSet = await loadGeoWards();

    console.log("\n🔍 SAMPLE CHECK:\n");

    for (let i = 1; i <= 15; i++) {
      console.log(
        `Ward ${i} →`,
        nameMap[i] || "❌ missing name",
        "| Geo:",
        geoSet.has(i) ? "✅" : "❌"
      );
    }

    // ==========================================
    // 📊 SUMMARY
    // ==========================================
    const totalNames = Object.keys(nameMap).length;
    const totalGeo = geoSet.size;

    const matched = Object.keys(nameMap).filter((k) =>
      geoSet.has(Number(k))
    ).length;

    console.log("\n📊 SUMMARY:");
    console.log("Total wards (names):", totalNames);
    console.log("Total wards (geo):", totalGeo);
    console.log("Matched:", matched);

    console.log("\n🎯 DONE\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    process.exit();
  }
};

run();