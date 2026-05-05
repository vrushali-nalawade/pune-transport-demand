# ==========================================
# 📦 IMPORTS
# ==========================================
import pandas as pd
import geopandas as gpd
import numpy as np
import os

# ==========================================
# 📁 PATH SETUP
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DATA_PATH = os.path.join(BASE_DIR, "data")
GEO_PATH = os.path.join(BASE_DIR, "geo")

# ==========================================
# 1. LOAD WARDS GEOJSON
# ==========================================
wards = gpd.read_file(
    os.path.join(GEO_PATH, "pune.pre-2012.wards.geojson")
).to_crs("EPSG:4326")

# 🔥 FIX: CREATE ward_no
if "wardnum" in wards.columns:
    wards["ward_no"] = wards["wardnum"].astype(int)
elif "ward_no" in wards.columns:
    wards["ward_no"] = wards["ward_no"].astype(int)
else:
    raise ValueError("❌ ward number not found in geojson")

wards = wards[wards["ward_no"] != 0]

# ==========================================
# 2. LOAD BUS STOPS
# ==========================================
bus_stops = gpd.read_file(
    os.path.join(DATA_PATH, "bus_stops.kml"),
    driver="KML"
).to_crs("EPSG:4326")

bus_with_wards = gpd.sjoin(
    bus_stops, wards, how="left", predicate="within"
)

bus_stop_counts = (
    bus_with_wards
    .dropna(subset=["ward_no"])
    .groupby("ward_no")
    .size()
    .reset_index(name="bus_stop_count")
)

# ==========================================
# 3. LOAD 2011 POPULATION
# ==========================================
pop = pd.read_csv(
    os.path.join(DATA_PATH, "census-population-data-2011.csv"),
    header=[0,1]
)

pop.columns = [
    f"{c[0]}_{c[1]}" if c[1] != "" else c[0]
    for c in pop.columns
]

clean = pd.DataFrame()
clean["ward_raw"] = pop.iloc[:, 0]
clean["population"] = pd.to_numeric(pop.iloc[:, 2], errors="coerce")
clean["ward_name"] = pop.iloc[:, 21]

# 🔥 EXTRACT ward_no
clean["ward_no"] = clean["ward_raw"].str.extract(r'(\d+)')
clean = clean.dropna(subset=["ward_no", "population"])
clean["ward_no"] = clean["ward_no"].astype(int)

df = clean[[
    "ward_no",
    "ward_name",
    "population"
]].copy()

# ==========================================
# 4. MERGE BUS STOPS
# ==========================================
df = df.merge(bus_stop_counts, on="ward_no", how="left")
df["bus_stop_count"] = df["bus_stop_count"].fillna(0).astype(int)

# ==========================================
# 5. AREA CALCULATION
# ==========================================
wards["area_sqkm"] = wards.geometry.to_crs(epsg=3857).area / 1e6

area_map = wards.set_index("ward_no")["area_sqkm"]

df["area_sqkm"] = df["ward_no"].map(area_map)
df["area_sqkm"] = df["area_sqkm"].fillna(df["area_sqkm"].mean())

# ==========================================
# 6. CLEAN
# ==========================================
df = df.dropna(subset=["population", "area_sqkm"])
df = df[df["population"] > 0]

df = df.sort_values("ward_no").reset_index(drop=True)

# ==========================================
# 7. POPULATION MODELS
# ==========================================
growth_rate = 0.025

def logistic(t, K, r, P0):
    A = (K - P0) / P0
    return K / (1 + A * np.exp(-r * t))

P0 = df["population"].sum()
K = P0 * 2.2
r = 0.025

years = list(range(2011, 2031))

cagr_list = []
logistic_list = []

# ==========================================
# 8. GENERATE DATA
# ==========================================
for year in years:
    t = year - 2011

    temp_cagr = df.copy()
    temp_log = df.copy()

    temp_cagr["year"] = year
    temp_log["year"] = year

    # CAGR
    temp_cagr["population"] = (
        df["population"] * ((1 + growth_rate) ** t)
    )

    # Logistic
    city_pop = logistic(t, K, r, P0)
    temp_log["population"] = (
        (df["population"] / P0) * city_pop
    )

    temp_cagr["model"] = "cagr"
    temp_log["model"] = "logistic"

    cagr_list.append(temp_cagr)
    logistic_list.append(temp_log)

cagr_df = pd.concat(cagr_list, ignore_index=True)
logistic_df = pd.concat(logistic_list, ignore_index=True)

# ==========================================
# 9. SAVE SNAPSHOTS (FIXED FORMAT)
# ==========================================
cols = [
    "ward_no",
    "ward_name",
    "bus_stop_count",
    "area_sqkm",
    "year",
    "population",
    "model"
]

for year in [2021, 2026, 2030]:
    cagr_df[cagr_df.year == year][cols].to_csv(
        os.path.join(DATA_PATH, f"pune_cagr_{year}.csv"),
        index=False
    )

    logistic_df[logistic_df.year == year][cols].to_csv(
        os.path.join(DATA_PATH, f"pune_logistic_{year}.csv"),
        index=False
    )

# ==========================================
# 10. SAVE FULL DATASETS
# ==========================================
cagr_df = cagr_df.sort_values(["ward_no", "year"])
logistic_df = logistic_df.sort_values(["ward_no", "year"])

cagr_df.to_csv(
    os.path.join(DATA_PATH, "pune_cagr_population_2011_2030.csv"),
    index=False
)

logistic_df.to_csv(
    os.path.join(DATA_PATH, "pune_logistic_population_2011_2030.csv"),
    index=False
)

combined_population = pd.concat([
    cagr_df,
    logistic_df
], ignore_index=True)

combined_population = combined_population.sort_values(["ward_no", "year"])

combined_population.to_csv(
    os.path.join(DATA_PATH, "pune_population_combined_2011_2030.csv"),
    index=False
)

print("\n✅ CAGR + LOGISTIC DATA GENERATED WITH ward_no + ward_name")