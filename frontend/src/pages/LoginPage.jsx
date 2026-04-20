// ============================================================
//  pages/LoginPage.jsx  — Premium Glass Login
// ============================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const { saveLogin } = useAuth()
  const navigate      = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Enter email and password.'); return }

    setLoading(true); setError('')

    try {
      const data = await login(form.email, form.password)
      saveLogin(data.access_token, {
        user_id: data.user_id, email: data.email,
        role: data.role, username: data.username,
      })
      if (data.role === 'admin')      navigate('/admin/dashboard')
      else if (data.role === 'mess_staff') navigate('/staff/dashboard')
      else                            navigate('/voter')
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
      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(108, 99, 255, 0.12), transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '15%', width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(0, 217, 166, 0.1), transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, color: 'var(--text-primary)' }}>
          <div style={{ fontSize: 56 }} className="floating">🍱</div>
          <h1 style={{
            fontSize: 30, fontWeight: 800, marginTop: 12,
            background: 'linear-gradient(135deg, #6C63FF, #00D9A6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>MateMess</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleLogin}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="admin@mess.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}
              style={{ marginTop: 8, padding: '14px', fontSize: 15 }}>
              {loading ? <><span className="spinner" /> Signing in...</> : '🔐 Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Register as Voter
            </Link>
          </div>

          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            <Link to="/feedback" style={{ color: 'var(--secondary)', fontWeight: 500 }}>
              ↩ Submit feedback without account
            </Link>
          </div>
        </div>

        {/* Role hints */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '👑', label: 'Admin' },
            { icon: '🧑‍🍳', label: 'Mess Staff' },
            { icon: '🎓', label: 'Voter' },
          ].map(({ icon, label }) => (
            <span key={label} style={{
              background: 'rgba(108, 99, 255, 0.1)',
              border: '1px solid rgba(108, 99, 255, 0.15)',
              color: 'var(--text-secondary)',
              padding: '6px 16px', borderRadius: 99, fontSize: 13,
              backdropFilter: 'blur(8px)',
            }}>
              {icon} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

