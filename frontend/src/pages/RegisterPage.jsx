// ============================================================
//  pages/RegisterPage.jsx  — Voter self-registration
// ============================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../utils/api'

export default function RegisterPage() {
  const [form, setForm]       = useState({ username: '', email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true); setError('')
    try {
      await register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1A1A2E 0%, #1ABC9C 100%)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28, color: 'white' }}>
          <div style={{ fontSize: 52 }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>Create Voter Account</h1>
          <p style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>Join SmartMess and earn tokens for feedback!</p>
        </div>

        <div className="card">
          {success ? (
            <div className="alert alert-success" style={{ textAlign: 'center' }}>
              ✅ Account created! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" placeholder="e.g. Abhiram Binil"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Username *</label>
                <input className="input" placeholder="e.g. abhiram123"
                  value={form.username} onChange={e => set('username', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Email *</label>
                <input className="input" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Password * <span style={{ fontSize: 11, color: 'var(--grey)' }}>(min 6 chars)</span></label>
                <input className="input" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>

              <button type="submit" className="btn btn-green btn-full" disabled={loading}
                style={{ marginTop: 8, padding: '13px' }}>
                {loading ? <><span className="spinner" /> Creating...</> : '🚀 Create Account'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 14, color: 'var(--grey)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
