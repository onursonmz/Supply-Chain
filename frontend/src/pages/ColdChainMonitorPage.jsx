import { useState, useEffect } from 'react'
import { coldChainService } from '../services/coldChainService'
import { medicineService } from '../services/medicineService'
import { transferRequestService } from '../services/transferRequestService'
import { toast } from '../components/Toast'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

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
  const user = getUser()
  const role = user?.role || ''
  const isRegulatorOrAdmin = role === 'REGULATOR_USER' || role === 'ADMIN'
  const isHolder = role === 'DISTRIBUTOR_USER' || role === 'PHARMACY_USER' || role === 'ADMIN'

  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('VIOLATED')
  const [actionId, setActionId] = useState(null)

  function load() {
    setLoading(true); setError('')
    const req = filter === 'ALL'      ? coldChainService.getAll()
              : filter === 'VIOLATED' ? coldChainService.getViolations()
              : coldChainService.getAll().then(all => all.filter(r => r.coldChainStatus === 'VALID'))
    req.then(setRecords)
       .catch(e => setError(e.message))
       .finally(() => setLoading(false))
  }
  useEffect(load, [filter])

  async function handleRecall(record) {
    const batchNo = record.batchNumber
    if (!batchNo) {
      toast('Parti numarası bulunamadı. Soğuk zincir kaydı eksik bilgi içeriyor.', 'error')
      return
    }
    if (!window.confirm(
      `"${batchNo}" partisi için tüm ilaçlar RECALLED olarak işaretlensin mi?\n\nBu işlem geri alınamaz.`
    )) return

    setActionId(record.recordId)
    try {
      await medicineService.recallBatch(batchNo)
      toast(`✓ "${batchNo}" partisi toplandı. İlaçlar RECALLED olarak işaretlendi.`, 'success')
      load()
    } catch (e) {
      toast('Geri çağırma başarısız: ' + e.message, 'error')
    } finally {
      setActionId(null)
    }
  }

  async function handleReturn(record) {
    const batchNo = record.batchNumber
    const fromOrg = record.fromOrganizationName || 'gönderici'
    if (!window.confirm(
      `"${batchNo}" partisi (${record.transferQuantity} adet) "${fromOrg}"'e iade edilsin mi?\n\nStoktan düşülür, gönderici envanterine eklenir.`
    )) return

    setActionId(record.recordId)
    try {
      await transferRequestService.returnToSender(record.transferRequestId)
      toast(`✓ "${batchNo}" partisi "${fromOrg}"'e iade edildi.`, 'success')
      load()
    } catch (e) {
      toast('İade başarısız: ' + e.message, 'error')
    } finally {
      setActionId(null)
    }
  }

  const violatedCount = records.filter(r => r.coldChainStatus === 'VIOLATED').length
  const validCount    = records.filter(r => r.coldChainStatus === 'VALID').length

  return (
    <div>
      <div className="page-header">
        <h1>Soğuk Zincir İzleme</h1>
        <p>Transfer sırasındaki sıcaklık kayıtları — ihlaller, geri çağırma ve iade</p>
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
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={load}>↻ Yenile</button>
      </div>

      {violatedCount > 0 && filter === 'VIOLATED' && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          <strong>⚠ {violatedCount} soğuk zincir ihlali tespit edildi.</strong>
          {' '}İhlalli ilaçlar için topla (RECALLED) veya iade (gönderici envanterine iade et) işlemi yapılabilir.
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
                  {['İlaç / Parti', 'Min', 'Max', 'Ort', 'İzin Min-Max', 'Gönderen → Alıcı', 'Araç', 'Durum', 'Tarih', 'İşlem'].map(h => (
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
                      <div style={{ fontWeight: 600 }}>{r.medicineName || '—'}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {r.batchNumber || r.transferReferenceNo}
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <TempCell value={r.minTemperature} min={r.minAllowedTemp} max={r.maxAllowedTemp} />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <TempCell value={r.maxTemperature} min={r.minAllowedTemp} max={r.maxAllowedTemp} />
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{r.avgTemperature}°C</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.minAllowedTemp}°C – {r.maxAllowedTemp}°C
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{r.fromOrganizationName || '—'}</span>
                      {' → '}
                      <span style={{ fontWeight: 600 }}>{r.toOrganizationName || '—'}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem' }}>{r.vehicleId || '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}><StatusBadge status={r.coldChainStatus} /></td>
                    <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.77rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {r.submittedAt}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {r.coldChainStatus === 'VIOLATED' && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                          {/* Geri gönder — holder (distributor/pharmacy) */}
                          {(isHolder || isRegulatorOrAdmin) && r.transferRequestId && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#f39c12', color: '#fff', border: 'none', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                              disabled={actionId === r.recordId}
                              onClick={() => handleReturn(r)}
                            >
                              {actionId === r.recordId ? '…' : '↩ Geri Gönder'}
                            </button>
                          )}
                          {/* Topla — regulator/admin */}
                          {isRegulatorOrAdmin && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#e74c3c', color: '#fff', border: 'none', fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                              disabled={actionId === r.recordId}
                              onClick={() => handleRecall(r)}
                            >
                              {actionId === r.recordId ? '…' : '🗑 Topla'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#f8fafc', fontSize: '0.82rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>İşlemler Hakkında</div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
          <span><strong style={{ color: '#f39c12' }}>↩ Geri Gönder</strong> — İlaçları orijinal göndericiye iade eder. Stoktan düşer, gönderici envanterine eklenir.</span>
          <span><strong style={{ color: '#e74c3c' }}>🗑 Topla</strong> — İlaçları RECALLED olarak işaretler. Blockchain'de kalıcı kayıt oluşur. (Sadece Denetleyici/Admin)</span>
        </div>
      </div>
    </div>
  )
}
