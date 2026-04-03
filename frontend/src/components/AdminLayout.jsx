// ============================================================
//  components/AdminLayout.jsx  — Sidebar shell for admin/staff
// ============================================================

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout }  from '../utils/api'

export default function AdminLayout({ role }) {
  const { user, clearLogin } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'
  const base    = isAdmin ? '/admin' : '/staff'

  // Nav items differ by role
  const navItems = [
    { to: `${base}/dashboard`, icon: '📊', label: 'Dashboard' },
    { to: `${base}/insights`,  icon: '🤖', label: 'AI Insights' },
    { to: `${base}/questions`, icon: '❓', label: 'Questions' },
    // Admin-only items
    ...(isAdmin ? [
      { to: `${base}/mess`,      icon: '🍽️',  label: 'Mess Locations' },
      { to: `${base}/users`,     icon: '👥', label: 'Users & Tokens' },
      { to: `${base}/staff`,     icon: '🧑‍🍳', label: 'Mess Staff' },
      { to: `${base}/qr`,        icon: '📲', label: 'QR Codes' },
    ] : []),
  ]

  async function handleLogout() {
    try { await logout() } catch {}
    clearLogin()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 230, background: 'var(--dark)', color: 'white',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 28 }}>🍱</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>SmartMess</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
            {isAdmin ? '👑 Admin Panel' : '🧑‍🍳 Staff Panel'}
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{user?.username}</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{user?.email}</div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', background: 'rgba(231,76,60,0.2)', border: 'none',
            color: '#ff8a80', padding: '10px 12px', borderRadius: 8,
            cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}
