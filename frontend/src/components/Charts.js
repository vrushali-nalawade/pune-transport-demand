// ==========================================
// 📦 IMPORTS
// ==========================================
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";

// ==========================================
// 🎨 COLORS (DARK RED THEME)
// ==========================================
const COLORS = {
  MAE: "#ff7a7a",
  RMSE: "#ff1f3d",
  R2: "#fca5a5",
  BEST: "#a855f7" // purple highlight
};

// ==========================================
// 📊 CUSTOM TOOLTIP (DARK)
// ==========================================
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const mae = payload.find(p => p.dataKey === "MAE")?.value || 0;
    const rmse = payload.find(p => p.dataKey === "RMSE")?.value || 0;
    const r2 = payload.find(p => p.dataKey === "R2")?.value || 0;

    return (
      <div style={{
        background: "#111827",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #1f2937",
        color: "#e5e7eb"
      }}>
        <strong>{label}</strong>
        <div>MAE: {mae.toFixed(2)}</div>
        <div>RMSE: {rmse.toFixed(2)}</div>
        <div>R²: {r2.toFixed(3)}</div>
      </div>
    );
  }
  return null;
};

// ==========================================
// 📊 CHART COMPONENT
// ==========================================
export default function Charts({ data }) {

  if (!data || data.length === 0) {
    return <p className="status-text">No chart data available</p>;
  }

  // 🔥 SORT BY BEST MODEL (LOWEST RMSE)
  const sortedData = [...data].sort((a, b) => a.RMSE - b.RMSE);
  const bestModel = sortedData[0]?.Model;

  return (
    <div className="chart-container">

      <h2 style={{ marginBottom: "15px" }}>
        📊 Model Comparison
      </h2>

      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
        >
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis 
            dataKey="Model"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
          />

          <YAxis tick={{ fill: "#9ca3af" }} />

          <Tooltip content={<CustomTooltip />} />

          <Legend wrapperStyle={{ color: "#e5e7eb" }} />

          {/* MAE */}
          <Bar dataKey="MAE" radius={[6, 6, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`mae-${index}`}
                fill={
                  entry.Model === bestModel
                    ? COLORS.BEST
                    : COLORS.MAE
                }
              />
            ))}
            <LabelList
              dataKey="MAE"
              position="top"
              formatter={(v) => v.toFixed(0)}
              fill="#9ca3af"
              fontSize={10}
            />
          </Bar>

          {/* RMSE */}
          <Bar dataKey="RMSE" radius={[6, 6, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`rmse-${index}`}
                fill={
                  entry.Model === bestModel
                    ? COLORS.BEST
                    : COLORS.RMSE
                }
              />
            ))}
            <LabelList
              dataKey="RMSE"
              position="top"
              formatter={(v) => v.toFixed(0)}
              fill="#9ca3af"
              fontSize={10}
            />
          </Bar>

          {/* R2 */}
          <Bar dataKey="R2" radius={[6, 6, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`r2-${index}`}
                fill={
                  entry.Model === bestModel
                    ? COLORS.BEST
                    : COLORS.R2
                }
              />
            ))}
            <LabelList
              dataKey="R2"
              position="top"
              formatter={(v) => v.toFixed(2)}
              fill="#9ca3af"
              fontSize={10}
            />
          </Bar>

        </BarChart>
      </ResponsiveContainer>

      {/* 🏆 BEST MODEL CARD */}
      <div style={{
        marginTop: "18px",
        padding: "12px",
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "10px",
        color: "#e5e7eb"
      }}>
        🏆 Best Model: <strong style={{ color: "#a855f7" }}>
          {bestModel}
        </strong>
      </div>

    </div>
  );
}