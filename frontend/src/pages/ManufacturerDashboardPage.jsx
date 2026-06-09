import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import StatCard from '../components/StatCard'
import MedicineTable from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'

export default function ManufacturerDashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    medicineService.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner" />

  const chartData = [
    { name: 'Üretildi',   value: data?.createdCount        || 0, fill: '#2980b9' },
    { name: 'Dağıtımda',  value: data?.inDistributionCount || 0, fill: '#f39c12' },
    { name: 'Eczanede',   value: data?.atPharmacyCount     || 0, fill: '#8e44ad' },
    { name: 'Teslim',     value: data?.dispensedCount      || 0, fill: '#27ae60' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>Üretici Gösterge Paneli</h1>
        <p>{data?.organizationName || 'Üretici'} — Üretim ve Sevkiyat Özeti</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📦" value={data?.myOrganizationCount || 0}   label="Kendi Stoğum (adet)"  color="#1e3a5f" />
        <StatCard icon="📤" value={data?.outgoingTransferCount || 0} label="Gönderilen Transferler" color="#2980b9" />
        <StatCard icon="⏳" value={data?.pendingTransferCount || 0}  label="Bekleyen Transfer"     color="#f39c12" />
        {(data?.pendingOrderCount || 0) > 0 && (
          <StatCard icon="🛒" value={data.pendingOrderCount}          label="Bekleyen Sipariş"     color="#8e44ad" />
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">İlaç Durum Dağılımı</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="quick-actions">
        <div className="action-card" onClick={() => navigate('/medicines/batch/create')}>
          <div className="action-card-icon">➕</div>
          <div className="action-card-label">Toplu İlaç Oluştur</div>
          <div className="action-card-sub">Yeni ilacı blokzincire kaydet</div>
        </div>
        <div className="action-card" onClick={() => navigate('/medicines/transfer')}>
          <div className="action-card-icon">📋</div>
          <div className="action-card-label">Transfer Talebi</div>
          <div className="action-card-sub">Dağıtıcıya toplu transfer</div>
        </div>
        <div className="action-card" onClick={() => navigate('/transfers/outgoing')}
          style={{ position: 'relative' }}>
          <div className="action-card-icon">📤</div>
          <div className="action-card-label">Giden Transferler</div>
          <div className="action-card-sub">
            {data?.pendingTransferCount > 0
              ? `${data.pendingTransferCount} talep bekliyor`
              : 'Gönderim durumu'}
          </div>
        </div>
        <div className="action-card" onClick={() => navigate('/manufacturer/orders')}
          style={{ position: 'relative' }}>
          <div className="action-card-icon">🛒</div>
          <div className="action-card-label">Gelen Siparişler</div>
          <div className="action-card-sub">
            {data?.pendingOrderCount > 0
              ? `${data.pendingOrderCount} sipariş bekliyor`
              : 'Dağıtıcı siparişleri'}
          </div>
          {data?.pendingOrderCount > 0 && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              background: '#e74c3c', color: '#fff',
              borderRadius: '50%', width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700
            }}>{data.pendingOrderCount}</span>
          )}
        </div>
        <div className="action-card" onClick={() => navigate('/medicines')}>
          <div className="action-card-icon">💊</div>
          <div className="action-card-label">Envanter</div>
          <div className="action-card-sub">Bu düğümdeki tüm ilaçlar</div>
        </div>
      </div>

      {data?.recentMedicines?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Son Eklenen İlaçlar</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/medicines')}>Tümünü Gör</button>
          </div>
          <MedicineTable
            medicines={data.recentMedicines}
            compact
            onTransfer={id => navigate(`/medicines/transfer?linearId=${id}`)}
          />
        </div>
      )}
    </div>
  )
}
