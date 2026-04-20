// ============================================================
//  pages/AdminDashboard.jsx  — Premium Glass Analytics
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
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading dashboard...</span></div>
  if (error) return <div className="alert alert-error">{error}</div>

  const stats = data?.mess_stats || []
  const recent = data?.recent_feedback || []
  const labels = stats.map(s => s.mess)

  const barData = {
    labels,
    datasets: [
      { label: 'Food Quality', data: stats.map(s => s.avg_quality), backgroundColor: 'rgba(108, 99, 255, 0.7)', borderRadius: 6 },
      { label: 'Taste', data: stats.map(s => s.avg_taste), backgroundColor: 'rgba(0, 217, 166, 0.7)', borderRadius: 6 },
      { label: 'Hygiene', data: stats.map(s => s.avg_hygiene), backgroundColor: 'rgba(255, 179, 71, 0.7)', borderRadius: 6 },
      { label: 'Staff', data: stats.map(s => s.avg_staff), backgroundColor: 'rgba(255, 107, 157, 0.7)', borderRadius: 6 },
    ],
  }

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 4, ticks: { stepSize: 1, color: '#8892B0' }, grid: { color: 'rgba(108,99,255,0.06)' } },
      x: { ticks: { color: '#8892B0' }, grid: { display: false } },
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: '#8892B0', padding: 16, usePointStyle: true } },
    },
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="fade-in">
      <h1 style={{
        fontSize: 26, fontWeight: 800, marginBottom: 4,
        background: 'linear-gradient(135deg, #6C63FF, #00D9A6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>📊 Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        {isAdmin ? 'Full analytics access' : 'Read-only analytics view'}
      </p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Feedback', value: data.total_feedback, icon: '📝', color: '#6C63FF' },
          { label: 'Mess Locations', value: data.total_mess, icon: '🍽️', color: '#00D9A6' },
          { label: 'Total Voters', value: data.total_voters, icon: '👥', color: '#FF6B9D' },
          { label: 'Best Score', value: stats.length ? Math.max(...stats.map(s => s.overall_avg)).toFixed(1) + '★' : 'N/A', icon: '⭐', color: '#FFB347' },
        ].map(({ label, value, icon, color }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{
              background: `${color}15`,
              boxShadow: `0 0 20px ${color}15`,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>📈 Ratings by Mess Location</h2>
        {stats.length === 0
          ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No feedback data yet.</p>
          : <div style={{ height: 300 }}><Bar data={barData} options={barOpts} /></div>
        }
      </div>

      {/* Mess table */}
      {stats.length > 0 && (
        <div className="card" style={{ marginBottom: 24, overflowX: 'auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>🏆 Mess Rankings</h2>
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
                  <td>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</td>
                  <td style={{ fontWeight: 600 }}>{s.mess}</td>
                  <td>{s.total_feedback}</td>
                  <td>{s.avg_quality}</td>
                  <td>{s.avg_taste}</td>
                  <td>{s.avg_hygiene}</td>
                  <td>{s.avg_staff}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.overall_avg >= 3.5 ? 'var(--success)' : s.overall_avg >= 2.5 ? 'var(--warning)' : 'var(--danger)' }}>
                      {s.overall_avg}
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
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>🕐 Recent Feedback</h2>
          {recent.map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, padding: '12px 0',
              borderTop: i > 0 ? '1px solid var(--surface-border)' : 'none',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{f.username} — {f.meal_type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{f.date_str} · {f.slot} slot</div>
                {f.comment && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>"{f.comment}"</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

