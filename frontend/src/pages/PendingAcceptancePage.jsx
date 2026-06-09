import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PendingAcceptancePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/transfers/incoming', { replace: true }), 2000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div>
      <div className="page-header">
        <h1>Mal Kabul Kaldırıldı</h1>
        <p>Transfer akışı güncellendi</p>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
          Mal kabul akışı artık kullanılmıyor
        </div>
        <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.92rem', maxWidth: 480, margin: '0 auto 1.5rem' }}>
          Transfer işlemi yapıldığında ürün doğrudan alıcı envanterine ekleniyor.
          Ayrı bir kabul adımı gerekmez. Gelen transferleri görüntülemek için yönlendiriliyorsunuz…
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/transfers/incoming', { replace: true })}>
          Gelen Transferlere Git
        </button>
      </div>
    </div>
  )
}
