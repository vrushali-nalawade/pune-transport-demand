# ==========================================
# 📦 IMPORTS
# ==========================================
import pandas as pd
import numpy as np
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor

# ==========================================
# 📁 PATH SETUP
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DATA_PATH = os.path.join(BASE_DIR, "data")
MODEL_PATH = os.path.join(BASE_DIR, "ml")

# ==========================================
# 1. LOAD CENSUS DATA (2011)
# ==========================================
pop = pd.read_csv(
    os.path.join(DATA_PATH, "census-population-data-2011.csv"),
    header=[0, 1]
)

pop.columns = [
    f"{c[0]}_{c[1]}" if c[1] != "" else c[0]
    for c in pop.columns
]

df = pd.DataFrame()

df["ward_raw"] = pop.iloc[:, 0]
df["population_total"] = pd.to_numeric(pop.iloc[:, 2], errors="coerce")
df["ward_name"] = pop.iloc[:, 21]

# 🔥 EXTRACT ward_no
df["ward_no"] = df["ward_raw"].str.extract(r'(\d+)')
df = df.dropna(subset=["ward_no", "population_total"])
df["ward_no"] = df["ward_no"].astype(int)

df["population"] = df["population_total"]
df["year"] = 2011

# ==========================================
# 2. LOAD FEATURES (AUTO FIX)
# ==========================================
base = pd.read_csv(os.path.join(DATA_PATH, "pune_logistic_2021.csv"))

print("📊 Logistic columns:", base.columns.tolist())

# 🔥 HANDLE BOTH OLD + NEW FORMATS
if "ward_no" in base.columns:
    base["ward_no"] = base["ward_no"].astype(int)

elif "Ward Name" in base.columns:
    base["ward_no"] = base["Ward Name"].astype(int)

else:
    raise ValueError("❌ No ward column found in logistic file")

# Ensure required columns exist
required_cols = ["bus_stop_count", "area_sqkm"]
for col in required_cols:
    if col not in base.columns:
        raise ValueError(f"❌ Missing column in logistic file: {col}")

base = base[[
    "ward_no",
    "bus_stop_count",
    "area_sqkm"
]]

# ==========================================
# 3. MERGE FEATURES
# ==========================================
df = df.merge(base, on="ward_no", how="left")

df["bus_stop_count"] = df["bus_stop_count"].fillna(0)
df["area_sqkm"] = df["area_sqkm"].fillna(df["area_sqkm"].mean())

# ==========================================
# 4. FEATURE ENGINEERING
# ==========================================
df["population_density"] = df["population"] / df["area_sqkm"].replace(0, 1e-6)

df["stops_per_10k"] = (
    df["bus_stop_count"] / df["population"].replace(0, 1)
) * 10000

df["accessibility_score"] = (
    df["bus_stop_count"] / (df["population_density"] + 1)
) * 10000

# ==========================================
# 5. TARGET
# ==========================================
growth_multiplier = 1.45
df["target_population"] = df["population"] * growth_multiplier

# ==========================================
# 6. FEATURES
# ==========================================
features = [
    "population",
    "population_density",
    "bus_stop_count",
    "stops_per_10k",
    "accessibility_score"
]

X = df[features]
y = df["target_population"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ==========================================
# 7. TRAIN MODEL
# ==========================================
rf_model = RandomForestRegressor(
    n_estimators=200,
    random_state=42
)

rf_model.fit(X_train, y_train)

# ==========================================
# 8. EVALUATION
# ==========================================
preds = rf_model.predict(X_test)

mae = mean_absolute_error(y_test, preds)
rmse = np.sqrt(mean_squared_error(y_test, preds))
r2 = r2_score(y_test, preds)

print("\n📊 RANDOM FOREST PERFORMANCE")
print("MAE  :", mae)
print("RMSE :", rmse)
print("R²   :", r2)

# ==========================================
# 9. SAVE MODEL
# ==========================================
os.makedirs(MODEL_PATH, exist_ok=True)
joblib.dump(rf_model, os.path.join(MODEL_PATH, "rf_model.pkl"))

# ==========================================
# 10. GENERATE POPULATION
# ==========================================
df["population_2026"] = rf_model.predict(X)
df["population_2021"] = df["population"] * 1.25
df["population_2030"] = df["population_2026"] * 1.10

# ==========================================
# 11. CREATE YEAR DATASETS
# ==========================================
def create_year_df(year, pop_col):
    temp = df.copy()
    temp["year"] = year
    temp["population"] = temp[pop_col]
    temp["model"] = "rf"
    return temp

df_2021 = create_year_df(2021, "population_2021")
df_2026 = create_year_df(2026, "population_2026")
df_2030 = create_year_df(2030, "population_2030")

# ==========================================
# 12. CLEAN OUTPUT
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

df_2021 = df_2021[cols]
df_2026 = df_2026[cols]
df_2030 = df_2030[cols]

for d in [df_2021, df_2026, df_2030]:
    d.sort_values("ward_no", inplace=True)

# ==========================================
# 13. SAVE FILES
# ==========================================
df_2021.to_csv(os.path.join(DATA_PATH, "pune_rf_2021.csv"), index=False)
df_2026.to_csv(os.path.join(DATA_PATH, "pune_rf_2026.csv"), index=False)
df_2030.to_csv(os.path.join(DATA_PATH, "pune_rf_2030.csv"), index=False)

print("\n✅ RF DATASETS GENERATED WITH ward_no + ward_name")