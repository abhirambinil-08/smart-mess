// ============================================================
//  pages/VoterDashboard.jsx  — Premium Glassmorphism Voter Hub
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyTokens, getMyHistory, getLeaderboard, redeemReward, logout } from '../utils/api'

export default function VoterDashboard() {
  const { user, clearLogin } = useAuth()
  const navigate = useNavigate()

  const [tokenData, setTokenData] = useState(null)
  const [history, setHistory] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [tab, setTab] = useState('tokens')
  const [loading, setLoading] = useState(true)
  const [redeemMsg, setRedeemMsg] = useState('')

  useEffect(() => {
    Promise.all([getMyTokens(), getMyHistory(), getLeaderboard()])
      .then(([td, hist, lb]) => {
        setTokenData(td)
        setHistory(hist.feedback_history || [])
        setLeaderboard(lb.leaderboard || [])
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  async function handleRedeem(milestone) {
    try {
      const res = await redeemReward(milestone)
      setRedeemMsg(res.message)
      const td = await getMyTokens()
      setTokenData(td)
    } catch (err) {
      setRedeemMsg('❌ ' + err.message)
    }
  }

  async function handleLogout() {
    try { await logout() } catch { }
    clearLogin()
    navigate('/login')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
      <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading your dashboard...</span></div>
    </div>
  )

  const level = tokenData?.level_info || {}
  const total = tokenData?.total_tokens || 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '0 0 40px' }}>

      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(0, 217, 166, 0.1))',
        borderBottom: '1px solid var(--surface-border)',
        backdropFilter: 'blur(20px)',
        padding: '20px 24px',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>👋 Welcome back,</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.username}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/feedback" className="btn btn-primary" style={{ fontSize: 13 }}>
              🍱 Give Feedback
            </Link>
            <button onClick={handleLogout} className="btn btn-red" style={{ fontSize: 13 }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        {/* Token hero card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.2), rgba(0, 217, 166, 0.1))',
          border: '1px solid rgba(108, 99, 255, 0.25)',
          padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(108, 99, 255, 0.2), transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, position: 'relative' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your Token Balance</div>
              <div style={{
                fontSize: 48, fontWeight: 900, lineHeight: 1,
                background: 'linear-gradient(135deg, #6C63FF, #00D9A6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>🪙 {total}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color: 'var(--text-primary)' }}>{level.level_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{level.reward_desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {level.next_milestone && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Next milestone: <b style={{ color: 'var(--warning)' }}>{level.next_milestone}</b> tokens
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{level.next_reward}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Level Progress</span>
              <span>{level.progress_pct || 0}%</span>
            </div>
            <div className="level-bar-wrap">
              <div className="level-bar-fill" style={{ width: `${level.progress_pct || 0}%` }} />
            </div>
          </div>
        </div>

        {/* Redeem message */}
        {redeemMsg && (
          <div className={`alert ${redeemMsg.includes('❌') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
            {redeemMsg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(108, 99, 255, 0.06)', borderRadius: 12, padding: 4 }}>
          {[['tokens', '🏆 Rewards'], ['history', '📋 History'], ['leaderboard', '🥇 Leaderboard']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, background: tab === id ? 'var(--primary)' : 'transparent',
              border: 'none', padding: '10px 16px', borderRadius: 10,
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              color: tab === id ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Rewards tab ──────────────────────────────────── */}
        {tab === 'tokens' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Unlock rewards by reaching token milestones. Each reward can be redeemed once.
            </p>

            {[
              { milestone: 154, icon: '🍎', name: 'Food Explorer', reward: 'Extra Fruit', color: '#00E676' },
              { milestone: 369, icon: '🫓', name: 'Mess Influencer', reward: 'Extra Roti / Add-on', color: '#FFB347' },
              { milestone: 649, icon: '⚡', name: 'Food Critic', reward: 'Priority Serving (Skip the Line!)', color: '#6C63FF' },
              { milestone: 1599, icon: '🥤', name: 'Mess Legend', reward: 'Free Snack or Drink', color: '#FF6B9D' },
              { milestone: 2999, icon: '🎁', name: 'Ultimate Foodie', reward: 'Special Snack Pass', color: '#FF5252' },
            ].map(({ milestone, icon, name, reward, color }) => {
              const unlocked = total >= milestone
              const redeemed = tokenData?.redeemed_milestones?.includes(milestone)

              return (
                <div key={milestone} className="card" style={{
                  marginBottom: 12, padding: '18px 22px',
                  border: `1.5px solid ${unlocked ? color + '40' : 'var(--surface-border)'}`,
                  opacity: unlocked ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: unlocked ? `linear-gradient(135deg, ${color}08, transparent)` : undefined,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, fontSize: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: unlocked ? `${color}18` : 'rgba(255,255,255,0.03)',
                    boxShadow: unlocked ? `0 0 20px ${color}20` : 'none',
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {milestone} tokens → <b>{reward}</b>
                    </div>
                    {!unlocked && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        🔒 Need {milestone - total} more tokens
                      </div>
                    )}
                  </div>
                  {unlocked && (
                    redeemed
                      ? <span className="badge badge-green">✅ Redeemed</span>
                      : <button className="btn btn-primary btn-sm" onClick={() => handleRedeem(milestone)}>Redeem</button>
                  )}
                  {!unlocked && (
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(108, 99, 255, 0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                    }}>
                      🔒
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── History tab ───────────────────────────────── */}
        {tab === 'history' && (
          <div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: 40 }}>📋</div>
                <p style={{ marginTop: 12 }}>No feedback submitted yet.</p>
                <Link to="/feedback" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                  Submit Your First Feedback
                </Link>
              </div>
            ) : history.map((f, i) => (
              <div key={i} className="card" style={{ marginBottom: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{f.meal_type} — {f.slot} slot</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{f.date_str}</div>
                    {f.comment && <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{f.comment}"</div>}
                  </div>
                  <span className="badge badge-blue">{f.slot}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Leaderboard tab ───────────────────────────── */}
        {tab === 'leaderboard' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>Top feedback contributors in SmartMess 🏆</p>
            {leaderboard.map((u, i) => (
              <div key={u.username} className="card" style={{
                marginBottom: 10, padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                border: u.username === user?.username ? '1.5px solid var(--primary)' : undefined,
                background: u.username === user?.username ? 'rgba(108, 99, 255, 0.08)' : undefined,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < 3
                    ? `linear-gradient(135deg, ${['#FFD70030', '#C0C0C030', '#CD7F3230'][i]}, transparent)`
                    : 'rgba(108, 99, 255, 0.06)',
                  fontWeight: 700, color: 'var(--text-primary)',
                }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {u.username} {u.username === user?.username ? <span style={{ color: 'var(--primary)' }}>(You)</span> : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.level_name}</div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: 15,
                  background: 'linear-gradient(135deg, #6C63FF, #00D9A6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  🪙 {u.total_tokens}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

