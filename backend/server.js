// ==========================================
// 📦 IMPORTS
// ==========================================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import demandRoutes from "./routes/demand.js";
import modelRoutes from "./routes/models.js";
import downloadRoutes from "./routes/download.js";
import metaRoutes from "./routes/meta.js";
import geoRoutes from "./routes/geo.js";
// ==========================================
// 🔐 CONFIG
// ==========================================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 🧱 MIDDLEWARE
// ==========================================

// ✅ CORS (allow frontend)
app.use(cors({
  origin: "*", // later restrict to your frontend URL
}));

// ✅ JSON parsing
app.use(express.json());

// ✅ REQUEST LOGGER (VERY IMPORTANT 🔥)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

app.use("/api/geo", geoRoutes);
// ==========================================
// 🚀 ROUTES
// ==========================================
app.use("/api/demand", demandRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/meta", metaRoutes);

// ==========================================
// 🏥 HEALTH CHECK (FOR DEPLOYMENT)
// ==========================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API is healthy 🚀",
    time: new Date()
  });
});

// ==========================================
// 🏠 ROOT
// ==========================================
app.get("/", (req, res) => {
  res.send("🚀 Pune Transport API is running");
});

// ==========================================
// ❌ 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

// ==========================================
// ⚠️ GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack);

  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

// ==========================================
// ▶ START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📊 API: http://localhost:${PORT}/api
❤️ Health: http://localhost:${PORT}/health
`);
});