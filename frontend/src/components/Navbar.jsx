import { useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard':              { title: 'Gösterge Paneli',        sub: 'Tedarik zinciri genel bakışı' },
  '/admin/organizations':    { title: 'Kuruluş Yönetimi',       sub: 'Tedarik zinciri kuruluşlarını yönet' },
  '/admin/users':            { title: 'Kullanıcı Yönetimi',     sub: 'Sistem kullanıcılarını yönet' },
  '/admin':                  { title: 'Yönetim Paneli',         sub: 'Sistem yönetimi' },
  '/medicines':              { title: 'İlaç Envanteri',          sub: 'Tüm farmasötik ürünler' },
  '/medicines/batch/create': { title: 'Toplu İlaç Oluşturma',   sub: 'Blokzincirde yeni ilaç partisi kaydet' },
  '/medicines/transfer':     { title: 'İlaç Transfer İşlemi',   sub: 'Sonraki tarafa sahipliği devret' },
  '/medicines/dispense':     { title: 'İlaç Teslim İşlemi',     sub: 'İlacı teslim edildi olarak işaretle' },
  '/medicines/verify':       { title: 'İlaç Doğrulama',         sub: 'Seri numarası veya GTIN ile ilaç sorgulama' },
  '/audit':                  { title: 'Denetim Kayıtları',       sub: 'Eksiksiz ilaç geçmişi' },
  '/transfers/outgoing':     { title: 'Giden Transferler',       sub: 'Oluşturduğunuz transfer talepleri' },
  '/transfers/incoming':     { title: 'Gelen İlaçlar',           sub: 'Teslim alınan ilaçlar' },
}

export default function Navbar() {
  const location = useLocation()
  const user     = (() => { try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null } })()
  const info     = TITLES[location.pathname] || { title: 'İlaç Detayı', sub: 'Farmasötik ürün kaydı' }

  return (
    <div className="navbar">
      <div className="navbar-left">
        <h2>{info.title}</h2>
        <p>{info.sub}</p>
      </div>
      <div className="navbar-right">
        {user?.organizationName && <span className="org-chip">{user.organizationName}</span>}
        {user?.nodeRole && <span className="node-chip">{user.nodeRole.toUpperCase()} Node</span>}
      </div>
    </div>
  )
}
