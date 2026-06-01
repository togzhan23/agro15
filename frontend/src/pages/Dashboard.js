import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import axios from 'axios';

const API = 'https://agroplatform.onrender.com';
const CROPS = ['wheat', 'barley', 'sunflower'];
const CROP_EMOJI  = { wheat: '🌾', barley: '🌿', sunflower: '🌻' };
const CROP_COLORS = { wheat: '#4ade80', barley: '#60a5fa', sunflower: '#fbbf24' };
const CROP_NAMES  = { wheat: 'Wheat', barley: 'Barley', sunflower: 'Sunflower' };

const BEST_R2    = { wheat: 0.810, barley: 0.818, sunflower: 0.9061 };
const BEST_MODEL = { wheat: 'SVR', barley: 'Lasso', sunflower: 'Stacking SVR×2' };
const BEST_MAE   = { wheat: 1.04,  barley: 1.14,   sunflower: 0.535 };
const BEST_MODEL_SUB = {
  wheat:     'Support Vector Regression (RBF kernel)',
  barley:    'Lasso Regression',
  sunflower: 'Stacking SVR×2 (RobustScaler + StandardScaler)',
};

// ── Hardcoded data from training graphs (1990–2025) ────────────────────────
const YEARS = [1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,
               2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,
               2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,
               2020,2021,2022,2023,2024,2025];

const ACTUAL = {
  wheat:     [4.2,2.0,6.3,6.0,4.0,4.3,4.3,4.3,4.0,5.5,5.8,12.0,12.3,5.5,6.2,5.1,7.0,8.5,4.0,13.9,6.0,7.0,4.0,11.9,10.6,9.1,10.0,10.0,11.1,8.0,9.0,12.0,9.5,4.0,11.0,14.0],
  barley:    [4.0,2.0,6.0,4.0,2.5,3.5,3.5,3.8,3.0,5.0,9.5,12.0,12.0,5.5,6.0,5.8,7.5,9.6,3.2,13.0,5.0,7.5,4.0,12.0,6.0,8.0,12.0,10.6,10.5,6.0,8.0,11.7,9.5,4.5,11.5,12.0],
  sunflower: [3.5,2.5,3.0,3.3,2,1.8,1.3,1.4,0.5,1.8,1.7,3.0,3.9,4.3,3.0,3.0,3.4,3.5,1.7,4.3,2.0,2.5,2.0,4.8,3.3,5.5,6.0,6.0,6.3,6.0,7.0,8.0,8.0,5.0,11.0,10.9],
};

// Wheat: SVR(best),
const WHEAT_LINES = {
  'SVR (R²=0.810)':   [4.0,3.0,4.5,5.0,4.0,5.0,4.5,5.0,2.5,6.0,6.0,11.0,10.0,7.5,6.0,8.0,7.0,8.0,4.0,11.0,6.0,6.5,5.0,12.0,8.0,9.0,12.0,9.0,12.5,9.5,8.0,9.0,9.4,6.5,11.5,11.0],
};

// Barley: Lasso(best)
const BARLEY_LINES = {
  'Lasso (R²=0.818)': [2.0,2.0,6.3,6.0,3.5,4.0,3.5,3.0,1.0,4.5,8.0,13.0,12.0,8.0,6.0,6.0,7.5,8.0,3.0,10.0,7.0,8.0,6.0,10.5,8.0,8.0,12.0,9.0,11.0,8.0,7.5,8.0,9.0,7.5,12.0,11.0],
};

// Sunflower: Stacking SVR×2(best), SVR RobustScaler, SVR StandardScaler
const SUNFLOWER_LINES = {
  'Stacking SVR×2 (R²=0.906)':    [3.5,1.5,3.0,3.8,2.0,1.5,1.1,1.0,0.5,1.8,2.0,3.0,3.0,2.8,2.8,3.0,3.0,4.0,2.0,4.0,2.0,3.5,2.0,5.0,3.5,5.5,6.0,6.5,7.5,7.1,7.0,7.0,7.5,7.5,10.0,11.0],
};

// Line styles per model key
const LINE_STYLES = {
  // Wheat
  'SVR (R²=0.810)':    { color: '#f97316', dash: '',      width: 2   },
  // Barley
  'Lasso (R²=0.818)':  { color: '#3b82f6', dash: '6 3',   width: 2   },
  // Sunflower
  'Stacking SVR×2 (R²=0.906)':    { color: '#10b981', dash: '',    width: 2   },
  'SVR RobustScaler (R²=0.897)':  { color: '#f97316', dash: '6 3', width: 1.5 },
  'SVR StandardScaler (R²=0.890)':{ color: '#3b82f6', dash: '4 2', width: 1.5 },
};

const MODEL_LINES = { wheat: WHEAT_LINES, barley: BARLEY_LINES, sunflower: SUNFLOWER_LINES };

function MetricCard({ label, value, unit, color, sub }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 24px', flex: 1,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: color || 'var(--accent)', fontWeight: 500 }}>
        {value ?? '—'}<span style={{ fontSize: 14, color: 'var(--text3)', marginLeft: 4 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, maxWidth: 240,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Year: {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong> c/ha
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [forecasts, setForecasts] = useState(null);
  const [crop, setCrop] = useState('wheat');

  useEffect(() => {
    axios.get(`${API}/forecasts`).then(r => setForecasts(r.data)).catch(() => {});
  }, []);

  const color  = CROP_COLORS[crop];
  const r2     = BEST_R2[crop];
  const lines  = MODEL_LINES[crop];

  // Build chart data: year + Actual + all model predictions
  const chartData = YEARS.map((y, i) => {
    const row = { year: y, Actual: ACTUAL[crop][i] };
    Object.entries(lines).forEach(([key, vals]) => { row[key] = vals[i]; });
    return row;
  });

  const compData = CROPS.map(c => ({
    crop: CROP_NAMES[c], model: BEST_MODEL[c], R2: BEST_R2[c],
  }));

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 36, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: 'var(--text3)', fontSize: 15 }}>
          Model performance — Pavlodar region (1990–2025)
        </p>
      </div>

      {/* Crop selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {CROPS.map(c => (
          <button key={c} onClick={() => setCrop(c)} style={{
            padding: '9px 22px', borderRadius: 100,
            background: crop === c ? CROP_COLORS[c] + '22' : 'var(--card)',
            color: crop === c ? CROP_COLORS[c] : 'var(--text2)',
            border: `1px solid ${crop === c ? CROP_COLORS[c] : 'var(--border)'}`,
            fontWeight: crop === c ? 700 : 400, fontSize: 14, cursor: 'pointer',
          }}>{CROP_EMOJI[c]} {CROP_NAMES[c]}</button>
        ))}
      </div>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <MetricCard label="R² Score"      value={r2}                            color={color} sub={`${BEST_MODEL[crop]} — coefficient of determination`} />
        <MetricCard label="Best Model"    value={BEST_MODEL[crop]}             color={color} sub={BEST_MODEL_SUB[crop]} />
        <MetricCard label="Forecast 2025" value={forecasts?.[crop]?.prediction} unit="ц/га"  color={color} sub="Best model prediction for 2025" />
        <MetricCard label="MAE"           value={BEST_MAE[crop]}               unit="c/ha"  color={color} sub="Mean absolute error" />
      </div>

      {/* Multi-model Actual vs Predicted chart */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Predicted vs Actual {CROP_NAMES[crop]} Yield (1990–2025)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>
              Best model: {BEST_MODEL[crop]} · R² = {r2} · MAE = {BEST_MAE[crop]} c/ha
            </p>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: 100,
            background: color + '18', border: `1px solid ${color}44`,
            fontSize: 12, fontWeight: 700, color,
          }}>
            R² = {r2}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="year" stroke="var(--text3)" tick={{ fontSize: 11 }}
              tickFormatter={v => v % 5 === 0 ? v : ''} />
            <YAxis stroke="var(--text3)" tick={{ fontSize: 12 }} unit=" c/ha" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

            {/* Actual — always thick black */}
            <Line
              type="monotone" dataKey="Actual"
              stroke="#111" strokeWidth={2.5}
              dot={{ r: 3, fill: '#111' }} activeDot={{ r: 5 }}
            />

            {/* Best model predicted line only */}
            {(() => {
              const bestKey = Object.keys(lines)[0];
              const s = LINE_STYLES[bestKey] || { color: '#f59e0b', dash: '6 3', width: 2 };
              return (
                <Line key={bestKey}
                  type="monotone" dataKey={bestKey}
                  stroke={s.color} strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 3, fill: s.color }} activeDot={{ r: 5 }}
                />
              );
            })()}
          </LineChart>
        </ResponsiveContainer>

        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7,
        }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>◈ About this chart: </span>
          Black line — recorded oblast-level yield. Coloured lines — model predictions.
          Best model: <strong>{BEST_MODEL[crop]}</strong> (R²={r2}, MAE={BEST_MAE[crop]} c/ha).
        </div>
      </div>

      {/* Best Model R² comparison */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 28,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Best Model R² — All Crops</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          Wheat (SVR): 0.810 · Barley (Lasso): 0.818 · Sunflower (Stacking SVR×2): 0.9061
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={compData} margin={{ top: 5, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="crop" stroke="var(--text3)" tick={{ fontSize: 13 }} />
            <YAxis domain={[0.6, 1]} stroke="var(--text3)" tick={{ fontSize: 12 }} />
            <ReferenceLine y={0.8} stroke="#f87171" strokeDasharray="4 3"
              label={{ value: 'Target 0.8', position: 'right', fontSize: 11, fill: '#f87171' }} />
            <Tooltip
              contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}
              formatter={(v, name, props) => [v, `R² · ${props.payload.model}`]}
            />
            <Bar dataKey="R2" radius={[6,6,0,0]} fill={color}
              label={{ position: 'top', fontSize: 13, fill: 'var(--text2)' }} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6, fontSize: 11, color: 'var(--text3)', paddingLeft: 40 }}>
          {compData.map(d => <span key={d.crop}>{d.model}</span>)}
        </div>
      </div>
    </div>
  );
}
