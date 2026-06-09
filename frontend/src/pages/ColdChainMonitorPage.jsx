import { useState, useEffect } from 'react'
import { coldChainService } from '../services/coldChainService'
import { medicineService } from '../services/medicineService'
import { api } from '../services/api'
import { toast } from '../components/Toast'

function StatusBadge({ status }) {
  const isV = status === 'VIOLATED'
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 20,
      fontSize: '0.73rem', fontWeight: 700,
      background: isV ? '#fee2e2' : '#d1fae5',
      color: isV ? '#991b1b' : '#065f46',
      border: `1px solid ${isV ? '#fca5a5' : '#6ee7b7'}`
    }}>
      {isV ? '⚠ İhlal' : '❄ Geçerli'}
    </span>
  )
}

function TempCell({ value, min, max }) {
  const num = Number(value)
  const bad = num > Number(max) || num < Number(min)
  return (
    <span style={{ fontWeight: 700, color: bad ? '#e74c3c' : 'inherit' }}>
      {num}°C {bad && '⚠'}
    </span>
  )
}

export default function ColdChainMonitorPage() {
  const [records, setRecords]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [filter, setFilter]       = useState('VIOLATED')
  const [recalling, setRecalling] = useState(null)
  const [recallModal, setModal]   = useState(null)

  function load() {
    setLoading(true); setError('')
    const req = filter === 'ALL' ? coldChainService.getAll()
              : filter === 'VIOLATED' ? coldChainService.getViolations()
              : coldChainService.getAll().then(all => all.filter(r => r.coldChainStatus === 'VALID'))
    req
      .then(setRecords)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filter])

  async function handleRecall(record) {
    if (!window.confirm(
      `Parti "${record.batchNumber || record.transferReferenceNo}" için geri çağırma başlatılsın mı?\n\nBu işlem geri alınamaz.`
    )) return

    setRecalling(record.recordId); setError('')
    try {
      // Recall all medicines in the batch with this reference no
      const batchRef = record.batchNumber || record.medicineName
      if (batchRef) {
        await medicineService.recallBatch(batchRef)
        toast(`Parti "${batchRef}" için geri çağırma başlatıldı. İlaçlar RECALLED olarak işaretlendi.`, 'success')
        load()
      } else {
        toast('Parti numarası bulunamadı, geri çağırma yapılamadı.', 'error')
      }
    } catch (e) {
      toast('Geri çağırma başarısız: ' + e.message, 'error')
      setError(e.message)
    } finally {
      setRecalling(null)
    }
  }

  const violatedCount = records.filter(r => r.coldChainStatus === 'VIOLATED').length
  const validCount    = records.filter(r => r.coldChainStatus === 'VALID').length

  return (
    <div>
      <div className="page-header">
        <h1>Soğuk Zincir İzleme</h1>
        <p>Transfer sırasındaki sıcaklık kayıtları — ihlaller ve geri çağırma</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{
          flex: 1, minWidth: 140, padding: '1rem', textAlign: 'center',
          border: violatedCount > 0 ? '1px solid #fca5a5' : '1px solid var(--border)',
          cursor: 'pointer', background: filter === 'VIOLATED' ? '#fff5f5' : undefined
        }} onClick={() => setFilter('VIOLATED')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e74c3c' }}>{violatedCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#e74c3c', fontWeight: 600 }}>İhlal</div>
        </div>
        <div className="card" style={{
          flex: 1, minWidth: 140, padding: '1rem', textAlign: 'center',
          border: '1px solid #6ee7b7', cursor: 'pointer',
          background: filter === 'VALID' ? '#f0fdf4' : undefined
        }} onClick={() => setFilter('VALID')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#27ae60' }}>{validCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#27ae60', fontWeight: 600 }}>Geçerli</div>
        </div>
        <div className="card" style={{
          flex: 1, minWidth: 140, padding: '1rem', textAlign: 'center',
          cursor: 'pointer', background: filter === 'ALL' ? 'var(--bg-secondary)' : undefined
        }} onClick={() => setFilter('ALL')}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2980b9' }}>{records.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam Kayıt</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={load}>↻ Yenile</button>
      </div>

      {/* Alert for violations */}
      {filter === 'VIOLATED' && violatedCount > 0 && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠</span>
          <div>
            <strong>{violatedCount} soğuk zincir ihlali tespit edildi.</strong>
            {' '}Bu ilaçlar sıcaklık limitlerini aşmış taşımada bulundu.
            Güvenilirliklerini değerlendirin ve gerekirse topla işlemi başlatın.
          </div>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {filter === 'VIOLATED' ? 'Soğuk Zincir İhlalleri'
            : filter === 'VALID'   ? 'Geçerli Soğuk Zincir Kayıtları'
            : 'Tüm Soğuk Zincir Kayıtları'}
            {' '}({records.length})
          </div>
        </div>

        {loading ? <div className="spinner" /> : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {filter === 'VIOLATED' ? '✅' : '❄'}
            </div>
            <div style={{ fontWeight: 600 }}>
              {filter === 'VIOLATED' ? 'Soğuk zincir ihlali yok' : 'Kayıt bulunamadı'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Transfer Ref', 'Min (°C)', 'Max (°C)', 'Ort (°C)', 'İzin Min', 'İzin Max', 'Araç', 'Durum', 'Tarih', 'İşlem'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.recordId} style={{
                    borderBottom: '1px solid var(--border)',
                    background: r.coldChainStatus === 'VIOLATED' ? '#fff5f5' : 'transparent'
                  }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.77rem', color: 'var(--text-muted)' }}>{r.transferReferenceNo}</div>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <TempCell value={r.minTemperature} min={r.minAllowedTemp} max={r.maxAllowedTemp} />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <TempCell value={r.maxTemperature} min={r.minAllowedTemp} max={r.maxAllowedTemp} />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{r.avgTemperature}°C</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{r.minAllowedTemp}°C</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{r.maxAllowedTemp}°C</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem' }}>{r.vehicleId || '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}><StatusBadge status={r.coldChainStatus} /></td>
                    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.77rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {r.submittedAt}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {r.coldChainStatus === 'VIOLATED' && (
                        <button
                          className="btn btn-sm"
                          style={{ background: '#e74c3c', color: '#fff', border: 'none', fontSize: '0.78rem', fontWeight: 700 }}
                          disabled={recalling === r.recordId}
                          onClick={() => handleRecall(r)}
                        >
                          {recalling === r.recordId ? '…' : '🗑 Topla'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works info */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#f8fafc' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.88rem' }}>Soğuk Zincir Akışı</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Transfer oluştur</span>
          <span>→</span>
          <span>Soğuk zincir verisi gir</span>
          <span>→</span>
          <span style={{ color: '#991b1b' }}>İhlal tespit edilirse batch işaretlenir</span>
          <span>→</span>
          <span>Denetleyici "Topla" butonuyla geri çağırır</span>
          <span>→</span>
          <span>İlaçlar RECALLED olarak işaretlenir</span>
        </div>
      </div>
    </div>
  )
}
