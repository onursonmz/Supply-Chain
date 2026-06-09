const STEPS = [
  { key: 'CREATED',              icon: '🏭', label: 'Üretildi',        sub: 'İlaç blokzincirinde oluşturuldu' },
  { key: 'IN_DISTRIBUTION',      icon: '🚚', label: 'Dağıtımda',       sub: 'Dağıtıcıya transfer edildi' },
  { key: 'AT_PHARMACY',          icon: '🏥', label: 'Eczanede',         sub: 'Eczane tarafından teslim alındı' },
  { key: 'DISPENSED_TO_PATIENT', icon: '✅', label: 'Hastaya Teslim',  sub: 'Hastaya teslim edildi' },
]

const ORDER = ['CREATED', 'IN_DISTRIBUTION', 'AT_PHARMACY', 'DISPENSED_TO_PATIENT', 'RECALLED']

export default function Timeline({ medicine }) {
  const currentIdx = ORDER.indexOf(medicine?.status)

  if (medicine?.status === 'RECALLED') {
    return (
      <div className="timeline">
        <div className="timeline-step">
          <div className="timeline-dot" style={{ background: '#e74c3c', borderColor: '#e74c3c', color: '#fff' }}>⚠</div>
          <div className="timeline-content">
            <div className="timeline-title" style={{ color: '#e74c3c' }}>Geri Çağırıldı</div>
            <div className="timeline-sub">Bu ilaç tedarik zincirinden geri çağırıldı</div>
          </div>
        </div>
      </div>
    )
  }

  if (medicine?.status === 'EXPIRED') {
    return (
      <div className="timeline">
        <div className="timeline-step">
          <div className="timeline-dot" style={{ background: '#95a5a6', borderColor: '#95a5a6', color: '#fff' }}>⏰</div>
          <div className="timeline-content">
            <div className="timeline-title" style={{ color: '#95a5a6' }}>Son Kullanım Geçti</div>
            <div className="timeline-sub">Bu ilacın son kullanım tarihi geçmiştir</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="timeline">
      {STEPS.map((step, i) => {
        const done    = currentIdx > i
        const current = currentIdx === i
        return (
          <div key={step.key} className="timeline-step" style={{ opacity: done || current ? 1 : 0.4 }}>
            <div className={`timeline-dot ${done ? 'done' : current ? 'current' : ''}`}>
              {done ? '✓' : step.icon}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">{step.label}</div>
              <div className="timeline-sub">
                {current && medicine?.ownerOrganizationName
                  ? medicine.ownerOrganizationName
                  : step.sub}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
