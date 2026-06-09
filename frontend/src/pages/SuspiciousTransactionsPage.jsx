import { useState, useEffect } from 'react'
import { api } from '../services/api'

const SEVERITY_MAP = {
  HIGH:   { bg: '#fee2e2', color: '#991b1b', icon: '🔴', label: 'Yüksek Risk' },
  MEDIUM: { bg: '#fef3c7', color: '#92400e', icon: '🟡', label: 'Orta Risk' },
  LOW:    { bg: '#e0f2fe', color: '#075985', icon: '🔵', label: 'Düşük Risk' },
}

const TYPE_MAP = {
  EXPIRED_IN_STOCK:    { label: 'Süresi Geçmiş Stok',       icon: '⏰' },
  MISSING_BATCH_NUMBER:{ label: 'Eksik Parti Numarası',      icon: '❓' },
  CANCELLED_TRANSFERS: { label: 'İptal Edilmiş Transferler', icon: '✕' },
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_MAP[severity] || { bg: '#eee', color: '#333', label: severity }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color
    }}>{s.label}</span>
  )
}

export default function SuspiciousTransactionsPage() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('ALL')

  function load() {
    setLoading(true); setError('')
    api.get('/api/audit/suspicious')
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = filter === 'ALL' ? items : items.filter(i => i.severity === filter)

  const counts = {
    HIGH:   items.filter(i => i.severity === 'HIGH').length,
    MEDIUM: items.filter(i => i.severity === 'MEDIUM').length,
    LOW:    items.filter(i => i.severity === 'LOW').length,
  }

  return (
    <div>
      <div className="page-header">
        <h1>Şüpheli / Kontrol Gerektiren Kayıtlar</h1>
        <p>Denetim kontrol listesi — potansiyel risk ve uyumsuzluk tespiti</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'HIGH',   label: 'Yüksek Risk', color: '#e74c3c', border: '#fca5a5' },
          { key: 'MEDIUM', label: 'Orta Risk',   color: '#f39c12', border: '#fcd34d' },
          { key: 'LOW',    label: 'Düşük Risk',  color: '#2980b9', border: '#7dd3fc' },
        ].map(s => (
          <div key={s.key} className="card" style={{
            flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center',
            border: `1px solid ${s.border}`, cursor: 'pointer',
            background: filter === s.key ? s.border + '33' : undefined
          }}
            onClick={() => setFilter(filter === s.key ? 'ALL' : s.key)}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{counts[s.key]}</div>
            <div style={{ fontSize: '0.78rem', color: s.color, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#17a589' }}>{items.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam Kayıt</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Yenile</button>
        {filter !== 'ALL' && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter('ALL')}>× Filtreyi Kaldır</button>
        )}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {filtered.length} kayıt gösteriliyor
        </span>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <div style={{ fontWeight: 600 }}>
            {items.length === 0 ? 'Şüpheli işlem tespit edilmedi' : 'Seçilen filtre için kayıt bulunamadı'}
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Tüm kontroller temiz görünüyor.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item, i) => {
            const sev  = SEVERITY_MAP[item.severity] || SEVERITY_MAP.LOW
            const type = TYPE_MAP[item.type] || { label: item.type, icon: '⚠' }
            return (
              <div key={i} className="card" style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${sev.color}`,
                background: sev.bg + '44'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{sev.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{type.icon} {type.label}</span>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <div style={{ fontSize: '0.88rem', marginBottom: '0.5rem' }}>{item.description}</div>
                    {(item.medicineName || item.batchNumber || item.ownerName) && (
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {item.medicineName && <span><strong>İlaç:</strong> {item.medicineName}</span>}
                        {item.batchNumber  && <span><strong>Parti:</strong> <span style={{ fontFamily: 'monospace' }}>{item.batchNumber}</span></span>}
                        {item.ownerName    && <span><strong>Sahip:</strong> {item.ownerName}</span>}
                        {item.quantity     && <span><strong>Miktar:</strong> {item.quantity}</span>}
                        {item.expiryDate   && <span><strong>Son Kullanım:</strong> {item.expiryDate}</span>}
                        {item.count        && <span><strong>Adet:</strong> {item.count}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
