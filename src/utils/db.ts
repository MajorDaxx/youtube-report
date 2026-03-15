/**
 * Thin IndexedDB wrapper.
 * Stores two records:
 *   'entries'  → WatchEntry[] (Date objects survive via structured clone)
 *   'html'     → Blob         (the original Wiedergabeverlauf.html)
 */

import type { WatchEntry } from './parseWatchHistory'

const DB_NAME = 'yt-report'
const DB_VERSION = 1
const STORE = 'data'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function put(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function get<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

function del(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveEntries(entries: WatchEntry[]): Promise<void> {
  const db = await open()
  await put(db, 'entries', entries)
}

export async function loadEntries(): Promise<WatchEntry[] | null> {
  const db = await open()
  const raw = await get<WatchEntry[]>(db, 'entries')
  if (!raw) return null
  // IDB structured clone stores Dates as Dates — but serialisation round-trips
  // (e.g. between browser sessions) may return plain strings. Normalise.
  return raw.map((e) => ({
    ...e,
    date: e.date instanceof Date ? e.date : new Date(e.date as unknown as string),
  }))
}

export async function saveHtmlBlob(blob: Blob): Promise<void> {
  const db = await open()
  await put(db, 'html', blob)
}

export async function loadHtmlBlob(): Promise<Blob | null> {
  const db = await open()
  return (await get<Blob>(db, 'html')) ?? null
}

export async function clearAll(): Promise<void> {
  const db = await open()
  await del(db, 'entries')
  await del(db, 'html')
}
