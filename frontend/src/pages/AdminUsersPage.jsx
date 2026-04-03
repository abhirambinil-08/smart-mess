// ============================================================
//  pages/AdminUsersPage.jsx  — Voter management + token control
// ============================================================

import { useState, useEffect } from 'react'
import { getAllUsersTokens, adjustTokens } from '../utils/api'

export default function AdminUsersPage() {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [adjusting, setAdjusting] = useState(null)   // user_id being adjusted
  const [adjustForm, setAdjustForm] = useState({ amount: '', reason: '' })
  const [msg, setMsg]           = useState(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try { setUsers((await getAllUsersTokens()).users || []) }
    catch {}
    finally { setLoading(false) }
  }

  async function handleAdjust(userId) {
    if (!adjustForm.amount) { setMsg({ type: 'error', msg: 'Enter an amount.' }); return }
    const amount = parseInt(adjustForm.amount)
    if (isNaN(amount)) { setMsg({ type: 'error', msg: 'Amount must be a number.' }); return }

    try {
      const res = await adjustTokens({ user_id: userId, amount, reason: adjustForm.reason || 'Admin adjustment' })
      setMsg({ type: 'success', msg: res.message })
      setAdjusting(null)
      setAdjustForm({ amount: '', reason: '' })
      loadUsers()
    } catch (err) {
      setMsg({ type: 'error', msg: err.message })
    }
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading users...</span></div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>👥 Users & Tokens</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 24 }}>
        View all voters and manually adjust token balances.
      </p>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>
          {msg.msg} <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'right' }}>✕</button>
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="input" placeholder="🔍 Search by username or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }} />
        <div style={{ fontSize: 14, color: 'var(--grey)', padding: '11px 0' }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Tokens</th>
              <th>Redeemed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <>
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>🪙 {u.total_tokens}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.redeemed} reward{u.redeemed !== 1 ? 's' : ''}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAdjusting(adjusting === u.user_id ? null : u.user_id)}
                    >
                      🪙 Adjust Tokens
                    </button>
                  </td>
                </tr>

                {/* Inline token adjustment form */}
                {adjusting === u.user_id && (
                  <tr key={u.user_id + '_adj'}>
                    <td colSpan={6}>
                      <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                          <label className="label" style={{ fontSize: 12 }}>Amount (+ to add, - to remove)</label>
                          <input className="input" type="number" placeholder="e.g. 50 or -20"
                            value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))}
                            style={{ width: 140 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <label className="label" style={{ fontSize: 12 }}>Reason</label>
                          <input className="input" placeholder="Bonus, correction..."
                            value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAdjust(u.user_id)}>
                          ✅ Apply
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAdjusting(null)}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--grey)' }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
