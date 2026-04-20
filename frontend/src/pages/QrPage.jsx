// ============================================================
//  pages/QrPage.jsx  — QR code generator for mess locations
// ============================================================

import { useState, useEffect } from 'react'
import { getAllMess, getQrUrl } from '../utils/api'

export default function QrPage() {
  const [messList, setMessList] = useState([])
  const [qrUrls,   setQrUrls]  = useState({})    // { messId: blobUrl }
  const [loading,  setLoading]  = useState(true)
  const [generating, setGenerating] = useState({})

  useEffect(() => {
    getAllMess()
      .then(d => setMessList(d.mess || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function generateQR(mess) {
    setGenerating(g => ({ ...g, [mess.id]: true }))
    try {
      // If we are on localhost, the phone won't be able to scan. 
      // Force use the network IP address (192.168.1.7) for the QR content.
      const origin = window.location.hostname === 'localhost' 
        ? 'http://192.168.1.7:5173' 
        : window.location.origin
        
      const url = await getQrUrl(mess.id, origin)
      setQrUrls(prev => ({ ...prev, [mess.id]: url }))
    } catch (err) {
      alert('Failed to generate QR: ' + err.message)
    } finally {
      setGenerating(g => ({ ...g, [mess.id]: false }))
    }
  }

  function downloadQR(mess) {
    const url = qrUrls[mess.id]
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${mess.name.replace(/\s+/g, '_')}_QR.png`
    a.click()
  }

  if (loading) return <div className="page-loader"><div className="spinner spinner-dark" /><span>Loading mess locations...</span></div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📲 QR Codes</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Generate QR codes for each mess location. Students scan to open the feedback form instantly.
      </p>

      {messList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: 48 }}>📲</div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No mess locations yet. Add them in the Mess Locations page first.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {messList.map(mess => (
            <div key={mess.id} className="card" style={{ textAlign: 'center' }}>
              {/* Mess info */}
              <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{mess.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{mess.institution}</p>

              {/* QR image */}
              {qrUrls[mess.id] ? (
                <div>
                  <div style={{
                    background: 'rgba(15,22,50,0.5)', border: '2px solid var(--surface-border)',
                    borderRadius: 12, padding: '16px', display: 'inline-block', marginBottom: 14,
                  }}>
                    <img src={qrUrls[mess.id]} alt={`QR for ${mess.name}`} style={{ width: 180, height: 180, display: 'block' }} />
                  </div>

                  {/* Engaging UI text */}
                  <div style={{
                    background: 'linear-gradient(135deg, #6C63FF, #00D9A6)',
                    borderRadius: 10, padding: '10px 16px', marginBottom: 14, color: 'white',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>🎮 Scan & Earn Tokens!</div>
                    <div style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>
                      Each feedback = 1–10 tokens. Level up & unlock rewards!
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => downloadQR(mess)}>
                      💾 Download PNG
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => generateQR(mess)}>
                      🔄 Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-green btn-full"
                  onClick={() => generateQR(mess)}
                  disabled={generating[mess.id]}
                >
                  {generating[mess.id]
                    ? <><span className="spinner" /> Generating...</>
                    : '📲 Generate QR Code'}
                </button>
              )}

              {/* Feedback URL */}
              <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                🔗 {`${window.location.hostname === 'localhost' ? 'http://192.168.1.7:5173' : window.location.origin}/feedback?mess=${mess.id}&name=${mess.name}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

