// ============================================================
//  pages/VoterDashboard.jsx  — Voter's personal dashboard
//  Shows: tokens, level, rewards, history, leaderboard
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
  const [tab, setTab] = useState('tokens')   // tokens | history | leaderboard
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
      // Refresh token data
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading your dashboard...</span></div>
    </div>
  )

  const level = tokenData?.level_info || {}
  const total = tokenData?.total_tokens || 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 40px' }}>

      {/* Header bar */}
      <div style={{ background: 'linear-gradient(135deg, #1A56A0, #1ABC9C)', padding: '20px 24px', color: 'white' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>👋 Welcome back,</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{user?.username}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/feedback" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 13 }}>
              🍱 Give Feedback
            </Link>
            <button onClick={handleLogout} className="btn" style={{ background: 'rgba(231,76,60,0.4)', color: 'white', fontSize: 13 }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        {/* Token hero card */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1A2E, #1A56A0)', borderRadius: 16,
          padding: '24px', color: 'white', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Your Token Balance</div>
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1 }}>🪙 {total}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>{level.level_name}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>{level.reward_desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {level.next_milestone && (
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Next milestone: <b>{level.next_milestone}</b> tokens
                </div>
              )}
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{level.next_reward}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              <span>Level Progress</span>
              <span>{level.progress_pct || 0}%</span>
            </div>
            <div className="level-bar-wrap" style={{ background: 'rgba(255,255,255,0.2)' }}>
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
          {[['tokens', '🏆 Rewards'], ['history', '📋 History'], ['leaderboard', '🥇 Leaderboard']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: 'none', border: 'none', padding: '10px 16px',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              color: tab === id ? 'var(--primary)' : 'var(--grey)',
              borderBottom: `2px solid ${tab === id ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -2, transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Rewards tab ──────────────────────────────────── */}
        {tab === 'tokens' && (
          <div>
            <p style={{ fontSize: 14, color: 'var(--grey)', marginBottom: 16 }}>
              Unlock rewards by reaching token milestones. Each reward can be redeemed once.
            </p>

            {/* Level progression cards */}
            {[
              { milestone: 154, icon: '🍎', name: 'Food Explorer', reward: 'Extra Fruit', color: '#27AE60' },
              { milestone: 369, icon: '🫓', name: 'Mess Influencer', reward: 'Extra Roti / Add-on', color: '#E67E22' },
              { milestone: 649, icon: '⚡', name: 'Food Critic', reward: 'Priority Serving (Skip the Line!)', color: '#1A56A0' },
              { milestone: 1599, icon: '🥤', name: 'Mess Legend', reward: 'Free Snack or Drink', color: '#8E44AD' },
              { milestone: 2999, icon: '🎁', name: 'Ultimate Foodie', reward: 'Special Snack Pass', color: '#E74C3C' },
            ].map(({ milestone, icon, name, reward, color }) => {
              const unlocked = total >= milestone
              const redeemed = tokenData?.redeemed_milestones?.includes(milestone)
              const available = tokenData?.available_rewards?.find(r => r.milestone === milestone)

              return (
                <div key={milestone} style={{
                  background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 12,
                  border: `2px solid ${unlocked ? color : 'var(--border)'}`,
                  opacity: unlocked ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, fontSize: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: unlocked ? `${color}20` : 'var(--bg)',
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: unlocked ? 'var(--dark)' : 'var(--grey)' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 2 }}>
                      {milestone} tokens → <b>{reward}</b>
                    </div>
                    {!unlocked && (
                      <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4 }}>
                        🔒 Need {milestone - total} more tokens
                      </div>
                    )}
                  </div>
                  {unlocked && (
                    redeemed
                      ? <span className="badge badge-green">✅ Redeemed</span>
                      : <button className="btn btn-primary btn-sm" onClick={() => handleRedeem(milestone)}>
                        Redeem
                      </button>
                  )}
                  {!unlocked && (
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: 'var(--bg)',
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
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--grey)' }}>
                <div style={{ fontSize: 40 }}>📋</div>
                <p style={{ marginTop: 12 }}>No feedback submitted yet.</p>
                <Link to="/feedback" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
                  Submit Your First Feedback
                </Link>
              </div>
            ) : history.map((f, i) => (
              <div key={i} className="card" style={{ marginBottom: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{f.meal_type} — {f.slot} slot</div>
                    <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2 }}>{f.date_str}</div>
                    {f.comment && <div style={{ fontSize: 13, marginTop: 4, color: 'var(--dark)' }}>"{f.comment}"</div>}
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
            <p style={{ fontSize: 14, color: 'var(--grey)', marginBottom: 16 }}>Top feedback contributors in SmartMess 🏆</p>
            {leaderboard.map((u, i) => (
              <div key={u.username} style={{
                background: 'white', borderRadius: 10, padding: '12px 18px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 14,
                border: u.username === user?.username ? '2px solid var(--primary)' : '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] + '30' : 'var(--bg)',
                  fontWeight: 700, color: 'var(--dark)',
                }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {u.username} {u.username === user?.username ? '(You)' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--grey)' }}>{u.level_name}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>
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
