import { NavLink, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

const NAV_BY_ROLE = {
  ADMIN: [
    { path: '/dashboard',           icon: '📊', label: 'Gösterge Paneli' },
    { divider: true },
    { path: '/admin/organizations', icon: '🏢', label: 'Kuruluşlar' },
    { path: '/admin/users',         icon: '👥', label: 'Kullanıcılar' },
    { divider: true },
    { path: '/medicines',           icon: '💊', label: 'İlaçlar' },
    { path: '/cold-chain',          icon: '❄', label: 'Soğuk Zincir İzleme' },
    { path: '/audit',               icon: '🔍', label: 'Denetim Kayıtları' },
    { path: '/audit/report',        icon: '📊', label: 'Denetim Raporu' },
    { path: '/audit/expiring',      icon: '⏰', label: 'Son Kullanım Takibi' },
    { path: '/audit/critical-stock',icon: '📉', label: 'Kritik Stok' },
    { path: '/medicines/verify',    icon: '✅', label: 'İlaç Doğrulama' },
  ],
  MANUFACTURER_USER: [
    { path: '/dashboard',              icon: '📊', label: 'Gösterge Paneli' },
    { divider: true },
    { path: '/medicines',              icon: '💊', label: 'İlaç Envanteri' },
    { path: '/medicines/batch/create', icon: '➕', label: 'Toplu İlaç Oluştur' },
    { path: '/medicines/transfer',     icon: '📋', label: 'Transfer Talebi' },
    { path: '/transfers/outgoing',     icon: '📤', label: 'Giden Transferler' },
    { path: '/manufacturer/orders',    icon: '🛒', label: 'Gelen Siparişler' },
    { path: '/medicines/verify',       icon: '✅', label: 'İlaç Doğrulama' },
  ],
  DISTRIBUTOR_USER: [
    { path: '/dashboard',            icon: '📊', label: 'Gösterge Paneli' },
    { divider: true },
    { path: '/medicines',            icon: '💊', label: 'İlaç Envanteri' },
    { path: '/transfers/incoming',   icon: '📥', label: 'Gelen Transferler' },
    { path: '/distributor/history',  icon: '📋', label: 'Transfer Geçmişi' },
    { path: '/distributor/orders',   icon: '🛒', label: 'Tedarik Talepleri' },
    { path: '/manufacturer/orders',  icon: '📨', label: 'Eczane Siparişleri' },
    { divider: true },
    { path: '/medicines/transfer',   icon: '📤', label: 'Transfer Talebi' },
    { path: '/transfers/outgoing',   icon: '📦', label: 'Giden Transferler' },
    { path: '/medicines/verify',     icon: '✅', label: 'İlaç Doğrulama' },
  ],
  PHARMACY_USER: [
    { path: '/dashboard',            icon: '📊', label: 'Gösterge Paneli' },
    { divider: true },
    { path: '/medicines',            icon: '💊', label: 'İlaç Envanteri' },
    { path: '/transfers/incoming',   icon: '📥', label: 'Gelen Transferler' },
    { path: '/distributor/history',  icon: '📋', label: 'Alım Geçmişi' },
    { path: '/distributor/orders',   icon: '🛒', label: 'Tedarik Talepleri' },
    { divider: true },
    { path: '/medicines/dispense',   icon: '💉', label: 'Hastaya Teslim' },
    { path: '/medicines/verify',     icon: '✅', label: 'İlaç Doğrulama' },
  ],
  REGULATOR_USER: [
    { path: '/dashboard',            icon: '📊', label: 'Gösterge Paneli' },
    { divider: true },
    { path: '/medicines',            icon: '💊', label: 'Tüm İlaçlar' },
    { path: '/cold-chain',           icon: '❄', label: 'Soğuk Zincir İzleme' },
    { path: '/audit',                icon: '🔍', label: 'Denetim Kayıtları' },
    { path: '/audit/report',         icon: '📈', label: 'Denetim Raporu' },
    { path: '/audit/expiring',       icon: '⏰', label: 'Son Kullanım Takibi' },
    { path: '/audit/critical-stock', icon: '📉', label: 'Kritik Stok' },
    { path: '/audit/suspicious',     icon: '⚠', label: 'Şüpheli İşlemler' },
    { path: '/medicines/verify',     icon: '✅', label: 'İlaç Doğrulama' },
  ],
}

export default function Sidebar() {
  const user    = getUser()
  const navigate = useNavigate()
  const nav     = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.MANUFACTURER_USER

  async function logout() {
    await authService.logout().catch(() => {})
    sessionStorage.removeItem('pharma_user')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">💊</div>
        <div>
          <div className="brand-name">İlaç Takip</div>
          <div className="brand-sub">Blokzincir Platformu</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menü</div>
        {nav.map((item, i) =>
          item.divider
            ? <div key={i} className="nav-divider" />
            : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">
            {user?.fullName?.[0] || user?.username?.[0] || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || user?.username || '—'}
            </div>
            <div className="user-role">{user?.organizationName || user?.role || ''}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', marginTop: '0.75rem',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.65)',
            padding: '0.45rem', borderRadius: '6px',
            fontSize: '0.78rem', cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.13)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
        >
          🚪 Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
