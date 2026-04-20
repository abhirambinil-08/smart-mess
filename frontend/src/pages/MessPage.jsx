// ============================================================
//  pages/MessPage.jsx  — Create mess & download QR codes
// ============================================================

import { useState, useEffect } from 'react'
import { getAllMess, createMess, deleteMess, getQRCode } from '../utils/api'

export default function MessPage() {
  const [messList,    setMessList]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [creating,    setCreating]    = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [qrMess,      setQrMess]      = useState(null)   // which mess QR to preview

  const [name,        setName]        = useState('')
  const [institution, setInstitution] = useState('')

  const load = () => {
    setLoading(true)
    getAllMess()
      .then(d => setMessList(d.mess || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async () => {
    if (!name.trim() || !institution.trim()) { setError('Name and Institution are required.'); return }
    setCreating(true); setError(''); setSuccess('')
    try {
      await createMess(name.trim(), institution.trim())
      setSuccess(`✅ Mess "${name}" created successfully!`)
      setName(''); setInstitution('')
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, messName) => {
    if (!confirm(`Delete mess "${messName}"? This cannot be undone.`)) return
    try {
      await deleteMess(id)
      setSuccess(`Mess "${messName}" deleted.`)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const downloadQR = (messName) => {
    const a = document.createElement('a')
    a.href = getQRCode(messName)
    a.download = `${messName}_qr.png`
    a.click()
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>🍽️ Mess Configuration</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Add mess locations and manage their QR codes</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 24, alignItems: 'start' }}>

        {/* ── Create Form ─────────────────────────── */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>➕ Add New Mess</h2>

          {error   && <div className="alert alert-error"   style={{ marginBottom: 14 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 14 }}>{success}</div>}

          <div className="form-group">
            <label className="label">Mess Name *</label>
            <input className="input" placeholder="e.g. Block A Mess"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Institution *</label>
            <input className="input" placeholder="e.g. IILM University"
              value={institution} onChange={e => setInstitution(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={creating}
            style={{ marginTop: 4 }}>
            {creating ? <><span className="spinner" /> Creating...</> : '🏗️ Create Mess'}
          </button>
        </div>

        {/* ── Mess List ───────────────────────────── */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            📋 All Mess Locations
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({messList.length} total)
            </span>
          </h2>

          {loading
            ? <div className="page-loader"><div className="spinner spinner-dark" /></div>
            : messList.length === 0
            ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px 0' }}>No mess added yet.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messList.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', background: 'rgba(108,99,255,0.04)', borderRadius: 8,
                    border: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: 24 }}>🍱</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.institution}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-outline btn-sm"
                        onClick={() => setQrMess(qrMess === m.name ? null : m.name)}>
                        🔍 QR
                      </button>
                      <button className="btn btn-green btn-sm" onClick={() => downloadQR(m.name)}>
                        ⬇️ Download
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.name)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* ── QR Preview ──────────────────────────────── */}
      {qrMess && (
        <div className="card" style={{ marginTop: 24, textAlign: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>QR Code — {qrMess}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Print this and place it inside the mess. Students scan to open the feedback form.
          </p>
          <img
            src={getQRCode(qrMess)}
            alt={`QR for ${qrMess}`}
            style={{ width: 220, height: 220, border: '2px solid var(--surface-border)', borderRadius: 12 }}
          />
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-green" onClick={() => downloadQR(qrMess)}>
              ⬇️ Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

