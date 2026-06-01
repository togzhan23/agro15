import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:8000';
const CROP_ICONS  = { wheat: '🌾', barley: '🌿', sunflower: '🌻' };
const CROP_COLORS = { wheat: 'var(--accent)', barley: 'var(--blue)', sunflower: 'var(--gold)' };
const MODEL_LABELS = {
  svr: 'SVR', random_forest: 'Random Forest',
  linear_regression: 'Linear Reg', ridge_regression: 'Ridge',
};

export default function Home() {
  const nav = useNavigate();
  const [forecasts, setForecasts] = useState(null);
  const [risks, setRisks]         = useState(null);

  useEffect(() => {
    axios.get(`${API}/forecasts`).then(r => setForecasts(r.data)).catch(() => {});
    axios.get(`${API}/risk`).then(r => setRisks(r.data)).catch(() => {});
  }, []);

  const STATS = [
    { value: '3',       label: 'Crop Types',      icon: '◈' },
    { value: '6',       label: 'ML Models',        icon: '◈' },
    { value: '35yr',    label: 'Training Data',    icon: '◈' },
    { value: 'R²0.9',  label: 'Best Accuracy',   icon: '◈' },
  ];

  return (
    <div style={{ padding: '48px 48px 64px', maxWidth: 980, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
       

        <h1 style={{
          fontFamily: 'var(--font-head)',
          fontSize: 'clamp(36px, 5vw, 54px)',
          lineHeight: 1.1, color: 'var(--text)', marginBottom: 20,
        }}>
          Intelligent Crop Yield<br />
          <span style={{ color: 'var(--accent)' }}>Prediction System</span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 560, lineHeight: 1.8, marginBottom: 36 }}>
          Predicting wheat, barley, and sunflower yields for the{' '}
          <strong style={{ color: 'var(--text)' }}>Pavlodar region of Kazakhstan</strong>{' '}
          using satellite remote sensing (NDVI, LST, EVI, LST, ERA) and machine learning.
          The system auto-selects the best model and monitors crop risk with risk detection.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={() => nav('/prediction')} style={{
            padding: '14px 28px', borderRadius: 'var(--radius)',
            background: 'var(--accent)', color: '#0b1a12', fontWeight: 700, fontSize: 15,
          }}>◆ Run Smart Prediction →</button>
          <button onClick={() => nav('/risk')} style={{
            padding: '14px 28px', borderRadius: 'var(--radius)',
            background: 'rgba(248,113,113,0.1)', color: '#f87171',
            border: '1px solid rgba(248,113,113,0.3)', fontWeight: 600, fontSize: 15,
          }}>⚡ View Risk Monitor</button>
          <button onClick={() => nav('/dashboard')} style={{
            padding: '14px 28px', borderRadius: 'var(--radius)',
            background: 'transparent', color: 'var(--text)',
            border: '1px solid var(--border)', fontWeight: 500, fontSize: 15,
          }}>Dashboard</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '24px 20px',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--accent)', fontWeight: 500 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live forecasts + risks side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Forecasts */}
        {forecasts && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 19, marginBottom: 18 }}>
              2025 Yield Forecasts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(forecasts).map(([crop, data]) => (
                <div key={crop} onClick={() => nav('/prediction')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'var(--bg3)',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'var(--transition)',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = CROP_COLORS[crop]}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{CROP_ICONS[crop]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{data.crop_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {crop === 'barley' ? 'Lasso' : 'SVR'} · R² {data.r2}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: CROP_COLORS[crop] }}>
                      {data.prediction}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>ц/га</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk overview */}
        {risks && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 19, marginBottom: 18 }}>
              Risk Overview
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(risks).map(([crop, r]) => (
                <div key={crop} onClick={() => nav('/risk')} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'var(--bg3)',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'var(--transition)',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = r.risk_color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{CROP_ICONS[crop]}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{crop.charAt(0).toUpperCase()+crop.slice(1)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {r.anomaly_count} anomalies detected
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: r.risk_color + '18', border: `1px solid ${r.risk_color}44`,
                    borderRadius: 100, padding: '5px 12px', fontSize: 12, fontWeight: 700,
                    color: r.risk_color,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.risk_color, display: 'inline-block' }} />
                    {r.risk_level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    
    </div>
  );
}
