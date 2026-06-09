import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { adminService } from '../services/adminService'

const TYPES = ['MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY', 'REGULATOR']
const CORDA = ['Manufacturer', 'Distributor', 'Pharmacy', '']

const TYPE_BADGE = {
  MANUFACTURER: 'badge-manufacturer', DISTRIBUTOR: 'badge-distributor',
  PHARMACY: 'badge-pharmacy', REGULATOR: 'badge-regulator',
}

const EMPTY = { organizationName: '', organizationType: '', licenseNumber: '', city: '', district: '', address: '', phone: '', email: '', cordaPartyName: '' }

export default function OrganizationManagementPage() {
  const [orgs, setOrgs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  function load() {
    setLoading(true)
    adminService.getOrganizations().then(setOrgs).finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openCreate() { setForm(EMPTY); setEditing(null); setError(''); setModal('form') }
  function openEdit(o)  { setForm({ ...o }); setEditing(o.organizationId); setError(''); setModal('form') }

  async function handleSave() {
    if (!form.organizationName || !form.organizationType) { setError('Name and type are required.'); return }
    setSaving(true); setError('')
    try {
      if (editing) await adminService.updateOrganization(editing, form)
      else         await adminService.createOrganization(form)
      setModal(null); load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function toggle(id) {
    await adminService.toggleOrganization(id).catch(() => {})
    load()
  }

  function fill(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <div>
      <div className="page-header">
        <h1>Organization Management</h1>
        <p>Manage supply chain organizations and their Corda node assignments</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Organizations ({orgs.length})</div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Organization</button>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Organization</th><th>Type</th><th>City</th><th>Corda Node</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orgs.map(o => (
                  <tr key={o.organizationId}>
                    <td><strong>{o.organizationName}</strong><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.organizationId}</div></td>
                    <td><span className={`badge ${TYPE_BADGE[o.organizationType] || ''}`}>{o.organizationType}</span></td>
                    <td>{o.city || '—'}</td>
                    <td>{o.cordaPartyName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td><span className={`badge ${o.status === 'ACTIVE' ? 'badge-active' : 'badge-passive'}`}>{o.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => toggle(o.organizationId)}>
                          {o.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Organization' : 'New Organization'} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>}
        >
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Organization Name *</label>
              <input value={form.organizationName} onChange={e => fill('organizationName', e.target.value)} placeholder="ABC Pharma" />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={form.organizationType} onChange={e => fill('organizationType', e.target.value)}>
                <option value="">— Select —</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>License Number</label>
              <input value={form.licenseNumber} onChange={e => fill('licenseNumber', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Corda Party Name</label>
              <select value={form.cordaPartyName} onChange={e => fill('cordaPartyName', e.target.value)}>
                <option value="">— None —</option>
                {CORDA.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>City</label><input value={form.city} onChange={e => fill('city', e.target.value)} /></div>
            <div className="form-group"><label>District</label><input value={form.district} onChange={e => fill('district', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Address</label><input value={form.address} onChange={e => fill('address', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => fill('phone', e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => fill('email', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
