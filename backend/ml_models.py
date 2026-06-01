"""
ml_models.py — AgroPlatform 11
================================
Loads pre-trained models from models/ and data from Pavlodar_full_with_era5.csv.

Models:
  wheat     → SVR (wheat_svr_model.pkl, scaler, selector)  | R²=0.8098
  barley    → Lasso (barley_svr_model.pkl, scaler, selector) | R²=0.8185
  sunflower → Quadratic trend polynomial (coeffs in meta JSON) | R²=0.9061
"""

import json, joblib, warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

CROPS  = ["wheat", "barley", "sunflower"]
MONTHS = ["apr", "may", "jun", "jul", "aug", "sep"]
TARGET = "yield_c_per_ha"

# All possible satellite feature columns (ERA5 CSV has these)
SAT_FEATURES = [
    "ndvi_apr","ndvi_may","ndvi_jun","ndvi_jul","ndvi_aug","ndvi_sep",
    "evi_apr", "evi_may", "evi_jun", "evi_jul", "evi_aug", "evi_sep",
    "ndwi_apr","ndwi_may","ndwi_jun","ndwi_jul","ndwi_aug","ndwi_sep",
    "lst_apr", "lst_may", "lst_jun", "lst_jul", "lst_aug", "lst_sep",
    "precip_apr","precip_may","precip_jun","precip_jul","precip_aug","precip_sep",
    "temp_apr", "temp_may", "temp_jun", "temp_jul", "temp_aug", "temp_sep",
]

CROP_YIELD_COL = {
    "wheat":     "yield_wheat_c_ha",
    "barley":    "yield_barley_c_ha",
    "sunflower": "yield_sunflower_c_ha",
}

DATA_PATH = "data/Pavlodar_full_with_era5.csv"

loaded:        dict = {}
metrics_store: dict = {}

# ── Load CSV ──────────────────────────────────────────────────────────────
try:
    full_csv = pd.read_csv(DATA_PATH)
    print(f"[ml_models] Loaded {len(full_csv)} rows from {DATA_PATH}")
except FileNotFoundError:
    raise RuntimeError(f"[ml_models] '{DATA_PATH}' not found!")

# Keep only feature columns that exist in this CSV
AVAILABLE_FEATURES = [c for c in SAT_FEATURES if c in full_csv.columns]

# ── Load each crop ────────────────────────────────────────────────────────
for crop in CROPS:
    loaded[crop]        = {}
    metrics_store[crop] = {}

    # Build crop dataframe (satellite features + yield + year)
    df = full_csv[AVAILABLE_FEATURES + [CROP_YIELD_COL[crop], "year"]].copy()
    df = df.rename(columns={CROP_YIELD_COL[crop]: TARGET})
    df = df.sort_values("year").reset_index(drop=True)
    loaded[crop]["df"] = df

    # ── Load meta JSON ────────────────────────────────────────────────────
    with open(f"models/{crop}_model_meta.json") as f:
        meta = json.load(f)
    loaded[crop]["svr_meta"] = meta

    # ── Load model + scaler + selector (wheat and barley only) ───────────
    if crop in ("wheat", "barley"):
        loaded[crop]["svr"]          = joblib.load(f"models/{crop}_svr_model.pkl")
        loaded[crop]["svr_scaler"]   = joblib.load(f"models/{crop}_svr_scaler.pkl")
        loaded[crop]["svr_selector"] = joblib.load(f"models/{crop}_svr_selector.pkl")
        model_label = "SVR" if crop == "wheat" else "Lasso"
    else:
        # sunflower: quadratic polynomial trend only
        loaded[crop]["svr"]          = None
        loaded[crop]["svr_scaler"]   = None
        loaded[crop]["svr_selector"] = None
        model_label = "Quadratic Trend SVR"

    # ── Build chart trend predictions ─────────────────────────────────────
    years = df["year"].values

    if crop == "sunflower":
        # Quadratic polynomial: coeffs = [a, b, c] applied to year-index (0-based from 1990)
        coeffs = meta["coeffs"]
        base_year = int(years[0])
        trend_preds = [
            round(float(np.polyval(coeffs, yr - base_year)), 3)
            for yr in years
        ]
    else:
        # Linear trend: slope * year + intercept
        slope     = meta["slope"]
        intercept = meta["intercept"]
        trend_preds = [round(slope * y + intercept, 3) for y in years]

    loaded[crop]["svr_trend_preds"] = trend_preds

    # ── Metrics from meta JSON ────────────────────────────────────────────
    metrics_store[crop]["svr"] = {
        "r2":   meta["r2"],
        "mae":  meta.get("mae"),
        "rmse": meta.get("rmse"),
    }

    print(f"[ml_models] {crop} ({model_label}): R²={meta['r2']} | 2025={meta['prediction_2025']} ц/га")

print("[ml_models] ✓ All models loaded from pre-trained files.")
