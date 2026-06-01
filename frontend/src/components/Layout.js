import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/',             icon: '⌂', label: 'Home' },
  { to: '/dashboard',    icon: '◈', label: 'Dashboard' },
  { to: '/prediction',   icon: '◎', label: 'Prediction' },
  { to: '/risk',         icon: '⚡', label: 'Risk Monitor' },
  { to: '/visualization',icon: '◉', label: 'Visualization' },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: collapsed ? 64 : 224,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px 16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          minWidth: 224,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent3), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>◈</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, color: 'var(--accent)', lineHeight: 1.1 }}>AgroPlatform</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em' }}>PAVLODAR </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 12px', borderRadius: 'var(--radius)',
                marginBottom: 4, minWidth: 208,
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'rgba(74,222,128,0.08)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                transition: 'var(--transition)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              })}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

      

        <button onClick={() => setCollapsed(!collapsed)} style={{
          margin: '8px 8px 12px', padding: '10px 12px',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text3)',
          fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>

      <main style={{
        flex: 1,
        marginLeft: collapsed ? 64 : 224,
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}>
        {children}
      </main>
    </div>
  );
}
