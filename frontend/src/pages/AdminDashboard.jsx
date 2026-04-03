// ============================================================
//  pages/AdminDashboard.jsx  — Analytics dashboard
//  Accessible by admin (full) and mess_staff (read-only)
// ============================================================

import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { getDashboard } from '../utils/api'
import { useAuth } from '../context/AuthContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const { user }            = useAuth()
  const [data,    setData]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading dashboard...</span></div>
  if (error)   return <div className="alert alert-error">{error}</div>

  const stats  = data?.mess_stats      || []
  const recent = data?.recent_feedback || []
  const labels = stats.map(s => s.mess)

  const barData = {
    labels,
    datasets: [
      { label: 'Food Quality', data: stats.map(s => s.avg_quality), backgroundColor: '#1A56A0CC' },
      { label: 'Taste',        data: stats.map(s => s.avg_taste),   backgroundColor: '#1ABC9CCC' },
      { label: 'Hygiene',      data: stats.map(s => s.avg_hygiene), backgroundColor: '#E67E22CC' },
      { label: 'Staff',        data: stats.map(s => s.avg_staff),   backgroundColor: '#8E44ADCC' },
    ],
  }

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { min: 0, max: 4, ticks: { stepSize: 1 } } },
    plugins: { legend: { position: 'bottom' } },
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📊 Dashboard</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 24 }}>
        {isAdmin ? 'Full analytics access' : 'Read-only analytics view'}
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '📝', label: 'Total Feedback', value: data.total_feedback, bg: '#EBF4FB', ic: '#1A56A0' },
          { icon: '🍽️', label: 'Mess Locations', value: data.total_mess,     bg: '#E8F8F0', ic: '#27AE60' },
          { icon: '🎓', label: 'Total Voters',   value: data.total_voters,   bg: '#F3E8FF', ic: '#8E44AD' },
          { icon: '⭐', label: 'Best Score',     value: stats.length ? Math.max(...stats.map(s => s.overall_avg)).toFixed(1) + '★' : 'N/A', bg: '#FFF3E0', ic: '#E67E22' },
        ].map(({ icon, label, value, bg, ic }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg, color: ic }}>{icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--grey)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📈 Ratings by Mess Location</h2>
        {stats.length === 0
          ? <p style={{ color: 'var(--grey)', textAlign: 'center', padding: '40px 0' }}>No feedback data yet.</p>
          : <div style={{ height: 300 }}><Bar data={barData} options={barOpts} /></div>
        }
      </div>

      {/* Mess table */}
      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: 24, overflowX: 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🏆 Mess Rankings</h2>
          <table className="table">
            <thead>
              <tr>
                {['Rank', 'Mess', 'Feedback', 'Quality', 'Taste', 'Hygiene', 'Staff', 'Overall'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...stats].sort((a, b) => b.overall_avg - a.overall_avg).map((s, i) => (
                <tr key={s.mess}>
                  <td>{['🥇','🥈','🥉'][i] || `#${i+1}`}</td>
                  <td style={{ fontWeight: 600 }}>{s.mess}</td>
                  <td>{s.total_feedback}</td>
                  <td>{s.avg_quality}</td>
                  <td>{s.avg_taste}</td>
                  <td>{s.avg_hygiene}</td>
                  <td>{s.avg_staff}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.overall_avg >= 3.5 ? 'var(--green)' : s.overall_avg >= 2.5 ? 'var(--orange)' : 'var(--red)' }}>
                      {s.overall_avg} ⭐
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent feedback */}
      {recent.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🕐 Recent Feedback</h2>
          {recent.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 24 }}>🍽️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.username} — {f.meal_type}</div>
                <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2 }}>{f.date_str} · {f.slot} slot</div>
                {f.comment && <div style={{ fontSize: 13, color: 'var(--dark)', marginTop: 4 }}>"{f.comment}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
