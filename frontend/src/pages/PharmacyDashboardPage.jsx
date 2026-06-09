import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { medicineService } from '../services/medicineService'
import { transferRequestService } from '../services/transferRequestService'


export default function PharmacyDashboardPage() {
  const [data, setData]         = useState(null)
  const [incoming, setIncoming] = useState([])
  const [loading, setLoading]   = useState(true)
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

  return (
    <div>
      <div className="page-header">
        <h1>Eczane Gösterge Paneli</h1>
        <p>{data?.organizationName || 'Eczane'} — İlaç Teslim ve Hasta Hizmetleri</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="💊" value={data?.myOrganizationCount || 0}   label="Kendi Stoğum (adet)"  color="#1e3a5f" />
        <StatCard icon="📥" value={data?.incomingTransferCount || 0} label="Gelen Transferler"     color="#27ae60" />
        <StatCard icon="💉" value={data?.dispensedCount || 0}        label="Hastaya Teslim"        color="#8e44ad" />
        {(data?.nearExpiryCount || 0) > 0 && (
          <StatCard icon="⏰" value={data.nearExpiryCount}           label="Son Kullanım Yakın"    color="#e67e22" />
        )}
      </div>

      {(data?.nearExpiryCount || 0) > 0 && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⏰</span>
          <div>
            <strong>{data.nearExpiryCount} ilaç(lar) 60 gün içinde son kullanım tarihine ulaşıyor.</strong>
            {' '}Stoğu gözden geçirin.
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/medicines')}>Stoğu Gör</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hızlı Erişim</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
            {[
              { icon: '💊', label: 'İlaç Stoku',         sub: `${data?.myOrganizationCount || 0} adet mevcut`,     path: '/medicines' },
              { icon: '📥', label: 'Gelen Transferler',  sub: `${data?.incomingTransferCount || 0} tamamlandı`,     path: '/transfers/incoming' },
              { icon: '💉', label: 'Hastaya Teslim Et',  sub: 'İlaç teslimini kaydet',                              path: '/medicines/dispense' },
              { icon: '🛒', label: 'Tedarik Talepleri',  sub: 'Dağıtıcıya sipariş ver',                             path: '/distributor/orders' },
              { icon: '✅', label: 'İlaç Doğrulama',     sub: 'Seri/Parti ile doğrula',                             path: '/medicines/verify' },
            ].map(a => (
              <div key={a.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer',
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

        {recentIncoming.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Son Gelen Transferler</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transfers/incoming')}>Tümü</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['İlaç', 'Miktar', 'Gönderen', 'Tarih'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.65rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentIncoming.map(t => (
                    <tr key={t.transferRequestId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 0.65rem', fontWeight: 600 }}>{t.medicineName}</td>
                      <td style={{ padding: '0.5rem 0.65rem', fontWeight: 700, color: '#27ae60' }}>{t.quantity}</td>
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
    </div>
  )
}
