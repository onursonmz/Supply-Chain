import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { medicineService } from '../services/medicineService'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('pharma_user') || 'null') } catch { return null }
}

const CATEGORIES = ['Antibiyotik', 'Analjezik', 'Antiviral', 'Antifungal', 'Kardiyovasküler',
  'Diyabet', 'Solunum', 'Nörolojik', 'Onkoloji', 'Aşı', 'Diğer']

const FORMS = ['Tablet', 'Kapsül', 'Enjeksiyon', 'Şurup', 'Krem', 'Yama', 'İnhaler', 'Damla']

const STORAGE = ['Oda Sıcaklığı (15–25°C)', 'Soğuk Zincir (2–8°C)', 'Derin Dondurucu (−20°C)', 'Işıktan Koruyunuz']

const EMPTY = {
  medicineName: '', gtin: '', batchNumber: '', category: '',
  quantity: 1, expiryDate: '', description: '', strength: '',
  medicineForm: '', storageCondition: ''
}

export default function MedicineBatchCreatePage() {
  const navigate = useNavigate()
  const user = getUser()
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  function fill(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.medicineName) { setError('İlaç adı zorunludur.'); return }
    if (!form.gtin)         { setError('GTIN / ürün kodu zorunludur.'); return }
    if (!form.batchNumber)  { setError('Parti numarası zorunludur.'); return }
    if (form.quantity < 1 || form.quantity > 100) { setError('Adet 1 ile 100 arasında olmalıdır.'); return }
    setLoading(true); setError('')
    try {
      const res = await medicineService.createBatch(form)
      setResult({ ...res, formData: form })
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
          <h1>Toplu İlaç Oluşturma</h1>
          <p>Yeni farmasötik partiyi blokzincire kaydet</p>
        </div>
        <div className="card">
          <div className="alert alert-success">
            Parti başarıyla kaydedildi! {result.formData.quantity} ilaç birimi otomatik oluşturulan seri
            numaralarıyla blokzincire işlendi.
          </div>
          <div className="card-title" style={{ margin: '1rem 0 0.75rem' }}>Parti Özeti</div>
          <table className="detail-table">
            <tbody>
              <tr><td>İlaç Adı</td><td><strong>{result.formData.medicineName}</strong></td></tr>
              <tr><td>GTIN</td><td>{result.formData.gtin}</td></tr>
              <tr><td>Parti Numarası</td><td>{result.formData.batchNumber}</td></tr>
              {result.formData.strength && <tr><td>Güç/Doz</td><td>{result.formData.strength}</td></tr>}
              {result.formData.medicineForm && <tr><td>İlaç Formu</td><td>{result.formData.medicineForm}</td></tr>}
              <tr><td>Kategori</td><td>{result.formData.category || '—'}</td></tr>
              <tr><td>Adet</td><td>{result.formData.quantity} birim</td></tr>
              <tr><td>Son Kullanım Tarihi</td><td>{result.formData.expiryDate || '—'}</td></tr>
              <tr><td>Üretici Firma</td><td>{user?.organizationName || '—'}</td></tr>
              <tr><td>Seri Numaraları</td><td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Otomatik oluşturuldu: {result.formData.batchNumber}-0001 … {result.formData.batchNumber}-{String(result.formData.quantity).padStart(4, '0')}
              </td></tr>
            </tbody>
          </table>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => { setResult(null); setForm(EMPTY) }}>
              Yeni Parti Oluştur
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/medicines')}>İlaçları Görüntüle</button>
            <button className="btn btn-ghost"   onClick={() => navigate('/dashboard')}>Gösterge Paneli</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Toplu İlaç Oluşturma</h1>
        <p>Yeni farmasötik partiyi blokzincire kaydet</p>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '0.25rem' }}>Parti Bilgileri</div>
        <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
          Her birim için seri numaraları otomatik oluşturulur (ör. BATCH-2026-001-0001, -0002…).
          Her birim ayrı bir Corda blokzincir durumu olur. Büyük partiler biraz zaman alabilir.
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>İlaç Adı *</label>
              <input value={form.medicineName} onChange={e => fill('medicineName', e.target.value)}
                placeholder="ör. Amoksisilin" />
            </div>
            <div className="form-group">
              <label>Güç/Doz</label>
              <input value={form.strength} onChange={e => fill('strength', e.target.value)}
                placeholder="ör. 500mg" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>GTIN/Ürün Kodu *</label>
              <input value={form.gtin} onChange={e => fill('gtin', e.target.value)}
                placeholder="ör. 08690000000001" />
            </div>
            <div className="form-group">
              <label>Parti Numarası *</label>
              <input value={form.batchNumber} onChange={e => fill('batchNumber', e.target.value)}
                placeholder="ör. BATCH-2026-001" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kategori</label>
              <select value={form.category} onChange={e => fill('category', e.target.value)}>
                <option value="">— Kategori seçin —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>İlaç Formu</label>
              <select value={form.medicineForm} onChange={e => fill('medicineForm', e.target.value)}>
                <option value="">— Form seçin —</option>
                {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Adet *</label>
              <input type="number" min="1" max="100" value={form.quantity}
                onChange={e => fill('quantity', parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group">
              <label>Son Kullanım Tarihi</label>
              <input type="date" value={form.expiryDate} onChange={e => fill('expiryDate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Saklama Koşulu</label>
            <select value={form.storageCondition} onChange={e => fill('storageCondition', e.target.value)}>
              <option value="">— Saklama koşulu seçin —</option>
              {STORAGE.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Açıklama (isteğe bağlı)</label>
            <input value={form.description} onChange={e => fill('description', e.target.value)}
              placeholder="ör. Bakteriyel enfeksiyonlar için geniş spektrumlu antibiyotik" />
          </div>

          <div className="form-group">
            <label>Üretici Firma</label>
            <input value={user?.organizationName || '—'} readOnly
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Kuruluşunuzdan otomatik doldurulur. Değiştirilemez.
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? `${form.quantity} birim blokzincire işleniyor…` : 'Partiyi Oluştur'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>İptal</button>
          </div>
        </form>
      </div>
    </div>
  )
}
