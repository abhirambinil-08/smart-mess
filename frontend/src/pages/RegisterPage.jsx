// ============================================================
//  pages/RegisterPage.jsx  — Premium Glass Registration
// ============================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../utils/api'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ username: '', email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const navigate = useNavigate()

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { setError('Fill all required fields.'); return }
    setLoading(true); setError('')
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)', padding: 16, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: '20%', right: '15%', width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(0, 217, 166, 0.1), transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56 }} className="floating">🎓</div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, marginTop: 12,
            background: 'linear-gradient(135deg, #6C63FF, #00D9A6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>Join MateMess as a voter</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleRegister}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Doe"
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="label">Username *</label>
              <input className="input" placeholder="johndoe"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="you@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <button type="submit" className="btn btn-green btn-full" disabled={loading}
              style={{ marginTop: 8, padding: '14px', fontSize: 15 }}>
              {loading ? <><span className="spinner" /> Creating...</> : '🚀 Register'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

