// ============================================================
//  components/SyncService.jsx — Background Data Sync
// ============================================================

import { useEffect, useState } from 'react'
import { getQueuedFeedback, removeQueuedFeedback } from '../utils/offlineStore'
import { submitFeedback } from '../utils/api'

export default function SyncService() {
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)

  // Listen for online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[SyncService] We are back online. Attempting sync...')
      performSync()
    }

    window.addEventListener('online', handleOnline)
    // Also try sync on mount in case we just loaded while online
    performSync()

    return () => window.removeEventListener('online', handleOnline)
  }, [])

  const performSync = async () => {
    const queue = await getQueuedFeedback()
    if (queue.length === 0) return

    setSyncing(true)
    let successCount = 0

    for (const item of queue) {
      try {
        // Since api.js submitFeedback is now async and handles offline, 
        // we can just call it. If we are truly online, it will hit the network.
        const res = await submitFeedback(item.payload)
        
        if (res && !res.offline) {
          await removeQueuedFeedback(item.id)
          successCount++
        }
      } catch (err) {
        console.error('[SyncService] Failed to sync item:', item.id, err)
      }
    }

    if (successCount > 0) {
      setToast(`Synced ${successCount} offline feedback item${successCount > 1 ? 's' : ''}! 🚀`)
      setTimeout(() => setToast(null), 5000)
    }
    setSyncing(false)
  }

  if (!toast && !syncing) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: 'rgba(20, 20, 30, 0.9)', backdropFilter: 'blur(10px)',
      padding: '12px 20px', borderRadius: 100, border: '1px solid rgba(108, 99, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff', fontSize: 13,
      fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
      animation: 'fp-fadein 0.4s ease-out'
    }}>
      {syncing ? (
        <>
          <span className="spinner" style={{ width: 14, height: 14 }} />
          Syncing offline data...
        </>
      ) : (
        <>
          <span>✨</span>
          {toast}
        </>
      )}
    </div>
  )
}
