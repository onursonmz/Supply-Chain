import { useNavigate } from 'react-router-dom'

const STATUS_TR = {
  CREATED:              'Üretildi',
  IN_DISTRIBUTION:      'Dağıtımda',
  AT_PHARMACY:          'Eczanede',
  DISPENSED_TO_PATIENT: 'Hastaya Teslim',
  RECALLED:             'Geri Çağırıldı',
  EXPIRED:              'Son Kullanım Geçti',
}

const STATUS_LABELS = {
  CREATED:              { cls: 'badge-created',         label: STATUS_TR.CREATED },
  IN_DISTRIBUTION:      { cls: 'badge-in-distribution', label: STATUS_TR.IN_DISTRIBUTION },
  AT_PHARMACY:          { cls: 'badge-at-pharmacy',      label: STATUS_TR.AT_PHARMACY },
  DISPENSED_TO_PATIENT: { cls: 'badge-dispensed',        label: STATUS_TR.DISPENSED_TO_PATIENT },
  RECALLED:             { cls: 'badge-recalled',         label: STATUS_TR.RECALLED },
  EXPIRED:              { cls: 'badge-recalled',         label: STATUS_TR.EXPIRED },
}

export function StatusBadge({ status }) {
  const meta = STATUS_LABELS[status] || { cls: '', label: status }
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>
}

export default function MedicineTable({ medicines = [], onTransfer, onDispense, onRecall, compact }) {
  const navigate = useNavigate()

  if (!medicines.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💊</div>
        <p>İlaç bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>İlaç Adı</th>
            {!compact && <th>GTIN</th>}
            <th>Parti / Seri No</th>
            {!compact && <th>Son Kullanım</th>}
            <th>Mevcut Konum</th>
            <th>Durum</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(m => (
            <tr key={m.linearId}>
              <td>
                <strong>{m.medicineName}</strong>
                {m.strength && <span style={{ marginLeft: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.strength}</span>}
                {m.category && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.category}</div>}
              </td>
              {!compact && <td className="id-col">{m.gtin || '—'}</td>}
              <td>
                <div style={{ fontSize: '0.78rem' }}>{m.batchNumber}</div>
                <div className="id-col">{m.serialNumber}</div>
              </td>
              {!compact && <td>{m.expiryDate || '—'}</td>}
              <td>{m.ownerOrganizationName || m.owner || '—'}</td>
              <td><StatusBadge status={m.status} /></td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/medicines/${m.linearId}`)}>Detay</button>
                  {onTransfer && m.status !== 'DISPENSED_TO_PATIENT' && m.status !== 'RECALLED' && (
                    <button className="btn btn-accent btn-sm"
                      onClick={() => onTransfer(m.linearId)}>Transfer Et</button>
                  )}
                  {onDispense && m.status === 'AT_PHARMACY' && (
                    <button className="btn btn-primary btn-sm"
                      onClick={() => onDispense(m.linearId)}>Teslim Et</button>
                  )}
                  {onRecall && m.status !== 'RECALLED' && m.status !== 'DISPENSED_TO_PATIENT' && (
                    <button className="btn btn-outline btn-sm" style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
                      onClick={() => onRecall(m.linearId)}>Geri Çağır</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
