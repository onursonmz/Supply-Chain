import { useState, useEffect } from 'react'
import { api } from '../services/api'

const STOCK_MAP = {
  CRITICAL: { bg: '#fee2e2', color: '#991b1b', label: 'Kritik Stok' },
  LOW:      { bg: '#fef3c7', color: '#92400e', label: 'Düşük Stok' },
  WATCH:    { bg: '#e0f2fe', color: '#075985', label: 'Takipte' },
}

function StockBadge({ status }) {
  const s = STOCK_MAP[status] || { bg: '#eee', color: '#333', label: status }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color
    }}>{s.label}</span>
  )
}

function StockMeter({ current, threshold }) {
  const pct = Math.min(100, Math.round((current / threshold) * 100))
  const color = pct <= 25 ? '#e74c3c' : pct <= 50 ? '#f39c12' : '#2980b9'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  )
}

export default function CriticalStockPage() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('ALL')
  const [search, setSearch]   = useState('')
  const [threshold, setThreshold] = useState(20)

  function load() {
    setLoading(true); setError('')
    api.get(`/api/audit/critical-stock?threshold=${threshold}`)
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [threshold])

  const filtered = items.filter(i => {
    if (filter !== 'ALL' && i.stockStatus !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return i.medicineName?.toLowerCase().includes(q) ||
             i.batchNumber?.toLowerCase().includes(q) ||
             i.ownerName?.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    CRITICAL: items.filter(i => i.stockStatus === 'CRITICAL').length,
    LOW:      items.filter(i => i.stockStatus === 'LOW').length,
    WATCH:    items.filter(i => i.stockStatus === 'WATCH').length,
  }

  return (
    <div>
      <div className="page-header">
        <h1>Kritik Stok Seviyeleri</h1>
        <p>Minimum stok eşiğinin altına düşen ilaçlar</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center', border: '1px solid #fca5a5', cursor: 'pointer', background: filter === 'CRITICAL' ? '#fff5f5' : undefined }}
          onClick={() => setFilter(filter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e74c3c' }}>{counts.CRITICAL}</div>
          <div style={{ fontSize: '0.78rem', color: '#e74c3c', fontWeight: 600 }}>Kritik (≤5)</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center', border: '1px solid #fcd34d', cursor: 'pointer', background: filter === 'LOW' ? '#fffbeb' : undefined }}
          onClick={() => setFilter(filter === 'LOW' ? 'ALL' : 'LOW')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f39c12' }}>{counts.LOW}</div>
          <div style={{ fontSize: '0.78rem', color: '#f39c12', fontWeight: 600 }}>Düşük (6–10)</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center', border: '1px solid #7dd3fc', cursor: 'pointer', background: filter === 'WATCH' ? '#f0f9ff' : undefined }}
          onClick={() => setFilter(filter === 'WATCH' ? 'ALL' : 'WATCH')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2980b9' }}>{counts.WATCH}</div>
          <div style={{ fontSize: '0.78rem', color: '#2980b9', fontWeight: 600 }}>Takip (11–{threshold - 1})</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#17a589' }}>{items.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam Kalem</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Min Eşik:</label>
          <select value={threshold} onChange={e => setThreshold(Number(e.target.value))}>
            <option value={10}>10 adet</option>
            <option value={20}>20 adet</option>
            <option value={30}>30 adet</option>
            <option value={50}>50 adet</option>
          </select>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Yenile</button>
        {filter !== 'ALL' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter('ALL')}>× Filtreyi Kaldır</button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {filter !== 'ALL' ? `${STOCK_MAP[filter]?.label} Kayıtları` : 'Tüm Kritik Stok Kalemleri'} ({filtered.length})
          </div>
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <div style={{ fontWeight: 600 }}>
              {items.length === 0 ? `${threshold} adetten düşük stok bulunamadı` : 'Seçilen filtre için kayıt bulunamadı'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['İlaç Adı', 'Parti No', 'Sahip', 'Rol', 'Mevcut', 'Min Eşik', 'Doluluk', 'Durum'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: item.stockStatus === 'CRITICAL' ? '#fff5f5'
                              : item.stockStatus === 'LOW'      ? '#fffbeb'
                              : 'transparent'
                  }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{item.medicineName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.batchNumber}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{item.ownerName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.ownerRole}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: item.currentQuantity <= 5 ? '#e74c3c' : item.currentQuantity <= 10 ? '#f39c12' : '#2980b9' }}>
                      {item.currentQuantity} adet
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>{item.minimumThreshold} adet</td>
                    <td style={{ padding: '0.65rem 0.75rem', minWidth: 100 }}>
                      <StockMeter current={item.currentQuantity} threshold={item.minimumThreshold} />
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><StockBadge status={item.stockStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
