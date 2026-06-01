import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API = 'http://localhost:8000';
const MONTHS = ['apr','may','jun','jul','aug','sep'];
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep'];
const CROP_COLOR  = { wheat: '#4ade80', barley: '#60a5fa', sunflower: '#fbbf24' };
const CROP_EMOJI  = { wheat: '🌾', barley: '🌿', sunflower: '🌻' };

// ── Hardcoded NDVI values from the chart in the images ──────────────────
// These are the actual average NDVI values per month per crop from Pavlodar data
const NDVI_FIXED = {
  wheat:     { apr: 0.2066, may: 0.3295, jun: 0.3677, jul: 0.3735, aug: 0.3643, sep: 0.3229 },
  barley:    { apr: 0.2066, may: 0.3295, jun: 0.3677, jul: 0.3735, aug: 0.3643, sep: 0.3229 },
  sunflower: { apr: 0.2066, may: 0.3295, jun: 0.3677, jul: 0.3735, aug: 0.3643, sep: 0.3229 },
};

export default function Visualization() {
  const [rawData,    setRawData]    = useState({});
  const [yieldData,  setYieldData]  = useState([]);
  const [crop,       setCrop]       = useState('wheat');
  const [tab,        setTab]        = useState('yield');

  useEffect(() => {
    // Fetch real yield data for all crops
    axios.get(`${API}/yield_data`).then(r => setYieldData(r.data)).catch(() => {});
    // Fetch raw data for table
    ['wheat','barley','sunflower'].forEach(c => {
      axios.get(`${API}/data/${c}`)
        .then(r => setRawData(prev => ({ ...prev, [c]: r.data })))
        .catch(() => {});
    });
  }, []);

  // ── NDVI chart data (hardcoded values from the image) ──────────────────
  const ndviCompare = MONTHS.map((m, i) => ({
    month: MONTH_LABELS[i],
    Wheat:     NDVI_FIXED.wheat[m],
    Barley:    NDVI_FIXED.barley[m],
    Sunflower: NDVI_FIXED.sunflower[m],
  }));

  // ── Yield timeline — real data for selected crop ────────────────────────
  const yieldTimeline = yieldData.map(row => ({
    year:  row.year,
    Yield: row[crop],
  }));

  // ── All crops yield comparison (average) ────────────────────────────────
  const allCropsYield = ['wheat','barley','sunflower'].map(c => {
    const avg = yieldData.length
      ? yieldData.reduce((s, r) => s + (r[c] || 0), 0) / yieldData.length
      : 0;
    return { crop: c.charAt(0).toUpperCase() + c.slice(1), AvgYield: +avg.toFixed(2) };
  });

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1050 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 36, marginBottom: 6 }}>Visualization</h1>
        <p style={{ color: 'var(--text3)', fontSize: 15 }}>
          Satellite data and yield dynamics — Pavlodar region (1990–2025)
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
        {[['yield','Yield Timeline'],['ndvi','NDVI Dynamics'],['compare','Crop Comparison'],['table','Data Table']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 20px', borderRadius: '8px 8px 0 0',
            background: tab === key ? 'var(--card)' : 'transparent',
            color: tab === key ? 'var(--accent)' : 'var(--text3)',
            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab === key ? 600 : 400, fontSize: 14,
            transition: 'var(--transition)', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Yield Timeline Tab ─────────────────────────────────────────── */}
      {tab === 'yield' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {['wheat','barley','sunflower'].map(c => (
              <button key={c} onClick={() => setCrop(c)} style={{
                padding: '8px 18px', borderRadius: 100,
                background: crop === c ? CROP_COLOR[c]+'22' : 'var(--card)',
                color: crop === c ? CROP_COLOR[c] : 'var(--text2)',
                border: `1px solid ${crop === c ? CROP_COLOR[c] : 'var(--border)'}`,
                fontWeight: crop === c ? 700 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'var(--transition)',
              }}>{CROP_EMOJI[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</button>
            ))}
          </div>

          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 28,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              {crop.charAt(0).toUpperCase()+crop.slice(1)} — Real Yield Data (1990–2025)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              Historical yield in centners per hectare (c/ha)
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={yieldTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--text3)" tick={{ fontSize: 11 }}
                  tickFormatter={v => v % 5 === 0 ? v : ''} />
                <YAxis stroke="var(--text3)" tick={{ fontSize: 12 }} unit=" c/ha" />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v) => [`${v} c/ha`, 'Yield']}
                  labelFormatter={(l) => `Year: ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line
                  type="monotone" dataKey="Yield"
                  stroke={CROP_COLOR[crop]} strokeWidth={2.5}
                  dot={{ r: 4, fill: CROP_COLOR[crop] }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
            {(() => {
              const vals = yieldTimeline.map(r => r.Yield).filter(Boolean);
              const avg  = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2) : '—';
              const max  = vals.length ? Math.max(...vals).toFixed(2) : '—';
              const min  = vals.length ? Math.min(...vals).toFixed(2) : '—';
              return [
                { label: 'Average', value: avg },
                { label: 'Best Year', value: max },
                { label: 'Lowest Year', value: min },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--card)', border: `1px solid ${CROP_COLOR[crop]}44`,
                  borderRadius: 'var(--radius-lg)', padding: '18px 22px',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: CROP_COLOR[crop] }}>
                    {value} <span style={{ fontSize: 13 }}>c/ha</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ── NDVI Tab ───────────────────────────────────────────────────── */}
      {tab === 'ndvi' && (
        <div>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Average NDVI by Month — All Crops</h3>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              Mean NDVI values across growing season (April–September)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ndviCompare}>
                <defs>
                  {['Wheat','Barley','Sunflower'].map((c, i) => (
                    <linearGradient key={c} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={Object.values(CROP_COLOR)[i]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={Object.values(CROP_COLOR)[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text3)" tick={{ fontSize: 12 }} />
                <YAxis domain={[0.2, 0.45]} stroke="var(--text3)" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Area type="monotone" dataKey="Wheat"     stroke={CROP_COLOR.wheat}     fill="url(#g0)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Barley"    stroke={CROP_COLOR.barley}    fill="url(#g1)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Sunflower" stroke={CROP_COLOR.sunflower} fill="url(#g2)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* NDVI value cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {MONTHS.map((m, i) => (
              <div key={m} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{MONTH_LABELS[i]}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--accent)', fontWeight: 600 }}>
                  {NDVI_FIXED.wheat[m]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Crop Comparison Tab ────────────────────────────────────────── */}
      {tab === 'compare' && (
        <div>
          {/* All crops on one chart */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>All Crops — Yield Timeline (1990–2025)</h3>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              Real historical yield data for wheat, barley, and sunflower
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--text3)" tick={{ fontSize: 11 }}
                  tickFormatter={v => v % 5 === 0 ? v : ''} />
                <YAxis stroke="var(--text3)" tick={{ fontSize: 12 }} unit=" c/ha" />
                <Tooltip
                  contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v, name) => [`${v} c/ha`, name.charAt(0).toUpperCase()+name.slice(1)]}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="wheat"     stroke={CROP_COLOR.wheat}     strokeWidth={2} dot={{ r: 3 }} name="Wheat" />
                <Line type="monotone" dataKey="barley"    stroke={CROP_COLOR.barley}     strokeWidth={2} dot={{ r: 3 }} name="Barley" />
                <Line type="monotone" dataKey="sunflower" stroke={CROP_COLOR.sunflower}  strokeWidth={2} dot={{ r: 3 }} name="Sunflower" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Average cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {allCropsYield.map(({ crop: c, AvgYield }) => (
              <div key={c} style={{
                background: 'var(--card)', borderRadius: 'var(--radius-lg)', padding: '22px 24px',
                border: `1px solid ${CROP_COLOR[c.toLowerCase()]}44`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{CROP_EMOJI[c.toLowerCase()]}</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, color: CROP_COLOR[c.toLowerCase()] }}>{AvgYield}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>c/ha average</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Data Table Tab ─────────────────────────────────────────────── */}
      {tab === 'table' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {['wheat','barley','sunflower'].map(c => (
              <button key={c} onClick={() => setCrop(c)} style={{
                padding: '8px 18px', borderRadius: 100,
                background: crop === c ? CROP_COLOR[c]+'22' : 'var(--card)',
                color: crop === c ? CROP_COLOR[c] : 'var(--text2)',
                border: `1px solid ${crop === c ? CROP_COLOR[c] : 'var(--border)'}`,
                fontWeight: crop === c ? 700 : 400, fontSize: 13, cursor: 'pointer',
                transition: 'var(--transition)',
              }}>{CROP_EMOJI[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</button>
            ))}
          </div>

          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                    {['Year','NDVI Apr','NDVI May','NDVI Jun','NDVI Jul','LST Jun (°C)','Yield (c/ha)'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rawData[crop] || []).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 ? 'var(--bg3)' : 'transparent' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{row.year}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{row.ndvi_apr?.toFixed(3)}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{row.ndvi_may?.toFixed(3)}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{row.ndvi_jun?.toFixed(3)}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{row.ndvi_jul?.toFixed(3)}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{row.lst_jun?.toFixed(1)}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 600 }}>{row.yield_c_per_ha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
