import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'

const ACTION_TR = {
  CREATED: 'Üretildi',
  TRANSFERRED_TO_DISTRIBUTOR: 'Dağıtıcıya Gönderildi',
  TRANSFERRED_TO_PHARMACY: 'Eczaneye Gönderildi',
  DISPENSED_TO_PATIENT: 'Hastaya Teslim Edildi',
  RECALLED: 'Geri Çağırıldı',
}

const ACTION_ICON = {
  CREATED: '🏭',
  TRANSFERRED_TO_DISTRIBUTOR: '🚚',
  TRANSFERRED_TO_PHARMACY: '🏥',
  DISPENSED_TO_PATIENT: '✅',
  RECALLED: '⚠️',
}

const ACTION_COLOR = {
  CREATED: '#2980b9',
  TRANSFERRED_TO_DISTRIBUTOR: '#f39c12',
  TRANSFERRED_TO_PHARMACY: '#8e44ad',
  DISPENSED_TO_PATIENT: '#27ae60',
  RECALLED: '#e74c3c',
}

const STATUS_DISPLAY = {
  CREATED:              { label: 'Üretildi',         color: '#2980b9', bg: '#eaf4fb' },
  IN_DISTRIBUTION:      { label: 'Dağıtımda',        color: '#f39c12', bg: '#fef9ec' },
  AT_PHARMACY:          { label: 'Eczanede',          color: '#8e44ad', bg: '#f5eef8' },
  DISPENSED_TO_PATIENT: { label: 'Hastaya Teslim Edildi', color: '#27ae60', bg: '#eafaf1' },
  RECALLED:             { label: 'Geri Çağırıldı',   color: '#e74c3c', bg: '#fdedec' },
}

export default function MedicineVerificationPage() {
  const [query, setQuery]     = useState('')
  const [result, setResult]   = useState(null)
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError]     = useState('')
  const navigate = useNavigate()

  async function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setResult(null)
    setEvents([])
    setNotFound(false)
    setError('')

    try {
      const medicine = await medicineService.verify(q)
      setResult(medicine)

      // Try to load events
      try {
        const evData = await medicineService.getEvents(medicine.linearId)
        setEvents(Array.isArray(evData) ? evData : [])
      } catch {
        setEvents([])
      }
    } catch (err) {
      const status = err?.response?.status || err?.status
      if (status === 404 || err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
        setNotFound(true)
      } else {
        setError(err.message || 'Sorgu sırasında bir hata oluştu.')
      }
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = result ? (STATUS_DISPLAY[result.status] || { label: result.status, color: '#666', bg: '#f5f5f5' }) : null

  return (
    <div>
      <div className="page-header">
        <h1>İlaç Doğrulama</h1>
        <p>Seri numarası, GTIN veya parti numarası ile ilaç sorgulayın</p>
      </div>

      {/* Search Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title" style={{ marginBottom: '0.5rem' }}>İlaç Sorgula</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Şüpheli ilaçları, geri çağırılan ürünleri ve gerçek tedarik zincirini doğrulamak için kullanın.
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Seri numarası, GTIN veya parti numarası girin..."
            style={{ flex: 1, minWidth: '260px', fontSize: '1rem', padding: '0.65rem 1rem' }}
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !query.trim()}
            style={{ padding: '0.65rem 1.75rem', fontSize: '1rem', minWidth: '110px' }}
          >
            {loading ? '⏳ Sorgulanıyor…' : '🔍 Sorgula'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>
      )}

      {/* Not Found */}
      {notFound && (
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            İlaç bulunamadı
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Seri numarasını veya GTIN'i kontrol edin ve tekrar deneyin.
          </div>
        </div>
      )}

      {/* Result */}
      {result && statusInfo && (
        <div>
          {/* Recall Alert */}
          {result.status === 'RECALLED' && (
            <div style={{
              background: '#fdedec',
              border: '2px solid #e74c3c',
              borderRadius: '10px',
              padding: '1.1rem 1.4rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#e74c3c',
            }}>
              <span style={{ fontSize: '1.4rem' }}>⚠</span>
              Bu ilaç geri çağırılmıştır! Kullanmayınız.
            </div>
          )}

          {/* Big Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: statusInfo.bg,
            border: `2px solid ${statusInfo.color}`,
            borderRadius: '12px',
            padding: '1.1rem 1.5rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              background: statusInfo.color,
              color: '#fff',
              borderRadius: '8px',
              padding: '0.5rem 1.1rem',
              fontWeight: 700,
              fontSize: '1.05rem',
              whiteSpace: 'nowrap',
            }}>
              {statusInfo.label}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{result.medicineName}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Seri No: {result.serialNumber} · Parti: {result.batchNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Medicine Details */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title" style={{ marginBottom: '1rem' }}>İlaç Bilgileri</div>
              <table className="detail-table">
                <tbody>
                  <tr><td>İlaç Adı</td><td><strong>{result.medicineName}</strong></td></tr>
                  {result.strength     && <tr><td>Güç/Doz</td><td>{result.strength}</td></tr>}
                  {result.medicineForm && <tr><td>Form</td><td>{result.medicineForm}</td></tr>}
                  <tr><td>Kategori</td><td>{result.category || '—'}</td></tr>
                  <tr><td>GTIN</td><td className="id-col">{result.gtin || '—'}</td></tr>
                  <tr><td>Parti No</td><td>{result.batchNumber}</td></tr>
                  <tr><td>Seri No</td><td className="id-col">{result.serialNumber}</td></tr>
                  <tr><td>Üretici</td><td>{result.manufacturerName || '—'}</td></tr>
                  <tr><td>Son Kullanım</td><td>{result.expiryDate || '—'}</td></tr>
                  {result.storageCondition && <tr><td>Saklama</td><td>{result.storageCondition}</td></tr>}
                  <tr><td>Durum</td><td><StatusBadge status={result.status} /></td></tr>
                </tbody>
              </table>
            </div>

            {/* Current Owner */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title" style={{ marginBottom: '1rem' }}>Mevcut Sahip</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-subtle, #f8f9fa)',
                  borderRadius: '8px',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}>
                    {(result.ownerOrganizationName || result.owner || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{result.ownerOrganizationName || result.owner || '—'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Kayıtlı Kuruluş</div>
                  </div>
                </div>
              </div>

              {/* Blockchain ID */}
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>Blokzincir Kaydı</div>
                <div style={{ fontSize: '0.72rem', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {result.linearId}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => navigator.clipboard.writeText(result.linearId).catch(() => {})}
                >
                  Kopyala
                </button>
              </div>
            </div>
          </div>

          {/* Events Timeline */}
          {events.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
              <div className="card-title" style={{ marginBottom: '1rem' }}>İlaç Yolculuğu (Blokzincir Kaydı)</div>
              <div className="timeline">
                {events.map(ev => (
                  <div key={ev.eventId} className="timeline-step">
                    <div
                      className="timeline-dot"
                      style={{
                        background: ACTION_COLOR[ev.actionType] || '#17a589',
                        borderColor: ACTION_COLOR[ev.actionType] || '#17a589',
                        color: '#fff',
                        fontSize: '1rem',
                      }}
                    >
                      {ACTION_ICON[ev.actionType] || '📋'}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">
                        {ACTION_TR[ev.actionType] || ev.actionType}
                      </div>
                      <div className="timeline-sub">
                        {ev.fromOrganizationName && `${ev.fromOrganizationName} → `}
                        {ev.toOrganizationName || ''}
                        {ev.timestamp && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                            {ev.timestamp}
                          </span>
                        )}
                      </div>
                      {ev.performedBy && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          İşlemi yapan: {ev.performedBy}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Button */}
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/medicines/${result.linearId}`)}
            >
              Detay Sayfasına Git →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
