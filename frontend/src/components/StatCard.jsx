export default function StatCard({ icon, value, label, color = '#17a589' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '1a' }}>
        {icon}
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
