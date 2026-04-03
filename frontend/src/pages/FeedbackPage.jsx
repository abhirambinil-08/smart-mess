// ============================================================
//  pages/FeedbackPage.jsx  — Rich Feedback Form
//  - Camera capture on EVERY question
//  - Live camera preview + capture button
//  - Emoji faces (editable), sliders, multi-select, photo, voice
//  - FeedGuard warning shown if AI flags submission
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { getAllMess, getTodaysQuestions, submitFeedback, uploadImage } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const STAFF_EMOJIS = ['😡', '😐', '🙂', '😍']
const STAFF_LABELS = ['Very Rude', 'Unfriendly', 'Polite', 'Very Helpful']
const SLOT_INFO = [
  { label: 'Morning', time: '7:00 AM – 11:00 AM', icon: '🌅' },
  { label: 'Afternoon', time: '1:00 PM – 3:00 PM', icon: '☀️' },
  { label: 'Evening', time: '7:00 PM – 10:00 PM', icon: '🌙' },
]
const EMOJI_FACES = ['😍', '🙂', '😐', '😕', '😡', '🤩', '😋', '🤢', '😴', '🔥']

// ── Mini Camera Component (per question) ─────────────────────
function QuestionCamera({ questionKey, onCapture, captured }) {
  const videoRef = useRef()
  const canvasRef = useRef()
  const streamRef = useRef(null)
  const fileRef = useRef()

  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(captured || null)
  const [hasCamera, setHasCamera] = useState(true)

  async function openCamera() {
    setOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setHasCamera(false)
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setOpen(false)
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      const file = new File([blob], `q-${questionKey}-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setPreview(url)
      onCapture(file, url)
      closeCamera()
    }, 'image/jpeg', 0.85)
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onCapture(file, url)
  }

  function removePhoto() {
    setPreview(null)
    onCapture(null, null)
  }

  return (
    <div style={{ marginTop: 10 }}>
      {/* Camera / Upload buttons */}
      {!preview && !open && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={openCamera}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#1A56A0', color: 'white',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            📷 Open Camera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', color: '#1A56A0',
              border: '1.5px solid #1A56A0', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            🖼️ Upload Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      )}

      {/* Live Camera View */}
      {open && (
        <div style={{
          background: '#000', borderRadius: 12, overflow: 'hidden',
          position: 'relative', marginTop: 8,
        }}>
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{
                position: 'absolute', bottom: 12, left: 0, right: 0,
                display: 'flex', justifyContent: 'center', gap: 12,
              }}>
                <button
                  type="button"
                  onClick={capture}
                  style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'white', border: '4px solid #1ABC9C',
                    fontSize: 24, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  }}
                  title="Capture photo"
                >
                  📸
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', border: '2px solid white',
                    color: 'white', fontSize: 18, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    alignSelf: 'center',
                  }}
                  title="Close camera"
                >
                  ✕
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: 'white', padding: 20, textAlign: 'center', fontSize: 13 }}>
              📷 Camera not available. Please use Upload Photo instead.
              <br />
              <button type="button" onClick={closeCamera}
                style={{ marginTop: 10, color: '#1ABC9C', background: 'none', border: 'none', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Photo Preview */}
      {preview && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <img
            src={preview}
            alt="captured"
            style={{ maxHeight: 120, borderRadius: 10, maxWidth: '100%', display: 'block', border: '2px solid var(--green)' }}
          />
          <button
            type="button"
            onClick={removePhoto}
            style={{
              position: 'absolute', top: -8, right: -8,
              background: 'var(--red)', color: 'white',
              border: 'none', borderRadius: '50%',
              width: 22, height: 22, fontSize: 12,
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>
            ✅ Photo attached — boosts AI genuineness score!
          </div>
        </div>
      )}
    </div>
  )
}


// ── Main FeedbackPage ─────────────────────────────────────────
export default function FeedbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const messIdParam = params.get('mess') || ''
  const messName = params.get('name') || ''

  // Redirect to student login if not logged in
  useEffect(() => {
    if (!user) {
      navigate(`/student-login${window.location.search}`, { replace: true })
    }
  }, [user, navigate])

  const [messList, setMessList] = useState([])
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [questionPhotos, setQuestionPhotos] = useState({})  // { qKey: { file, url } }
  const [staffRating, setStaffRating] = useState(null)
  const [staffEmoji, setStaffEmoji] = useState('😐')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [comment, setComment] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [selectedMess, setSelectedMess] = useState(messIdParam)
  const [mealType, setMealType] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [reward, setReward] = useState(null)
  const mainFileRef = useRef()

  useEffect(() => {
    getAllMess().then(d => setMessList(d.mess || [])).catch(() => { })
  }, [])

  useEffect(() => {
    if (!mealType) return
    getTodaysQuestions(mealType)
      .then(d => { setQuestions(d.questions || []); setAnswers({}); setQuestionPhotos({}) })
      .catch(() => { })
  }, [mealType])

  function handleMainImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleQuestionPhoto(qKey, file, url) {
    setQuestionPhotos(prev => ({
      ...prev,
      [qKey]: file ? { file, url } : null,
    }))
  }

  function recordAnswer(q, value, extra = {}) {
    const key = q.id || q.question_text
    setAnswers(prev => ({
      ...prev,
      [key]: {
        question_id: q.id || '',
        question_text: q.question_text,
        selected_option: String(value),
        emoji: extra.emoji || '',
        category: q.category,
        question_type: q.question_type || 'single_select',
        multi_values: extra.multi_values || null,
      },
    }))
  }

  function toggleMulti(q, option, emoji) {
    const key = q.id || q.question_text
    const current = answers[key]?.multi_values || []
    const updated = current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option]
    recordAnswer(q, updated.join(', '), { emoji, multi_values: updated })
  }

  // Categories that should show camera option
  const CAMERA_CATEGORIES = ['hygiene', 'food_quality', 'taste', 'portion', 'general']

  async function handleSubmit() {
    if (!selectedMess) { setStatus({ type: 'error', msg: 'Please select a mess.' }); return }
    if (!mealType) { setStatus({ type: 'error', msg: 'Please select a meal type.' }); return }
    if (staffRating === null) { setStatus({ type: 'error', msg: 'Please rate the staff behaviour.' }); return }

    const reqQuestions = questions.filter(q =>
      !['photo_upload', 'voice_note'].includes(q.question_type || 'single_select')
    )
    if (reqQuestions.length > 0 && Object.keys(answers).length < reqQuestions.length) {
      setStatus({ type: 'error', msg: 'Please answer all questions before submitting.' })
      return
    }

    setLoading(true); setStatus(null)
    try {
      // Upload main image if any
      let mainImageUrl = ''
      if (imageFile) {
        const imgRes = await uploadImage(imageFile)
        mainImageUrl = imgRes.url || ''
      }

      // Upload question-level photos and attach to answers
      const updatedAnswers = { ...answers }
      for (const [qKey, photoData] of Object.entries(questionPhotos)) {
        if (photoData?.file) {
          try {
            const imgRes = await uploadImage(photoData.file)
            if (updatedAnswers[qKey]) {
              updatedAnswers[qKey].photo_url = imgRes.url || ''
            }
          } catch { }
        }
      }

      // Use first question photo as main image if no main image set
      if (!mainImageUrl) {
        const firstPhoto = Object.values(questionPhotos).find(p => p?.file)
        if (firstPhoto) {
          mainImageUrl = Object.values(updatedAnswers).find(a => a.photo_url)?.photo_url || ''
        }
      }

      const payload = {
        mess_id: selectedMess,
        meal_type: mealType,
        answers: Object.values(updatedAnswers),
        staff_behaviour: staffRating + 1,
        image_url: mainImageUrl,
        comment: comment,
      }

      const res = await submitFeedback(payload)
      setSubmitted(true)
      setReward({
        tokens_earned: res.tokens_earned,
        total_tokens: res.total_tokens,
        milestone_reward: res.milestone_reward,
        level_info: res.level_info,
        flagged: res.tokens_earned === 0,
        message: res.message,
      })
    } catch (err) {
      setStatus({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  // ── Success / Warning Screen ──────────────────────────────
  if (submitted && reward) {
    const isFlagged = reward.flagged
    return (
      <div style={{
        minHeight: '100vh',
        background: isFlagged
          ? 'linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%)'
          : 'linear-gradient(135deg, #1A56A0 0%, #1ABC9C 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>{isFlagged ? '⚠️' : '🎉'}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {isFlagged ? 'FeedGuard Warning!' : 'Feedback Submitted!'}
            </h2>
            <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 20 }}>
              {isFlagged
                ? 'Your feedback was flagged as suspicious. Please give genuine feedback to earn tokens.'
                : 'Thank you for helping improve the mess experience.'}
            </p>

            {!isFlagged && (
              <div style={{
                background: 'linear-gradient(135deg, #1A56A0, #1ABC9C)',
                borderRadius: 12, padding: '18px 24px', color: 'white', marginBottom: 16,
              }}>
                <div style={{ fontSize: 32 }}>🪙 +{reward.tokens_earned} Token{reward.tokens_earned > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                  Total: <b>{reward.total_tokens}</b> tokens
                </div>
                {reward.tokens_earned === 10 && (
                  <div style={{ marginTop: 8, fontSize: 13, background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px' }}>
                    ✨ RARE REWARD! Jackpot 10 tokens!
                  </div>
                )}
              </div>
            )}

            {isFlagged && (
              <div style={{ background: '#FFF3E0', border: '2px solid var(--orange)', borderRadius: 10, padding: '14px', marginBottom: 16, fontSize: 13 }}>
                <strong>Why was I flagged?</strong><br />
                Our AI detected your answers may be random or inconsistent.
                Attaching a photo and writing a genuine comment helps prove authenticity.
              </div>
            )}

            {reward.level_info && !isFlagged && (
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>{reward.level_info.level_name}</div>
                <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 8 }}>
                  Progress: {reward.level_info.progress_pct}%
                </div>
                <div className="level-bar-wrap" style={{ marginTop: 4 }}>
                  <div className="level-bar-fill" style={{ width: `${reward.level_info.progress_pct}%` }} />
                </div>
              </div>
            )}

            {reward.milestone_reward && !isFlagged && (
              <div style={{ background: '#FFF3E0', border: '2px solid var(--orange)', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: 'var(--orange)' }}>🏆 Milestone Unlocked!</div>
                <div style={{ fontSize: 14, marginTop: 4 }}>{reward.milestone_reward}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => {
                setSubmitted(false); setReward(null); setAnswers({})
                setComment(''); setStaffRating(null)
                setImageFile(null); setImagePreview('')
                setQuestionPhotos({})
              }}>
                {isFlagged ? '🔄 Try Again' : 'Submit Another'}
              </button>
              <Link to="/voter" className="btn btn-ghost">My Tokens</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Form ─────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A56A0 0%, #1ABC9C 100%)',
      padding: '24px 16px',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', color: 'white', marginBottom: 24 }}>
          <div style={{ fontSize: 52 }}>🍱</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '10px 0 4px' }}>SmartMess Feedback</h1>
          <p style={{ opacity: 0.85, fontSize: 14 }}>
            Hey {user?.username}! Your voice improves every meal 🚀
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            {SLOT_INFO.map(s => (
              <span key={s.label} style={{
                background: 'rgba(255,255,255,0.18)', color: 'white',
                padding: '5px 12px', borderRadius: 99, fontSize: 12,
              }}>
                {s.icon} {s.label} {s.time}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          {status && (
            <div className={`alert alert-${status.type}`} style={{ marginBottom: 18 }}>{status.msg}</div>
          )}

          {/* Step 1 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              📍 Step 1 — Select Mess & Meal
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Mess Location *</label>
                <select className="input" value={selectedMess} onChange={e => setSelectedMess(e.target.value)}>
                  <option value="">-- Select --</option>
                  {messList.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Meal Type *</label>
                <select className="input" value={mealType} onChange={e => setMealType(e.target.value)}>
                  <option value="">-- Select --</option>
                  <option value="Breakfast">🌅 Breakfast</option>
                  <option value="Lunch">☀️ Lunch</option>
                  <option value="Dinner">🌙 Dinner</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Questions with per-question camera */}
          {questions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                ❓ Step 2 — Rate Your Meal
              </div>

              {questions.map((q, qi) => {
                const qKey = q.id || q.question_text
                const answered = answers[qKey]
                const qType = q.question_type || 'single_select'
                const showCam = CAMERA_CATEGORIES.includes(q.category)

                return (
                  <div key={qKey} style={{
                    background: 'var(--bg)', borderRadius: 12, padding: '16px',
                    marginBottom: 14,
                    border: answered ? '2px solid var(--green)' : '2px solid transparent',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                      Q{qi + 1}. {q.question_text}
                    </div>
                    {q.menu_item && (
                      <div style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 10 }}>
                        🍛 Today: <b>{q.menu_item}</b>
                      </div>
                    )}

                    {/* single_select or emoji_rating */}
                    {(qType === 'single_select' || qType === 'emoji_rating') && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {q.options.map((opt, oi) => {
                          const isSelected = answered?.selected_option === opt
                          return (
                            <button key={oi}
                              className={`emoji-btn${isSelected ? ' active' : ''}`}
                              onClick={() => recordAnswer(q, opt, { emoji: q.emoji_scale?.[oi] || '' })}
                              title={opt}
                            >
                              <div style={{ fontSize: 28 }}>{q.emoji_scale?.[oi]}</div>
                              {qType === 'single_select' && (
                                <div style={{ fontSize: 11, color: isSelected ? 'var(--primary)' : 'var(--grey)', marginTop: 4, fontWeight: 600 }}>
                                  {opt}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* slider */}
                    {qType === 'slider' && (
                      <div>
                        <input type="range" min="1" max="10" step="1"
                          value={answered?.selected_option || 5}
                          onChange={e => {
                            const val = parseInt(e.target.value)
                            recordAnswer(q, val, { emoji: q.emoji_scale?.[val - 1] || '' })
                          }}
                          style={{ width: '100%', accentColor: 'var(--primary)' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                          <span>😡 Terrible</span>
                          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                            {answered?.selected_option || 5}/10
                          </span>
                          <span>😍 Excellent</span>
                        </div>
                      </div>
                    )}

                    {/* multi_select */}
                    {qType === 'multi_select' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {q.options.map((opt, oi) => {
                          const selected = answers[qKey]?.multi_values?.includes(opt)
                          return (
                            <button key={oi}
                              onClick={() => toggleMulti(q, opt, q.emoji_scale?.[oi])}
                              style={{
                                border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                                background: selected ? 'var(--primary-light)' : 'white',
                                borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                                color: selected ? 'var(--primary)' : 'var(--dark)',
                                transition: 'all 0.15s',
                              }}
                            >
                              {q.emoji_scale?.[oi]} {opt}
                              {selected && <span style={{ marginLeft: 4 }}>✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* photo_upload type */}
                    {qType === 'photo_upload' && (
                      <div style={{ fontSize: 13, color: 'var(--grey)', background: 'white', borderRadius: 8, padding: 10, border: '1px dashed var(--border)', marginBottom: 6 }}>
                        📸 Use the camera button below to capture your meal photo!
                      </div>
                    )}

                    {/* voice_note type */}
                    {qType === 'voice_note' && (
                      <div style={{ fontSize: 13, color: 'var(--grey)', background: 'white', borderRadius: 8, padding: 10, border: '1px dashed var(--border)' }}>
                        🎙️ Voice notes coming soon! Leave a written comment in Step 4.
                      </div>
                    )}

                    {/* Per-question camera — shown for hygiene, food, taste, portion */}
                    {showCam && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--grey)', marginBottom: 6, fontWeight: 600 }}>
                          📷 Add photo proof for this question <span style={{ color: 'var(--green)' }}>(boosts AI score!)</span>
                        </div>
                        <QuestionCamera
                          questionKey={qKey}
                          captured={questionPhotos[qKey]?.url || null}
                          onCapture={(file, url) => handleQuestionPhoto(qKey, file, url)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 3: Staff Behaviour */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              🧑‍🍳 Step 3 — Rate Staff Behaviour *
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, flex: 1, margin: 0 }}>
                  How was the behaviour of mess staff?
                </p>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(p => !p)}
                    style={{ fontSize: 22, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                    title="Change emoji style"
                  >
                    {staffEmoji}
                  </button>
                  {showEmojiPicker && (
                    <div style={{
                      position: 'absolute', right: 0, top: 40, zIndex: 10,
                      background: 'white', border: '1px solid var(--border)', borderRadius: 10,
                      padding: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      display: 'flex', gap: 8, flexWrap: 'wrap', width: 200,
                    }}>
                      {EMOJI_FACES.map(em => (
                        <button key={em} onClick={() => { setStaffEmoji(em); setShowEmojiPicker(false) }}
                          style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {STAFF_EMOJIS.map((emoji, i) => (
                  <button key={i}
                    className={`emoji-btn${staffRating === i ? ' active' : ''}`}
                    onClick={() => setStaffRating(i)}
                    title={STAFF_LABELS[i]}
                  >
                    <div style={{ fontSize: 32 }}>{staffRating === i ? staffEmoji : emoji}</div>
                    <div style={{ fontSize: 11, color: staffRating === i ? 'var(--primary)' : 'var(--grey)', marginTop: 4, fontWeight: 600 }}>
                      {STAFF_LABELS[i]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Main photo + comment */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              📎 Step 4 — Optional Extras
            </div>

            <div className="form-group">
              <label className="label">
                Overall Meal Photo{' '}
                <span style={{ color: 'var(--green)', fontSize: 11 }}>⭐ Boosts AI genuineness score!</span>
              </label>
              <div
                onClick={() => mainFileRef.current.click()}
                style={{
                  border: '2px dashed var(--border)', borderRadius: 10, padding: '20px',
                  textAlign: 'center', cursor: 'pointer', background: 'var(--bg)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={{ maxHeight: 140, borderRadius: 8, maxWidth: '100%' }} />
                ) : (
                  <>
                    <div style={{ fontSize: 32 }}>📸</div>
                    <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 6 }}>Click to upload overall meal photo</div>
                  </>
                )}
              </div>
              <input ref={mainFileRef} type="file" accept="image/*" capture="environment"
                style={{ display: 'none' }} onChange={handleMainImageChange} />
              {imageFile && (
                <button onClick={() => { setImageFile(null); setImagePreview('') }}
                  style={{ marginTop: 6, fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ✕ Remove
                </button>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label">Additional Comment (optional)</label>
              <textarea className="input" placeholder="Any specific feedback or suggestions..."
                value={comment} maxLength={300}
                onChange={e => setComment(e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--grey)', textAlign: 'right', marginTop: 2 }}>
                {comment.length}/300
              </div>
            </div>
          </div>

          {/* FeedGuard notice */}
          <div style={{
            background: 'linear-gradient(135deg, #EBF5FF, #E6FBF5)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#1A56A0',
          }}>
            🛡️ <strong>FeedGuard AI</strong> checks every submission. Random or fake answers reduce tokens and issue a warning. Photos on each question boost your authenticity score!
          </div>

          <button className="btn btn-green btn-full" onClick={handleSubmit} disabled={loading}
            style={{ padding: '14px', fontSize: 16 }}>
            {loading ? <><span className="spinner" /> Submitting...</> : '🚀 Submit & Earn Tokens!'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--grey)', marginTop: 12 }}>
            🪙 Genuine feedback earns 1–10 tokens • Camera photos boost your score!
          </p>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 16 }}>
          SmartMess · Logged in as <b style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.username}</b>
          {' · '}<Link to="/voter" style={{ color: 'rgba(255,255,255,0.8)' }}>My Tokens</Link>
        </p>
      </div>
    </div>
  )
}
