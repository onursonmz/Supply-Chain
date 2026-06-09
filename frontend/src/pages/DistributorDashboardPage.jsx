import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import StatCard from '../components/StatCard'
import { medicineService } from '../services/medicineService'
import { transferRequestService } from '../services/transferRequestService'

export default function DistributorDashboardPage() {
  const [data, setData]       = useState(null)
  const [incoming, setIncoming] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      medicineService.getDashboard(),
      transferRequestService.getIncoming().catch(() => []),
    ]).then(([d, inc]) => {
      setData(d)
      setIncoming(inc || [])
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const recentIncoming = incoming
    .filter(t => t.status === 'TRANSFERRED')
    .slice(0, 5)

  const chartData = [
    { name: 'Gelen',      value: data?.incomingTransferCount || 0, fill: '#27ae60' },
    { name: 'Giden',      value: data?.outgoingTransferCount || 0, fill: '#2980b9' },
    { name: 'Bekleyen',   value: data?.pendingTransferCount  || 0, fill: '#f39c12' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Dağıtıcı Gösterge Paneli</h1>
        <p>{data?.organizationName || 'Dağıtıcı'} — Gelen ve Giden İlaç Akışı</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📦" value={data?.myOrganizationCount || 0}   label="Kendi Stoğum (adet)"  color="#1e3a5f" />
        <StatCard icon="📥" value={data?.incomingTransferCount || 0} label="Gelen Transferler"     color="#27ae60" />
        <StatCard icon="📤" value={data?.outgoingTransferCount || 0} label="Giden Transferler"     color="#2980b9" />
        {(data?.pendingTransferCount || 0) > 0 && (
          <StatCard icon="⏳" value={data.pendingTransferCount}       label="Bekleyen Transfer"    color="#f39c12" />
        )}
        {(data?.pendingOrderCount || 0) > 0 && (
          <StatCard icon="🛒" value={data.pendingOrderCount}          label="Bekleyen Sipariş"     color="#8e44ad" />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Transfer Akışı</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Hızlı Erişim</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
            {[
              { icon: '💊', label: 'İlaç Envanteri',     sub: `${data?.myOrganizationCount || 0} adet stok`,     path: '/medicines' },
              { icon: '📥', label: 'Gelen Transferler',  sub: `${data?.incomingTransferCount || 0} tamamlandı`,   path: '/transfers/incoming' },
              { icon: '📤', label: 'Transfer Talebi',    sub: 'Eczaneye transfer et',                             path: '/medicines/transfer' },
              { icon: '📦', label: 'Giden Transferler',  sub: `${data?.pendingTransferCount || 0} bekliyor`,      path: '/transfers/outgoing' },
              { icon: '🛒', label: 'Tedarik Talepleri',  sub: 'Üreticiye sipariş ver',                            path: '/distributor/orders' },
            ].map(a => (
              <div key={a.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                  transition: 'background 0.15s',
                  ':hover': { background: 'var(--bg-hover)' }
                }}
                onClick={() => navigate(a.path)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.label}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{a.sub}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Son gelen transferler */}
      {recentIncoming.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Son Gelen Transferler</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transfers/incoming')}>Tümünü Gör</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Ref No', 'İlaç', 'Miktar', 'Gönderen', 'Tarih'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentIncoming.map(t => (
                  <tr key={t.transferRequestId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem 0.65rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.transferReferenceNo}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 600 }}>{t.medicineName}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: '#27ae60' }}>{t.quantity} adet</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.8rem' }}>{t.fromOrganizationName}</td>
                    <td style={{ padding: '0.5rem 0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.dispatchedAt || t.createdAt}</td>
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
