// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState } from "react";
import { fetchMeta } from "../api";

// ==========================================
// 🎛️ CONTROLS COMPONENT
// ==========================================
export default function Controls({
  model,
  setModel,
  year,
  setYear
}) {
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 📌 LOAD META (RUN ONLY ONCE)
  // ==========================================
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await fetchMeta();

        if (res) {
          const m = res.models || [];
          const y = res.years || [];

          setModels(m);
          setYears(y);

          // ✅ SAFE DEFAULTS
          if (!model && m.length > 0) {
            const firstModel =
              typeof m[0] === "string" ? m[0] : m[0].key;
            setModel(firstModel);
          }

          if (!year && y.length > 0) {
            setYear(String(y[0]));
          }
        }
      } catch (err) {
        console.error("❌ Error loading meta:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMeta();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // ⏳ LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="controls-container">
        <p className="status-text">Loading filters...</p>
      </div>
    );
  }

  // ==========================================
  // 🎨 UI
  // ==========================================
  return (
    <div className="controls-container">

      {/* MODEL */}
      <div className="control-group">
        <label>Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="control-input"
        >
          {models.map((m) => {
            const value =
              typeof m === "string" ? m : m.key;

            const label =
              typeof m === "string"
                ? m.toUpperCase()
                : m.label || m.key.toUpperCase();

            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      {/* YEAR */}
      <div className="control-group">
        <label>Year</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="control-input"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}