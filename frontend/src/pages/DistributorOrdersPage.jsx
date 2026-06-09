import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { organizationService } from '../services/adminService'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

const STATUS_TR = {
  PENDING:  { label: 'Bekliyor',  bg: '#fff3cd', color: '#856404' },
  APPROVED: { label: 'Onaylandı', bg: '#d1e7dd', color: '#0a3622' },
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

export default function DistributorOrdersPage() {
  const user = getUser()
  const isPharmacy = user?.role === 'PHARMACY_USER'

  // Distributor orders from manufacturers; Pharmacy orders from distributors
  const supplierType    = isPharmacy ? 'DISTRIBUTOR' : 'MANUFACTURER'
  const supplierLabel   = isPharmacy ? 'Dağıtıcı'    : 'Üretici'
  const pageTitle       = isPharmacy ? 'Tedarik Talepleri (Dağıtıcıya)' : 'Tedarik Talepleri (Üreticiye)'

  const [orders, setOrders]             = useState([])
  const [suppliers, setSuppliers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ manufacturerOrgId: '', medicineName: '', quantity: 1, description: '' })
  const [submitting, setSubmitting]     = useState(false)

  function load() {
    setLoading(true); setError('')
    Promise.all([
      orderService.getMyOrders(),
      organizationService.getActiveByType(supplierType),
    ]).then(([ords, orgs]) => {
      setOrders(ords)
      setSuppliers(orgs || [])
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.manufacturerOrgId) return setError(`${supplierLabel} seçimi zorunludur.`)
    if (!form.medicineName.trim()) return setError('İlaç adı zorunludur.')
    if (form.quantity < 1) return setError('Miktar en az 1 olmalıdır.')
    setSubmitting(true); setError('')
    try {
      await orderService.create({ ...form, quantity: Number(form.quantity) })
      setForm({ manufacturerOrgId: '', medicineName: '', quantity: 1, description: '' })
      setShowForm(false)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pending  = orders.filter(o => o.status === 'PENDING')
  const approved = orders.filter(o => o.status === 'APPROVED')
  const rejected = orders.filter(o => o.status === 'REJECTED')

  return (
    <div>
      <div className="page-header">
        <h1>Tedarik Talepleri</h1>
        <p>{pageTitle} — oluştur ve takip et</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Bekleyen', count: pending.length, color: '#856404' },
          { label: 'Onaylanan', count: approved.length, color: '#0a3622' },
          { label: 'Reddedilen', count: rejected.length, color: '#842029' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
        <button className="btn btn-primary" style={{ alignSelf: 'center' }}
          onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Kapat' : '+ Yeni Talep'}
        </button>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={load}>↻</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Yeni Tedarik Talebi</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {supplierLabel} *
                </label>
                {suppliers.length === 0 ? (
                  <div style={{ padding: '0.5rem', background: '#fff3cd', borderRadius: 6, fontSize: '0.82rem', color: '#856404' }}>
                    Aktif {supplierLabel.toLowerCase()} bulunamadı.
                  </div>
                ) : (
                  <select
                    value={form.manufacturerOrgId}
                    onChange={e => setForm(f => ({ ...f, manufacturerOrgId: e.target.value }))}
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">{supplierLabel} seçin...</option>
                    {suppliers.map(s => (
                      <option key={s.organizationId} value={s.organizationId}>{s.organizationName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>İlaç Adı *</label>
                <input
                  placeholder="Örn: Parol 500mg"
                  value={form.medicineName}
                  onChange={e => setForm(f => ({ ...f, medicineName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Miktar *</label>
                <input
                  type="number" min={1}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Açıklama</label>
                <input
                  placeholder="Ek bilgi..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || suppliers.length === 0}>
                {submitting ? 'Gönderiliyor…' : 'Talep Oluştur'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setError('') }}>İptal</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div className="spinner" /> : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontWeight: 600 }}>Henüz tedarik talebi yok</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Yukarıdan yeni talep oluşturun</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tüm Talepler ({orders.length})</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['İlaç', 'Miktar', supplierLabel, 'Açıklama', 'Durum', 'Tarih', 'İşleme'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{o.medicineName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#2980b9' }}>{o.quantity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 3 }}>adet</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{o.manufacturerOrgName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{o.description || '—'}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><StatusPill status={o.status} /></td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.createdAt}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem' }}>
                      {o.status === 'APPROVED' && (
                        <span style={{ color: '#0a3622' }}>✓ {o.processedAt}</span>
                      )}
                      {o.status === 'REJECTED' && (
                        <span style={{ color: '#842029' }} title={o.rejectionReason}>✕ {o.rejectionReason || o.processedAt}</span>
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
