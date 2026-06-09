import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { adminService } from '../services/adminService'

const ROLES = ['ADMIN', 'MANUFACTURER_USER', 'DISTRIBUTOR_USER', 'PHARMACY_USER', 'REGULATOR_USER']

const ROLE_BADGE = {
  ADMIN: 'badge-regulator',
  MANUFACTURER_USER: 'badge-manufacturer',
  DISTRIBUTOR_USER: 'badge-distributor',
  PHARMACY_USER: 'badge-pharmacy',
  REGULATOR_USER: 'badge-regulator',
}

const EMPTY = { username: '', fullName: '', password: '', role: '', organizationId: '' }

export default function UserManagementPage() {
  const [users, setUsers]     = useState([])
  const [orgs, setOrgs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  function load() {
    setLoading(true)
    Promise.all([adminService.getUsers(), adminService.getOrganizations()])
      .then(([u, o]) => { setUsers(u); setOrgs(o) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  function openCreate() { setForm(EMPTY); setEditing(null); setError(''); setModal('form') }
  function openEdit(u)  { setForm({ ...u, password: '' }); setEditing(u.userId); setError(''); setModal('form') }

  async function handleSave() {
    if (!form.username || !form.role) { setError('Username and role are required.'); return }
    if (!editing && !form.password)   { setError('Password is required for new users.'); return }
    setSaving(true); setError('')
    try {
      if (editing) await adminService.updateUser(editing, form)
      else         await adminService.createUser(form)
      setModal(null); load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  async function toggle(id) {
    await adminService.toggleUser(id).catch(() => {})
    load()
  }

  function fill(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users and their organization assignments</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Users ({users.length})</div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add User</button>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Role</th><th>Organization</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId}>
                    <td>
                      <strong>{u.fullName || u.username}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.username}</div>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || ''}`}>{u.role}</span></td>
                    <td>{u.organizationName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-passive'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => toggle(u.userId)}>
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
        <Modal
          title={editing ? 'Edit User' : 'New User'}
          onClose={() => setModal(null)}
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
              <label>Username *</label>
              <input value={form.username} onChange={e => fill('username', e.target.value)} placeholder="john_doe" />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.fullName} onChange={e => fill('fullName', e.target.value)} placeholder="John Doe" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{editing ? 'New Password (blank = keep)' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={e => fill('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select value={form.role} onChange={e => fill('role', e.target.value)}>
                <option value="">— Select —</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Organization</label>
            <select value={form.organizationId} onChange={e => fill('organizationId', e.target.value)}>
              <option value="">— None —</option>
              {orgs.map(o => (
                <option key={o.organizationId} value={o.organizationId}>
                  {o.organizationName} ({o.organizationType})
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}
