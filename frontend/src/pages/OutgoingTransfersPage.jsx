import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transferRequestService } from '../services/transferRequestService'
import { coldChainService } from '../services/coldChainService'
import { toast } from '../components/Toast'

const STATUS_TR = {
  PENDING:     { label: 'Bekliyor',     bg: '#fff3cd', color: '#856404' },
  TRANSFERRED: { label: 'Teslim Edildi',bg: '#d1e7dd', color: '#0a3622' },
  CANCELLED:   { label: 'İptal',        bg: '#f8d7da', color: '#842029' },
  FAILED:      { label: 'Başarısız',    bg: '#f8d7da', color: '#842029' },
  DELIVERED:   { label: 'Teslim',       bg: '#d1e7dd', color: '#0a3622' },
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

function ColdChainForm({ transferId, onClose, onSaved }) {
  const [form, setForm] = useState({
    minTemperature: 2, maxTemperature: 8, avgTemperature: 5,
    minAllowedTemp: 2, maxAllowedTemp: 8,
    transportStartTime: '', transportEndTime: '',
    vehicleId: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function save(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await coldChainService.submit(transferId, {
        ...form,
        minTemperature:    Number(form.minTemperature),
        maxTemperature:    Number(form.maxTemperature),
        avgTemperature:    Number(form.avgTemperature),
        minAllowedTemp:    Number(form.minAllowedTemp),
        maxAllowedTemp:    Number(form.maxAllowedTemp),
      })
      onSaved()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="card" style={{ width: 520, maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>❄ Soğuk Zincir Verisi Gir</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={save}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Min Ölçülen (°C)', key: 'minTemperature' },
              { label: 'Max Ölçülen (°C)', key: 'maxTemperature' },
              { label: 'Ortalama (°C)',     key: 'avgTemperature' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>{f.label}</label>
                <input type="number" step="0.1"
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'İzin Verilen Min (°C)', key: 'minAllowedTemp' },
              { label: 'İzin Verilen Max (°C)', key: 'maxAllowedTemp' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>{f.label}</label>
                <input type="number" step="0.1"
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Taşıma Başlangıç</label>
              <input type="datetime-local" value={form.transportStartTime}
                onChange={e => setForm(p => ({ ...p, transportStartTime: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Taşıma Bitiş</label>
              <input type="datetime-local" value={form.transportEndTime}
                onChange={e => setForm(p => ({ ...p, transportEndTime: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Araç / Plaka</label>
            <input placeholder="Örn: 34ABC123" value={form.vehicleId}
              onChange={e => setForm(p => ({ ...p, vehicleId: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Notlar</label>
            <input placeholder="Ek notlar..." value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>İptal</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OutgoingTransfersPage() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [actionId, setActionId] = useState(null)
  const [ccFormId, setCcFormId] = useState(null)

  function load() {
    setLoading(true); setError('')
    transferRequestService.getOutgoing()
      .then(setRequests)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleDispatch(id) {
    if (!window.confirm('Bu transferi göndermek istiyor musunuz? Ürün stoğunuzdan düşülecek ve alıcıya doğrudan aktarılacak.')) return
    setActionId(id); setError('')
    try {
      const r = requests.find(x => x.transferRequestId === id)
      toast('Transfer işlemi başlatılıyor...', 'info')
      await transferRequestService.dispatch(id)
      toast(`İlaç başarıyla transfer edildi. ${r?.medicineName || ''} (${r?.quantity || ''} adet) alıcı envanterine eklendi.`, 'success')
      load()
    } catch (e) {
      toast('İşlem sırasında hata oluştu: ' + e.message, 'error')
      setError('Transfer başarısız: ' + e.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Bu transfer talebini iptal etmek istediğinizden emin misiniz? Stok değişmeyecek.')) return
    setActionId(id); setError('')
    try {
      await transferRequestService.cancel(id)
      toast('Transfer iptal edildi — stok etkilenmedi.', 'info')
      load()
    } catch (e) {
      toast('İptal başarısız: ' + e.message, 'error')
      setError('İptal başarısız: ' + e.message)
    } finally {
      setActionId(null)
    }
  }

  const pending     = requests.filter(r => r.status === 'PENDING')
  const transferred = requests.filter(r => r.status === 'TRANSFERRED')
  const cancelled   = requests.filter(r => r.status === 'CANCELLED' || r.status === 'FAILED')

  return (
    <div>
      <div className="page-header">
        <h1>Giden Transferler</h1>
        <p>Oluşturduğunuz transfer talepleri ve gönderim durumları</p>
      </div>

      {ccFormId && (
        <ColdChainForm
          transferId={ccFormId}
          onClose={() => setCcFormId(null)}
          onSaved={() => { setCcFormId(null); load() }}
        />
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Bekleyen',        count: pending.length,     color: '#856404' },
          { label: 'Teslim Edildi',   count: transferred.length, color: '#0a3622' },
          { label: 'İptal / Başarısız',count: cancelled.length,  color: '#842029' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: 1, minWidth: 120, padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
        <button className="btn btn-primary" style={{ alignSelf: 'center' }}
          onClick={() => navigate('/medicines/transfer')}>
          + Yeni Transfer Talebi
        </button>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={load}>↻</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {loading ? <div className="spinner" /> : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
          <div style={{ fontWeight: 600 }}>Henüz transfer talebi yok</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tüm Transfer Talepleri ({requests.length})</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Referans No', 'İlaç', 'Parti', 'Miktar', 'Hedef', 'Durum', 'Soğuk Zincir', 'Tarih', 'İşlemler'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.transferRequestId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.transferReferenceNo}</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{r.medicineName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.batchNumber}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#2980b9' }}>{r.quantity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 3 }}>adet</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>{r.toOrganizationName}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}><StatusPill status={r.status} /></td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {r.coldChainStatus ? (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          color: r.coldChainStatus === 'VALID' ? '#065f46' : '#991b1b'
                        }}>
                          {r.coldChainStatus === 'VALID' ? '❄ Geçerli' : '⚠ İhlal'}
                        </span>
                      ) : (
                        r.status === 'PENDING' && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                            onClick={() => setCcFormId(r.transferRequestId)}>
                            + Ekle
                          </button>
                        )
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.createdAt}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {r.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-accent btn-sm"
                            disabled={actionId === r.transferRequestId}
                            onClick={() => handleDispatch(r.transferRequestId)}
                            style={{ background: '#2980b9', color: '#fff', border: 'none' }}>
                            {actionId === r.transferRequestId ? 'Gönderiliyor…' : '📤 Gönder'}
                          </button>
                          <button className="btn btn-ghost btn-sm"
                            disabled={actionId === r.transferRequestId}
                            onClick={() => handleCancel(r.transferRequestId)}>
                            İptal
                          </button>
                        </div>
                      )}
                      {r.status === 'TRANSFERRED' && (
                        <span style={{ fontSize: '0.78rem', color: '#0a3622', fontWeight: 600 }}>
                          ✓ Transfer tamamlandı
                        </span>
                      )}
                      {(r.status === 'CANCELLED' || r.status === 'FAILED') && (
                        <span style={{ fontSize: '0.78rem', color: '#842029' }}>✕ İptal edildi</span>
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
