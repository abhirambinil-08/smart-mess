// ============================================================
//  App.jsx  — Routes for all 3 roles + Student Login Gate
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect } from 'react'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentLoginPage from './pages/StudentLoginPage'
import FeedbackPage from './pages/FeedbackPage'
import VoterDashboard from './pages/VoterDashboard'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminMessPage from './pages/AdminMessPage'
import AdminInsightsPage from './pages/AdminInsightsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminStaffPage from './pages/AdminStaffPage'
import QrPage from './pages/QrPage'
import QuestionsPage from './pages/QuestionsPage'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Heartbeat: ping every 60s to mark user as online ─────────
function OnlineHeartbeat() {
  const { user, token } = useAuth()

  useEffect(() => {
    if (!user || !token) return

    async function beat() {
      try {
        await fetch(`${API}/api/auth/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { }
    }

    beat()
    const interval = setInterval(beat, 60_000)
    return () => clearInterval(interval)
  }, [user, token])

  return null
}

// ── Route Guards ──────────────────────────────────────────────
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading...</span></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OnlineHeartbeat />
        <Routes>
          {/* ── Public ──────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/feedback" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/student-login" element={<StudentLoginPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />

          {/* ── Voter ───────────────────────────────────── */}
          <Route path="/voter" element={
            <RequireAuth roles={['voter']}>
              <VoterDashboard />
            </RequireAuth>
          } />

          {/* ── Admin ───────────────────────────────────── */}
          <Route path="/admin" element={
            <RequireAuth roles={['admin']}>
              <AdminLayout role="admin" />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="mess" element={<AdminMessPage />} />
            <Route path="insights" element={<AdminInsightsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="qr" element={<QrPage />} />
            <Route path="questions" element={<QuestionsPage />} />
          </Route>

          {/* ── Mess Staff ──────────────────────────────── */}
          <Route path="/staff" element={
            <RequireAuth roles={['mess_staff']}>
              <AdminLayout role="mess_staff" />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="insights" element={<AdminInsightsPage />} />
            <Route path="questions" element={<QuestionsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/feedback" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
