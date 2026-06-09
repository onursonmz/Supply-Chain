import { useState, useEffect } from 'react'
import { api } from '../services/api'

const RISK_MAP = {
  CRITICAL: { bg: '#fee2e2', color: '#991b1b', label: 'Kritik', border: '#fca5a5' },
  WARNING:  { bg: '#fef3c7', color: '#92400e', label: 'Uyarı',  border: '#fcd34d' },
  WATCH:    { bg: '#e0f2fe', color: '#075985', label: 'Takip',  border: '#7dd3fc' },
}

function RiskBadge({ level }) {
  const s = RISK_MAP[level] || { bg: '#eee', color: '#333', label: level }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color
    }}>{s.label}</span>
  )
}

export default function ExpiringMedicinesPage() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('ALL')
  const [search, setSearch]     = useState('')
  const [days, setDays]         = useState(90)

  function load() {
    setLoading(true); setError('')
    api.get(`/api/audit/expiring?days=${days}`)
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [days])

  const filtered = items.filter(i => {
    if (filter !== 'ALL' && i.riskLevel !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return i.medicineName?.toLowerCase().includes(q) ||
             i.batchNumber?.toLowerCase().includes(q) ||
             i.ownerName?.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    CRITICAL: items.filter(i => i.riskLevel === 'CRITICAL').length,
    WARNING:  items.filter(i => i.riskLevel === 'WARNING').length,
    WATCH:    items.filter(i => i.riskLevel === 'WATCH').length,
  }

  return (
    <div>
      <div className="page-header">
        <h1>Son Kullanım Takibi</h1>
        <p>Son kullanma tarihi yaklaşan ilaçların risk analizi</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center', border: '1px solid #fca5a5', cursor: 'pointer', background: filter === 'CRITICAL' ? '#fff5f5' : undefined }}
          onClick={() => setFilter(filter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e74c3c' }}>{counts.CRITICAL}</div>
          <div style={{ fontSize: '0.78rem', color: '#e74c3c', fontWeight: 600 }}>Kritik (&lt;30 gün)</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center', border: '1px solid #fcd34d', cursor: 'pointer', background: filter === 'WARNING' ? '#fffbeb' : undefined }}
          onClick={() => setFilter(filter === 'WARNING' ? 'ALL' : 'WARNING')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f39c12' }}>{counts.WARNING}</div>
          <div style={{ fontSize: '0.78rem', color: '#f39c12', fontWeight: 600 }}>Uyarı (30–60 gün)</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center', border: '1px solid #7dd3fc', cursor: 'pointer', background: filter === 'WATCH' ? '#f0f9ff' : undefined }}
          onClick={() => setFilter(filter === 'WATCH' ? 'ALL' : 'WATCH')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2980b9' }}>{counts.WATCH}</div>
          <div style={{ fontSize: '0.78rem', color: '#2980b9', fontWeight: 600 }}>Takip (60–90 gün)</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#17a589' }}>{items.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam Kayıt</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="İlaç adı, parti no veya sahip ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={30}>Son 30 gün</option>
          <option value={60}>Son 60 gün</option>
          <option value={90}>Son 90 gün</option>
          <option value={180}>Son 180 gün</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Yenile</button>
        {filter !== 'ALL' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter('ALL')}>× Filtreyi Kaldır</button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {filter !== 'ALL' ? `${RISK_MAP[filter]?.label} Uyarılar` : 'Tüm Son Kullanım Uyarıları'} ({filtered.length})
          </div>
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <div style={{ fontWeight: 600 }}>
              {items.length === 0 ? 'Son kullanım uyarısı yok' : 'Seçilen filtre için kayıt bulunamadı'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['İlaç Adı', 'Parti / Lot No', 'Mevcut Sahip', 'Rol', 'Miktar', 'Son Kullanım', 'Kalan Gün', 'Risk Durumu'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: item.riskLevel === 'CRITICAL' ? '#fff5f5'
                              : item.riskLevel === 'WARNING'  ? '#fffbeb'
                              : 'transparent'
                  }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{item.medicineName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.batchNumber}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{item.ownerName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ownerRole}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#2980b9' }}>{item.quantity}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.82rem' }}>{item.expiryDate}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{
                        fontWeight: 700,
                        color: item.daysLeft <= 30 ? '#e74c3c' : item.daysLeft <= 60 ? '#f39c12' : '#2980b9'
                      }}>
                        {item.daysLeft} gün
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><RiskBadge level={item.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .sidebar, .navbar, .page-header p, button { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  )
}
