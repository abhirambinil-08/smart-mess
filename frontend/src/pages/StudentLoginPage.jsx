// ============================================================
//  pages/StudentLoginPage.jsx  — Student ID Login Gate
//  Every student MUST enter their unique ID before accessing
//  the feedback form. Redirects to /feedback on success.
// ============================================================

import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { loginUser } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function StudentLoginPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { login }      = useAuth()

  const messParam = params.get('mess') || ''
  const nameParam = params.get('name') || ''

  const [studentId, setStudentId] = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!studentId.trim()) { setError('Please enter your Student ID.'); return }
    if (!password.trim())  { setError('Please enter your password.'); return }

    setLoading(true)
    setError('')

    try {
      // Student ID is used as the email/username — backend maps it
      const res = await loginUser({ email: studentId.trim(), password: password.trim() })

      if (res.role !== 'voter') {
        setError('This login is only for students. Staff please use the admin login.')
        setLoading(false)
        return
      }

      login(res)

      // Redirect to feedback form, preserving mess params
      const feedbackUrl = messParam
        ? `/feedback?mess=${messParam}&name=${encodeURIComponent(nameParam)}`
        : '/feedback'
      navigate(feedbackUrl, { replace: true })

    } catch (err) {
      setError(err.message || 'Invalid Student ID or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: 28 }}>
          <div style={{ fontSize: 56 }}>🪪</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '10px 0 4px' }}>
            Student Verification
          </h1>
          <p style={{ opacity: 0.85, fontSize: 14 }}>
            Enter your unique Student ID to submit feedback
          </p>
          {nameParam && (
            <div style={{
              background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: 8,
              padding: '8px 16px',
              marginTop: 12,
              fontSize: 13,
            }}>
              📍 {nameParam}
            </div>
          )}
        </div>

        <div className="card">

          {/* Why login info box */}
          <div style={{
            background: 'rgba(108,99,255,0.08)',
            border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--primary)',
            lineHeight: 1.6,
          }}>
            <strong>🛡️ Why do we verify?</strong><br />
            Every feedback is linked to your Student ID to ensure authenticity.
            Fake or random feedback will reduce your tokens and issue a warning.
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Student ID / Email *</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. 22BCS001 or your.email@college.edu"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                autoFocus
                autoComplete="username"
              />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Use your college-assigned Student ID or registered email
              </div>
            </div>

            <div className="form-group">
              <label className="label">Password *</label>
              <input
                className="input"
                type="password"
                placeholder="Your MateMess password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ padding: '13px', fontSize: 16, marginTop: 4 }}
            >
              {loading
                ? <><span className="spinner" /> Verifying...</>
                : '✅ Verify & Go to Feedback'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
            Not registered yet?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Create account
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            Are you Admin or Staff?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Staff Login →
            </Link>
          </div>
        </div>

        {/* Token info */}
        <div style={{
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 12,
          marginTop: 16,
        }}>
          🪙 Genuine feedback earns 1–10 tokens per submission
        </div>
      </div>
    </div>
  )
}

