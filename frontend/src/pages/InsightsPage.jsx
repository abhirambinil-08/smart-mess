// ============================================================
//  pages/InsightsPage.jsx  — AI hygiene analysis per mess
// ============================================================

import { useState, useEffect } from 'react'
import { getInsights } from '../utils/api'

const STATUS_STYLE = {
  Good:     { badge: 'badge-good',     icon: '✅', border: '#A8DDB5', bg: '#E8F8F0' },
  Warning:  { badge: 'badge-warning',  icon: '⚠️',  border: '#FFCC80', bg: '#FFF3E0' },
  Critical: { badge: 'badge-critical', icon: '🚨', border: '#F5AAAA', bg: '#FDECEA' },
}

export default function InsightsPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getInsights()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Analysing data...</span></div>
  if (error)   return <div className="alert alert-error">{error}</div>

  const insights = data?.insights || []

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>🤖 AI Hygiene Insights</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
        AI-powered hygiene analysis based on student feedback
      </p>
      {data?.note && (
        <div className="alert alert-warning" style={{ marginBottom: 24, fontSize: 13 }}>
          ℹ️ {data.note}
        </div>
      )}

      {insights.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            No insights yet. Need at least 3 feedback submissions per mess to generate insights.
          </p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
            {['Good', 'Warning', 'Critical'].map(s => {
              const count = insights.filter(i => i.status === s).length
              const st    = STATUS_STYLE[s]
              return (
                <div className="stat-card" key={s}>
                  <div className="stat-icon" style={{ background: st.bg }}>{st.icon}</div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{count}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s} Hygiene</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Insight cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {insights.map((item) => {
              const st = STATUS_STYLE[item.status] || STATUS_STYLE.Warning
              return (
                <div key={item.mess} style={{ background: st.bg, border: `1.5px solid ${st.border}`,
                  borderRadius: 'var(--radius)', padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 26 }}>{st.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{item.mess}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item.total_feedback} feedback submissions analysed
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${st.badge}`}>{item.status}</span>
                      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4,
                        color: item.status === 'Good' ? 'var(--success)' : item.status === 'Critical' ? 'var(--danger)' : 'var(--warning)' }}>
                        {item.hygiene_score} / 5
                      </div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 6,
                    height: 8, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 6, width: `${(item.hygiene_score / 5) * 100}%`,
                      background: item.status === 'Good' ? 'var(--success)' : item.status === 'Critical' ? 'var(--danger)' : 'var(--warning)',
                      transition: 'width 0.6s ease' }} />
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--mid)', lineHeight: 1.6 }}>
                    💡 <strong>Recommendation:</strong> {item.recommendation}
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Generated at: {new Date(data.generated_at).toLocaleString()}
          </p>
        </>
      )}
    </div>
  )
}

