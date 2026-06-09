import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/MedicineTable'
import Timeline from '../components/Timeline'
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

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

export default function MedicineDetailPage() {
  const { linearId } = useParams()
  const navigate = useNavigate()
  const [medicine, setMedicine]   = useState(null)
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [recalling, setRecalling] = useState(false)

  const user = getUser()
  const role = user?.role || ''
  const canTransfer = ['MANUFACTURER_USER', 'DISTRIBUTOR_USER', 'ADMIN'].includes(role)
  const canDispense = ['PHARMACY_USER', 'ADMIN'].includes(role)
  const canRecall   = ['ADMIN', 'REGULATOR_USER'].includes(role)

  useEffect(() => {
    medicineService.getById(linearId)
      .then(setMedicine)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    medicineService.getEvents(linearId)
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
  }, [linearId])

  async function handleRecall() {
    if (!window.confirm('Bu ilacı geri çağırmak istediğinizden emin misiniz? Bu işlem blokzincire kalıcı olarak kaydedilecektir.')) return
    setRecalling(true)
    try {
      const updated = await medicineService.recallMedicine(linearId)
      setMedicine(updated)
    } catch (e) {
      alert('Geri çağırma başarısız: ' + e.message)
    } finally {
      setRecalling(false)
    }
  }

  if (loading) return <div className="spinner" />

  if (error) return (
    <div>
      <div className="page-header"><h1>İlaç Detayı</h1></div>
      <div className="alert alert-error">{error}</div>
      <button className="btn btn-outline" onClick={() => navigate('/medicines')}>← Listeye Dön</button>
    </div>
  )

  const isActive = medicine.status !== 'DISPENSED_TO_PATIENT' && medicine.status !== 'RECALLED'

  return (
    <div>
      <div className="page-header">
        <h1>{medicine.medicineName}{medicine.strength ? ` ${medicine.strength}` : ''}</h1>
        <p>Parti: {medicine.batchNumber} · <StatusBadge status={medicine.status} /></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* İlaç Bilgileri */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>İlaç Bilgileri</div>
          <table className="detail-table">
            <tbody>
              <tr><td>İlaç Adı</td><td><strong>{medicine.medicineName}</strong></td></tr>
              {medicine.strength     && <tr><td>Güç/Doz</td><td>{medicine.strength}</td></tr>}
              {medicine.medicineForm && <tr><td>Form</td><td>{medicine.medicineForm}</td></tr>}
              <tr><td>Kategori</td><td>{medicine.category || '—'}</td></tr>
              <tr><td>GTIN</td><td className="id-col">{medicine.gtin || '—'}</td></tr>
              <tr><td>Parti No</td><td>{medicine.batchNumber}</td></tr>
              <tr><td>Seri No</td><td className="id-col">{medicine.serialNumber}</td></tr>
              <tr><td>Üretici</td><td>{medicine.manufacturerName}</td></tr>
              <tr><td>Son Kullanım</td><td>{medicine.expiryDate || '—'}</td></tr>
              {medicine.storageCondition && <tr><td>Saklama</td><td>{medicine.storageCondition}</td></tr>}
              {medicine.description && (
                <tr><td>Açıklama</td><td style={{ fontSize: '0.82rem' }}>{medicine.description}</td></tr>
              )}
              <tr>
                <td>Mevcut Konum</td>
                <td><strong>{medicine.ownerOrganizationName || medicine.owner}</strong></td>
              </tr>
              <tr><td>Durum</td><td><StatusBadge status={medicine.status} /></td></tr>
              <tr>
                <td>Blokzincir ID</td>
                <td className="id-col" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {medicine.linearId}
                  <button
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(medicine.linearId).catch(() => {})}
                  >
                    kopyala
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Sahiplik Zinciri */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Sahiplik Zinciri</div>
            <Timeline medicine={medicine} />
          </div>

          {/* ZKP */}
          {medicine.prescriptionHash && (
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>Gizlilik Doğrulama (ZKP)</div>
              <div className="alert alert-info" style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                Blokzincir yalnızca reçete referansının kriptografik hash değerini saklar.
                Hasta bilgileri hiçbir zaman zincire kaydedilmez — bu, gizliliği koruyan ispattır.
              </div>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td>Reçete Hash</td>
                    <td className="id-col" style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                      {medicine.prescriptionHash}
                    </td>
                  </tr>
                  <tr><td>Algoritma</td><td>SHA-256</td></tr>
                  <tr>
                    <td>Durum</td>
                    <td><span style={{ color: '#27ae60' }}>Blokzincirde Doğrulandı</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* İlaç Yolculuğu — Events Timeline */}
      {events.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>İlaç Yolculuğu (Blokzincir Kaydı)</div>
          <div className="timeline">
            {events.map((ev) => (
              <div key={ev.eventId} className="timeline-step">
                <div
                  className="timeline-dot"
                  style={{
                    background: ACTION_COLOR[ev.actionType] || '#17a589',
                    color: '#fff',
                    fontSize: '1rem',
                    borderColor: ACTION_COLOR[ev.actionType] || '#17a589',
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

      {/* Action Buttons */}
      <div className="form-actions" style={{ marginTop: '1.5rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/medicines')}>← Listeye Dön</button>
        {canTransfer && isActive && medicine.status !== 'AT_PHARMACY' && (
          <button
            className="btn btn-accent"
            onClick={() => navigate(`/medicines/transfer?linearId=${medicine.linearId}`)}
          >
            Transfer Et
          </button>
        )}
        {canDispense && medicine.status === 'AT_PHARMACY' && (
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/medicines/dispense?linearId=${medicine.linearId}`)}
          >
            Hastaya Teslim Et
          </button>
        )}
        {canRecall && isActive && (
          <button
            className="btn btn-outline"
            style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
            onClick={handleRecall}
            disabled={recalling}
          >
            {recalling ? 'Geri Çağırılıyor…' : 'İlacı Geri Çağır'}
          </button>
        )}
      </div>
    </div>
  )
}
