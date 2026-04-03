// ============================================================
//  components/StarRating.jsx
//  Click stars to set a 1–5 rating. Hover preview included.
// ============================================================

import { useState } from 'react'

export default function StarRating({ label, value, onChange }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div className="star-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= (hover || value) ? 'active' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </span>
        ))}
        <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--grey)', alignSelf: 'center' }}>
          {value ? `${value}/5` : 'Tap to rate'}
        </span>
      </div>
    </div>
  )
}
