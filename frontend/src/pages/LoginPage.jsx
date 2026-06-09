import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

const ROLE_META = {
  manufacturer: {
    icon: '🏭',
    label: 'Üretici',
    users: ['abc_pharma_user / 1234'],
  },
  distributor: {
    icon: '🚚',
    label: 'Distribütör',
    users: ['anadolu_user / 1234', 'ege_user / 1234'],
  },
  pharmacy: {
    icon: '🏥',
    label: 'Eczane',
    users: ['alsancak_user / 1234', 'bornova_user / 1234'],
  },
}

/* ── CSS Keyframes injected once ──────────────────────────────────────────── */
const STYLES = `
  @keyframes float-node {
    0%, 100% { transform: translateY(0px) scale(1); }
    33%       { transform: translateY(-14px) scale(1.08); }
    66%       { transform: translateY(6px) scale(0.94); }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(23,165,137,0.5); }
    70%  { box-shadow: 0 0 0 16px rgba(23,165,137,0); }
    100% { box-shadow: 0 0 0 0 rgba(23,165,137,0); }
  }
  @keyframes dash-flow {
    to { stroke-dashoffset: -20; }
  }
  @keyframes slide-in-right {
    from { transform: translateX(40px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes fade-up {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes count-up-anim {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  .bc-node-1 { animation: float-node 5s ease-in-out infinite, pulse-ring 3s ease-out infinite; }
  .bc-node-2 { animation: float-node 6.5s ease-in-out infinite 1s; }
  .bc-node-3 { animation: float-node 4.5s ease-in-out infinite 2s; }
  .bc-node-4 { animation: float-node 7s ease-in-out infinite 0.5s; }
  .bc-node-5 { animation: float-node 5.5s ease-in-out infinite 1.5s; }
  .login-card-anim { animation: slide-in-right 0.55s cubic-bezier(0.22,1,0.36,1) both; }
  .stat-num-anim   { animation: count-up-anim 0.8s ease both; }
  .feature-anim    { animation: fade-up 0.5s ease both; }
`

function injectStyles() {
  if (document.getElementById('login-page-styles')) return
  const el = document.createElement('style')
  el.id = 'login-page-styles'
  el.textContent = STYLES
  document.head.appendChild(el)
}

/* ── Blockchain SVG Visualization ─────────────────────────────────────────── */
function BlockchainViz() {
  const nodes = [
    { cx: 80,  cy: 60,  cls: 'bc-node-1', label: '🏭' },
    { cx: 220, cy: 40,  cls: 'bc-node-2', label: '📦' },
    { cx: 310, cy: 90,  cls: 'bc-node-3', label: '🚚' },
    { cx: 160, cy: 130, cls: 'bc-node-4', label: '🏥' },
    { cx: 280, cy: 150, cls: 'bc-node-5', label: '💊' },
  ]
  const lines = [
    [0, 1], [1, 2], [1, 3], [2, 4], [3, 4],
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '200px', marginBottom: '1.5rem' }}>
      <svg
        viewBox="0 0 370 200"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <style>{`
            .bc-dash {
              stroke: rgba(23,165,137,0.55);
              stroke-width: 1.5;
              stroke-dasharray: 6 4;
              fill: none;
              animation: dash-flow 1.2s linear infinite;
            }
          `}</style>
        </defs>
        {lines.map(([a, b], i) => (
          <line
            key={i}
            className="bc-dash"
            x1={nodes[a].cx} y1={nodes[a].cy}
            x2={nodes[b].cx} y2={nodes[b].cy}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <div
          key={i}
          className={n.cls}
          style={{
            position: 'absolute',
            left: `${(n.cx / 370) * 100}%`,
            top:  `${(n.cy / 200) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'rgba(23,165,137,0.18)',
            border: '1.5px solid rgba(23,165,137,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            backdropFilter: 'blur(4px)',
            zIndex: 2,
          }}
        >
          {n.label}
        </div>
      ))}
    </div>
  )
}

/* ── Stat Box ─────────────────────────────────────────────────────────────── */
function StatBox({ value, label, delay }) {
  return (
    <div
      className="stat-num-anim"
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        padding: '0.75rem 0.5rem',
        textAlign: 'center',
        animationDelay: delay,
      }}
    >
      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#17a589', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', marginTop: '4px', lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm]         = useState({ username: '', password: '' })
  const [nodeRole, setNodeRole] = useState(null)
  const [nodeInfo, setNodeInfo] = useState(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    injectStyles()
    authService.nodeInfo().then(d => {
      setNodeRole(d.nodeRole)
      setNodeInfo(d)
    }).catch(() => {})
  }, [])

  function fill(username, password) {
    setForm({ username, password })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await authService.login(form.username, form.password)
      sessionStorage.setItem('pharma_user', JSON.stringify(user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Kullanıcı adı veya şifre hatalı.')
    } finally {
      setLoading(false)
    }
  }

  const meta = nodeRole ? ROLE_META[nodeRole] : null

  /* ── Demo users list ── */
  const demoUsers = meta
    ? [
        ...meta.users.map(u => {
          const [un] = u.split(' / ')
          return { label: u, username: un.trim(), password: '1234' }
        }),
        { label: 'admin / admin1234 (herhangi bir node)', username: 'admin', password: 'admin1234' },
      ]
    : [
        { label: 'admin / admin1234', username: 'admin', password: 'admin1234' },
        { label: 'abc_pharma_user / 1234', username: 'abc_pharma_user', password: '1234' },
      ]

  const features = [
    'Blokzincir Koruması',
    'Uçtan Uca İzlenebilirlik',
    'Akıllı Sözleşme Doğrulama',
    'Gizlilik Korumalı Reçete (ZKP)',
  ]

  /* ── Outer container: full viewport, flex row ── */
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── LEFT HERO (55%) ── */}
      <div style={{
        width: '55%',
        minWidth: 0,
        background: 'linear-gradient(150deg, #0a1628 0%, #0f2035 45%, #1e3a5f 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2.5rem 3rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background circles */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(23,165,137,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,58,95,0.6) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* System badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(23,165,137,0.15)', border: '1px solid rgba(23,165,137,0.35)',
          borderRadius: '20px', padding: '0.35rem 0.9rem',
          color: '#4dd9bb', fontSize: '0.75rem', fontWeight: 600,
          marginBottom: '1.5rem', alignSelf: 'flex-start',
        }}>
          🏥 Türkiye İlaç Takip Sistemi
        </div>

        {/* Main title */}
        <h1 style={{
          color: '#fff', fontSize: '1.65rem', fontWeight: 900,
          lineHeight: 1.3, margin: '0 0 0.75rem',
          letterSpacing: '-0.02em',
        }}>
          Blockchain Tabanlı<br />İlaç Takip Platformu
        </h1>

        {/* Tagline */}
        <p style={{
          color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem',
          margin: '0 0 1.75rem', letterSpacing: '0.04em',
        }}>
          Güvenli &bull; Şeffaf &bull; İzlenebilir İlaç Hareketleri
        </p>

        {/* Blockchain visualization */}
        <BlockchainViz />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <StatBox value="12K+" label="İlaç Hareketi"   delay="0.1s" />
          <StatBox value="48"   label="Eczane Sayısı"   delay="0.25s" />
          <StatBox value="9"    label="Dağıtıcı Sayısı" delay="0.4s" />
        </div>

        {/* Feature list */}
        <ul style={{ listStyle: 'none', margin: '0 0 auto', padding: 0 }}>
          {features.map((f, i) => (
            <li
              key={f}
              className="feature-anim"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                color: 'rgba(255,255,255,0.78)', fontSize: '0.82rem',
                padding: '0.3rem 0',
                animationDelay: `${0.15 * i}s`,
              }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(23,165,137,0.2)', border: '1px solid #17a589',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: '#17a589', fontWeight: 900, flexShrink: 0,
              }}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Powered by badge */}
        <div style={{
          marginTop: '1.75rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px', padding: '0.3rem 0.7rem',
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600,
            letterSpacing: '0.05em',
          }}>
            ⛓ Powered by Corda R3 Blockchain
          </span>
        </div>
      </div>

      {/* ── RIGHT FORM (45%) ── */}
      <div style={{
        width: '45%',
        minWidth: 0,
        background: '#f4f7fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        overflowY: 'auto',
      }}>
        <div
          className="login-card-anim"
          style={{
            width: '100%',
            maxWidth: 400,
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            padding: '2.25rem 2rem',
            border: '1px solid #dde3ea',
          }}
        >
          {/* Logo area */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '0.35rem' }}>💊</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e3a5f', letterSpacing: '-0.01em' }}>
              PharmaChain
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7c93', marginTop: '2px' }}>
              İlaç Tedarik Zinciri Yönetimi
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eaedf1', marginBottom: '1.5rem' }} />

          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a2e4a', marginBottom: '0.2rem' }}>
            Sisteme Giriş
          </h2>
          <p style={{ fontSize: '0.77rem', color: '#6b7c93', marginBottom: '1.25rem' }}>
            Kimlik bilgilerinizi girerek devam edin
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fdf0ef', color: '#c0392b',
              border: '1px solid #f5c6c2', borderRadius: '8px',
              padding: '0.65rem 0.9rem', fontSize: '0.82rem',
              marginBottom: '1rem',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1a2e4a', marginBottom: '0.35rem' }}>
                Kullanıcı Adı
              </label>
              <input
                type="text"
                placeholder="Kullanıcı adınızı girin"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                style={{
                  width: '100%', padding: '0.6rem 0.85rem',
                  border: '1.5px solid #dde3ea', borderRadius: '8px',
                  fontSize: '0.85rem', color: '#1a2e4a', background: '#f8fafc',
                  outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#17a589'}
                onBlur={e => e.target.style.borderColor = '#dde3ea'}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#1a2e4a', marginBottom: '0.35rem' }}>
                Şifre
              </label>
              <input
                type="password"
                placeholder="Şifrenizi girin"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '0.6rem 0.85rem',
                  border: '1.5px solid #dde3ea', borderRadius: '8px',
                  fontSize: '0.85rem', color: '#1a2e4a', background: '#f8fafc',
                  outline: 'none', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#17a589'}
                onBlur={e => e.target.style.borderColor = '#dde3ea'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                background: loading ? '#a0c4bb' : '#17a589',
                color: '#fff', border: 'none', borderRadius: '9px',
                fontSize: '0.92rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, transform 0.1s',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#148a72' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#17a589' }}
            >
              {loading ? '⏳ Giriş yapılıyor…' : '🔐 Giriş Yap'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            margin: '1.25rem 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#eaedf1' }} />
            <span style={{ fontSize: '0.68rem', color: '#a0adb9', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Demo Kullanıcılar
            </span>
            <div style={{ flex: 1, height: '1px', background: '#eaedf1' }} />
          </div>

          {/* Demo users */}
          <div style={{
            background: '#f8fafc', borderRadius: '9px',
            border: '1px solid #dde3ea', padding: '0.6rem 0.75rem',
            fontSize: '0.75rem', color: '#6b7c93',
          }}>
            {meta && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                marginBottom: '0.5rem', fontWeight: 600, color: '#1a2e4a',
                fontSize: '0.72rem',
              }}>
                {meta.icon} {meta.label} Node
              </div>
            )}
            {demoUsers.map((u, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.25rem 0',
                borderBottom: i < demoUsers.length - 1 ? '1px solid #eaedf1' : 'none',
              }}>
                <span style={{ color: '#4a5568', fontSize: '0.73rem' }}>{u.label}</span>
                <button
                  type="button"
                  onClick={() => fill(u.username, u.password)}
                  style={{
                    padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.68rem',
                    fontWeight: 600, background: 'rgba(23,165,137,0.1)',
                    color: '#17a589', border: '1px solid rgba(23,165,137,0.25)',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '0.5rem',
                  }}
                >
                  Doldur
                </button>
              </div>
            ))}
          </div>

          {/* Node info chip */}
          {nodeInfo && (
            <div style={{
              marginTop: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              fontSize: '0.68rem', color: '#a0adb9',
            }}>
              <span style={{
                display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                background: '#17a589', flexShrink: 0,
              }} />
              {nodeInfo.nodeName || nodeInfo.nodeRole || 'Node'} bağlı
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.65rem', color: '#b0b8c4' }}>
            Corda R3 4.12 · Mezuniyet Projesi
          </div>
        </div>
      </div>
    </div>
  )
}
