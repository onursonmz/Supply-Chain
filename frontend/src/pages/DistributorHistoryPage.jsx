import { useState, useEffect } from 'react'
import { transferRequestService } from '../services/transferRequestService'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

export default function DistributorHistoryPage() {
  const user = getUser()
  const isPharmacy = user?.role === 'PHARMACY_USER'
  const senderLabel = isPharmacy ? 'Dağıtıcı' : 'Üretici'
  const pageDesc    = isPharmacy
    ? 'Dağıtıcıdan kabul ettiğiniz tüm sevkiyatlar'
    : 'Üreticiden kabul ettiğiniz tüm sevkiyatlar'

  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [filterMedicine, setFilterMedicine] = useState('')
  const [filterSender, setFilterSender]     = useState('')

  function load() {
    setLoading(true); setError('')
    transferRequestService.getIncoming()
      .then(all => setRecords(all.filter(r => r.status === 'TRANSFERRED' || r.status === 'ACCEPTED')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const senders = [...new Set(records.map(r => r.fromOrganizationName).filter(Boolean))]

  const filtered = records.filter(r => {
    const q = filterMedicine.toLowerCase()
    const matchMed    = !q || r.medicineName?.toLowerCase().includes(q)
    const matchSender = !filterSender || r.fromOrganizationName === filterSender
    return matchMed && matchSender
  })

  // Group by date (dd.MM.yyyy)
  const grouped = {}
  for (const r of filtered) {
    const dateKey = r.dispatchedAt?.split(' ')[0] || r.acceptedAt?.split(' ')[0] || r.createdAt?.split(' ')[0] || '—'
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(r)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Alım Geçmişi</h1>
        <p>{pageDesc} — zaman sırasına göre</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="İlaç adına göre ara..."
          value={filterMedicine}
          onChange={e => setFilterMedicine(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select value={filterSender} onChange={e => setFilterSender(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">Tüm {senderLabel}ler</option>
          {senders.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Yenile</button>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {filtered.length} kayıt
        </span>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div className="spinner" /> : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <div style={{ fontWeight: 600 }}>Henüz kabul edilen sevkiyat yok</div>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => {
            const parseDate = s => {
              const [d, m, y] = s.split('.')
              return new Date(`${y}-${m}-${d}`)
            }
            return parseDate(b) - parseDate(a)
          })
          .map(([date, items]) => (
            <div key={date} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                padding: '0.4rem 0.75rem', background: 'var(--bg-secondary)',
                borderLeft: '3px solid #2980b9', borderRadius: '0 6px 6px 0',
                fontWeight: 600, fontSize: '0.85rem', color: '#2980b9', marginBottom: '0.5rem'
              }}>
                {date}
              </div>
              {items.map(r => (
                <div key={r.transferRequestId} className="card" style={{ marginBottom: '0.5rem', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {r.quantity} Adet {r.medicineName}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        {r.fromOrganizationName} &nbsp;·&nbsp; Parti: <span style={{ fontFamily: 'monospace' }}>{r.batchNumber}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.transferReferenceNo}</div>
                      {r.coldChainStatus && (
                        <span style={{
                          display: 'inline-block', marginTop: '0.25rem',
                          padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                          background: r.coldChainStatus === 'VALID' ? '#d1fae5' : '#fee2e2',
                          color: r.coldChainStatus === 'VALID' ? '#065f46' : '#991b1b'
                        }}>
                          {r.coldChainStatus === 'VALID' ? '❄ Soğuk Zincir OK' : '⚠ İhlal'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
      )}
    </div>
  )
}
