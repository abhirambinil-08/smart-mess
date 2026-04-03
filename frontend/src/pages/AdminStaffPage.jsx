// ============================================================
//  pages/AdminStaffPage.jsx  — Requirement #13
//  Admin can create mess staff accounts and see their credentials
// ============================================================

import { useState, useEffect } from 'react'
import { createStaff, listStaff } from '../utils/api'

export default function AdminStaffPage() {
  const [form, setForm]         = useState({ full_name: '', email: '', password: '', department: 'Mess Department' })
  const [staffList, setStaffList] = useState([])
  const [loading,   setLoading]  = useState(false)
  const [fetching,  setFetching] = useState(true)
  const [error,     setError]    = useState('')
  const [created,   setCreated]  = useState(null)   // last created staff credentials

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { loadStaff() }, [])

  async function loadStaff() {
    setFetching(true)
    try { setStaffList((await listStaff()).staff || []) }
    catch {}
    finally { setFetching(false) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) { setError('All fields required.'); return }

    setLoading(true); setError('')
    try {
      const res = await createStaff(form)
      setCreated(res)
      setForm({ full_name: '', email: '', password: '', department: 'Mess Department' })
      loadStaff()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function generatePassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#!'
    let pass = ''
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)]
    set('password', pass)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🧑‍🍳 Mess Staff Accounts</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 28 }}>
        Create login credentials for mess staff. They'll get read-only access to dashboard and can manage questions.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,420px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Create form */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>➕ Create Staff Account</h2>

          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="e.g. Ravi Kumar" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="staff@mess.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Department</label>
              <input className="input" placeholder="Mess Department" value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Password *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Set a password" value={form.password} onChange={e => set('password', e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={generatePassword} style={{ whiteSpace: 'nowrap' }}>
                  🎲 Auto
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                Password will be shown once after creation. Save it!
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating...</> : '🧑‍🍳 Create Staff Account'}
            </button>
          </form>
        </div>

        {/* Right column */}
        <div>
          {/* Credential card — shown after creation */}
          {created && (
            <div style={{
              background: 'linear-gradient(135deg, #1A1A2E, #1A56A0)',
              borderRadius: 14, padding: '24px', color: 'white', marginBottom: 20,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>✅ Staff Account Created!</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>
                ⚠️ Save these credentials now. Password is shown only once.
              </div>

              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  {[
                    ['👤 Name',       created.full_name],
                    ['📧 Email',      created.email],
                    ['🔑 Password',   created.password],
                    ['🎭 Role',       created.role],
                  ].map(([label, val]) => (
                    <tr key={label}>
                      <td style={{ padding: '6px 0', color: 'rgba(255,255,255,0.65)', width: 110 }}>{label}</td>
                      <td style={{ padding: '6px 0', fontWeight: 600, fontFamily: 'monospace', letterSpacing: 0.5 }}>{val}</td>
                    </tr>
                  ))}
                </table>
              </div>

              <div style={{ marginTop: 16, fontSize: 13, opacity: 0.8 }}>
                {created.note}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                  onClick={() => {
                    const text = `SmartMess Staff Login\nEmail: ${created.email}\nPassword: ${created.password}\nLogin at: http://localhost:5173/login`
                    navigator.clipboard.writeText(text)
                  }}
                >
                  📋 Copy Credentials
                </button>
                <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }} onClick={() => setCreated(null)}>
                  ✕ Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Existing staff list */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              📋 All Mess Staff
              <span style={{ fontSize: 13, color: 'var(--grey)', fontWeight: 400, marginLeft: 8 }}>
                ({staffList.length} accounts)
              </span>
            </h2>

            {fetching ? (
              <div className="page-loader"><div className="spinner spinner-dark" /></div>
            ) : staffList.length === 0 ? (
              <p style={{ color: 'var(--grey)', textAlign: 'center', padding: '24px 0' }}>
                No staff accounts yet. Create one using the form.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map(s => (
                      <tr key={s.user_id}>
                        <td style={{ fontWeight: 600 }}>{s.full_name || s.username}</td>
                        <td style={{ fontSize: 13 }}>{s.email}</td>
                        <td style={{ fontSize: 13 }}>{s.department}</td>
                        <td>
                          <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>
                            {s.is_active ? '✅ Active' : '🚫 Inactive'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--grey)' }}>
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
