// ============================================================
//  pages/AdminInsightsPage.jsx  — AI insights + Suspicious Dashboard + Online Users
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { getInsights, sendReport, getSuspiciousFeedback, getOnlineUsers } from '../utils/api'
import { useAuth } from '../context/AuthContext'

// authFetch removed in favor of unified api.js helpers

export default function AdminInsightsPage() {
  const { user, token } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [insights, setInsights] = useState([])
  const [suspicious, setSuspicious] = useState([])
  const [online, setOnline] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('insights')  // 'insights' | 'suspicious' | 'online'
  const [error, setError] = useState('')

  // Email form
  const [emails, setEmails] = useState('')
  const [frequency, setFrequency] = useState('weekly')
  const [sending, setSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ins, sus, onl] = await Promise.all([
        getInsights(),
        getSuspiciousFeedback(),
        getOnlineUsers(),
      ])
      setInsights(ins.insights || [])
      setSuspicious(sus.suspicious_feedback || [])
      setOnline(onl.online_users || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleSendReport() {
    const list = emails.split(',').map(e => e.trim()).filter(Boolean)
    if (!list.length) { setEmailMsg({ type: 'error', msg: 'Enter at least one email.' }); return }
    setSending(true); setEmailMsg(null)
    try {
      const res = await sendReport({ recipients: list, frequency })
      setEmailMsg({ type: 'success', msg: `Report sent to ${res.sent_to.length} recipient(s)!` })
    } catch (err) {
      setEmailMsg({ type: 'error', msg: err.message })
    } finally {
      setSending(false)
    }
  }

  function handleDownloadCSV() {
    // We use a direct backend link to ensure the file is served with correct headers/extension
    const downloadUrl = `/api/insights/export?token=${token}`
    window.location.href = downloadUrl
  }

  const statusColor = {
    ' Excellent': 'var(--success)',
    ' Needs Improvement': 'var(--warning)',
    ' Critical': 'var(--danger)',
    ' No Data': 'var(--text-secondary)',
  }

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Analysing data...</span></div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}> AI Insights & Monitoring</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Real-time mess analytics, FeedGuard suspicious activity, and live user monitoring.
      </p>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'insights', label: ' Performance Insights' },
          { key: 'suspicious', label: ` Suspicious Feedback (${suspicious.length})` },
          { key: 'online', label: ` Online Now (${online.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Performance Insights ── */}
      {tab === 'insights' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            {insights.length === 0 ? (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: 40 }}></div>
                <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>No insights yet. Add mess locations and collect feedback first.</p>
              </div>
            ) : insights.map((ins, i) => (
              <div key={i} className="card" style={{ border: `2px solid ${(statusColor[ins.status] || 'var(--surface-border)')}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{ins.mess}</h3>
                  <span style={{ fontSize: 22 }}>
                    {ins.status?.includes('Excellent') ? '✅' : ins.status?.includes('Needs') ? '' : ins.status?.includes('Critical') ? '⚠️' : '❔'}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                    background: `${(statusColor[ins.status] || '#999')}20`,
                    color: statusColor[ins.status] || 'var(--text-secondary)',
                  }}>
                    {ins.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'Overall', value: ins.overall_avg },
                    { label: 'Hygiene', value: ins.hygiene_score },
                    { label: 'Taste', value: ins.taste_score },
                    { label: 'Feedback', value: ins.total_feedback },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(108,99,255,0.04)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{value ?? '—'}</div>
                    </div>
                  ))}
                </div>
                {ins.recommendation && (
                  <div style={{ background: 'rgba(108,99,255,0.04)', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                    {ins.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="card" style={{ maxWidth: 560 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>📧 Send Analytics Report</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Email the full analytics report to principals, admin, or mess in-charge.
              </p>
              {emailMsg && <div className={`alert alert-${emailMsg.type}`} style={{ marginBottom: 16 }}>{emailMsg.msg}</div>}
              <div className="form-group">
                <label className="label">Recipient Emails (comma-separated)</label>
                <textarea className="input" rows={3}
                  placeholder="admin@college.edu, principal@college.edu"
                  value={emails} onChange={e => setEmails(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Report Frequency</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['weekly', 'monthly', 'yearly'].map(f => (
                    <button key={f} onClick={() => setFrequency(f)}
                      className={`btn btn-sm ${frequency === f ? 'btn-primary' : 'btn-ghost'}`}>
                      {f === 'weekly' ? ' Weekly' : f === 'monthly' ? ' Monthly' : ' Yearly'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-green" onClick={handleSendReport} disabled={sending}>
                  {sending ? <><span className="spinner" /> Sending...</> : '📤 Send Report Now'}
                </button>
                <button className="btn btn-primary" onClick={handleDownloadCSV} disabled={!insights.length}>
                  📥 Download Word Report
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Suspicious Feedback ── */}
      {tab === 'suspicious' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}> FeedGuard — Flagged Submissions</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                These submissions were flagged by AI as potentially fake or randomly selected.
                Tokens were deducted from these students.
              </p>
            </div>
            <div style={{
              background: suspicious.length > 0 ? 'var(--danger-light)' : 'var(--success-light)',
              color: suspicious.length > 0 ? 'var(--danger)' : 'var(--success)',
              borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 20,
            }}>
              {suspicious.length}
            </div>
          </div>

          {suspicious.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <p style={{ marginTop: 12 }}>No suspicious feedback detected. System is clean!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(108,99,255,0.04)' }}>
                    {['Student', 'Meal', 'Date', 'Slot', 'AI Score', 'Reason', 'Flags'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suspicious.map((s, i) => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--surface-border)', background: i % 2 === 0 ? 'white' : 'rgba(108,99,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        <div>@{s.username}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{s.meal_type}</td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{s.date_str}</td>
                      <td style={{ padding: '10px 12px' }}>{s.slot}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: s.ai_score < 30 ? 'var(--danger-light)' : 'var(--orange-light)',
                          color: s.ai_score < 30 ? 'var(--danger)' : 'var(--warning)',
                          borderRadius: 6, padding: '2px 8px', fontWeight: 700,
                        }}>
                          {s.ai_score}/100
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', maxWidth: 200, fontSize: 12, color: 'var(--text-secondary)' }}>
                        {s.ai_reason}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(s.ai_flags || []).map((flag, fi) => (
                            <span key={fi} style={{
                              background: 'rgba(255,179,71,0.08)', color: 'var(--warning)',
                              borderRadius: 4, padding: '1px 6px', fontSize: 11,
                            }}>
                              {flag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Online Users ── */}
      {tab === 'online' && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}> Who Is Online Right Now</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Users active in the last 3 minutes. Updates on page refresh.
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadAll}>🔄 Refresh</button>
          </div>

          {online.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 36 }}></div>
              <p style={{ marginTop: 10 }}>No users online right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {online.map((u, i) => {
                const lastSeen = new Date(u.last_seen)
                const secsAgo = Math.floor((Date.now() - lastSeen) / 1000)
                const timeLabel = secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo / 60)}m ago`
                const roleColor = u.role === 'admin' ? 'var(--primary)' : u.role === 'mess_staff' ? 'var(--warning)' : 'var(--success)'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(108,99,255,0.04)', borderRadius: 10, padding: '12px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: secsAgo < 90 ? '#22C55E' : '#FFA500',
                        flexShrink: 0,
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>@{u.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Last seen: {lastSeen.toLocaleTimeString()} · {timeLabel}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      background: `${roleColor}20`, color: roleColor,
                      borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                    }}>
                      {u.role === 'mess_staff' ? ' Staff' : u.role === 'admin' ? ' Admin' : ' Student'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

