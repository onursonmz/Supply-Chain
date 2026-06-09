import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import MedicineTable from '../components/MedicineTable'
import { dashboardService } from '../services/medicineService'

export default function DashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const navigate = useNavigate()
  const user = (() => { try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null } })()

  useEffect(() => {
    dashboardService.get()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-text">Loading dashboard…</div>

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.displayName || user?.username}</h1>
        <p>Node: <strong>{data?.nodeName}</strong> · Pharmaceutical supply chain overview</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {data && (
        <>
          <div className="stats-grid">
            <StatCard icon="💊" value={data.totalMedicines}        label="Total Medicines"         color="primary" />
            <StatCard icon="🔄" value={data.totalTransfers}        label="Total Transfers"         color="accent"  />
            <StatCard icon="✅" value={data.activeMedicines}       label="Active Medicines"        color="success" />
            <StatCard icon="🏥" value={data.currentOwnerMedicines} label="My Node Medicines"       color="warning" />
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">⚡ Quick Actions</div>
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={() => navigate('/medicines/create')}>
                💊 Create Medicine
              </button>
              <button className="btn btn-accent" onClick={() => navigate('/medicines/transfer')}>
                🔄 Transfer Medicine
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/medicines')}>
                📋 View All Medicines
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">🕐 Recent Activity</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/medicines')}>
                View All →
              </button>
            </div>
            <MedicineTable
              medicines={data.recentTransactions || []}
              compact
              onTransfer={id => navigate(`/medicines/transfer?linearId=${id}`)}
            />
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">🌐 Network Participants</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Role</th><th>Organisation</th><th>Web Port</th><th>RPC Port</th></tr>
                </thead>
                <tbody>
                  <tr><td>🏭 İlaç Üreticisi</td><td>Manufacturer</td><td>8081</td><td>10006</td></tr>
                  <tr><td>🚚 Ecza Deposu</td><td>Distributor</td><td>8082</td><td>10009</td></tr>
                  <tr><td>🏥 Eczane</td><td>Pharmacy</td><td>8083</td><td>10012</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
