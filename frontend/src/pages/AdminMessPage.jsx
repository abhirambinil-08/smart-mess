// ============================================================
//  pages/AdminMessPage.jsx  — Manage mess locations
// ============================================================

import { useState, useEffect } from 'react'
import { getAllMess, createMess, deleteMess } from '../utils/api'

export default function AdminMessPage() {
  const [messList, setMessList] = useState([])
  const [form,     setForm]     = useState({ name: '', institution: '', location: '' })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  useEffect(() => { loadMess() }, [])

  async function loadMess() {
    setLoading(true)
    try { setMessList((await getAllMess()).mess || []) }
    catch {}
    finally { setLoading(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name || !form.institution) { setError('Name and institution are required.'); return }
    setSaving(true); setError('')
    try {
      await createMess(form)
      setSuccess('Mess created successfully!')
      setForm({ name: '', institution: '', location: '' })
      loadMess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await deleteMess(id)
      loadMess()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🍽️ Mess Locations</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 28 }}>
        Add and manage mess locations. Each location gets its own QR code.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,380px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Create form */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>➕ Add Mess Location</h2>
          {error   && <div className="alert alert-error"   style={{ marginBottom: 14 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 14 }}>{success}</div>}

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Mess Name *</label>
              <input className="input" placeholder="e.g. North Mess, Block A Mess"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Institution *</label>
              <input className="input" placeholder="e.g. IILM University, Gurugram"
                value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Location / Block</label>
              <input className="input" placeholder="e.g. Block C, Ground Floor"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? <><span className="spinner" /> Adding...</> : '🍽️ Add Mess'}
            </button>
          </form>
        </div>

        {/* Mess list */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            All Mess Locations
            <span style={{ fontSize: 13, color: 'var(--grey)', fontWeight: 400, marginLeft: 8 }}>
              ({messList.length})
            </span>
          </h2>

          {loading ? (
            <div className="page-loader"><div className="spinner spinner-dark" /></div>
          ) : messList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--grey)' }}>
              <div style={{ fontSize: 40 }}>🍽️</div>
              <p style={{ marginTop: 12 }}>No mess locations yet. Add one using the form.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messList.map(m => (
                <div key={m.id} style={{
                  background: 'var(--bg)', borderRadius: 10, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ fontSize: 28 }}>🍽️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2 }}>
                      {m.institution}{m.location ? ` · ${m.location}` : ''}
                    </div>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none' }}
                    onClick={() => handleDelete(m.id, m.name)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
