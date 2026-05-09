// ==========================================
// 📦 IMPORTS
// ==========================================
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ==========================================
// 🎨 COLOR SCALE
// ==========================================
const getColor = (d) => {
  if (d > 8000) return "#ff1f3d";
  if (d > 5000) return "#ff4d4d";
  if (d > 2000) return "#ff7a7a";
  if (d > 1000) return "#fca5a5";
  return "#fee2e2";
};

// ==========================================
// 🧠 GET WARD NUMBER FROM GEOJSON
// ==========================================
const getWardNo = (props) => {
  return (
    Number(props?.wardnum) ||
    Number(props?.WARD_NO) ||
    Number(props?.ward_no) ||
    null
  );
};

// ==========================================
// 🗺️ MAP COMPONENT
// ==========================================
export default function MapView({ data }) {
  const [geoData, setGeoData] = useState(null);
  const [geoError, setGeoError] = useState(false);

  // ==========================================
  // 📍 LOAD GEOJSON FROM BACKEND
  // ==========================================
  useEffect(() => {

  const API =
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000/api";

  fetch(`${API}/geo/wards`)
    .then((res) => res.json())
    .then((json) => {
      console.log("✅ GeoJSON loaded:", json.features.length);
      setGeoData(json);
    })
    .catch((err) => {
      console.error("❌ Geo fetch error:", err);
      setGeoError(true);
    });

}, []);
  // ==========================================
  // ⚠️ NO DATA
  // ==========================================
  if (!data || data.length === 0) {
    return (
      <div className="map-container">
        <p className="status-text">No map data available</p>
      </div>
    );
  }

  // ==========================================
  // 🧠 BUILD MAPS (🔥 FINAL FIX)
  // ==========================================
  const demandMap = {};
  const nameMap = {};
  const populationMap = {};

  data.forEach((d) => {
    const key = Number(d.ward_no);

    if (!isNaN(key)) {
      demandMap[key] = d.predicted_demand;
      nameMap[key] = d.ward;            // 🔥 FIX: use API name
      populationMap[key] = d.population;
    }
  });

  // ==========================================
  // 🎨 STYLE FUNCTION
  // ==========================================
  const style = (feature) => {
    const wardNo = getWardNo(feature.properties);
    const demand = demandMap[wardNo] || 0;

    return {
      fillColor: getColor(demand),
      weight: 1,
      color: "#1f2937",
      fillOpacity: 0.75
    };
  };

  // ==========================================
  // 🖱️ POPUP (🔥 FINAL FIX)
  // ==========================================
  const onEachFeature = (feature, layer) => {
    const wardNo = getWardNo(feature.properties);

    const wardName = nameMap[wardNo] || `Ward ${wardNo}`;
    const demand = demandMap[wardNo] || 0;
    const population = populationMap[wardNo] || 0;

    layer.bindPopup(`
      <strong>${wardName}</strong><br/>
      Ward No: ${wardNo ?? "N/A"}<br/>
      Population: ${population.toLocaleString()}<br/>
      Demand: ${demand.toFixed(2)}
    `);
  };

  // ==========================================
  // 🎨 UI
  // ==========================================
  return (
    <div className="map-container">

      {/* 🔥 LEGEND */}
      <div className="map-legend">
        <h4>Demand Levels</h4>
        <div><span style={{ background: "#fee2e2" }}></span> Very Low</div>
        <div><span style={{ background: "#fca5a5" }}></span> Low</div>
        <div><span style={{ background: "#ff7a7a" }}></span> Medium</div>
        <div><span style={{ background: "#ff4d4d" }}></span> High</div>
        <div><span style={{ background: "#ff1f3d" }}></span> Very High</div>
      </div>

      {/* ERROR */}
      {geoError && (
        <p style={{ color: "#ff4d4d", padding: "10px" }}>
          ❌ Failed to load GeoJSON
        </p>
      )}

      {/* LOADING */}
      {!geoData && !geoError && (
        <p style={{ color: "#9ca3af", padding: "10px" }}>
          Loading map...
        </p>
      )}

      {/* MAP */}
      <MapContainer
        center={[18.5204, 73.8567]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "520px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {geoData && (
          <GeoJSON
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}
