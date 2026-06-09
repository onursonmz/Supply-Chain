import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MedicineTable from '../components/MedicineTable'
import { medicineService } from '../services/medicineService'

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  function load() {
    setLoading(true)
    medicineService.getAll()
      .then(setMedicines)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <div>
      <div className="page-header">
        <h1>Medicine Inventory</h1>
        <p>All pharmaceutical products visible to this node</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">💊 Medicine List</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/medicines/create')}>
              + New Medicine
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        {loading
          ? <div className="loading-text">Loading medicines…</div>
          : <MedicineTable
              medicines={medicines}
              onTransfer={id => navigate(`/medicines/transfer?linearId=${id}`)}
            />
        }
      </div>
    </div>
  )
}
