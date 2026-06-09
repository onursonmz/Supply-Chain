import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'

export default function DispenseMedicinePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [linearId, setLinearId]             = useState(params.get('linearId') || '')
  const [prescriptionReference, setPrescRef] = useState('')
  const [result, setResult]                 = useState(null)
  const [error, setError]                   = useState('')
  const [loading, setLoading]               = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!linearId.trim())              { setError('İlaç Linear ID zorunludur.'); return }
    if (!prescriptionReference.trim()) { setError('Reçete referansı zorunludur.'); return }
    setLoading(true); setError('')
    try {
      const medicine = await medicineService.dispense({
        linearId: linearId.trim(),
        prescriptionReference: prescriptionReference.trim()
      })
      setResult({ ...medicine, rawPrescription: prescriptionReference.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div>
        <div className="page-header">
          <h1>İlaç Teslim İşlemi</h1>
          <p>İlaç hastaya teslim edildi olarak işaretle</p>
        </div>
        <div className="card">
          <div className="alert alert-success">
            İlaç teslim edildi ve blokzincire kalıcı olarak kaydedildi.
          </div>

          <div className="card-title" style={{ margin: '1rem 0 0.75rem' }}>{result.medicineName}</div>
          <table className="detail-table">
            <tbody>
              <tr><td>İlaç Adı</td><td><strong>{result.medicineName}</strong></td></tr>
              {result.strength && <tr><td>Güç/Doz</td><td>{result.strength}</td></tr>}
              <tr><td>Parti Numarası</td><td>{result.batchNumber}</td></tr>
              <tr><td>Seri Numarası</td><td>{result.serialNumber}</td></tr>
              <tr><td>Durum</td><td><StatusBadge status={result.status} /></td></tr>
            </tbody>
          </table>

          <div className="card-title" style={{ margin: '1.25rem 0 0.75rem' }}>Gizlilik Doğrulama (ZKP Modeli)</div>
          <div className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Hasta gizliliği korunmaktadır. Blokzincirde yalnızca reçetenin kriptografik özeti saklanır.
            Orijinal reçete referansı eczanenizde çevrimdışı tutulmaktadır.
          </div>
          <table className="detail-table">
            <tbody>
              <tr><td>Reçete Referansınız</td><td><strong>{result.rawPrescription}</strong></td></tr>
              <tr>
                <td>Blokzincir Hash (SHA-256)</td>
                <td className="id-col" style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                  {result.prescriptionHash}
                  <button className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(result.prescriptionHash).catch(() => {})}>
                    kopyala
                  </button>
                </td>
              </tr>
              <tr><td>Gizlilik Durumu</td><td><span style={{ color: '#27ae60' }}>Hasta verisi blokzincirde SAKLANMIYOR</span></td></tr>
            </tbody>
          </table>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary"
              onClick={() => { setResult(null); setLinearId(''); setPrescRef('') }}>
              Başka İlaç Teslim Et
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/medicines')}>İlaçları Görüntüle</button>
            <button className="btn btn-ghost"   onClick={() => navigate('/dashboard')}>Gösterge Paneli</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>İlaç Teslim İşlemi</h1>
        <p>İlaç hastaya teslim edildi olarak işaretle</p>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '0.5rem' }}>Teslim Detayları</div>

        <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
          Yalnızca <strong>AT_PHARMACY (Eczanede)</strong> durumundaki ilaçlar teslim edilebilir.
          Reçete referansı, blokzincire kaydedilmeden önce gizlilik hashlenir.
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>İlaç Linear ID *</label>
            <input
              placeholder="ör. 12345678-abcd-1234-abcd-123456789abc"
              value={linearId}
              onChange={e => { setLinearId(e.target.value); setError('') }}
              required
            />
          </div>

          <div className="form-group">
            <label>Reçete Referansı *</label>
            <input
              placeholder="ör. RX-2026-00123"
              value={prescriptionReference}
              onChange={e => { setPrescRef(e.target.value); setError('') }}
              required
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Bu referans eczanenizde kalır. Blokzincire yalnızca SHA-256 özeti gönderilir.
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'İşleniyor…' : 'Teslim Et'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/medicines')}>İptal</button>
          </div>
        </form>
      </div>
    </div>
  )
}
