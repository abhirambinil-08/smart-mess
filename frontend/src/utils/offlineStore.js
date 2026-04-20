// ============================================================
//  utils/offlineStore.js — IndexedDB for Offline Queueing
//  Saves feedback submissions when the user is offline.
// ============================================================

const DB_NAME = 'MateMessOfflineDB'
const STORE_NAME = 'feedback_queue'
const DB_VERSION = 1

/**
 * Opens (and creates if necessary) the IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror   = () => reject(request.error)
  })
}

/**
 * Saves a feedback payload to the queue
 */
export async function saveOfflineFeedback(payload) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store       = transaction.objectStore(STORE_NAME)

    // Payloads often contain File/Blob. 
    // IndexedDB supports storing Blobs natively in modern browsers.
    const request = store.add({
      payload,
      timestamp: Date.now(),
      status: 'pending'
    })

    request.onsuccess = () => resolve(true)
    request.onerror   = () => reject(request.error)
  })
}

/**
 * Retrieves all pending feedback items from the queue
 */
export async function getQueuedFeedback() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store       = transaction.objectStore(STORE_NAME)
    const request     = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror   = () => reject(request.error)
  })
}

/**
 * Removes an item from the queue after successful sync
 */
export async function removeQueuedFeedback(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store       = transaction.objectStore(STORE_NAME)
    const request     = store.delete(id)

    request.onsuccess = () => resolve(true)
    request.onerror   = () => reject(request.error)
  })
}

/**
 * Clears the entire queue (use with caution)
 */
export async function clearQueue() {
  const db = await openDB()
  const transaction = db.transaction(STORE_NAME, 'readwrite')
  transaction.objectStore(STORE_NAME).clear()
}
