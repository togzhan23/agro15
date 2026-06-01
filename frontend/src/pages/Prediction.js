import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'https://agroplatform.onrender.com';

const CROPS = ['wheat', 'barley', 'sunflower'];
const CROP_NAMES  = { wheat: 'Wheat', barley: 'Barley', sunflower: 'Sunflower' };
const CROP_ICONS  = { wheat: '🌾', barley: '🌿', sunflower: '🌻' };
const CROP_COLORS = { wheat: 'var(--accent)', barley: 'var(--blue)', sunflower: 'var(--gold)' };
const CROP_DESC   = {
  wheat:     'Main grain crop of Pavlodar region. Grown April–August.',
  barley:    'Drought-resistant cereal, key for livestock feed.',
  sunflower: 'Primary oilseed crop, heat-tolerant.',
};

const MODEL_LABELS = {
  svr:               'SVR',
  random_forest:     'Random Forest',
  linear_regression: 'Linear Regression',
  ridge_regression:  'Ridge Regression',
};

const SEVERITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };

function InfoRow({ label, value, highlight, mono }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14,
    }}>
      <span style={{ color: 'var(--text3)' }}>{label}</span>
      <span style={{
        color: highlight ? 'var(--accent)' : 'var(--text)',
        fontWeight: 500,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>{value}</span>
    </div>
  );
}

function RiskBadge({ level, score, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: color + '18', border: `1px solid ${color}44`,
      borderRadius: 100, padding: '6px 16px',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ color, fontWeight: 700, fontSize: 14 }}>{level} Risk</span>
      <span style={{ color: 'var(--text3)', fontSize: 12 }}>({score}/100)</span>
    </div>
  );
}

export default function Prediction() {
  const [crop,     setCrop]     = useState('wheat');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handlePredict = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.post(`${API}/smart_predict`, { crop });
      setResult(res.data);
    } catch {
      setError('Could not connect to backend. Make sure it is running on port 8000.');
    }
    setLoading(false);
  };

  const cropColor = CROP_COLORS[crop];

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: 100, padding: '5px 14px', marginBottom: 14, fontSize: 11,
          color: 'var(--accent)', letterSpacing: '0.1em', fontWeight: 700,
        }}>◈ INTELLIGENT PREDICTION ENGINE</div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 36, marginBottom: 8 }}>
          Smart Yield Forecast
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 15, maxWidth: 560 }}>
          Select a crop — the system automatically evaluates all 6 ML models,
          picks the best one, and delivers the 2025 forecast with a satellite-based risk assessment.
        </p>
      </div>



      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>

        {/* LEFT: crop selector + button */}
        <div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase', fontWeight: 600 }}>
              Step 1 — Select Crop
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {CROPS.map(c => (
                <button key={c} onClick={() => { setCrop(c); setResult(null); }} style={{
                  flex: 1, padding: '20px 10px', borderRadius: 'var(--radius)',
                  background: crop === c ? CROP_COLORS[c] + '15' : 'var(--bg3)',
                  border: `2px solid ${crop === c ? CROP_COLORS[c] : 'var(--border)'}`,
                  color: crop === c ? CROP_COLORS[c] : 'var(--text2)',
                  fontWeight: crop === c ? 700 : 400, fontSize: 14,
                  transition: 'var(--transition)', textAlign: 'center', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{CROP_ICONS[c]}</div>
                  {CROP_NAMES[c]}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius)' }}>
              {CROP_DESC[crop]}
            </div>
          </div>

          {/* How it works */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 22, marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase', fontWeight: 600 }}>
              Step 2 — System Does the Rest
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '◉', text: 'Loads NDVI+NDWI+EVI+LST+ERA satellite data (1990–2025) automatically' },
                { icon: '◈', text: 'Uses the best pre-trained model with the highest R² score (SVR for wheat, Lasso for barley, Stacking SVR×2 for sunflower)' },
                { icon: '⚡', text: 'Runs anomaly detection on latest satellite readings' },
                { icon: '✓', text: 'Returns prediction + risk level + recommendation' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13, color: 'var(--text2)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Predict button */}
          <button onClick={handlePredict} disabled={loading} style={{
            width: '100%', padding: '18px', borderRadius: 'var(--radius)',
            background: loading ? 'var(--border)' : cropColor,
            color: loading ? 'var(--text3)' : '#0b1a12',
            fontSize: 16, fontWeight: 700,
            transition: 'var(--transition)', cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
          }}>
            {loading
              ? '◌  Analysing satellite data…'
              : `◆  Get Best ${CROP_NAMES[crop]} Forecast`}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', color: 'var(--danger)', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* RIGHT: result panel */}
        <div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 28, position: 'sticky', top: 24,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>
              Prediction Result
            </div>

            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{CROP_ICONS[crop]}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  Click <strong style={{ color: 'var(--text2)' }}>Get Forecast</strong><br />
                  to run the intelligent prediction
                </div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 48, animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: 16 }}>◌</div>
                <div style={{ fontSize: 13 }}>Evaluating models…</div>
              </div>
            )}

            {result && (
              <div style={{ animation: 'fadeUp 0.4s ease' }}>

                {/* Prediction hero */}
                <div style={{
                  background: cropColor + '10',
                  border: `1px solid ${cropColor}33`,
                  borderRadius: 'var(--radius)', padding: '24px 20px',
                  textAlign: 'center', marginBottom: 20,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>
                    {result.crop_name} — {result.year}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 56, color: cropColor, fontWeight: 500, lineHeight: 1 }}>
                    {result.prediction}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 6 }}>ц/га</div>
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100,
                      background: cropColor + '22', color: cropColor,
                    }}>
                      Best model: {result.best_model_label}
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <InfoRow label="R² Score"  value={result.metrics?.r2}   highlight mono />
                <InfoRow label="MAE"       value={result.metrics?.mae != null ? result.metrics.mae + ' ц/га' : '—'} mono />
                <InfoRow label="RMSE"      value={result.metrics?.rmse != null ? result.metrics.rmse + ' ц/га' : '—'} mono />
                <InfoRow label="Best Model" value={result.best_model_label} />

                {/* Reasoning */}
                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>◈ How chosen: </span>
                  {result.reasoning}
                </div>

                {/* Model comparison mini */}
                {result.model_comparison && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>All Models R²</div>
                    {Object.entries(result.model_comparison).map(([m, ms]) => (
                      <div key={m} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: m === result.best_model ? 'var(--accent)' : 'var(--text3)', fontWeight: m === result.best_model ? 700 : 400 }}>
                            {m === result.best_model ? '★ ' : ''}{MODEL_LABELS[m]}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: m === result.best_model ? 'var(--accent)' : 'var(--text3)' }}>
                            {ms.r2}
                          </span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${Math.max(0, ms.r2) * 100}%`,
                            background: m === result.best_model ? cropColor : 'var(--border)',
                            borderRadius: 2, transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk assessment */}
                {result.risk_assessment && (
                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                   
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <RiskBadge
                        level={result.risk_assessment.risk_level}
                        score={result.risk_assessment.risk_score}
                        color={result.risk_assessment.risk_color}
                      />
                    </div>

                    {result.risk_assessment.risks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {result.risk_assessment.risks.map((r, i) => (
                          <div key={i} style={{
                            padding: '10px 12px',
                            background: SEVERITY_COLOR[r.severity] + '10',
                            border: `1px solid ${SEVERITY_COLOR[r.severity]}33`,
                            borderRadius: 'var(--radius)', fontSize: 12, lineHeight: 1.6,
                          }}>
                            <div style={{ fontWeight: 600, color: SEVERITY_COLOR[r.severity], marginBottom: 2 }}>
                              {r.type} — {r.month}
                            </div>
                            <div style={{ color: 'var(--text3)' }}>{r.message}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                        No significant anomalies detected.
                      </div>
                    )}

                    <div style={{
                      padding: '12px 14px', background: 'var(--bg3)',
                      borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text2)', lineHeight: 1.7,
                    }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Recommendation: </span>
                      {result.risk_assessment.recommendation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
