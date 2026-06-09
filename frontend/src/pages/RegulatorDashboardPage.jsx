import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import StatCard from '../components/StatCard'
import { medicineService } from '../services/medicineService'
import { coldChainService } from '../services/coldChainService'
import { transferRequestService } from '../services/transferRequestService'
import { api } from '../services/api'

function RiskBadge({ level }) {
  const map = {
    CRITICAL: { bg: '#fee2e2', color: '#991b1b', label: 'Kritik' },
    WARNING:  { bg: '#fef3c7', color: '#92400e', label: 'Uyarı' },
    WATCH:    { bg: '#e0f2fe', color: '#075985', label: 'Takip' },
    HIGH:     { bg: '#fee2e2', color: '#991b1b', label: 'Yüksek' },
    MEDIUM:   { bg: '#fef3c7', color: '#92400e', label: 'Orta' },
    LOW:      { bg: '#e0f2fe', color: '#075985', label: 'Düşük' },
  }
  const s = map[level] || { bg: '#eee', color: '#333', label: level }
  return (
    <span style={{
      display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color
    }}>{s.label}</span>
  )
}

function StockBadge({ status }) {
  const map = {
    CRITICAL: { bg: '#fee2e2', color: '#991b1b', label: 'Kritik Stok' },
    LOW:      { bg: '#fef3c7', color: '#92400e', label: 'Düşük Stok' },
    WATCH:    { bg: '#e0f2fe', color: '#075985', label: 'Takipte' },
  }
  const s = map[status] || { bg: '#eee', color: '#333', label: status }
  return (
    <span style={{
      display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color
    }}>{s.label}</span>
  )
}

function SeverityBadge({ severity }) {
  return <RiskBadge level={severity} />
}

function TimelineEntry({ entry, index }) {
  const isManufacturer = entry.from && entry.from.toLowerCase().includes('pharma') || entry.from?.toLowerCase().includes('üretici')
  const color = isManufacturer ? '#2980b9' : '#8e44ad'
  const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: color + '22',
        border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', flexShrink: 0
      }}>📦</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
          {entry.from} → {entry.to}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
          <span style={{ fontWeight: 600, color: '#2980b9' }}>{entry.quantity} adet</span>
          {' '}{entry.medicineName}
          {' · '}
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{entry.referenceNo}</span>
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ts}</div>
    </div>
  )
}

export default function RegulatorDashboardPage() {
  const [data, setData]             = useState(null)
  const [transfers, setTransfers]   = useState([])
  const [violations, setViolations] = useState([])
  const [expiring, setExpiring]     = useState([])
  const [critStock, setCritStock]   = useState([])
  const [suspicious, setSuspicious] = useState([])
  const [timeline, setTimeline]     = useState([])
  const [loading, setLoading]       = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      medicineService.getDashboard(),
      transferRequestService.getAll().catch(() => []),
      coldChainService.getViolations().catch(() => []),
      api.get('/api/audit/expiring?days=90').catch(() => []),
      api.get('/api/audit/critical-stock?threshold=20').catch(() => []),
      api.get('/api/audit/suspicious').catch(() => []),
      api.get('/api/audit/timeline?limit=15').catch(() => []),
    ]).then(([d, tr, viol, exp, crit, susp, tl]) => {
      setData(d)
      setTransfers(tr || [])
      setViolations(viol || [])
      setExpiring(exp || [])
      setCritStock(crit || [])
      setSuspicious(susp || [])
      setTimeline(tl || [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const total = (data?.createdCount || 0) + (data?.inDistributionCount || 0) +
                (data?.atPharmacyCount || 0) + (data?.dispensedCount || 0) + (data?.recalledCount || 0)

  const transferred  = transfers.filter(t => t.status === 'TRANSFERRED').length
  const todayStart   = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayXfers   = transfers.filter(t => {
    const d = t.dispatchedAt || t.createdAt
    return t.status === 'TRANSFERRED' && d && new Date(d) >= todayStart
  }).length

  const criticalExpiring = expiring.filter(e => e.riskLevel === 'CRITICAL').length
  const criticalStockCnt = critStock.filter(s => s.stockStatus === 'CRITICAL').length
  const highSeverity     = suspicious.filter(s => s.severity === 'HIGH').length

  const statusChartData = [
    { name: 'Üretildi',   value: data?.createdCount        || 0, fill: '#2980b9' },
    { name: 'Dağıtımda',  value: data?.inDistributionCount || 0, fill: '#f39c12' },
    { name: 'Eczanede',   value: data?.atPharmacyCount     || 0, fill: '#8e44ad' },
    { name: 'Teslim',     value: data?.dispensedCount      || 0, fill: '#27ae60' },
    { name: 'Geri Çağır', value: data?.recalledCount       || 0, fill: '#e74c3c' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Müfettiş Gösterge Paneli</h1>
        <p>Sistem geneli tedarik zinciri izleme ve denetim merkezi</p>
      </div>

      {/* Alert banner for critical items */}
      {(criticalExpiring > 0 || criticalStockCnt > 0 || highSeverity > 0) && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>⚠</span>
          <div style={{ flex: 1 }}>
            <strong>Dikkat Gerektiren Durumlar:</strong>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
              {criticalExpiring > 0 && `${criticalExpiring} kritik son kullanım · `}
              {criticalStockCnt > 0 && `${criticalStockCnt} kritik stok · `}
              {highSeverity > 0 && `${highSeverity} yüksek riskli kayıt`}
            </span>
          </div>
        </div>
      )}

      {/* Main stats grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <StatCard icon="💊" value={total}                       label="Toplam İlaç"              color="#1e3a5f" />
        <StatCard icon="🔄" value={transferred}                 label="Toplam Transfer"          color="#2980b9" />
        <StatCard icon="📅" value={todayXfers}                  label="Bugünkü Transferler"      color="#17a589" />
        <StatCard icon="🏪" value={data?.atPharmacyCount || 0}  label="Eczaneye Ulaşan"         color="#8e44ad" />
        <StatCard icon="💉" value={data?.dispensedCount  || 0}  label="Hastaya Teslim"          color="#27ae60" />
        <StatCard icon="⏰" value={expiring.length}             label="Son Kullanımı Yaklaşan"   color="#f39c12" />
        <StatCard icon="📉" value={critStock.length}            label="Stokta Azalan"           color="#e67e22" />
        <StatCard icon="⚠" value={suspicious.length}           label="Şüpheli Kayıt"            color="#e74c3c" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">İlaç Durum Dağılımı</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hızlı Erişim</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.5rem' }}>
            {[
              { icon: '💊', label: 'Tüm İlaçlar',        sub: 'Tam envanter',         path: '/medicines' },
              { icon: '🔍', label: 'Denetim Kayıtları',  sub: 'Zincir geçmişi',       path: '/audit' },
              { icon: '📊', label: 'Denetim Raporu',     sub: 'Filtreli rapor',        path: '/audit/report' },
              { icon: '⏰', label: 'Son Kullanım',        sub: `${expiring.length} kayıt`, path: '/audit/expiring' },
              { icon: '📉', label: 'Kritik Stok',         sub: `${critStock.length} kalem`, path: '/audit/critical-stock' },
              { icon: '⚠', label: 'Şüpheli İşlemler',   sub: `${suspicious.length} kayıt`, path: '/audit/suspicious' },
            ].map(a => (
              <div key={a.path} className="action-card" onClick={() => navigate(a.path)}
                style={{ padding: '0.75rem', cursor: 'pointer' }}>
                <div style={{ fontSize: '1.3rem' }}>{a.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{a.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring medicines */}
      {expiring.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: criticalExpiring > 0 ? '1px solid #fca5a5' : '1px solid var(--border)' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: criticalExpiring > 0 ? '#e74c3c' : 'var(--text)' }}>
              ⏰ Son Kullanımı Yaklaşan İlaçlar ({expiring.length})
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit/expiring')}>Tümünü Gör</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['İlaç Adı', 'Parti No', 'Sahip', 'Miktar', 'Son Kullanım', 'Kalan Gün', 'Risk'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expiring.slice(0, 6).map((e, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: e.riskLevel === 'CRITICAL' ? '#fff5f5' : e.riskLevel === 'WARNING' ? '#fffbeb' : 'transparent'
                  }}>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 600 }}>{e.medicineName}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontFamily: 'monospace', fontSize: '0.77rem' }}>{e.batchNumber}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem' }}>{e.ownerName}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: '#2980b9' }}>{e.quantity}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.77rem' }}>{e.expiryDate}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: e.daysLeft <= 30 ? '#e74c3c' : e.daysLeft <= 60 ? '#f39c12' : '#2980b9' }}>
                      {e.daysLeft} gün
                    </td>
                    <td style={{ padding: '0.5rem 0.65rem' }}><RiskBadge level={e.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Critical stock */}
      {critStock.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: criticalStockCnt > 0 ? '#e67e22' : 'var(--text)' }}>
              📉 Kritik Stok Seviyeleri ({critStock.length})
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit/critical-stock')}>Tümünü Gör</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['İlaç Adı', 'Parti No', 'Sahip', 'Mevcut Miktar', 'Min Eşik', 'Durum'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {critStock.slice(0, 6).map((s, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: s.stockStatus === 'CRITICAL' ? '#fff5f5' : s.stockStatus === 'LOW' ? '#fffbeb' : 'transparent'
                  }}>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 600 }}>{s.medicineName}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontFamily: 'monospace', fontSize: '0.77rem' }}>{s.batchNumber}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem' }}>{s.ownerName}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: s.currentQuantity <= 5 ? '#e74c3c' : '#f39c12' }}>
                      {s.currentQuantity}
                    </td>
                    <td style={{ padding: '0.5rem 0.65rem', color: 'var(--text-muted)' }}>{s.minimumThreshold}</td>
                    <td style={{ padding: '0.5rem 0.65rem' }}><StockBadge status={s.stockStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspicious transactions */}
      {suspicious.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: highSeverity > 0 ? '1px solid #fca5a5' : '1px solid var(--border)' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: highSeverity > 0 ? '#e74c3c' : 'var(--text)' }}>
              ⚠ Şüpheli / Kontrol Gerektiren Kayıtlar ({suspicious.length})
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit/suspicious')}>Tümünü Gör</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem' }}>
            {suspicious.slice(0, 4).map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: 8,
                background: s.severity === 'HIGH' ? '#fff5f5' : s.severity === 'MEDIUM' ? '#fffbeb' : '#f8fafc',
                border: `1px solid ${s.severity === 'HIGH' ? '#fca5a5' : s.severity === 'MEDIUM' ? '#fcd34d' : '#e2e8f0'}`
              }}>
                <span style={{ fontSize: '1.1rem' }}>{s.severity === 'HIGH' ? '🔴' : s.severity === 'MEDIUM' ? '🟡' : '🔵'}</span>
                <div style={{ flex: 1, fontSize: '0.83rem' }}>{s.description}</div>
                <SeverityBadge severity={s.severity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cold chain violations */}
      {violations.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #fca5a5' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: '#e74c3c' }}>❄ Soğuk Zincir İhlalleri ({violations.length})</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit/report')}>Raporda Gör</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Transfer Ref', 'Min', 'Max', 'İzin Verilen Max', 'Araç', 'Tarih'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {violations.slice(0, 5).map(v => (
                  <tr key={v.recordId} style={{ borderBottom: '1px solid var(--border)', background: '#fff5f5' }}>
                    <td style={{ padding: '0.5rem 0.65rem', fontFamily: 'monospace', fontSize: '0.77rem' }}>{v.transferReferenceNo}</td>
                    <td style={{ padding: '0.5rem 0.65rem', color: '#2980b9', fontWeight: 600 }}>{v.minTemperature}°C</td>
                    <td style={{ padding: '0.5rem 0.65rem', color: '#e74c3c', fontWeight: 600 }}>{v.maxTemperature}°C</td>
                    <td style={{ padding: '0.5rem 0.65rem' }}>{v.maxAllowedTemp}°C</td>
                    <td style={{ padding: '0.5rem 0.65rem' }}>{v.vehicleId || '—'}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.77rem', color: 'var(--text-muted)' }}>{v.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer timeline */}
      {timeline.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Son Transferler Zaman Çizelgesi</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit')}>Tümünü Gör</button>
          </div>
          <div style={{ padding: '0 0.5rem' }}>
            {timeline.map((entry, i) => <TimelineEntry key={i} entry={entry} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
