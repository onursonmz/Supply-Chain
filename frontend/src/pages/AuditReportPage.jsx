import { useState } from 'react'
import { api } from '../services/api'

const STATUS_LABELS = {
  PENDING:     'Bekliyor',
  TRANSFERRED: 'Transfer Edildi',
  CANCELLED:   'İptal Edildi',
  FAILED:      'Başarısız',
  DELIVERED:   'Teslim Edildi',
}

const STATUS_COLORS = {
  TRANSFERRED: { bg: '#d1e7dd', color: '#0a3622' },
  PENDING:     { bg: '#fff3cd', color: '#856404' },
  CANCELLED:   { bg: '#f8d7da', color: '#842029' },
  FAILED:      { bg: '#f8d7da', color: '#842029' },
  DELIVERED:   { bg: '#d1e7dd', color: '#0a3622' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#eee', color: '#333' }
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 600, background: c.bg, color: c.color
    }}>{STATUS_LABELS[status] || status}</span>
  )
}

export default function AuditReportPage() {
  const [filters, setFilters] = useState({ medicine: '', batch: '', status: '', from: '', to: '' })
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function generate() {
    setLoading(true); setError('')
    const params = new URLSearchParams()
    if (filters.medicine) params.append('medicine', filters.medicine)
    if (filters.status)   params.append('status', filters.status)
    if (filters.from)     params.append('from', filters.from)
    if (filters.to)       params.append('to', filters.to)
    try {
      const data = await api.get(`/api/audit/report?${params.toString()}`)
      // Apply batch filter client-side
      if (filters.batch) {
        const q = filters.batch.toLowerCase()
        data.transfers = (data.transfers || []).filter(t => t.batchNumber?.toLowerCase().includes(q))
        data.transferCount = data.transfers.length
      }
      setReport(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const transferredCount = report?.transfers?.filter(t => t.status === 'TRANSFERRED').length || 0
  const cancelledCount   = report?.transfers?.filter(t => t.status === 'CANCELLED').length   || 0

  return (
    <div>
      <div className="page-header">
        <h1>Denetim Raporu</h1>
        <p>Transfer geçmişi ve soğuk zincir ihlallerini filtreleyin ve dışa aktarın</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Rapor Filtreleri</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>İlaç Adı</label>
            <input
              placeholder="İlaç adı ile ara..."
              value={filters.medicine}
              onChange={e => setFilters(f => ({ ...f, medicine: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Parti / Lot No</label>
            <input
              placeholder="Parti numarası..."
              value={filters.batch}
              onChange={e => setFilters(f => ({ ...f, batch: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Transfer Durumu</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">Tümü</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Başlangıç Tarihi</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem' }}>Bitiş Tarihi</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? 'Oluşturuluyor…' : '📊 Rapor Oluştur'}
          </button>
          {report && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨 Yazdır / PDF</button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportCsv(report.transfers)}>📥 CSV İndir</button>
            </>
          )}
        </div>
      </div>

      {report && (
        <div id="audit-report-content">
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Toplam Transfer',      value: report.transferCount,          color: '#2980b9' },
              { label: 'Transfer Edildi',       value: transferredCount,              color: '#27ae60' },
              { label: 'İptal Edildi',          value: cancelledCount,                color: '#e74c3c' },
              { label: 'Soğuk Zincir İhlali',   value: report.coldChainViolationCount,color: '#e74c3c' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Transfer history */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div className="card-title">Transfer Geçmişi ({report.transferCount})</div>
            </div>
            {report.transfers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Kayıt bulunamadı</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Ref No', 'İlaç', 'Parti', 'Miktar', 'Gönderen', 'Alıcı', 'Durum', 'Soğuk Zincir', 'Tarih'].map(h => (
                        <th key={h} style={{ padding: '0.55rem 0.7rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.76rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.transfers.map(t => (
                      <tr key={t.transferRequestId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.55rem 0.7rem', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{t.transferReferenceNo}</td>
                        <td style={{ padding: '0.55rem 0.7rem', fontWeight: 600 }}>{t.medicineName}</td>
                        <td style={{ padding: '0.55rem 0.7rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.batchNumber}</td>
                        <td style={{ padding: '0.55rem 0.7rem', fontWeight: 700, color: '#2980b9' }}>{t.quantity}</td>
                        <td style={{ padding: '0.55rem 0.7rem', fontSize: '0.8rem' }}>{t.fromOrganizationName}</td>
                        <td style={{ padding: '0.55rem 0.7rem', fontSize: '0.8rem' }}>{t.toOrganizationName}</td>
                        <td style={{ padding: '0.55rem 0.7rem' }}><StatusBadge status={t.status} /></td>
                        <td style={{ padding: '0.55rem 0.7rem', fontSize: '0.76rem' }}>
                          {t.coldChainStatus
                            ? <span style={{ color: t.coldChainStatus === 'VALID' ? '#065f46' : '#991b1b', fontWeight: 600 }}>
                                {t.coldChainStatus === 'VALID' ? '❄ Geçerli' : '⚠ İhlal'}
                              </span>
                            : '—'
                          }
                        </td>
                        <td style={{ padding: '0.55rem 0.7rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {t.dispatchedAt || t.createdAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cold chain violations */}
          {report.coldChainViolationCount > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title" style={{ color: '#e74c3c' }}>
                  ⚠ Soğuk Zincir İhlalleri ({report.coldChainViolationCount})
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      {['Transfer Ref', 'Min Sıcaklık', 'Max Sıcaklık', 'İzin Verilen Maks', 'Araç', 'Tarih'].map(h => (
                        <th key={h} style={{ padding: '0.55rem 0.7rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.76rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.coldChainViolations.map(v => (
                      <tr key={v.recordId} style={{ borderBottom: '1px solid var(--border)', background: '#fff5f5' }}>
                        <td style={{ padding: '0.55rem 0.7rem', fontFamily: 'monospace', fontSize: '0.76rem' }}>{v.transferReferenceNo}</td>
                        <td style={{ padding: '0.55rem 0.7rem', color: '#2980b9', fontWeight: 600 }}>{v.minTemperature}°C</td>
                        <td style={{ padding: '0.55rem 0.7rem', color: '#e74c3c', fontWeight: 600 }}>{v.maxTemperature}°C</td>
                        <td style={{ padding: '0.55rem 0.7rem' }}>{v.maxAllowedTemp}°C</td>
                        <td style={{ padding: '0.55rem 0.7rem' }}>{v.vehicleId || '—'}</td>
                        <td style={{ padding: '0.55rem 0.7rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{v.submittedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.5rem' }}>
            Rapor oluşturulma zamanı: {new Date(report.generatedAt).toLocaleString('tr-TR')}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .sidebar, .navbar, .page-header p, button { display: none !important; }
          #audit-report-content { font-size: 11pt; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  )
}

function exportCsv(transfers) {
  if (!transfers || transfers.length === 0) return
  const headers = ['Ref No', 'İlaç', 'Parti', 'Miktar', 'Gönderen', 'Alıcı', 'Durum', 'Tarih']
  const rows = transfers.map(t => [
    t.transferReferenceNo, t.medicineName, t.batchNumber, t.quantity,
    t.fromOrganizationName, t.toOrganizationName, t.status,
    t.dispatchedAt || t.createdAt
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'denetim-raporu.csv'; a.click()
  URL.revokeObjectURL(url)
}
