import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { medicineService } from '../services/medicineService'
import { transferRequestService } from '../services/transferRequestService'
import { coldChainService } from '../services/coldChainService'
import { api } from '../services/api'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

// Parse storage condition like "2-8°C" → { min: 2, max: 8 }
function parseStorageRange(condition) {
  if (!condition) return { min: 2, max: 25 }
  const m = condition.match(/([-\d.]+)\s*[-–]\s*([-\d.]+)/)
  if (m) return { min: parseFloat(m[1]), max: parseFloat(m[2]) }
  return { min: 2, max: 25 }
}

function ColdChainStatusBadge({ status }) {
  if (!status) return null
  const isViolated = status === 'VIOLATED'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.25rem 0.7rem', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem',
      background: isViolated ? '#fee2e2' : '#d1fae5',
      color: isViolated ? '#991b1b' : '#065f46',
      border: `1px solid ${isViolated ? '#fca5a5' : '#6ee7b7'}`
    }}>
      {isViolated ? '⚠ Soğuk Zincir İhlali' : '❄ Soğuk Zincir Geçerli'}
    </span>
  )
}

export default function TransferMedicinePage() {
  const navigate = useNavigate()
  const user = getUser()
  const role = user?.role || ''

  const [batches, setBatches]         = useState([])
  const [orgs, setOrgs]               = useState([])
  const [selectedBatch, setBatch]     = useState(null)
  const [quantity, setQuantity]       = useState(1)
  const [targetOrgId, setTarget]      = useState('')
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [result, setResult]           = useState(null)
  const [ccResult, setCcResult]       = useState(null)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')
  const [showColdChain, setShowCC]    = useState(false)
  const [searchParams] = useSearchParams()

  // Cold chain form state
  const [cc, setCc] = useState({
    minTemperature: '', maxTemperature: '', avgTemperature: '',
    minAllowedTemp: 2,  maxAllowedTemp: 8,
    vehicleId: '', transportStartTime: '', transportEndTime: '', notes: ''
  })

  const targetType = role === 'MANUFACTURER_USER' ? 'DISTRIBUTOR'
                   : role === 'DISTRIBUTOR_USER'  ? 'PHARMACY'
                   : null

  useEffect(() => {
    Promise.all([
      transferRequestService.getBatchSummaries(),
      medicineService.getOrganizations(targetType),
    ]).then(([b, o]) => {
      setBatches(b)
      setOrgs(o.filter(x => x.status === 'ACTIVE'))
      const batchParam = searchParams.get('batch')
      if (batchParam) {
        const match = b.find(x => x.batchNumber === batchParam)
        if (match) { setBatch(match); applyStorageCondition(match) }
      }
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function applyStorageCondition(batch) {
    if (!batch?.storageCondition) return
    const { min, max } = parseStorageRange(batch.storageCondition)
    setCc(prev => ({ ...prev, minAllowedTemp: min, maxAllowedTemp: max }))
  }

  function handleBatchChange(batchNumber) {
    const b = batches.find(x => x.batchNumber === batchNumber)
    setBatch(b || null)
    setQuantity(1)
    setError('')
    if (b) applyStorageCondition(b)
  }

  function reset() {
    setResult(null); setCcResult(null); setBatch(null); setTarget('')
    setQuantity(1); setNotes(''); setSearch(''); setShowCC(false)
    setCc({ minTemperature: '', maxTemperature: '', avgTemperature: '',
            minAllowedTemp: 2, maxAllowedTemp: 8, vehicleId: '',
            transportStartTime: '', transportEndTime: '', notes: '' })
    transferRequestService.getBatchSummaries().then(setBatches).catch(() => {})
  }

  const selectedOrg = orgs.find(o => o.organizationId === targetOrgId)
  const maxQty = selectedBatch?.availableCount || 1
  const hasCcData = cc.minTemperature !== '' && cc.maxTemperature !== '' && cc.avgTemperature !== ''

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedBatch) { setError('Lütfen bir parti seçin.'); return }
    if (!targetOrgId)   { setError('Lütfen hedef kuruluş seçin.'); return }
    if (quantity < 1 || quantity > maxQty) { setError(`Miktar 1–${maxQty} arasında olmalıdır.`); return }
    if (showColdChain && hasCcData) {
      if (cc.maxTemperature === '' || cc.minTemperature === '' || cc.avgTemperature === '') {
        setError('Soğuk zincir bölümü açıksa tüm sıcaklık değerlerini girin.')
        return
      }
    }

    setSubmitting(true); setError('')
    try {
      const res = await transferRequestService.transferDirect({
        batchNumber:          selectedBatch.batchNumber,
        medicineName:         selectedBatch.medicineName,
        gtin:                 selectedBatch.gtin,
        quantity:             Number(quantity),
        targetOrganizationId: targetOrgId,
        notes:                notes || undefined,
      })
      setResult(res)

      // Auto-submit cold chain data if provided
      if (showColdChain && hasCcData) {
        try {
          const ccRes = await api.post(`/api/cold-chain/${res.transferRequestId}`, {
            minTemperature:    Number(cc.minTemperature),
            maxTemperature:    Number(cc.maxTemperature),
            avgTemperature:    Number(cc.avgTemperature),
            minAllowedTemp:    Number(cc.minAllowedTemp),
            maxAllowedTemp:    Number(cc.maxAllowedTemp),
            vehicleId:         cc.vehicleId || undefined,
            transportStartTime:cc.transportStartTime || undefined,
            transportEndTime:  cc.transportEndTime   || undefined,
            notes:             cc.notes || undefined,
          })
          setCcResult(ccRes)
        } catch (ccErr) {
          setCcResult({ error: ccErr.message })
        }
      }
    } catch (err) {
      setError(err.message || 'Transfer sırasında hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (result) {
    const violated = ccResult?.coldChainStatus === 'VIOLATED'
    return (
      <div>
        <div className="page-header">
          <h1>Transfer Tamamlandı</h1>
          <p>İlaç başarıyla aktarıldı</p>
        </div>
        <div className="card" style={{ maxWidth: 600 }}>

          {/* Transfer success */}
          <div style={{
            background: '#d1fae5', border: '1px solid #6ee7b7',
            borderRadius: 10, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
            display: 'flex', gap: '0.75rem', alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#065f46' }}>Transfer başarıyla tamamlandı</div>
              <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.25rem' }}>
                {result.quantity} adet <strong>{result.medicineName}</strong>, <strong>{result.toOrganizationName}</strong> envanterine eklendi.
              </div>
            </div>
          </div>

          {/* Cold chain result */}
          {ccResult && !ccResult.error && (
            <div style={{
              background: violated ? '#fff5f5' : '#f0fdf4',
              border: `1px solid ${violated ? '#fca5a5' : '#86efac'}`,
              borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
                {violated ? '⚠ Soğuk Zincir İhlali Tespit Edildi' : '❄ Soğuk Zincir Doğrulandı'}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                <span>Min: <strong>{ccResult.minTemperature}°C</strong></span>
                <span>Max: <strong style={{ color: violated ? '#e74c3c' : 'inherit' }}>{ccResult.maxTemperature}°C</strong></span>
                <span>Ort: <strong>{ccResult.avgTemperature}°C</strong></span>
                <span>İzin: <strong>{ccResult.minAllowedTemp}°C – {ccResult.maxAllowedTemp}°C</strong></span>
              </div>
              {violated && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#991b1b', fontWeight: 600 }}>
                  Ürün ihlalli olarak işaretlendi. Denetleyici bu ürünü toplatabilir.
                </div>
              )}
            </div>
          )}
          {ccResult?.error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
              Soğuk zincir kaydedilemedi: {ccResult.error}
            </div>
          )}

          {/* Details table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            <tbody>
              {[
                ['Referans No',    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{result.transferReferenceNo}</span>],
                ['İlaç',           <strong>{result.medicineName}</strong>],
                ['Parti No',       result.batchNumber],
                ['Miktar',         <span style={{ fontWeight: 700, color: '#2980b9' }}>{result.quantity} adet</span>],
                ['Gönderen',       result.fromOrganizationName],
                ['Alıcı',          <strong>{result.toOrganizationName}</strong>],
                ['Durum',          <ColdChainStatusBadge status={ccResult?.coldChainStatus} />],
                ['Tamamlanma',     result.dispatchedAt || result.createdAt],
              ].filter(([, v]) => v).map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)', width: '40%' }}>{k}</td>
                  <td style={{ padding: '0.5rem' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={reset}>+ Yeni Transfer</button>
            <button className="btn btn-ghost" onClick={() => navigate('/medicines')}>Envantere Git</button>
            <button className="btn btn-ghost" onClick={() => navigate('/transfers/outgoing')}>Transfer Geçmişi</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Transfer form ─────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-header">
        <h1>İlaç Transfer Et</h1>
        <p>
          {role === 'MANUFACTURER_USER' ? 'Dağıtıcıya direkt transfer' : 'Eczaneye direkt transfer'}
          {' '}— Transfer anında tamamlanır
        </p>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ maxWidth: 700 }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {batches.length === 0 ? (
            <div className="alert alert-info">
              Transfer edilebilecek aktif parti bulunamadı.
              {role === 'MANUFACTURER_USER' && (
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: '1rem' }}
                  onClick={() => navigate('/medicines/batch/create')}>
                  İlaç Oluştur
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>

              {/* ── Temel transfer alanları ── */}
              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  1. İlaç Partisi *
                </label>
                <select value={selectedBatch?.batchNumber || ''} onChange={e => handleBatchChange(e.target.value)} required style={{ width: '100%' }}>
                  <option value="">— Parti seçin —</option>
                  {batches.map(b => (
                    <option key={b.batchNumber} value={b.batchNumber}>
                      {b.medicineName}{b.strength ? ` ${b.strength}` : ''} — {b.batchNumber}
                      {' '}({b.availableCount} adet)
                      {b.coldChainViolated ? ' ⚠ İhlal' : ''}
                    </option>
                  ))}
                </select>
                {selectedBatch && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {selectedBatch.storageCondition && (
                      <span>🌡 Saklama: <strong>{selectedBatch.storageCondition}</strong></span>
                    )}
                    {selectedBatch.expiryDate && <span>SKT: <strong>{selectedBatch.expiryDate}</strong></span>}
                    <span style={{ color: '#27ae60', fontWeight: 700 }}>{selectedBatch.availableCount} adet kullanılabilir</span>
                    {selectedBatch.coldChainViolated && (
                      <span style={{ color: '#991b1b', fontWeight: 700 }}>⚠ Soğuk zincir ihlali var</span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  2. Miktar * <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82rem' }}>(maks: {maxQty})</span>
                </label>
                <input type="number" min={1} max={maxQty} value={quantity}
                  onChange={e => { setQuantity(Number(e.target.value)); setError('') }}
                  disabled={!selectedBatch} required style={{ width: '100%' }} />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  3. Hedef Kuruluş *
                  {targetType && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({targetType === 'DISTRIBUTOR' ? 'Yalnızca Dağıtıcılar' : 'Yalnızca Eczaneler'})
                  </span>}
                </label>
                <input placeholder="İsim veya şehir ile ara..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', marginBottom: '0.4rem' }} />
                <select value={targetOrgId} onChange={e => { setTarget(e.target.value); setError('') }} required style={{ width: '100%' }}>
                  <option value="">— Hedef kuruluş seçin —</option>
                  {orgs.filter(o => !search || o.organizationName.toLowerCase().includes(search.toLowerCase()) || (o.city && o.city.toLowerCase().includes(search.toLowerCase())))
                    .map(o => (
                      <option key={o.organizationId} value={o.organizationId}>
                        {o.organizationName}{o.city ? ` — ${o.city}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* ── Soğuk Zincir Bölümü ── */}
              <div style={{
                border: `1px solid ${showColdChain ? '#7dd3fc' : 'var(--border)'}`,
                borderRadius: 10, marginBottom: '1rem', overflow: 'hidden'
              }}>
                <button type="button"
                  style={{
                    width: '100%', padding: '0.85rem 1rem',
                    background: showColdChain ? '#eff6ff' : 'var(--bg-secondary)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '0.9rem', fontWeight: 600, color: showColdChain ? '#1e40af' : 'var(--text)'
                  }}
                  onClick={() => setShowCC(v => !v)}>
                  <span>❄ Soğuk Zincir Takibi
                    {selectedBatch?.storageCondition && (
                      <span style={{ marginLeft: '0.5rem', fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ({selectedBatch.storageCondition})
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {showColdChain ? '▲ Gizle' : '▼ Ekle (Önerilen)'}
                  </span>
                </button>

                {showColdChain && (
                  <div style={{ padding: '1rem', background: '#f8fafc' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Taşıma sırasında ölçülen sıcaklıkları girin. Limit aşılırsa ihlal olarak kaydedilir.
                    </div>

                    {/* İzin verilen aralık */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                          İzin Verilen Min (°C)
                        </label>
                        <input type="number" step="0.1" value={cc.minAllowedTemp}
                          onChange={e => setCc(p => ({ ...p, minAllowedTemp: e.target.value }))}
                          style={{ width: '100%', background: '#e0f2fe' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                          İzin Verilen Max (°C)
                        </label>
                        <input type="number" step="0.1" value={cc.maxAllowedTemp}
                          onChange={e => setCc(p => ({ ...p, maxAllowedTemp: e.target.value }))}
                          style={{ width: '100%', background: '#e0f2fe' }} />
                      </div>
                    </div>

                    {/* Ölçülen değerler */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {[
                        { label: 'Min Ölçülen (°C)', key: 'minTemperature' },
                        { label: 'Max Ölçülen (°C)', key: 'maxTemperature' },
                        { label: 'Ortalama (°C)',    key: 'avgTemperature' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>{f.label}</label>
                          <input type="number" step="0.1" value={cc[f.key]}
                            placeholder="—"
                            onChange={e => setCc(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: '100%' }} />
                        </div>
                      ))}
                    </div>

                    {/* İhlal önizleme */}
                    {hasCcData && (() => {
                      const violated = Number(cc.maxTemperature) > Number(cc.maxAllowedTemp) ||
                                       Number(cc.minTemperature) < Number(cc.minAllowedTemp)
                      return (
                        <div style={{
                          padding: '0.6rem 0.8rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                          background: violated ? '#fee2e2' : '#d1fae5',
                          color: violated ? '#991b1b' : '#065f46',
                          marginBottom: '0.75rem'
                        }}>
                          {violated
                            ? `⚠ İhlal: Sıcaklık ${cc.maxTemperature}°C (limit: ${cc.maxAllowedTemp}°C)`
                            : `✓ Geçerli: Sıcaklık aralık içinde`
                          }
                        </div>
                      )
                    })()}

                    {/* Araç ve zaman */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>Araç / Plaka</label>
                        <input placeholder="34ABC123" value={cc.vehicleId}
                          onChange={e => setCc(p => ({ ...p, vehicleId: e.target.value }))} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>Taşıma Başlangıç</label>
                        <input type="datetime-local" value={cc.transportStartTime}
                          onChange={e => setCc(p => ({ ...p, transportStartTime: e.target.value }))} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>Taşıma Bitiş</label>
                        <input type="datetime-local" value={cc.transportEndTime}
                          onChange={e => setCc(p => ({ ...p, transportEndTime: e.target.value }))} style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Notlar (isteğe bağlı)</label>
                <input placeholder="Transfer notları..." value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%' }} />
              </div>

              {/* Özet */}
              {selectedBatch && targetOrgId && quantity >= 1 && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <strong>Transfer Özeti:</strong>{' '}
                  {quantity} adet <strong>{selectedBatch.medicineName}</strong>
                  {' '}→ <strong>{selectedOrg?.organizationName || '—'}</strong>
                  {showColdChain && <span style={{ marginLeft: '0.75rem', color: '#2980b9' }}>+ Soğuk zincir kaydı</span>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary"
                  disabled={submitting || !selectedBatch || !targetOrgId}
                  style={{ flex: 1, fontWeight: 700 }}>
                  {submitting ? 'Transfer yapılıyor…' : `📤 ${quantity} Adet Transfer Et`}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/medicines')}>İptal</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
