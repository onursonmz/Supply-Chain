import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'

const CATEGORIES = [
  'Painkiller', 'Antibiotic', 'Antiviral', 'Cardiovascular',
  'Diabetes', 'Oncology', 'Vaccine', 'Other',
]

const EMPTY = {
  medicineName: '', batchNumber: '', serialNumber: '',
  manufacturerName: '', expiryDate: '', category: '',
}

export default function CreateMedicinePage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState(EMPTY)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function fill(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const medicine = await medicineService.create(form)
      setResult(medicine)
      setForm(EMPTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div>
        <div className="page-header">
          <h1>Register New Medicine</h1>
          <p>Record a new pharmaceutical product on the blockchain ledger</p>
        </div>
        <div className="card">
          <div className="alert alert-success">✅ Medicine successfully registered on the Corda blockchain!</div>
          <div className="card-title" style={{ marginBottom: '1rem' }}>💊 {result.medicineName}</div>
          <table className="detail-table">
            <tbody>
              <tr><td>Medicine Name</td><td><strong>{result.medicineName}</strong></td></tr>
              <tr><td>Category</td><td>{result.category || '—'}</td></tr>
              <tr><td>Batch Number</td><td>{result.batchNumber}</td></tr>
              <tr><td>Serial Number</td><td>{result.serialNumber}</td></tr>
              <tr><td>Manufacturer</td><td>{result.manufacturerName}</td></tr>
              <tr><td>Expiry Date</td><td>{result.expiryDate || '—'}</td></tr>
              <tr><td>Current Owner</td><td><strong>{result.owner}</strong></td></tr>
              <tr><td>Status</td><td><StatusBadge status={result.status} /></td></tr>
              <tr><td>Linear ID</td><td className="id-col" style={{ fontSize: '0.8rem' }}>{result.linearId}</td></tr>
            </tbody>
          </table>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => setResult(null)}>Register Another</button>
            <button className="btn btn-accent"  onClick={() => navigate(`/medicines/transfer?linearId=${result.linearId}`)}>
              🔄 Transfer This Medicine
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/medicines')}>View All Medicines</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Register New Medicine</h1>
        <p>Record a new pharmaceutical product on the blockchain ledger</p>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '1.25rem' }}>Medicine Information</div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Medicine Name *</label>
              <input placeholder="e.g. Paracetamol 500mg" value={form.medicineName}
                     onChange={e => fill('medicineName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => fill('category', e.target.value)}>
                <option value="">— Select category —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Batch Number *</label>
              <input placeholder="e.g. BATCH-2026-001" value={form.batchNumber}
                     onChange={e => fill('batchNumber', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Serial Number *</label>
              <input placeholder="e.g. MED-0001" value={form.serialNumber}
                     onChange={e => fill('serialNumber', e.target.value)} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Manufacturer Name *</label>
              <input placeholder="e.g. ABC Pharma Ltd." value={form.manufacturerName}
                     onChange={e => fill('manufacturerName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" value={form.expiryDate}
                     onChange={e => fill('expiryDate', e.target.value)} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering on blockchain…' : '💊 Register on Blockchain'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(EMPTY)}>Clear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
