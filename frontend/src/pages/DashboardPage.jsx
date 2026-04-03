// ============================================================
//  pages/DashboardPage.jsx  — Admin analytics dashboard
// ============================================================

import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler,
  Title, Tooltip, Legend,
} from 'chart.js'
import { getDashboard } from '../utils/api'
import { useAuth } from '../context/AuthContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale,
  PointElement, LineElement, Filler, Title, Tooltip, Legend)

export default function DashboardPage() {
  const { admin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [online, setOnline] = useState([])

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Fetch online users every 30 seconds — admin only
  useEffect(() => {
    if (admin?.role !== 'admin') return

    const fetchOnline = () => {
      fetch('http://127.0.0.1:8000/api/auth/online-users', {
        headers: { Authorization: `Bearer ${admin.token}` }
      })
        .then(r => r.json())
        .then(d => setOnline(d.online_users || []))
        .catch(() => { })
    }

    fetchOnline()
    const interval = setInterval(fetchOnline, 30000)
    return () => clearInterval(interval)
  }, [admin])

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading dashboard...</span></div>
  if (error) return <div className="alert alert-error">{error}</div>

  const stats = data?.mess_stats || []
  const recent = data?.recent_feedback || []
  const labels = stats.map(s => s.mess)

  const barData = {
    labels,
    datasets: [
      { label: 'Food Quality', data: stats.map(s => s.avg_food_quality), backgroundColor: '#1A56A0CC' },
      { label: 'Taste', data: stats.map(s => s.avg_taste), backgroundColor: '#27AE60CC' },
      { label: 'Hygiene', data: stats.map(s => s.avg_hygiene), backgroundColor: '#E67E22CC' },
      { label: 'Portion Size', data: stats.map(s => s.avg_portion_size), backgroundColor: '#8E44ADCC' },
    ],
  }

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
    plugins: { legend: { position: 'bottom' } },
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>📊 Dashboard</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 24 }}>Live feedback analytics across all mess locations</p>

      {/* ── Stat Cards ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '📝', label: 'Total Feedback', value: data.total_feedback, bg: '#EBF4FB', ic: '#1A56A0' },
          { icon: '🍽️', label: 'Total Mess', value: data.total_mess, bg: '#E8F8F0', ic: '#27AE60' },
          { icon: '⭐', label: 'Best Avg Score', value: stats.length ? Math.max(...stats.map(s => s.overall_avg)).toFixed(2) : 'N/A', bg: '#FFF3E0', ic: '#E67E22' },
          { icon: '📍', label: 'Active Locations', value: stats.length, bg: '#F3E8FF', ic: '#8E44AD' },
        ].map(({ icon, label, value, bg, ic }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg, color: ic }}>{icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--dark)' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--grey)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bar Chart ───────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📈 Ratings by Mess</h2>
        {stats.length === 0
          ? <p style={{ color: 'var(--grey)', textAlign: 'center', padding: '40px 0' }}>No feedback yet. Submit some feedback to see charts.</p>
          : <div style={{ height: 320 }}><Bar data={barData} options={barOptions} /></div>
        }
      </div>

      {/* ── Mess Table ──────────────────────────────── */}
      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: 24, overflowX: 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🏆 Mess Rankings</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--primary-light)' }}>
                {['Mess', 'Feedback', 'Food', 'Taste', 'Hygiene', 'Portion', 'Overall'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.mess} style={{
                  borderTop: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'var(--white)' : 'var(--bg)'
                }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.mess}</td>
                  <td style={{ padding: '10px 14px' }}>{s.total_feedback}</td>
                  <td style={{ padding: '10px 14px' }}>{s.avg_food_quality}</td>
                  <td style={{ padding: '10px 14px' }}>{s.avg_taste}</td>
                  <td style={{ padding: '10px 14px' }}>{s.avg_hygiene}</td>
                  <td style={{ padding: '10px 14px' }}>{s.avg_portion_size}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: s.overall_avg >= 4 ? 'var(--green)' : s.overall_avg >= 3 ? 'var(--orange)' : 'var(--red)'
                    }}>
                      {s.overall_avg} ⭐
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Recent Feedback ─────────────────────────── */}
      {recent.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🕐 Recent Feedback</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', background: 'var(--bg)', borderRadius: 8
              }}>
                <div style={{ fontSize: 20 }}>🍽️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.mess} — {f.meal_type}</div>
                  {f.comment && <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2 }}>"{f.comment}"</div>}
                </div>
                <div style={{
                  fontWeight: 700,
                  color: f.overall >= 4 ? 'var(--green)' : f.overall >= 3 ? 'var(--orange)' : 'var(--red)',
                  whiteSpace: 'nowrap', fontSize: 14
                }}>
                  {f.overall} ⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Online Users (Admin only) ────────────────── */}
      {admin?.role === 'admin' && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            🟢 Online Users
            <span style={{
              marginLeft: 10, fontSize: 13, fontWeight: 400,
              background: '#E8F8F0', color: '#27AE60', padding: '2px 10px', borderRadius: 20
            }}>
              {online.length} active
            </span>
          </h2>
          {online.length === 0
            ? <p style={{ color: 'var(--grey)', fontSize: 14 }}>No users active in the last 30 minutes.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {online.map((u, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--bg)', borderRadius: 8
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#27AE60', flexShrink: 0
                    }} />
                    <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{u.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--grey)' }}>
                      Last seen: {new Date(u.last_seen).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
