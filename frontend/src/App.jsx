import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useToast, ToastContainer } from './components/Toast'
import Sidebar from './components/Sidebar'
import Navbar  from './components/Navbar'
import LoginPage                  from './pages/LoginPage'
import AdminDashboardPage         from './pages/AdminDashboardPage'
import OrganizationMgmtPage       from './pages/OrganizationManagementPage'
import UserMgmtPage               from './pages/UserManagementPage'
import ManufacturerDashboard      from './pages/ManufacturerDashboardPage'
import DistributorDashboard       from './pages/DistributorDashboardPage'
import PharmacyDashboard          from './pages/PharmacyDashboardPage'
import RegulatorDashboard         from './pages/RegulatorDashboardPage'
import MedicineListPage           from './pages/MedicineListPage'
import MedicineBatchCreatePage    from './pages/MedicineBatchCreatePage'
import MedicineDetailPage         from './pages/MedicineDetailPage'
import TransferMedicinePage       from './pages/TransferMedicinePage'
import DispenseMedicinePage       from './pages/DispenseMedicinePage'
import AuditHistoryPage           from './pages/AuditHistoryPage'
import AuditReportPage            from './pages/AuditReportPage'
import ExpiringMedicinesPage      from './pages/ExpiringMedicinesPage'
import CriticalStockPage          from './pages/CriticalStockPage'
import SuspiciousTransactionsPage from './pages/SuspiciousTransactionsPage'
import ColdChainMonitorPage       from './pages/ColdChainMonitorPage'
import MedicineVerificationPage   from './pages/MedicineVerificationPage'
import OutgoingTransfersPage      from './pages/OutgoingTransfersPage'
import IncomingMedicinesPage      from './pages/IncomingMedicinesPage'
import PendingAcceptancePage      from './pages/PendingAcceptancePage'
import DistributorHistoryPage     from './pages/DistributorHistoryPage'
import DistributorOrdersPage      from './pages/DistributorOrdersPage'
import ManufacturerOrdersPage     from './pages/ManufacturerOrdersPage'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

function PrivateRoute({ children, roles }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function RoleDashboard() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'ADMIN':            return <AdminDashboardPage />
    case 'MANUFACTURER_USER':return <ManufacturerDashboard />
    case 'DISTRIBUTOR_USER': return <DistributorDashboard />
    case 'PHARMACY_USER':    return <PharmacyDashboard />
    case 'REGULATOR_USER':   return <RegulatorDashboard />
    default:                 return <ManufacturerDashboard />
  }
}

function AppLayout({ children }) {
  const { toasts, addToast } = useToast()
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="page-content">{children}</main>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}

function P({ children, roles }) {
  return (
    <PrivateRoute roles={roles}>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<P><RoleDashboard /></P>} />

        <Route path="/admin"               element={<P roles={['ADMIN']}><AdminDashboardPage /></P>} />
        <Route path="/admin/organizations" element={<P roles={['ADMIN']}><OrganizationMgmtPage /></P>} />
        <Route path="/admin/users"         element={<P roles={['ADMIN']}><UserMgmtPage /></P>} />

        <Route path="/medicines/verify"      element={<P><MedicineVerificationPage /></P>} />
        <Route path="/medicines"             element={<P><MedicineListPage /></P>} />
        <Route path="/medicines/batch/create"element={<P roles={['MANUFACTURER_USER','ADMIN']}><MedicineBatchCreatePage /></P>} />
        <Route path="/medicines/transfer"    element={<P roles={['MANUFACTURER_USER','DISTRIBUTOR_USER','ADMIN']}><TransferMedicinePage /></P>} />
        <Route path="/medicines/dispense"    element={<P roles={['PHARMACY_USER','ADMIN']}><DispenseMedicinePage /></P>} />
        <Route path="/medicines/:linearId"   element={<P><MedicineDetailPage /></P>} />

        <Route path="/transfers/outgoing"          element={<P roles={['MANUFACTURER_USER','DISTRIBUTOR_USER','ADMIN']}><OutgoingTransfersPage /></P>} />
        <Route path="/transfers/incoming"          element={<P roles={['DISTRIBUTOR_USER','PHARMACY_USER','ADMIN']}><IncomingMedicinesPage /></P>} />
        <Route path="/transfers/pending-acceptance"element={<P roles={['DISTRIBUTOR_USER','PHARMACY_USER','ADMIN']}><PendingAcceptancePage /></P>} />

        <Route path="/distributor/history" element={<P roles={['DISTRIBUTOR_USER','PHARMACY_USER','ADMIN']}><DistributorHistoryPage /></P>} />
        <Route path="/distributor/orders"  element={<P roles={['DISTRIBUTOR_USER','PHARMACY_USER','ADMIN']}><DistributorOrdersPage /></P>} />

        <Route path="/manufacturer/orders" element={<P roles={['MANUFACTURER_USER','DISTRIBUTOR_USER','ADMIN']}><ManufacturerOrdersPage /></P>} />

        <Route path="/cold-chain"           element={<P roles={['REGULATOR_USER','ADMIN']}><ColdChainMonitorPage /></P>} />

        <Route path="/audit"                element={<P><AuditHistoryPage /></P>} />
        <Route path="/audit/report"         element={<P roles={['REGULATOR_USER','ADMIN']}><AuditReportPage /></P>} />
        <Route path="/audit/expiring"       element={<P roles={['REGULATOR_USER','ADMIN']}><ExpiringMedicinesPage /></P>} />
        <Route path="/audit/critical-stock" element={<P roles={['REGULATOR_USER','ADMIN']}><CriticalStockPage /></P>} />
        <Route path="/audit/suspicious"     element={<P roles={['REGULATOR_USER','ADMIN']}><SuspiciousTransactionsPage /></P>} />

        <Route path="*" element={<Navigate to={getUser() ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
