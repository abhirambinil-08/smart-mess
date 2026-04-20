import { saveOfflineFeedback } from './offlineStore'

const BASE = '/api'

// ── Helper: add auth token to headers ────────────────────────
function authHeaders() {
  const token = localStorage.getItem('mess_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ── Generic fetch wrapper ─────────────────────────────────────
async function req(method, path, body = null, isForm = false) {
  const opts = { method, headers: isForm ? { Authorization: authHeaders().Authorization } : authHeaders() }
  if (body && !isForm) opts.body = JSON.stringify(body)
  if (body && isForm) opts.body = body   // FormData

  const res = await fetch(BASE + path, opts)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // FastAPI validation errors return detail as an array of {loc, msg, type} objects
    const detail = data.detail
    let msg
    if (Array.isArray(detail)) {
      msg = detail.map(e => e.msg || JSON.stringify(e)).join(', ')
    } else {
      msg = detail || `Error ${res.status}`
    }
    throw new Error(msg)
  }
  return data
}

// ── Auth ──────────────────────────────────────────────────────
export const login = (email, password) => req('POST', '/auth/login', { email, password })
export const register = (form) => req('POST', '/auth/register', form)
export const logout = () => req('POST', '/auth/logout')
export const getMe = () => req('GET', '/auth/me')
export const setupAdmin = (email, password) => req('POST', '/auth/setup', { email, password })
export const createStaff = (data) => req('POST', '/auth/create-staff', data)
export const listStaff = () => req('GET', '/auth/staff-list')
export const getOnlineUsers = () => req('GET', '/auth/online-users')

// ── Mess ──────────────────────────────────────────────────────
export const getAllMess = () => req('GET', '/mess')
export const createMess = (data) => req('POST', '/mess', data)
export const deleteMess = (id) => req('DELETE', `/mess/${id}`)

// ── Questions ─────────────────────────────────────────────────
export const getTodaysQuestions = (mealType = 'All') => req('GET', `/questions/today?meal_type=${mealType}`)
export const getAllQuestions = () => req('GET', '/questions/all')
export const addQuestion = (data) => req('POST', '/questions', data)
export const updateQuestion = (id, data) => req('PUT', `/questions/${id}`, data)
export const deleteQuestion = (id) => req('DELETE', `/questions/${id}`)

// ── Feedback ──────────────────────────────────────────────────
export const submitFeedback = async (data) => {
  try {
    return await req('POST', '/feedback', data)
  } catch (err) {
    // If it's a network error (failed to fetch), save offline
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.warn('[Offline Mode] Saving feedback to local queue...')
      await saveOfflineFeedback(data)
      return { 
        offline: true, 
        message: 'You are offline. Your feedback has been saved locally and will sync once you are back online! 📥' 
      }
    }
    throw err
  }
}
export const getMyHistory = () => req('GET', '/feedback/my-history')
export const getAllFeedback = () => req('GET', '/feedback/all')
export const uploadImage = (file) => {
  const fd = new FormData(); fd.append('file', file)
  return req('POST', '/feedback/upload-image', fd, true)
}

// ── Tokens ────────────────────────────────────────────────────
export const getMyTokens = () => req('GET', '/tokens/my')
export const redeemReward = (milestone) => req('POST', '/tokens/redeem', { milestone })
export const adjustTokens = (data) => req('POST', '/tokens/adjust', data)
export const getLeaderboard = () => req('GET', '/tokens/leaderboard')
export const getAllUsersTokens = () => req('GET', '/tokens/all-users')

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboard = () => req('GET', '/dashboard')

// ── AI Insights ───────────────────────────────────────────────
export const getInsights = () => req('GET', '/insights')
export const sendReport = (data) => req('POST', '/insights/send-report', data)

// ── QR Code (returns blob URL) ────────────────────────────────
export async function getQrUrl(messId, baseUrl) {
  const token = localStorage.getItem('mess_token')
  const url   = new URL(`${BASE}/qr/${messId}`, window.location.origin)
  if (baseUrl) url.searchParams.append('base_url', baseUrl)

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('QR generation failed')
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

// ── New endpoints added for upgraded features ─────────────────

// Auth - renamed for clarity
export const loginUser = ({ email, password }) => req('POST', '/auth/login', { email, password })

// Suspicious feedback dashboard
export const getSuspiciousFeedback = () => req('GET', '/feedback/suspicious')

// Token warnings
export const getWarnedStudents = () => req('GET', '/tokens/warnings')

// Online heartbeat
export const sendHeartbeat = () => req('POST', '/auth/heartbeat')
