import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transferRequestService } from '../services/transferRequestService'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

export default function IncomingMedicinesPage() {
  const navigate = useNavigate()
  const user = getUser()
  const role = user?.role || ''

  const [transfers, setTransfers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  const pageTitle = role === 'PHARMACY_USER' ? 'Gelen Transferler' : 'Gelen Transferler'
  const pageDesc  = role === 'PHARMACY_USER'
    ? 'Dağıtıcıdan gelen, envantere eklenen ilaçlar'
    : 'Üreticiden gelen, envantere eklenen ilaçlar'

  function load() {
    setLoading(true); setError('')
    transferRequestService.getIncoming()
      .then(data => setTransfers((data || []).filter(t => t.status === 'TRANSFERRED')))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = transfers.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.medicineName?.toLowerCase().includes(q) ||
           t.batchNumber?.toLowerCase().includes(q) ||
           t.fromOrganizationName?.toLowerCase().includes(q) ||
           t.transferReferenceNo?.toLowerCase().includes(q)
  })

  const totalQty = filtered.reduce((s, t) => s + (t.quantity || 0), 0)

  return (
    <div>
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <p>{pageDesc}</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#27ae60' }}>{transfers.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Transfer Sayısı</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 130, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2980b9' }}>{totalQty}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Toplam Adet</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={load}>↻ Yenile</button>
        {role === 'PHARMACY_USER' && (
          <button className="btn btn-accent btn-sm" style={{ alignSelf: 'center', background: '#8e44ad', color: '#fff', border: 'none' }}
            onClick={() => navigate('/medicines/dispense')}>
            💉 Hastaya Teslim Et
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Gelen Transferler ({filtered.length})</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              placeholder="İlaç, parti, gönderen ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: '200px' }}
            />
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📥</div>
            <div style={{ fontWeight: 600 }}>
              {transfers.length === 0 ? 'Henüz gelen transfer yok' : 'Sonuç bulunamadı'}
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {role === 'PHARMACY_USER'
                ? 'Dağıtıcıdan ilaç transferi bekleniyor.'
                : 'Üreticiden ilaç transferi bekleniyor.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Ref No', 'İlaç Adı', 'Parti No', 'Miktar', 'Gönderen', 'Transfer Tarihi', 'İşlemler'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.transferRequestId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.77rem', color: 'var(--text-muted)' }}>
                      {t.transferReferenceNo}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{t.medicineName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.batchNumber}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#27ae60', fontSize: '1rem' }}>{t.quantity}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 3 }}>adet</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.82rem' }}>{t.fromOrganizationName}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {t.dispatchedAt || t.createdAt}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => navigate('/medicines')}>
                          Envanterde Gör
                        </button>
                        {role === 'PHARMACY_USER' && (
                          <button className="btn btn-accent btn-sm"
                            style={{ background: '#8e44ad', color: '#fff', border: 'none' }}
                            onClick={() => navigate('/medicines/dispense')}>
                            Teslim Et
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
