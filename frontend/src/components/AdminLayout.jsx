// ============================================================
//  components/AdminLayout.jsx  — Premium Glass Sidebar Shell
// ============================================================

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout }  from '../utils/api'

export default function AdminLayout({ role }) {
  const { user, clearLogin } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'
  const base    = isAdmin ? '/admin' : '/staff'

  const navItems = [
    { to: `${base}/dashboard`, icon: '📊', label: 'Dashboard' },
    { to: `${base}/insights`,  icon: '🤖', label: 'AI Insights' },
    { to: `${base}/questions`, icon: '❓', label: 'Questions' },
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        width: 250,
        background: 'rgba(10, 14, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--surface-border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid var(--surface-border)',
          background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.08), transparent)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }} className="floating">🍱</div>
          <div style={{
            fontSize: 18, fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>SmartMess</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
            {isAdmin ? '👑 Admin Panel' : '🧑‍🍳 Staff Panel'}
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white',
            }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '16px 14px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10, marginBottom: 4,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(108, 99, 255, 0.15), rgba(0, 217, 166, 0.08))'
                : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.2s ease',
            })}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '14px 14px', borderTop: '1px solid var(--surface-border)' }}>
          <button onClick={handleLogout} style={{
            width: '100%',
            background: 'rgba(255, 82, 82, 0.1)',
            border: '1px solid rgba(255, 82, 82, 0.2)',
            color: '#FF5252',
            padding: '11px 14px', borderRadius: 10,
            cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 82, 82, 0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 82, 82, 0.1)' }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main style={{
        flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: '100%',
        position: 'relative', zIndex: 1,
      }}>
        <Outlet />
      </main>
    </div>
  )
}
