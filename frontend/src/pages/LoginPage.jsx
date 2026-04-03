// ============================================================
//  pages/LoginPage.jsx  — Universal login for all 3 roles
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
      // Redirect based on role
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
      background: 'linear-gradient(135deg, #1A1A2E 0%, #1A56A0 100%)', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, color: 'white' }}>
          <div style={{ fontSize: 56 }}>🍱</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 12 }}>SmartMess</h1>
          <p style={{ opacity: 0.7, fontSize: 14, marginTop: 6 }}>Sign in to your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin}>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="your@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}
              style={{ marginTop: 8, padding: '13px' }}>
              {loading ? <><span className="spinner" /> Signing in...</> : '🔐 Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--grey)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Register as Voter
            </Link>
          </div>

          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 13, color: 'var(--grey)' }}>
            <Link to="/feedback" style={{ color: 'var(--green)', fontWeight: 500 }}>
              ↩ Submit feedback without account
            </Link>
          </div>
        </div>

        {/* Role hints */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '👑', label: 'Admin',      color: '#E67E22' },
            { icon: '🧑‍🍳', label: 'Mess Staff', color: '#1ABC9C' },
            { icon: '🎓', label: 'Voter',       color: '#8E44AD' },
          ].map(({ icon, label, color }) => (
            <span key={label} style={{
              background: 'rgba(255,255,255,0.12)', color: 'white',
              padding: '5px 14px', borderRadius: 99, fontSize: 13,
            }}>
              {icon} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
