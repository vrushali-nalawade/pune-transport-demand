# ==========================================
# 📦 IMPORTS
# ==========================================
import pandas as pd
import numpy as np
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

# ==========================================
# 📁 PATH SETUP
# ==========================================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data")
OUTPUT_PATH = DATA_PATH

# ==========================================
# 📂 LOAD HELPER
# ==========================================
def load(name):
    df = pd.read_csv(os.path.join(DATA_PATH, name))

    # 🔥 Ensure correct types
    df["ward_no"] = df["ward_no"].astype(int)
    df["population"] = pd.to_numeric(df["population"], errors="coerce")
    df["bus_stop_count"] = pd.to_numeric(df["bus_stop_count"], errors="coerce")

    return df

# ==========================================
# 1. LOAD DATA
# ==========================================
log_2021 = load("pune_logistic_2021.csv")
log_2026 = load("pune_logistic_2026.csv")
log_2030 = load("pune_logistic_2030.csv")

cagr_2021 = load("pune_cagr_2021.csv")
cagr_2026 = load("pune_cagr_2026.csv")
cagr_2030 = load("pune_cagr_2030.csv")

rf_2021 = load("pune_rf_2021.csv")
rf_2026 = load("pune_rf_2026.csv")
rf_2030 = load("pune_rf_2030.csv")

# ==========================================
# 2. FEATURE ENGINEERING
# ==========================================
def compute_features(df):
    df = df.copy()

    df["population_per_stop"] = (
        df["population"] /
        df["bus_stop_count"].replace(0, 1)
    )

    df["stops_per_10k"] = (
        df["bus_stop_count"] /
        df["population"].replace(0, 1)
    ) * 10000

    return df

# ==========================================
# 3. MODEL TRAINING PIPELINE
# ==========================================
datasets = {
    "logistic": (log_2021, log_2026, log_2030),
    "cagr": (cagr_2021, cagr_2026, cagr_2030),
    "rf": (rf_2021, rf_2026, rf_2030)
}

# ==========================================
# 4. TRAIN + GENERATE DEMAND
# ==========================================
for name, (df_2021, df_2026, df_2030) in datasets.items():

    df_2021 = compute_features(df_2021)
    df_2026 = compute_features(df_2026)
    df_2030 = compute_features(df_2030)

    features = [
        "population",
        "bus_stop_count",
        "stops_per_10k"
    ]

    # 🔥 Train on 2026
    X = df_2026[features]
    y = df_2026["population_per_stop"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=150,
        random_state=42
    )

    model.fit(X_train, y_train)

    print(f"\n✅ Trained demand model for {name}")

    # ==========================================
    # 🔥 GENERATE DEMAND FOR EACH YEAR
    # ==========================================
    year_map = {
        "2021": df_2021,
        "2026": df_2026,
        "2030": df_2030
    }

    for year, df in year_map.items():

        df = df.copy()

        df["predicted_demand"] = model.predict(df[features])

        # ==========================================
        # 💾 CLEAN OUTPUT (FINAL FORMAT)
        # ==========================================
        output = df[[
            "ward_no",
            "ward_name",
            "population",
            "bus_stop_count",
            "predicted_demand"
        ]].copy()

        # Sort for consistency
        output = output.sort_values("ward_no")

        # Save
        file_name = f"demand_{name}_{year}.csv"

        output.to_csv(
            os.path.join(OUTPUT_PATH, file_name),
            index=False
        )

        print(f"📦 Saved → {file_name}")

print("\n🎉 ALL DEMAND FILES GENERATED CLEANLY")