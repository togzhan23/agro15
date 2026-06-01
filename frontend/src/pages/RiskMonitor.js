import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'https://agroplatform.onrender.com';
const CROPS = ['wheat', 'barley', 'sunflower'];
const CROP_ICONS  = { wheat: '🌾', barley: '🌿', sunflower: '🌻' };
const CROP_COLORS = { wheat: '#4ade80', barley: '#60a5fa', sunflower: '#fbbf24' };
const SEVERITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' };

const TEST_YEARS = [
  { year: 2025, label: '2025 (current)', note: 'Normal conditions' },
  { year: 2023, label: '2023', note: 'Low yield year' },
  { year: 2008, label: '2008', note: 'Drought year' },
  { year: 1998, label: '1998', note: 'Very low yield' },
  { year: 1991, label: '1991', note: 'Worst wheat year' },
];

const MONTHS_SHORT = ['Apr','May','Jun','Jul','Aug','Sep'];
const MONTHS_KEY   = ['apr','may','jun','jul','aug','sep'];

// Hardcoded NDVI values per year (from satellite data, картинка)
const NDVI_OVERRIDE = {
  2025: { apr: 0.2066, may: 0.3295, jun: 0.3677, jul: 0.3735, aug: 0.3643, sep: 0.3229 },
  2023: { apr: 0.216,  may: 0.300,  jun: 0.310,  jul: 0.295,  aug: 0.324,  sep: 0.368  },
  2008: { apr: 0.230,  may: 0.323,  jun: 0.340,  jul: 0.303,  aug: 0.318,  sep: 0.340  },
  1998: { apr: -0.038, may: 0.223,  jun: 0.223,  jul: 0.237,  aug: 0.250,  sep: 0.238  },
  1991: { apr: 0.063,  may: 0.277,  jun: 0.263,  jul: 0.261,  aug: 0.308,  sep: 0.272  },
};


function RiskMeter({ score, color }) {
  const pct  = Math.min(100, Math.max(0, score));
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={110} height={110} viewBox="0 0 110 110">
      <circle cx={55} cy={55} r={r} fill="none" stroke="var(--bg3)" strokeWidth={10} />
      <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={55} y={51} textAnchor="middle" fill={color} fontSize={20} fontWeight={700}
        fontFamily="JetBrains Mono, monospace">{pct}</text>
      <text x={55} y={66} textAnchor="middle" fill="var(--text3)" fontSize={10}>/100</text>
    </svg>
  );
}

export default function RiskMonitor() {
  const [crop,        setCrop]        = useState('wheat');
  const [loading,     setLoading]     = useState(true);
  const [testYear,    setTestYear]    = useState(2025);
  const [testLoading, setTestLoading] = useState(false);
  const [detailRisk,  setDetailRisk]  = useState(null);

  const loadDetail = useCallback((c, y) => {
    setTestLoading(true);
    const url = y === 2025
      ? `${API}/risk/${c}`
      : `${API}/risk_year/${c}/${y}`;
    axios.get(url)
      .then(r => { setDetailRisk(r.data); setLoading(false); setTestLoading(false); })
      .catch(() => { setLoading(false); setTestLoading(false); });
  }, []);

  useEffect(() => {
    loadDetail(crop, testYear);
  }, [crop, testYear, loadDetail]);

  const satVals = detailRisk?.satellite_values;
  const risk = detailRisk;

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 36, marginBottom: 8 }}>
          Satellite Risk Monitor
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 15, maxWidth: 580 }}>
          Anomaly detection using NDVI, LST, and NDWI satellite indices.
          Readings are compared against 35 years of historical data to identify
          vegetation stress, heat events, and water deficit.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Loading risk data…</div>
      ) : (
        <>
          {/* Crop selector */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {CROPS.map(c => (
              <button key={c} onClick={() => setCrop(c)} style={{
                padding: '10px 24px', borderRadius: 100, fontSize: 14, cursor: 'pointer',
                background: crop === c ? CROP_COLORS[c] + '22' : 'var(--card)',
                color: crop === c ? CROP_COLORS[c] : 'var(--text2)',
                border: `1px solid ${crop === c ? CROP_COLORS[c] : 'var(--border)'}`,
                fontWeight: crop === c ? 700 : 400,
                transition: 'var(--transition)',
              }}>
                {CROP_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {/* Risk score hero */}
          {risk && (
            <div style={{
              background: 'var(--card)', border: `2px solid ${risk.risk_color}44`,
              borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 28,
            }}>
              <RiskMeter score={risk.risk_score} color={risk.risk_color} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>
                  {risk.crop_name} · {testYear}
                  {testYear !== 2025 && (
                    <span style={{ marginLeft: 10, color: '#fbbf24', fontWeight: 600 }}>⚠ Simulating {testYear}</span>
                  )}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  background: risk.risk_color + '18', border: `1px solid ${risk.risk_color}44`,
                  borderRadius: 100, padding: '5px 16px', fontSize: 15, fontWeight: 700,
                  color: risk.risk_color,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: risk.risk_color, display: 'inline-block' }} />
                  {risk.risk_level} Risk
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                  {risk.anomaly_count} anomalies detected
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.8, maxWidth: 340 }}>
                <strong style={{ color: 'var(--text2)', display: 'block', marginBottom: 4 }}>How the score is calculated:</strong>
                Checks NDVI, LST, NDWI against 35yr historical mean using Z-score (z &lt; −1.5σ = anomaly).
                Each anomaly adds points: High severity +30, Medium +15, Low +5. Max score = 100.
              </div>
            </div>
          )}

          {/* Test year bar */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>
              Test with historical year:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEST_YEARS.map(({ year, label, note }) => (
                <button key={year} onClick={() => setTestYear(year)} title={note}
                  style={{
                    padding: '6px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer',
                    background: testYear === year ? '#f87171' + '22' : 'var(--bg3)',
                    color: testYear === year ? '#f87171' : 'var(--text3)',
                    border: `1px solid ${testYear === year ? '#f87171' : 'var(--border)'}`,
                    fontWeight: testYear === year ? 700 : 400,
                    transition: 'var(--transition)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

            {/* Left */}
            <div>
              {/* Satellite values */}
              {satVals && (
                <div style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                    Satellite Index Values — {testYear}
                  </div>

                  {/* NDVI */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      NDVI — Vegetation Index
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                      {MONTHS_KEY.map((m, i) => {
                        const val = (NDVI_OVERRIDE[testYear] ?? {})[m] ?? satVals[m]?.ndvi ?? 0;
                        return (
                          <div key={m} style={{
                            background: 'var(--bg3)', borderRadius: 'var(--radius)',
                            padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border)',
                          }}>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{MONTHS_SHORT[i]}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#4ade80', fontWeight: 600 }}>
                              {val.toFixed(3)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* LST */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#f87171', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      LST — Land Surface Temperature (°C)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                      {MONTHS_KEY.map((m, i) => {
                        const val = satVals[m]?.lst ?? 0;
                        const isHot = val > 38;
                        return (
                          <div key={m} style={{
                            background: isHot ? 'rgba(248,113,113,0.08)' : 'var(--bg3)',
                            borderRadius: 'var(--radius)', padding: '10px 8px', textAlign: 'center',
                            border: `1px solid ${isHot ? '#f8717133' : 'var(--border)'}`,
                          }}>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{MONTHS_SHORT[i]}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: isHot ? '#f87171' : 'var(--text)', fontWeight: 600 }}>
                              {val.toFixed(1)}°
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* NDWI */}
                  <div>
                    <div style={{ fontSize: 11, color: '#60a5fa', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
                      NDWI — Water Index
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                      {MONTHS_KEY.map((m, i) => {
                        const val = satVals[m]?.ndwi ?? 0;
                        const isDry = val < -0.12;
                        return (
                          <div key={m} style={{
                            background: isDry ? 'rgba(96,165,250,0.08)' : 'var(--bg3)',
                            borderRadius: 'var(--radius)', padding: '10px 8px', textAlign: 'center',
                            border: `1px solid ${isDry ? '#60a5fa33' : 'var(--border)'}`,
                          }}>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{MONTHS_SHORT[i]}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: isDry ? '#60a5fa' : 'var(--text2)', fontWeight: 600 }}>
                              {val.toFixed(3)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Anomaly detection */}
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 28,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontFamily: 'var(--font-head)' }}>
                    Anomaly Detection — {testYear}
                  </h2>
                  {risk && (
                    <div style={{
                      padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                      background: risk.risk_color + '18', border: `1px solid ${risk.risk_color}44`,
                      color: risk.risk_color,
                    }}>
                      {risk.risk_level} · {risk.risk_score}/100
                    </div>
                  )}
                </div>

                {testLoading && (
                  <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Analysing…</div>
                )}

                {!testLoading && risk?.risks?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {risk.risks.map((r, i) => (
                      <div key={i} style={{
                        padding: '14px 16px',
                        background: SEVERITY_COLOR[r.severity] + '0d',
                        border: `1px solid ${SEVERITY_COLOR[r.severity]}33`,
                        borderRadius: 'var(--radius)',
                        borderLeft: `4px solid ${SEVERITY_COLOR[r.severity]}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ fontWeight: 700, color: SEVERITY_COLOR[r.severity], fontSize: 14 }}>
                            {r.type} — {r.month}
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                            background: SEVERITY_COLOR[r.severity] + '22',
                            color: SEVERITY_COLOR[r.severity], textTransform: 'uppercase',
                          }}>{r.severity}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 8 }}>{r.message}</div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                          {r.value !== undefined && (
                            <span style={{ color: 'var(--text2)' }}>
                              Value: <span style={{ fontFamily: 'var(--font-mono)', color: SEVERITY_COLOR[r.severity] }}>{r.value}</span>
                            </span>
                          )}
                          {r.mean !== undefined && r.mean !== 0 && (
                            <span style={{ color: 'var(--text2)' }}>
                              Hist. mean: <span style={{ fontFamily: 'var(--font-mono)' }}>{r.mean}</span>
                            </span>
                          )}
                          {r.z_score !== undefined && r.z_score !== 0 && (
                            <span style={{ color: 'var(--text2)' }}>
                              Z-score: <span style={{ fontFamily: 'var(--font-mono)' }}>{r.z_score}σ</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !testLoading && (
                  <div style={{
                    padding: '20px 18px', background: 'rgba(74,222,128,0.05)',
                    border: '1px solid rgba(74,222,128,0.15)', borderRadius: 'var(--radius)',
                    marginBottom: 20, fontSize: 14, color: 'var(--text3)',
                  }}>
                    ✓ No significant anomalies detected for {testYear}. All satellite indicators
                    (NDVI, LST, NDWI) are within normal historical range.
                  </div>
                )}

                {risk && (
                  <div style={{
                    padding: '16px 18px', background: 'var(--bg3)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, letterSpacing: '0.05em' }}>
                      ◈ RECOMMENDATION
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
                      {risk.recommendation}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: how it works */}
            <div>
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: 22, marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>How the score works</div>
                {[
                  ['Z-score',   'Compares value to 35yr mean ± σ. If z < −1.5 → anomaly flagged.'],
                  ['NDVI',      'Vegetation deficit in May/Jun (wheat, barley) or Jun/Jul (sunflower).'],
                  ['LST',       'Heat stress when Jun/Jul temperature is above historical norm.'],
                  ['NDWI',      'Water deficit when Jun/Jul water index is below historical norm.'],
                  ['5yr trend', 'Detects long-term NDVI decline over the past 5 years.'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 3 }}>◆ {k}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>{v}</div>
                  </div>
                ))}

                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, paddingTop: 4 }}>
                  <strong style={{ color: 'var(--text2)' }}>Score formula:</strong><br />
                  High anomaly = +30 pts<br />
                  Medium anomaly = +15 pts<br />
                  Low anomaly = +5 pts<br />
                  Maximum score = 100
                </div>
              </div>

              <div style={{
                background: 'var(--card)', border: '1px solid #fbbf2433',
                borderRadius: 'var(--radius-lg)', padding: 20,
              }}>
                <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 10 }}>
                  🧪 How to test
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.8 }}>
                  Click a historical year above to see how the system analyses real past conditions.
                  Try <strong style={{ color: 'var(--text2)' }}>1991</strong> or{' '}
                  <strong style={{ color: 'var(--text2)' }}>2008</strong> — these were real drought
                  years where the system detects genuine stress signals from the satellite data.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}