// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState, useMemo } from "react";
import "./App.css";

import {
  fetchDemand,
  fetchModelComparison
} from "./api";

import MapView from "./components/MapView";
import Controls from "./components/Controls";
import Charts from "./components/Charts";

// ==========================================
// 🧠 MAIN APP
// ==========================================
function App() {
  const [model, setModel] = useState("rf");
  const [year, setYear] = useState("2026");

  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // 📊 FETCH DEMAND
  // ==========================================
  useEffect(() => {
    const loadDemand = async () => {
      setLoading(true);
      setError(null);

      const res = await fetchDemand(model, year);

      if (Array.isArray(res)) {
        setData(res);
        if (res.length === 0) {
          setError("No demand data available");
        }
      } else {
        setError("Failed to load demand data");
        setData([]);
      }

      setLoading(false);
    };

    loadDemand();
  }, [model, year]);

  // ==========================================
  // 📈 FETCH MODEL COMPARISON
  // ==========================================
  useEffect(() => {
    const loadModels = async () => {
      const res = await fetchModelComparison();
      setChartData(Array.isArray(res) ? res : []);
    };

    loadModels();
  }, []);

  // ==========================================
  // 📊 KPI CALCULATIONS
  // ==========================================
  const kpis = useMemo(() => {
    const totalPopulation = data.reduce(
      (sum, d) => sum + (Number(d.population) || 0),
      0
    );

    const avgDemand =
      data.length > 0
        ? data.reduce(
            (sum, d) => sum + (Number(d.predicted_demand) || 0),
            0
          ) / data.length
        : 0;

    const bestModel =
      chartData.length > 0
        ? [...chartData].sort((a, b) => a.RMSE - b.RMSE)[0]?.Model
        : "-";

    return {
      population: totalPopulation,
      avgDemand,
      bestModel
    };
  }, [data, chartData]);

  // ==========================================
  // 💡 INSIGHTS
  // ==========================================
  const insights = useMemo(() => {
    if (!data.length) {
      return ["No insights available (no data loaded)"];
    }

    const demands = data.map(d => Number(d.predicted_demand) || 0);

    return [
      `Highest demand: ${Math.max(...demands).toFixed(2)}`,
      `Lowest demand: ${Math.min(...demands).toFixed(2)}`,
      `Average demand: ${kpis.avgDemand.toFixed(2)}`
    ];
  }, [data, kpis]);

  // ==========================================
  // 🎨 UI
  // ==========================================
  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="app-title">
        🚍 Pune Transport Demand Dashboard
      </div>

      {/* CONTROLS */}
      <Controls
        model={model}
        setModel={setModel}
        year={year}
        setYear={setYear}
      />

      {/* STATUS */}
      <div className="status-text">
        {loading && <p>⏳ Loading demand data...</p>}
        {error && <p style={{ color: "#ff4d4d" }}>❌ {error}</p>}
      </div>

      {/* KPI CARDS */}
      <div className="kpi-container">
        <div className="kpi-card">
          <h3>Total Population</h3>
          <p>{kpis.population ? kpis.population.toLocaleString() : "--"}</p>
        </div>

        <div className="kpi-card">
          <h3>Avg Demand</h3>
          <p>{kpis.avgDemand ? kpis.avgDemand.toFixed(2) : "--"}</p>
        </div>

        <div className="kpi-card">
          <h3>Best Model</h3>
          <p>{kpis.bestModel}</p>
        </div>
      </div>

      {/* 🔥 MAIN DASHBOARD GRID */}
      <div className="dashboard-grid">

        {/* MAP */}
        <div className="map-container">
          {data.length > 0 ? (
            <MapView data={data} />
          ) : (
            <p className="status-text">
              Map will appear when demand data is available
            </p>
          )}
        </div>

        {/* CHART */}
        <div className="chart-container">
          {chartData.length > 0 ? (
            <Charts data={chartData} />
          ) : (
            <p className="status-text">
              No model comparison data available
            </p>
          )}
        </div>

      </div>

      {/* INSIGHTS */}
      <div className="insights-container">
        <h2>💡 Insights</h2>
        <ul>
          {insights.map((ins, i) => (
            <li key={i}>{ins}</li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;