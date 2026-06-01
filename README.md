# AgroPlatform 7 — Intelligent Crop Yield Prediction System

**Diploma 2026 — Astana IT University**

## Key facts
- SVR is the best model for ALL crops (confirmed by training)
- R² values are taken directly from pre-trained models (models_and_harvest):
  - Wheat SVR: R² = 0.7721, forecast 2025 = 13.54 ц/га
  - Barley SVR: R² = 0.7836, forecast 2025 = 12.15 ц/га  
  - Sunflower SVR: R² = 0.8886, forecast 2025 = 10.28 ц/га

## Run
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```
```bash
cd frontend
npm install && npm start
```

## Data
`backend/data/Pavlodar_full_with_era5.csv` — 36 years, Pavlodar Oblast
