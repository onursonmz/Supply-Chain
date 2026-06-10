import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'
import MedicineTable from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'
import { api } from '../services/api'

export default function AdminDashboardPage() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [seeding, setSeeding]   = useState(false)
  const [clearing, setClearing] = useState(false)
  const [seedMsg, setSeedMsg]   = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    medicineService.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSeedDemo() {
    if (!window.confirm('Demo verisi oluşturulacak. Devam edilsin mi?')) return
    setSeeding(true); setSeedMsg('')
    try {
      const res = await api.post('/api/demo/seed', {})
      setSeedMsg(`✓ ${res.totalCreated} ilaç oluşturuldu. Envanteri yenilemek için sayfayı yenileyin.`)
      medicineService.getDashboard().then(setData).catch(() => {})
    } catch (e) {
      setSeedMsg('Hata: ' + e.message)
    } finally {
      setSeeding(false)
    }
  }

  async function handleClearData() {
    if (!window.confirm(
      '⚠ TÜM envanter, transfer ve soğuk zincir verileri silinecek!\n\nKuruluşlar ve kullanıcılar korunur.\n\nDevam edilsin mi?'
    )) return
    setClearing(true); setSeedMsg('')
    try {
      const res = await api.post('/api/demo/clear', {})
      setSeedMsg('✓ Tüm veriler temizlendi. Yeni demo verisi oluşturabilirsiniz.')
      medicineService.getDashboard().then(setData).catch(() => {})
    } catch (e) {
      setSeedMsg('Hata: ' + e.message)
    } finally {
      setClearing(false)
    }
  }

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <h1>Yönetici Gösterge Paneli</h1>
        <p>Farmasötik tedarik zincirinin sistem geneli özeti</p>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleSeedDemo} disabled={seeding || clearing}>
            {seeding ? '⏳ Oluşturuluyor…' : '🧪 Demo Veri Oluştur'}
          </button>
          <button
            className="btn btn-sm"
            style={{ background: '#e74c3c', color: '#fff', border: 'none' }}
            onClick={handleClearData}
            disabled={seeding || clearing}>
            {clearing ? '⏳ Temizleniyor…' : '🗑 Tüm Verileri Temizle'}
          </button>
          {seedMsg && <span style={{ fontSize: '0.82rem', color: seedMsg.startsWith('✓') ? '#0a3622' : '#842029' }}>{seedMsg}</span>}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="🏢" value={data?.totalOrganizations} label="Kuruluşlar"    color="#1e3a5f" />
        <StatCard icon="👥" value={data?.totalUsers}         label="Kullanıcılar"   color="#17a589" />
        <StatCard icon="🏭" value={data?.totalManufacturers} label="Üreticiler"    color="#2980b9" />
        <StatCard icon="🚚" value={data?.totalDistributors}  label="Dağıtıcılar"   color="#f39c12" />
        <StatCard icon="🏥" value={data?.totalPharmacies}    label="Eczaneler"     color="#8e44ad" />
        <StatCard icon="💊" value={data?.totalMedicines}     label="Toplam İlaç"   color="#27ae60" />
      </div>

      <div className="stats-grid" style={{ marginTop: '-0.5rem' }}>
        <StatCard icon="🏭" value={data?.createdCount}        label="Üretildi"         color="#2980b9" />
        <StatCard icon="🚚" value={data?.inDistributionCount} label="Dağıtımda"        color="#f39c12" />
        <StatCard icon="🏥" value={data?.atPharmacyCount}     label="Eczanede"         color="#8e44ad" />
        <StatCard icon="✅" value={data?.dispensedCount}      label="Teslim"           color="#27ae60" />
        <StatCard icon="⚠" value={data?.recalledCount}       label="Geri Çağırıldı"   color="#e74c3c" />
        <StatCard icon="⏰" value={data?.nearExpiryCount}     label="Son Kullanım Yakın" color="#e67e22" />
      </div>

      {data?.nearExpiryCount > 0 && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⏰</span>
          <div>
            <strong>{data.nearExpiryCount} ilaç(lar) 60 gün içinde son kullanım tarihine ulaşıyor.</strong>
            {' '}İlaç envanterini kontrol edin ve ilgili kuruluşları bilgilendirin.
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/medicines')}>Görüntüle</button>
        </div>
      )}

      <div className="quick-actions">
        <div className="action-card" onClick={() => navigate('/admin/organizations')}>
          <div className="action-card-icon">🏢</div>
          <div className="action-card-label">Kuruluş Yönetimi</div>
          <div className="action-card-sub">Ekle, düzenle, aktif/pasif yönet</div>
        </div>
        <div className="action-card" onClick={() => navigate('/admin/users')}>
          <div className="action-card-icon">👥</div>
          <div className="action-card-label">Kullanıcı Yönetimi</div>
          <div className="action-card-sub">Oluştur ve rol ata</div>
        </div>
        <div className="action-card" onClick={() => navigate('/medicines')}>
          <div className="action-card-icon">💊</div>
          <div className="action-card-label">Tüm İlaçlar</div>
          <div className="action-card-sub">Görüntüle, transfer et, geri çağır</div>
        </div>
        <div className="action-card" onClick={() => navigate('/audit')}>
          <div className="action-card-icon">🔍</div>
          <div className="action-card-label">Denetim Kayıtları</div>
          <div className="action-card-sub">Tam blokzincir geçmişi</div>
        </div>
      </div>

      {data?.recentMedicines?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Son İlaç Hareketleri</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/medicines')}>Tümünü Gör</button>
          </div>
          <MedicineTable medicines={data.recentMedicines} compact />
        </div>
      )}
    </div>
  )
}
