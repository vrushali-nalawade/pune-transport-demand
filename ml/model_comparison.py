# ==========================================
# 📦 IMPORTS
# ==========================================
import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression

# ==========================================
# 📁 PATH SETUP
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

DATA_PATH = os.path.join(BASE_DIR, "data")
OUTPUT_PATH = DATA_PATH

# ==========================================
# 1. LOAD CENSUS DATA (2011)
# ==========================================
pop = pd.read_csv(
    os.path.join(DATA_PATH, "census-population-data-2011.csv"),
    header=[0,1]
)

pop.columns = [
    f"{c[0]}_{c[1]}" if c[1] != "" else c[0]
    for c in pop.columns
]

df = pd.DataFrame()

df["ward_raw"] = pop.iloc[:, 0]
df["population"] = pd.to_numeric(pop.iloc[:, 2], errors="coerce")
df["ward_name"] = pop.iloc[:, 21]

# 🔥 EXTRACT ward_no
df["ward_no"] = df["ward_raw"].str.extract(r'(\d+)')
df = df.dropna(subset=["ward_no", "population"])
df["ward_no"] = df["ward_no"].astype(int)

# ==========================================
# 2. LOAD FEATURES (FIXED)
# ==========================================
base = pd.read_csv(os.path.join(DATA_PATH, "pune_logistic_2021.csv"))

print("📊 Logistic columns:", base.columns.tolist())

# 🔥 AUTO HANDLE BOTH FORMATS
if "ward_no" in base.columns:
    base["ward_no"] = base["ward_no"].astype(int)

elif "Ward Name" in base.columns:
    base["ward_no"] = base["Ward Name"].astype(int)

else:
    raise ValueError("❌ No ward column found in logistic file")

base = base[[
    "ward_no",
    "bus_stop_count",
    "area_sqkm"
]]

# ==========================================
# 3. MERGE
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
# 5. TARGET (PROXY)
# ==========================================
growth_rate = 0.025
years = 15

df["target_population"] = df["population"] * ((1 + growth_rate) ** years)

# ==========================================
# 6. FEATURES
# ==========================================
features = [
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
# 7. BASELINE
# ==========================================
baseline_pred = (
    df.loc[X_test.index, "population"] * ((1 + growth_rate) ** years)
)

baseline_mae = mean_absolute_error(y_test, baseline_pred)
baseline_rmse = np.sqrt(mean_squared_error(y_test, baseline_pred))
baseline_r2 = r2_score(y_test, baseline_pred)

print("\n📊 BASELINE")
print("MAE:", baseline_mae)
print("RMSE:", baseline_rmse)
print("R2:", baseline_r2)

# ==========================================
# 8. MODELS
# ==========================================
models = {
    "RandomForest": RandomForestRegressor(n_estimators=200, random_state=42),
    "GradientBoosting": GradientBoostingRegressor(n_estimators=200),
    "LinearRegression": LinearRegression()
}

results = []
trained_models = {}

# ==========================================
# 9. TRAIN + EVALUATE
# ==========================================
for name, model in models.items():
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    trained_models[name] = model

# ==========================================
# 10. RESULTS
# ==========================================
results_df = pd.DataFrame(results).sort_values("R2", ascending=False)

print("\n🏆 MODEL COMPARISON")
print(results_df)

results_df.to_csv(os.path.join(OUTPUT_PATH, "model_comparison.csv"), index=False)

# ==========================================
# 11. BEST MODEL
# ==========================================
best_model_name = results_df.iloc[0]["Model"]
best_model = trained_models[best_model_name]

print(f"\n✅ BEST MODEL: {best_model_name}")

# ==========================================
# 12. FEATURE IMPORTANCE
# ==========================================
if hasattr(best_model, "feature_importances_"):
    importance = pd.DataFrame({
        "Feature": features,
        "Importance": best_model.feature_importances_
    }).sort_values("Importance", ascending=False)

    importance.to_csv(
        os.path.join(OUTPUT_PATH, "feature_importance.csv"),
        index=False
    )

# ==========================================
# 13. SAVE ML PREDICTIONS
# ==========================================
df["population_ml_2026"] = best_model.predict(X)

df[[
    "ward_no",
    "ward_name",
    "population",
    "population_ml_2026"
]].to_csv(
    os.path.join(OUTPUT_PATH, "pune_ml_population_predictions.csv"),
    index=False
)

# ==========================================
# 14. PLOTS (DASHBOARD READY)
# ==========================================
plt.figure()
plt.bar(results_df["Model"], results_df["RMSE"])
plt.title("Model Comparison (RMSE)")
plt.ylabel("RMSE")
plt.savefig(os.path.join(OUTPUT_PATH, "rmse_comparison.png"))

plt.figure()
plt.bar(results_df["Model"], results_df["R2"])
plt.title("Model Comparison (R²)")
plt.ylabel("R²")
plt.savefig(os.path.join(OUTPUT_PATH, "r2_comparison.png"))

print("\n✅ MODEL COMPARISON READY FOR DASHBOARD")