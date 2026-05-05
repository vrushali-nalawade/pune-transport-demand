// ==========================================
// 📦 IMPORTS
// ==========================================
import axios from "axios";

// ==========================================
// 🌐 BASE CONFIG
// ==========================================
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

// ==========================================
// ⚙️ AXIOS INSTANCE
// ==========================================
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});

// ==========================================
// 🧠 REQUEST LOGGER
// ==========================================
api.interceptors.request.use((config) => {
  console.log(`➡️ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// ==========================================
// 🚨 RESPONSE LOGGER (VERY IMPORTANT)
// ==========================================
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Success:", response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error?.response?.status,
      error?.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// ==========================================
// ⚡ GENERIC REQUEST HANDLER
// ==========================================
const handleRequest = async (requestFn, fallback = null) => {
  try {
    const res = await requestFn();

    // 🔥 Handle both formats safely
    if (res.data && res.data.data) {
      return res.data.data;
    }

    return res.data;
  } catch (error) {
    return fallback;
  }
};

// ==========================================
// 📊 DEMAND API
// ==========================================
export const fetchDemand = async (model = "rf", year = "2026") => {
  return handleRequest(
    () =>
      api.get("/demand", {
        params: { model, year },
      }),
    []
  );
};

// ==========================================
// 📈 MODEL COMPARISON
// ==========================================
export const fetchModelComparison = async () => {
  return handleRequest(
    () => api.get("/models/comparison"),
    []
  );
};

// ==========================================
// 📊 MODEL EVALUATION
// ==========================================
export const fetchEvaluation = async () => {
  return handleRequest(
    () => api.get("/models/evaluation"),
    []
  );
};

// ==========================================
// 📌 META (MODELS + YEARS)
// ==========================================
export const fetchMeta = async () => {
  return handleRequest(
    () => api.get("/meta"),
    {
      models: [],
      years: []
    }
  );
};

// ==========================================
// 📥 DATASET LIST (OPTIONAL)
// ==========================================
export const fetchDatasets = async () => {
  return handleRequest(
    () => api.get("/download/list"), // 🔥 FIXED ENDPOINT
    []
  );
};

// ==========================================
// 📈 POPULATION TRENDS
// ==========================================
// ⚠️ Only call when backend exists
export const fetchPopulationTrends = async () => {
  return handleRequest(
    () => api.get("/population/trends"),
    []
  );
};

// ==========================================
// 📥 DOWNLOAD CSV
// ==========================================
export const downloadCSV = (table) => {
  window.open(`${BASE_URL}/download/${table}`, "_blank");
};