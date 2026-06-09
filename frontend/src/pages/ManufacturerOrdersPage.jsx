import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'

const STATUS_TR = {
  PENDING:  { label: 'Bekliyor',   bg: '#fff3cd', color: '#856404' },
  APPROVED: { label: 'Onaylandı',  bg: '#d1e7dd', color: '#0a3622' },
  REJECTED: { label: 'Reddedildi', bg: '#f8d7da', color: '#842029' },
}

function StatusPill({ status }) {
  const s = STATUS_TR[status] || { label: status, bg: '#eee', color: '#333' }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 20,
      fontSize: '0.73rem', fontWeight: 600, background: s.bg, color: s.color
    }}>{s.label}</span>
  )
}

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

export default function ManufacturerOrdersPage() {
  const user = getUser()
  const isDistributor = user?.role === 'DISTRIBUTOR_USER'
  const pageTitle = isDistributor ? 'Eczaneden Gelen Siparişler' : 'Dağıtıcıdan Gelen Siparişler'
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionId, setActionId]     = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [filter, setFilter]         = useState('ALL')

  function load() {
    setLoading(true); setError('')
    orderService.getIncoming()
      .then(setOrders)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleApprove(id) {
    setActionId(id)
    try {
      await orderService.approve(id)
      load()
    } catch (e) {
      setError('Onaylama başarısız: ' + e.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(id) {
    setActionId(id)
    try {
      await orderService.reject(id, rejectReason)
      setRejectModal(null); setRejectReason('')
      load()
    } catch (e) {
      setError('Reddetme başarısız: ' + e.message)
    } finally {
      setActionId(null)
    }
  }

  const pending  = orders.filter(o => o.status === 'PENDING')
  const shown    = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <div className="page-header">
        <h1>Gelen Siparişler</h1>
        <p>{pageTitle}</p>
      </div>

      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card" style={{ width: 400, padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Talebi Reddet</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Red gerekçesi (isteğe bağlı):</p>
            <textarea
              rows={3}
              style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', resize: 'vertical' }}
              placeholder="Stok yetersiz, ürün mevcut değil..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setRejectModal(null); setRejectReason('') }}>İptal</button>
              <button className="btn btn-sm" style={{ background: '#e74c3c', color: '#fff', border: 'none' }}
                disabled={actionId === rejectModal}
                onClick={() => handleReject(rejectModal)}>
                {actionId === rejectModal ? '…' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Bekleyen',   count: pending.length, color: '#856404' },
          { label: 'Onaylanan',  count: orders.filter(o => o.status === 'APPROVED').length, color: '#0a3622' },
          { label: 'Reddedilen', count: orders.filter(o => o.status === 'REJECTED').length, color: '#842029' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={load}>↻ Yenile</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'Tümü' : STATUS_TR[f]?.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div className="spinner" /> : shown.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontWeight: 600 }}>Gösterilecek talep yok</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              {filter === 'ALL' ? 'Tüm Talepler' : STATUS_TR[filter]?.label + ' Talepler'} ({shown.length})
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Dağıtıcı', 'İlaç', 'Miktar', 'Açıklama', 'Tarih', 'Durum', 'İşlemler'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(o => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{o.distributorOrgName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{o.medicineName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#2980b9' }}>{o.quantity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 3 }}>adet</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 200 }}>
                      {o.description || '—'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.createdAt}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><StatusPill status={o.status} /></td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {o.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#27ae60', color: '#fff', border: 'none' }}
                            disabled={actionId === o.orderId}
                            onClick={() => handleApprove(o.orderId)}
                          >
                            {actionId === o.orderId ? '…' : '✓ Onayla'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                            disabled={actionId === o.orderId}
                            onClick={() => setRejectModal(o.orderId)}
                          >
                            ✕ Reddet
                          </button>
                        </div>
                      )}
                      {o.status === 'APPROVED' && (
                        <span style={{ fontSize: '0.78rem', color: '#0a3622' }}>✓ {o.processedAt}<br/>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Transfer talebi oluşturabilirsiniz</span>
                        </span>
                      )}
                      {o.status === 'REJECTED' && o.rejectionReason && (
                        <span style={{ fontSize: '0.78rem', color: '#842029' }} title={o.rejectionReason}>
                          ✕ {o.rejectionReason.substring(0, 30)}{o.rejectionReason.length > 30 ? '…' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
