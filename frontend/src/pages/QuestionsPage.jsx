// ============================================================
//  pages/QuestionsPage.jsx  — Rich Question Type Management
//  Supports: Single Select, Emoji Rating, Slider, Multi-Select,
//            Photo Upload, Voice Note
// ============================================================

import { useState, useEffect } from 'react'
import { getAllQuestions, addQuestion, updateQuestion, deleteQuestion } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const QUESTION_TYPES = [
  { value: 'single_select', label: '🔘 Single Select',  desc: 'Classic pick-one with emoji' },
  { value: 'emoji_rating',  label: '😊 Emoji Rating',   desc: 'Quick emoji tap, no text labels' },
  { value: 'slider',        label: '📊 Slider (1-10)',   desc: 'Granular numeric slider' },
  { value: 'multi_select',  label: '☑️ Multi-Select',   desc: 'Pick multiple issues at once' },
  { value: 'photo_upload',  label: '📸 Photo Upload',   desc: 'Ask student to upload a meal photo' },
  { value: 'voice_note',    label: '🎙️ Voice Note',     desc: 'Ask student to record a voice comment' },
]

const CATEGORIES = ['food_quality', 'taste', 'hygiene', 'portion', 'staff_behaviour', 'general']

const BLANK_FORM = {
  question_text: '',
  category:      'food_quality',
  meal_type:     'All',
  question_type: 'single_select',
  options:       ['Very Bad', 'Bad', 'Good', 'Excellent'],
  emoji_scale:   ['😡', '😐', '🙂', '😍'],
  menu_item:     '',
  date_str:      '',
}

export default function QuestionsPage() {
  const { user }  = useAuth()
  const isAdmin   = user?.role === 'admin'

  const [questions, setQuestions] = useState([])
  const [form,      setForm]      = useState({ ...BLANK_FORM })
  const [editId,    setEditId]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  useEffect(() => { loadQuestions() }, [])

  async function loadQuestions() {
    setLoading(true)
    try { setQuestions((await getAllQuestions()).questions || []) }
    catch {}
    finally { setLoading(false) }
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setOption(i, v) { setForm(f => { const o = [...f.options]; o[i] = v; return { ...f, options: o } }) }
  function setEmoji(i, v)  { setForm(f => { const e = [...f.emoji_scale]; e[i] = v; return { ...f, emoji_scale: e } }) }

  function addOption() {
    setForm(f => ({
      ...f,
      options:     [...f.options, ''],
      emoji_scale: [...f.emoji_scale, '😐'],
    }))
  }

  function removeOption(i) {
    if (form.options.length <= 2) return
    setForm(f => ({
      ...f,
      options:     f.options.filter((_, idx) => idx !== i),
      emoji_scale: f.emoji_scale.filter((_, idx) => idx !== i),
    }))
  }

  function handleTypeChange(newType) {
    setF('question_type', newType)
    // Auto-set sensible defaults for some types
    if (newType === 'slider') {
      setForm(f => ({
        ...f,
        question_type: 'slider',
        options:     ['1','2','3','4','5','6','7','8','9','10'],
        emoji_scale: ['😡','😡','😡','😐','😐','😐','🙂','🙂','😍','😍'],
      }))
    } else if (newType === 'photo_upload' || newType === 'voice_note') {
      setForm(f => ({ ...f, question_type: newType, options: [], emoji_scale: [] }))
    } else if (newType === 'multi_select') {
      setForm(f => ({
        ...f,
        question_type: 'multi_select',
        options:     ['Cold food', 'Long queue', 'Less quantity', 'Poor taste'],
        emoji_scale: ['🥶', '⏳', '😤', '🤢'],
      }))
    }
  }

  function startEdit(q) {
    setEditId(q.id)
    setForm({
      question_text: q.question_text,
      category:      q.category,
      meal_type:     q.meal_type,
      question_type: q.question_type || 'single_select',
      options:       [...(q.options || [])],
      emoji_scale:   [...(q.emoji_scale || [])],
      menu_item:     q.menu_item || '',
      date_str:      q.date_str  || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() { setEditId(null); setForm({ ...BLANK_FORM }) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.question_text) { setError('Question text is required.'); return }

    const needsOptions = !['photo_upload', 'voice_note'].includes(form.question_type)
    if (needsOptions && form.options.some(o => !o.trim())) {
      setError('All option fields must be filled.')
      return
    }

    setSaving(true); setError(''); setSuccess('')
    try {
      if (editId) {
        await updateQuestion(editId, form)
        setSuccess('Question updated!')
        setEditId(null)
      } else {
        await addQuestion(form)
        setSuccess('Question added!')
      }
      setForm({ ...BLANK_FORM })
      loadQuestions()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this question?')) return
    try { await deleteQuestion(id); loadQuestions() }
    catch (err) { setError(err.message) }
  }

  const typeInfo   = QUESTION_TYPES.find(t => t.value === form.question_type)
  const hasOptions = !['photo_upload', 'voice_note'].includes(form.question_type)
  const isSlider   = form.question_type === 'slider'

  const typeColor = {
    single_select: '#1A56A0',
    emoji_rating:  '#F59E0B',
    slider:        '#8B5CF6',
    multi_select:  '#10B981',
    photo_upload:  '#EF4444',
    voice_note:    '#EC4899',
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>❓ Question Management</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 28 }}>
        Create rich interactive questions — emoji ratings, sliders, multi-select, photo prompts, and more.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,460px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Add/Edit Form */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>
            {editId ? '✏️ Edit Question' : '➕ Add Question'}
          </h2>

          {error   && <div className="alert alert-error"   style={{ marginBottom: 14 }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 14 }}>{success}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="label">Question Text *</label>
              <textarea className="input" rows={2}
                placeholder="e.g. How was today's dal makhani?"
                value={form.question_text}
                onChange={e => setF('question_text', e.target.value)} />
            </div>

            {/* Question Type Picker */}
            <div className="form-group">
              <label className="label">Question Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUESTION_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleTypeChange(t.value)}
                    style={{
                      border: `2px solid ${form.question_type === t.value ? typeColor[t.value] : 'var(--border)'}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      textAlign: 'left',
                      background: form.question_type === t.value ? `${typeColor[t.value]}12` : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12, color: form.question_type === t.value ? typeColor[t.value] : 'var(--dark)' }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--grey)', marginTop: 2 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setF('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Meal Type</label>
                <select className="input" value={form.meal_type} onChange={e => setF('meal_type', e.target.value)}>
                  <option value="All">All Meals</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 10 }}>
              <label className="label">Menu Item (optional)</label>
              <input className="input" placeholder="e.g. Dal Makhani"
                value={form.menu_item} onChange={e => setF('menu_item', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="label">Date (leave blank = permanent)</label>
              <input className="input" type="date"
                value={form.date_str} onChange={e => setF('date_str', e.target.value)} />
            </div>

            {/* Options — hidden for photo/voice */}
            {hasOptions && (
              <div className="form-group">
                <label className="label">
                  {isSlider ? 'Slider Scale Values (auto-set)' : 'Options & Emoji Scale'}
                </label>

                {isSlider ? (
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--grey)' }}>
                    📊 Slider auto-generates 1–10 with matching emojis. Students drag a handle to rate.
                  </div>
                ) : (
                  <>
                    {form.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <input className="input" value={form.emoji_scale[i] || ''}
                          onChange={e => setEmoji(i, e.target.value)}
                          style={{ width: 54, textAlign: 'center', fontSize: 20, padding: '8px' }} />
                        <input className="input" value={opt} placeholder={`Option ${i + 1}`}
                          onChange={e => setOption(i, e.target.value)} style={{ flex: 1 }} />
                        {form.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(i)}
                            style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addOption}
                      style={{ marginTop: 4 }}>
                      + Add Option
                    </button>
                  </>
                )}
              </div>
            )}

            {!hasOptions && (
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--grey)' }}>
                {form.question_type === 'photo_upload'
                  ? '📸 This question prompts students to upload a photo. No options needed.'
                  : '🎙️ This question prompts students to record a short voice note. No options needed.'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : editId ? '✅ Update' : '➕ Add Question'}
              </button>
              {editId && (
                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* Question List */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            All Questions
            <span style={{ fontSize: 13, color: 'var(--grey)', fontWeight: 400, marginLeft: 8 }}>
              ({questions.length})
            </span>
          </h2>

          {loading ? (
            <div className="page-loader"><div className="spinner spinner-dark" /></div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--grey)' }}>
              <p>No custom questions yet. Default questions will be used.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map(q => {
                const qType = q.question_type || 'single_select'
                const tInfo = QUESTION_TYPES.find(t => t.value === qType)
                const color = typeColor[qType] || '#666'
                return (
                  <div key={q.id} style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{q.question_text}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ background: `${color}20`, color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                            {tInfo?.label || qType}
                          </span>
                          <span className="badge badge-blue">{q.category.replace('_', ' ')}</span>
                          <span className="badge badge-orange">{q.meal_type}</span>
                          {q.date_str  && <span className="badge badge-purple">📅 {q.date_str}</span>}
                          {q.menu_item && <span className="badge badge-green">🍛 {q.menu_item}</span>}
                        </div>
                        {q.options?.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {q.options.slice(0, 5).map((opt, i) => (
                              <span key={i} style={{ fontSize: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
                                {q.emoji_scale?.[i]} {opt}
                              </span>
                            ))}
                            {q.options.length > 5 && (
                              <span style={{ fontSize: 12, color: 'var(--grey)' }}>+{q.options.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(q)}>✏️</button>
                        {isAdmin && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none' }}
                            onClick={() => handleDelete(q.id)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    {q.created_by && (
                      <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 6 }}>
                        Added by: {q.created_by} · {new Date(q.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
