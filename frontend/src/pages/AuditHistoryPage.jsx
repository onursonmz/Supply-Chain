import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'

const STATUS_TR = {
  CREATED: 'Üretildi',
  IN_DISTRIBUTION: 'Dağıtımda',
  AT_PHARMACY: 'Eczanede',
  DISPENSED_TO_PATIENT: 'Hastaya Teslim',
  RECALLED: 'Geri Çağırıldı',
}

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

const STATUS_ORDER = ['CREATED', 'IN_DISTRIBUTION', 'AT_PHARMACY', 'DISPENSED_TO_PATIENT', 'RECALLED']

function detectSuspicious(medicines) {
  const alerts = []

  // Duplicate serial numbers
  const serialMap = {}
  medicines.forEach(m => {
    if (!serialMap[m.serialNumber]) serialMap[m.serialNumber] = []
    serialMap[m.serialNumber].push(m)
  })
  Object.entries(serialMap).forEach(([sn, meds]) => {
    if (meds.length > 1) {
      alerts.push({ type: 'danger', msg: `⚠ Seri numarası çakışması: ${sn} — ${meds.length} kayıt` })
    }
  })

  // Expired but still active
  const today = new Date()
  medicines.forEach(m => {
    if (m.expiryDate && ['CREATED', 'IN_DISTRIBUTION', 'AT_PHARMACY'].includes(m.status)) {
      const exp = new Date(m.expiryDate)
      if (exp < today) {
        alerts.push({
          type: 'warning',
          msg: `⏰ Son kullanım tarihi geçmiş aktif ilaç: ${m.medicineName} (${m.serialNumber}) — ${m.expiryDate}`,
        })
      }
    }
  })

  return alerts
}

function computeStats(medicines) {
  const today = new Date()
  const in60Days = new Date(today)
  in60Days.setDate(in60Days.getDate() + 60)

  const recalled = medicines.filter(m => m.status === 'RECALLED').length
  const nearExpiry = medicines.filter(m => {
    if (!m.expiryDate) return false
    const exp = new Date(m.expiryDate)
    return exp >= today && exp <= in60Days
  }).length
  const batches = new Set(medicines.map(m => m.batchNumber).filter(Boolean)).size

  return { total: medicines.length, recalled, nearExpiry, batches }
}

export default function AuditHistoryPage() {
  const navigate = useNavigate()
  const [medicines, setMedicines]       = useState([])
  const [events, setEvents]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilter]       = useState('')
  const [activeTab, setActiveTab]       = useState('medicines')

  function loadMedicines() {
    setLoading(true)
    medicineService.getAuditAll()
      .then(setMedicines)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  function loadEvents() {
    setEventsLoading(true)
    medicineService.getAllEvents()
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false))
  }

  function reload() {
    loadMedicines()
    loadEvents()
  }

  useEffect(reload, [])

  const suspiciousAlerts = detectSuspicious(medicines)
  const stats = computeStats(medicines)

  const filtered = medicines.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      m.medicineName?.toLowerCase().includes(q) ||
      m.batchNumber?.toLowerCase().includes(q) ||
      m.serialNumber?.toLowerCase().includes(q) ||
      m.ownerOrganizationName?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || m.status === filterStatus
    return matchSearch && matchStatus
  })

  const filteredEvents = events.filter(ev => {
    const q = search.toLowerCase()
    return !q ||
      ev.medicineName?.toLowerCase().includes(q) ||
      ev.serialNumber?.toLowerCase().includes(q) ||
      ev.fromOrganizationName?.toLowerCase().includes(q) ||
      ev.toOrganizationName?.toLowerCase().includes(q)
  })

  return (
    <div>
      <div className="page-header">
        <h1>Denetim Kayıtları</h1>
        <p>Tüm ilaç hareketlerinin blokzincir kaydı</p>
      </div>

      {/* Suspicious Activity Detection */}
      {suspiciousAlerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#856404', fontSize: '0.9rem' }}>
              🔍 Şüpheli Aktivite Tespiti — {suspiciousAlerts.length} uyarı
            </div>
            {suspiciousAlerts.map((a, i) => (
              <div key={i} style={{
                padding: '0.4rem 0.75rem',
                marginBottom: '0.35rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                background: a.type === 'danger' ? '#f8d7da' : '#fff3cd',
                color: a.type === 'danger' ? '#721c24' : '#856404',
                border: `1px solid ${a.type === 'danger' ? '#f5c6cb' : '#ffc107'}`,
              }}>
                {a.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Toplam Kayıt', value: stats.total, color: '#2980b9', icon: '📋' },
          { label: 'Geri Çağırılan', value: stats.recalled, color: '#e74c3c', icon: '⚠️' },
          { label: 'Son Kullanım Yakın (60 gün)', value: stats.nearExpiry, color: '#f39c12', icon: '⏰' },
          { label: 'Aktif Batch', value: stats.batches, color: '#27ae60', icon: '📦' },
        ].map(s => (
          <div key={s.label} className="card" style={{ marginBottom: 0, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.15rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'medicines', label: 'İlaç Kayıtları' },
          { key: 'events', label: 'Transfer Olayları' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.65rem 1.4rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search / Filter */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {activeTab === 'medicines'
              ? `Tüm Kayıtlar (${filtered.length})`
              : `Transfer Olayları (${filteredEvents.length})`}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="İlaç adı, parti no, seri no ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: '220px' }}
            />
            {activeTab === 'medicines' && (
              <select value={filterStatus} onChange={e => setFilter(e.target.value)}>
                <option value="">Tüm Durumlar</option>
                {STATUS_ORDER.map(s => (
                  <option key={s} value={s}>{STATUS_TR[s] || s}</option>
                ))}
              </select>
            )}
            <button className="btn btn-ghost btn-sm" onClick={reload}>↻ Yenile</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Medicine Records Tab */}
        {activeTab === 'medicines' && (
          loading ? <div className="spinner" /> : (
            filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p>Denetim kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>İlaç Adı</th>
                      <th>GTIN</th>
                      <th>Parti / Seri No</th>
                      <th>Üretici</th>
                      <th>Mevcut Sahip</th>
                      <th>Durum</th>
                      <th>Reçete</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(m => (
                      <tr key={m.linearId}>
                        <td>
                          <strong>{m.medicineName}</strong>
                          {m.category && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.category}</div>
                          )}
                        </td>
                        <td className="id-col">{m.gtin || '—'}</td>
                        <td>
                          <div style={{ fontSize: '0.78rem' }}>{m.batchNumber}</div>
                          <div className="id-col">{m.serialNumber}</div>
                        </td>
                        <td>{m.manufacturerName || '—'}</td>
                        <td>{m.ownerOrganizationName || m.owner || '—'}</td>
                        <td><StatusBadge status={m.status} /></td>
                        <td style={{ fontSize: '0.78rem' }}>{m.prescriptionReference || '—'}</td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/medicines/${m.linearId}`)}
                          >
                            Detay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )
        )}

        {/* Transfer Events Tab */}
        {activeTab === 'events' && (
          eventsLoading ? <div className="spinner" /> : (
            filteredEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>Transfer olayı bulunamadı.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>İlaç Adı</th>
                      <th>Seri No</th>
                      <th>İşlem Türü</th>
                      <th>Kaynak Kuruluş</th>
                      <th>Hedef Kuruluş</th>
                      <th>Gerçekleştiren</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map(ev => (
                      <tr key={ev.eventId}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{ev.timestamp || '—'}</td>
                        <td>
                          <strong>{ev.medicineName || '—'}</strong>
                        </td>
                        <td className="id-col">{ev.serialNumber || '—'}</td>
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: ACTION_COLOR[ev.actionType] || '#666',
                          }}>
                            {ACTION_ICON[ev.actionType] || '📋'} {ACTION_TR[ev.actionType] || ev.actionType}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{ev.fromOrganizationName || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{ev.toOrganizationName || '—'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ev.performedBy || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}
