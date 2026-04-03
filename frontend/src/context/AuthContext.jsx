// ============================================================
//  context/AuthContext.jsx  — Global auth state
//  Updated: exposes token + login/logout aliases
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('mess_token')
    if (!stored) { setLoading(false); return }
    setToken(stored)
    getMe()
      .then(setUser)
      .catch(() => { localStorage.removeItem('mess_token') })
      .finally(() => setLoading(false))
  }, [])

  function saveLogin(tok, userData) {
    localStorage.setItem('mess_token', tok)
    setToken(tok)
    setUser(userData)
  }

  // login() accepts the full API response object {access_token, user_id, role, username, ...}
  function login(res) {
    saveLogin(res.access_token, {
      user_id:  res.user_id,
      email:    res.email,
      role:     res.role,
      username: res.username,
    })
  }

  function clearLogin() {
    localStorage.removeItem('mess_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, saveLogin, clearLogin, login, logout: clearLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
