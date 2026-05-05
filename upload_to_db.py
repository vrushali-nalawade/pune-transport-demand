# ==========================================
# 📦 IMPORTS
# ==========================================
import pandas as pd
import os
import json
from sqlalchemy import create_engine
from dotenv import load_dotenv

# ==========================================
# 🔐 ENV
# ==========================================
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found")

engine = create_engine(DATABASE_URL)

# ==========================================
# 📁 PATHS
# ==========================================
BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "data")
GEO_PATH = os.path.join(BASE_DIR, "geo", "pune.pre-2012.wards.geojson")

# ==========================================
# 🔥 STEP 1: LOAD CLEAN 2011 DATA
# ==========================================
csv_path = os.path.join(DATA_PATH, "census-population-data-2011.csv")

df = pd.read_csv(csv_path, skiprows=1)
df = df.iloc[1:].reset_index(drop=True)

df.columns = df.columns.str.lower().str.replace(" ", "_")

# extract correct columns
df = df[["ward_num", "ward_name"]].copy()

df.rename(columns={"ward_num": "ward_no"}, inplace=True)

df["ward_no"] = pd.to_numeric(df["ward_no"], errors="coerce")
df = df.dropna(subset=["ward_no"])
df["ward_no"] = df["ward_no"].astype(int)

# save clean ward table
df.to_sql("wards_2011", engine, if_exists="replace", index=False)
print("✅ wards_2011 uploaded")

# ==========================================
# 🧠 CREATE MAPPINGS
# ==========================================
no_to_name = dict(zip(df["ward_no"], df["ward_name"]))

def normalize(x):
    return str(x).lower().replace(" ", "").strip()

name_to_no = {
    normalize(v): k for k, v in no_to_name.items()
}

# ==========================================
# 🔥 STEP 2: LOAD GEOJSON
# ==========================================
with open(GEO_PATH, "r") as f:
    geo = json.load(f)

geo_rows = []

for feature in geo["features"]:
    props = feature["properties"]
    ward_no = props.get("wardnum")

    if ward_no:
        geo_rows.append({
            "ward_no": int(ward_no),
            "geometry": json.dumps(feature["geometry"])
        })

geo_df = pd.DataFrame(geo_rows)
geo_df.to_sql("wards_geo", engine, if_exists="replace", index=False)

print("✅ wards_geo uploaded")

# ==========================================
# 📂 STEP 3: ALL OTHER FILES
# ==========================================
files = {
    "rf_2021": "pune_rf_2021.csv",
    "rf_2026": "pune_rf_2026.csv",
    "rf_2030": "pune_rf_2030.csv",

    "cagr_2021": "pune_cagr_2021.csv",
    "cagr_2026": "pune_cagr_2026.csv",
    "cagr_2030": "pune_cagr_2030.csv",

    "logistic_2021": "pune_logistic_2021.csv",
    "logistic_2026": "pune_logistic_2026.csv",
    "logistic_2030": "pune_logistic_2030.csv",

    "demand_rf_2021": "demand_rf_2021.csv",
    "demand_rf_2026": "demand_rf_2026.csv",
    "demand_rf_2030": "demand_rf_2030.csv",

    "demand_cagr_2021": "demand_cagr_2021.csv",
    "demand_cagr_2026": "demand_cagr_2026.csv",
    "demand_cagr_2030": "demand_cagr_2030.csv",

    "demand_logistic_2021": "demand_logistic_2021.csv",
    "demand_logistic_2026": "demand_logistic_2026.csv",
    "demand_logistic_2030": "demand_logistic_2030.csv",

    "ml_population": "pune_ml_population_predictions.csv",
    "population_combined": "pune_population_combined_2011_2030.csv",

    "model_comparison": "model_comparison.csv",
    "demand_evaluation": "demand_model_evaluation.csv"
}

# ==========================================
# 🚀 STEP 4: UPLOAD + AUTO MAP
# ==========================================
for table, file in files.items():

    path = os.path.join(DATA_PATH, file)

    if not os.path.exists(path):
        print(f"⚠️ Missing: {file}")
        continue

    print(f"\n📤 Uploading {file} → {table}")

    temp_df = pd.read_csv(path)
    temp_df.columns = temp_df.columns.str.lower().str.replace(" ", "_")

    # ==========================================
    # 🔥 ADD ward_no + ward_name
    # ==========================================
    if "ward_no" in temp_df.columns:
        temp_df["ward_name"] = temp_df["ward_no"].map(no_to_name)

    elif "ward_name" in temp_df.columns:
        temp_df["key"] = temp_df["ward_name"].apply(normalize)
        temp_df["ward_no"] = temp_df["key"].map(name_to_no)
        temp_df.drop(columns=["key"], inplace=True)

    elif "ward" in temp_df.columns:
        temp_df["key"] = temp_df["ward"].apply(normalize)
        temp_df["ward_no"] = temp_df["key"].map(name_to_no)
        temp_df["ward_name"] = temp_df["ward_no"].map(no_to_name)
        temp_df.drop(columns=["key"], inplace=True)

    # ==========================================
    # 🚀 SAVE
    # ==========================================
    temp_df.to_sql(table, engine, if_exists="replace", index=False)

    print(f"✅ Done: {table}")

print("\n🔥 EVERYTHING UPLOADED + MAPPED SUCCESSFULLY")