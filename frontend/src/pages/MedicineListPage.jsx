import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicineService } from '../services/medicineService'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

function ExpiryBadge({ expiryDate }) {
  if (!expiryDate) return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
  const today   = new Date()
  const expiry  = new Date(expiryDate)
  const days    = Math.round((expiry - today) / 86400000)
  if (days < 0)  return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>Süresi Geçmiş</span>
  if (days <= 30) return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>{days}g</span>
  if (days <= 60) return <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>{days}g</span>
  return <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{expiryDate}</span>
}

function StockBar({ available, locked }) {
  const total = available + locked
  if (total === 0) return null
  const pct = Math.round((available / total) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3, minWidth: 40 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#2980b9', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  )
}

export default function MedicineListPage() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const navigate = useNavigate()
  const user = getUser()
  const role = user?.role || ''

  const canTransfer = ['MANUFACTURER_USER', 'DISTRIBUTOR_USER', 'ADMIN'].includes(role)
  const canDispense = ['PHARMACY_USER', 'ADMIN'].includes(role)
  const canCreate   = ['MANUFACTURER_USER', 'ADMIN'].includes(role)

  function load() {
    setLoading(true); setError('')
    medicineService.getInventory()
      .then(setBatches)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = batches.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return b.medicineName?.toLowerCase().includes(q) ||
           b.batchNumber?.toLowerCase().includes(q) ||
           b.gtin?.toLowerCase().includes(q) ||
           b.category?.toLowerCase().includes(q) ||
           b.strength?.toLowerCase().includes(q)
  })

  const totalStock = batches.reduce((sum, b) => sum + (b.availableCount || 0) + (b.lockedCount || 0), 0)
  const totalAvail = batches.reduce((sum, b) => sum + (b.availableCount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1>İlaç Envanteri</h1>
        <p>H2 parti envanteri — gerçek zamanlı stok durumu</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e3a5f' }}>{batches.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Parti Sayısı</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2980b9' }}>{totalStock}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam Adet</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#27ae60' }}>{totalAvail}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Transfere Hazır</div>
        </div>
        {totalStock - totalAvail > 0 && (
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f39c12' }}>{totalStock - totalAvail}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Transfer Sürecinde</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Envanter ({filtered.length} parti)</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="İlaç adı, parti no, GTIN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: '200px' }}
            />
            <button className="btn btn-ghost btn-sm" onClick={load}>↻ Yenile</button>
            {canCreate && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/medicines/batch/create')}>
                + Toplu Oluştur
              </button>
            )}
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💊</div>
            <div style={{ fontWeight: 600 }}>
              {batches.length === 0 ? 'Envanter boş' : 'Arama sonucu bulunamadı'}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {batches.length === 0 && canCreate
                ? 'İlaç eklemek için "Toplu Oluştur" butonunu kullanın.'
                : batches.length === 0
                ? 'Henüz hiç ilaç transferi yapılmamış.'
                : 'Farklı arama kriterleri deneyin.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['İlaç Adı', 'Parti / Lot No', 'Güç / Form', 'Kategori', 'Mevcut', 'Transfer Sürecinde', 'Doluluk', 'Son Kullanım', 'İşlemler'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const total = (b.availableCount || 0) + (b.lockedCount || 0)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{b.medicineName}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.batchNumber}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {b.strength || '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.category || '—'}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{ fontWeight: 700, color: b.availableCount === 0 ? '#e74c3c' : '#27ae60', fontSize: '1rem' }}>
                          {b.availableCount}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 3 }}>adet</span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        {b.lockedCount > 0
                          ? <span style={{ color: '#f39c12', fontWeight: 600 }}>{b.lockedCount} adet</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', minWidth: 80 }}>
                        <StockBar available={b.availableCount} locked={b.lockedCount} />
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <ExpiryBadge expiryDate={b.expiryDate} />
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {b.coldChainViolated && (
                            <span title="Bu partide soğuk zincir ihlali tespit edildi" style={{
                              background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5',
                              padding: '0.15rem 0.5rem', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700
                            }}>⚠ CC İhlal</span>
                          )}
                          {canTransfer && b.availableCount > 0 && (
                            <button className="btn btn-accent btn-sm"
                              style={{ background: '#2980b9', color: '#fff', border: 'none', fontSize: '0.78rem' }}
                              onClick={() => navigate(`/medicines/transfer?batch=${b.batchNumber}`)}>
                              Transfer Et
                            </button>
                          )}
                          {canDispense && b.availableCount > 0 && (
                            <button className="btn btn-accent btn-sm"
                              style={{ background: '#27ae60', color: '#fff', border: 'none', fontSize: '0.78rem' }}
                              onClick={() => navigate('/medicines/dispense')}>
                              Teslim Et
                            </button>
                          )}
                          {b.availableCount === 0 && !b.coldChainViolated && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stok tükendi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
