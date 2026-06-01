from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd

app = FastAPI(title="AgroPlatform 11")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CROPS  = ["wheat", "barley", "sunflower"]
MONTHS = ["apr", "may", "jun", "jul", "aug", "sep"]

CROP_NAMES = {
    "wheat":     "Wheat (Пшеница)",
    "barley":    "Barley (Ячмень)",
    "sunflower": "Sunflower (Подсолнечник)",
}

# Best model label per crop
BEST_MODEL_LABEL = {
    "wheat":     "SVR (Support Vector Regression)",
    "barley":    "Lasso Regression",
    "sunflower": "SVR Stacking + Quadratic Trend",
}

try:
    from ml_models import loaded, metrics_store
    print("[app] Models loaded OK")
except Exception as e:
    print(f"[app] WARNING: {e}")
    loaded = {}
    metrics_store = {}


# ── Risk assessment ──────────────────────────────────────────────────────
def compute_risk(crop: str, year: int = None) -> dict:
    df = loaded[crop]["df"]

    if year is not None:
        year_rows = df[df["year"] == year]
        if year_rows.empty:
            raise HTTPException(404, f"Year {year} not found in dataset")
        target_row = year_rows.iloc[0]
        historical = df[df["year"] != year]
        simulated  = True
    else:
        target_row = df.iloc[-1]
        historical = df.iloc[:-1]
        simulated  = False

    risks = []

    critical_months = {
        "wheat":     ["may", "jun"],
        "barley":    ["may", "jun"],
        "sunflower": ["jun", "jul"],
    }
    key_months = critical_months[crop]

    # ── NDVI check ──────────────────────────────────────────────────────
    for m in key_months:
        col = f"ndvi_{m}"
        if col not in df.columns:
            continue
        hist_mean = historical[col].mean()
        hist_std  = historical[col].std()
        z = (target_row[col] - hist_mean) / (hist_std + 1e-9)
        if z < -1.5:
            severity = "high" if z < -2.0 else "medium"
            risks.append({
                "type": "NDVI Deficit", "month": m.capitalize(),
                "value": round(float(target_row[col]), 4),
                "mean":  round(float(hist_mean), 4),
                "z_score": round(float(z), 2), "severity": severity,
                "message": f"NDVI in {m.capitalize()} is {abs(z):.1f}σ below historical mean — vegetation stress detected.",
            })
        elif z > 1.5:
            risks.append({
                "type": "NDVI Surplus", "month": m.capitalize(),
                "value": round(float(target_row[col]), 4),
                "mean":  round(float(hist_mean), 4),
                "z_score": round(float(z), 2), "severity": "low",
                "message": f"NDVI in {m.capitalize()} is {z:.1f}σ above mean — strong vegetation growth.",
            })

    # ── LST heat stress ──────────────────────────────────────────────────
    for m in ["jun", "jul"]:
        col = f"lst_{m}"
        if col not in df.columns:
            continue
        hist_mean = historical[col].mean()
        hist_std  = historical[col].std()
        z = (target_row[col] - hist_mean) / (hist_std + 1e-9)
        if z > 1.5:
            severity = "high" if z > 2.0 else "medium"
            risks.append({
                "type": "Heat Stress (LST)", "month": m.capitalize(),
                "value": round(float(target_row[col]), 2),
                "mean":  round(float(hist_mean), 2),
                "z_score": round(float(z), 2), "severity": severity,
                "message": f"Land Surface Temp in {m.capitalize()} is {z:.1f}σ above historical — heat stress risk.",
            })

    # ── NDWI water stress ───────────────────────────────────────────────
    for m in ["jun", "jul"]:
        col = f"ndwi_{m}"
        if col not in df.columns:
            continue
        hist_mean = historical[col].mean()
        hist_std  = historical[col].std()
        z = (target_row[col] - hist_mean) / (hist_std + 1e-9)
        if z < -1.5:
            severity = "high" if z < -2.0 else "medium"
            risks.append({
                "type": "Water Stress (NDWI)", "month": m.capitalize(),
                "value": round(float(target_row[col]), 4),
                "mean":  round(float(hist_mean), 4),
                "z_score": round(float(z), 2), "severity": severity,
                "message": f"NDWI in {m.capitalize()} is {abs(z):.1f}σ below mean — vegetation water deficit detected.",
            })

    # ── ERA5 precipitation check ─────────────────────────────────────────
    for m in key_months:
        col = f"precip_{m}"
        if col not in df.columns:
            continue
        hist_mean = historical[col].mean()
        hist_std  = historical[col].std()
        z = (target_row[col] - hist_mean) / (hist_std + 1e-9)
        if z < -1.5:
            severity = "high" if z < -2.0 else "medium"
            risks.append({
                "type": "Precipitation Deficit", "month": m.capitalize(),
                "value": round(float(target_row[col]), 2),
                "mean":  round(float(hist_mean), 2),
                "z_score": round(float(z), 2), "severity": severity,
                "message": f"Precipitation in {m.capitalize()} is {abs(z):.1f}σ below historical — drought risk.",
            })

    # ── 5-year NDVI trend ───────────────────────────────────────────────
    last5 = df.tail(6).iloc[:-1]
    ndvi_cols = [f"ndvi_{m}" for m in key_months if f"ndvi_{m}" in df.columns]
    if ndvi_cols:
        ndvi_trend_vals = last5[ndvi_cols].mean(axis=1).values
        if len(ndvi_trend_vals) >= 3:
            slope = np.polyfit(range(len(ndvi_trend_vals)), ndvi_trend_vals, 1)[0]
            if slope < -0.005:
                risks.append({
                    "type": "Declining NDVI Trend", "month": "5-year",
                    "value": round(float(slope), 5), "mean": 0, "z_score": 0,
                    "severity": "medium",
                    "message": f"NDVI declining over past 5 years (slope={slope:.4f}/yr).",
                })

    severity_weight = {"high": 30, "medium": 15, "low": 5}
    risk_score = min(100, sum(severity_weight.get(r["severity"], 0) for r in risks))

    if risk_score >= 50:
        risk_level, risk_color = "High",   "#f87171"
    elif risk_score >= 25:
        risk_level, risk_color = "Medium", "#fbbf24"
    else:
        risk_level, risk_color = "Low",    "#4ade80"

    if risk_level == "High":
        recommendation = "Significant stress signals detected. Consider drought-resistant varieties and additional irrigation."
    elif risk_level == "Medium":
        recommendation = "Moderate anomalies detected. Monitor crop development and consider supplemental irrigation."
    else:
        recommendation = "Satellite indicators are within normal range. Conditions are favourable for the predicted yield."

    satellite_values = {}
    for m in MONTHS:
        satellite_values[m] = {
            "ndvi":   round(float(target_row.get(f"ndvi_{m}",   0)), 4),
            "lst":    round(float(target_row.get(f"lst_{m}",    0)), 2),
            "ndwi":   round(float(target_row.get(f"ndwi_{m}",   0)), 4),
            "precip": round(float(target_row.get(f"precip_{m}", 0)), 2),
            "temp":   round(float(target_row.get(f"temp_{m}",   0)), 2),
        }

    return {
        "crop":             crop,
        "crop_name":        CROP_NAMES[crop],
        "year":             int(target_row["year"]),
        "simulated":        simulated,
        "risk_score":       risk_score,
        "risk_level":       risk_level,
        "risk_color":       risk_color,
        "risks":            risks,
        "recommendation":   recommendation,
        "anomaly_count":    len(risks),
        "satellite_values": satellite_values,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "AgroPlatform 11 running", "crops": CROPS}


@app.get("/metrics")
def get_metrics():
    return metrics_store


@app.get("/metrics/{crop}")
def get_metrics_crop(crop: str):
    if crop not in CROPS:
        raise HTTPException(404, f"Crop not found. Use: {CROPS}")
    return metrics_store[crop]


@app.get("/data/{crop}")
def get_data(crop: str):
    if crop not in CROPS:
        raise HTTPException(404, "Crop not found")
    return loaded[crop]["df"].to_dict(orient="records")


@app.get("/chart/{crop}")
def get_chart(crop: str):
    if crop not in CROPS:
        raise HTTPException(404, "Crop not found")
    df        = loaded[crop]["df"]
    meta      = loaded[crop]["svr_meta"]
    years     = df["year"].tolist()
    actual    = df["yield_c_per_ha"].tolist()
    predicted = loaded[crop]["svr_trend_preds"]
    return {
        "years":     years,
        "actual":    actual,
        "predicted": predicted,
        "r2":        meta["r2"],
        "ndvi_jun":  df["ndvi_jun"].tolist() if "ndvi_jun" in df.columns else [],
    }


@app.get("/chart/{crop}/{model}")
def get_chart_model(crop: str, model: str):
    if crop not in CROPS:
        raise HTTPException(404, "Crop not found")
    return get_chart(crop)


class SmartPredictRequest(BaseModel):
    crop: str


@app.post("/smart_predict")
def smart_predict(req: SmartPredictRequest):
    if req.crop not in CROPS:
        raise HTTPException(404, f"Crop not found. Use: {CROPS}")
    meta    = loaded[req.crop]["svr_meta"]
    metrics = metrics_store[req.crop]["svr"]
    model_label = BEST_MODEL_LABEL[req.crop]
    return {
        "crop":             req.crop,
        "crop_name":        CROP_NAMES[req.crop],
        "year":             2025,
        "prediction":       meta["prediction_2025"],
        "unit":             "ц/га",
        "best_model":       "svr",
        "best_model_label": model_label,
        "metrics":          metrics,
        "model_comparison": {"svr": metrics},
        "reasoning": (
            f"{model_label} is the best model for {req.crop}, "
            f"achieving R²={meta['r2']} on the training dataset (ERA5 + satellite features, 1990–2025)."
        ),
        "risk_assessment": compute_risk(req.crop),
    }


@app.get("/forecasts")
def forecasts():
    result = {}
    for crop in CROPS:
        meta    = loaded[crop]["svr_meta"]
        metrics = metrics_store[crop]["svr"]
        result[crop] = {
            "crop_name":  CROP_NAMES[crop],
            "prediction": meta["prediction_2025"],
            "unit":       "ц/га",
            "r2":         meta["r2"],
            "model":      "svr",
            "year":       2025,
        }
    return result


@app.get("/risk/{crop}")
def get_risk(crop: str):
    if crop not in CROPS:
        raise HTTPException(404, "Crop not found")
    return compute_risk(crop)


@app.get("/risk")
def get_all_risks():
    return {crop: compute_risk(crop) for crop in CROPS}


@app.get("/risk_year/{crop}/{year}")
def get_risk_year(crop: str, year: int):
    if crop not in CROPS:
        raise HTTPException(404, "Crop not found")
    return compute_risk(crop, year=year)


@app.get("/ndvi_stats")
def ndvi_stats():
    result = {}
    for crop in CROPS:
        df = loaded[crop]["df"]
        result[crop] = {
            m: round(float(df[f"ndvi_{m}"].mean()), 4)
            for m in MONTHS if f"ndvi_{m}" in df.columns
        }
    return result


@app.get("/yield_data")
def yield_data():
    """Returns historical yield data for all crops from the ERA5 CSV."""
    df = pd.read_csv("data/Pavlodar_full_with_era5.csv")
    result = []
    for _, row in df.iterrows():
        result.append({
            "year":      int(row["year"]),
            "wheat":     round(float(row["yield_wheat_c_ha"]), 4),
            "barley":    round(float(row["yield_barley_c_ha"]), 4),
            "sunflower": round(float(row["yield_sunflower_c_ha"]), 4),
        })
    return result


@app.get("/crop_info/{crop}")
def crop_info(crop: str):
    if crop not in CROPS:
        raise HTTPException(404, "Crop not found")
    meta = loaded[crop]["svr_meta"]
    return {
        "crop":            crop,
        "crop_name":       CROP_NAMES[crop],
        "best_model":      BEST_MODEL_LABEL[crop],
        "best_r2":         meta["r2"],
        "prediction_2025": meta["prediction_2025"],
        "unit":            "ц/га",
    }
