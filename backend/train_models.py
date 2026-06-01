"""
Train Random Forest, Linear Regression, Ridge Regression
for wheat, barley, sunflower crops.
Run once: python3 train_models.py
"""
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.model_selection import cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "ndvi_apr", "ndvi_may", "ndvi_jun", "ndvi_jul", "ndvi_aug", "ndvi_sep",
    "lst_apr",  "lst_may",  "lst_jun",  "lst_jul",  "lst_aug",  "lst_sep"
]
TARGET = "yield_c_per_ha"

CROPS = ["wheat", "barley", "sunflower"]

MODELS = {
    "random_forest":       RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42),
    "linear_regression":   LinearRegression(),
    "ridge_regression":    Ridge(alpha=1.0),
}

os.makedirs("models", exist_ok=True)
results = {}

for crop in CROPS:
    path = f"data/{crop}.csv"
    df = pd.read_csv(path)
    X = df[FEATURES].values
    y = df[TARGET].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    results[crop] = {}

    for model_name, model in MODELS.items():
        # Use scaled features for linear models
        if model_name in ("linear_regression", "ridge_regression"):
            X_use = X_scaled
        else:
            X_use = X

        model.fit(X_use, y)

        preds = model.predict(X_use)
        r2   = round(r2_score(y, preds), 4)
        mae  = round(mean_absolute_error(y, preds), 4)
        rmse = round(np.sqrt(mean_squared_error(y, preds)), 4)

        results[crop][model_name] = {"r2": r2, "mae": mae, "rmse": rmse}

        fname = f"models/{crop}_{model_name}.pkl"
        joblib.dump(model, fname)
        print(f"✅ {crop:12s} | {model_name:22s} | R²={r2:.3f}  MAE={mae:.3f}  RMSE={rmse:.3f}")

    # Save scaler per crop
    joblib.dump(scaler, f"models/{crop}_scaler.pkl")

print("\n✅ All models trained and saved to models/")
print(results)
