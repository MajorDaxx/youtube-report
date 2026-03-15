import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { parseWatchHistoryHtml, buildStats, type WatchStats, type WatchEntry } from '@/utils/parseWatchHistory'
import { saveEntries, loadEntries, saveHtmlBlob, loadHtmlBlob, clearAll } from '@/utils/db'

const STATS_KEY = 'yt-report-stats'
const log  = (...a: unknown[]) => console.log('[WatchHistory]', ...a)
const warn = (...a: unknown[]) => console.warn('[WatchHistory]', ...a)

interface PersistedStats {
  totalCount: number
  deletedCount: number
  estimatedShortCount: number
  dateRange: { from: string; to: string }
  byChannel: WatchStats['byChannel']
  byDayOfWeek: number[]
  byHour: number[]
  byMonth: WatchStats['byMonth']
  byDate: WatchStats['byDate']
  topRewatched: WatchStats['topRewatched']
  fileName: string
}

function saveStats(s: WatchStats, name: string) {
  try {
    const p: PersistedStats = {
      totalCount: s.totalCount,
      deletedCount: s.deletedCount,
      estimatedShortCount: s.estimatedShortCount,
      dateRange: { from: s.dateRange.from.toISOString(), to: s.dateRange.to.toISOString() },
      byChannel: s.byChannel,
      byDayOfWeek: s.byDayOfWeek,
      byHour: s.byHour,
      byMonth: s.byMonth,
      byDate: s.byDate,
      topRewatched: s.topRewatched,
      fileName: name,
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(p))
    log('Stats saved to localStorage')
  } catch (e) { warn('localStorage stats save failed:', e) }
}

function loadStats(): { stats: WatchStats; fileName: string } | null {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PersistedStats
    log(`Stats loaded from localStorage (${p.totalCount} videos, "${p.fileName}")`)
    return {
      fileName: p.fileName,
      stats: {
        entries: [],
        totalCount: p.totalCount,
        deletedCount: p.deletedCount ?? 0,
        estimatedShortCount: p.estimatedShortCount ?? 0,
        dateRange: { from: new Date(p.dateRange.from), to: new Date(p.dateRange.to) },
        byChannel: p.byChannel,
        byDayOfWeek: p.byDayOfWeek,
        byHour: p.byHour,
        byMonth: p.byMonth,
        byDate: p.byDate,
        topRewatched: p.topRewatched ?? [],
      },
    }
  } catch (e) { warn('localStorage stats load failed:', e); return null }
}

export const useWatchHistoryStore = defineStore('watchHistory', () => {
  const cached = loadStats()

  const hasData       = ref(!!cached)
  const stats         = shallowRef<WatchStats | null>(cached?.stats ?? null)
  const entries       = shallowRef<WatchEntry[]>([])
  const originalHtmlUrl = ref<string | null>(null)
  const loading       = ref(false)
  const loadingEntries = ref(false)
  const error         = ref<string | null>(null)
  const fileName      = ref<string | null>(cached?.fileName ?? null)

  if (cached) {
    log('Restoring entries + HTML from IndexedDB…')
    loadingEntries.value = true
    Promise.all([loadEntries(), loadHtmlBlob()])
      .then(([storedEntries, blob]) => {
        if (storedEntries) {
          entries.value = storedEntries
          log(`IndexedDB: restored ${storedEntries.length} entries`)
        } else {
          warn('IndexedDB: no entries found')
        }
        if (blob) {
          originalHtmlUrl.value = URL.createObjectURL(blob)
          log(`IndexedDB: restored HTML blob (${(blob.size / 1024).toFixed(0)} KB)`)
        }
      })
      .catch((e) => warn('IndexedDB restore failed:', e))
      .finally(() => { loadingEntries.value = false })
  }

  async function loadFile(file: File) {
    log(`Loading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
    loading.value = true
    error.value = null
    try {
      const t0 = performance.now()
      const html = await file.text()
      log(`File read in ${(performance.now() - t0).toFixed(0)} ms`)

      const t1 = performance.now()
      const parsed = parseWatchHistoryHtml(html)
      log(`Parsed ${parsed.totalCount} entries in ${(performance.now() - t1).toFixed(0)} ms — deleted: ${parsed.deletedCount}, est. shorts: ${parsed.estimatedShortCount}, rewatched titles: ${parsed.topRewatched.length}`)

      if (parsed.totalCount === 0) {
        error.value = 'No watch history entries found. Please upload a valid Wiedergabeverlauf.html file.'
        return
      }

      if (originalHtmlUrl.value) URL.revokeObjectURL(originalHtmlUrl.value)
      const blob = new Blob([html], { type: 'text/html' })

      stats.value = parsed
      entries.value = parsed.entries
      originalHtmlUrl.value = URL.createObjectURL(blob)
      fileName.value = file.name
      hasData.value = true

      saveStats(parsed, file.name)
      saveEntries(parsed.entries)
        .then(() => log('IndexedDB: entries saved'))
        .catch((e) => warn('IndexedDB: entries save failed:', e))
      saveHtmlBlob(blob)
        .then(() => log('IndexedDB: HTML blob saved'))
        .catch((e) => warn('IndexedDB: HTML blob save failed:', e))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to parse file.'
      error.value = msg
      warn('loadFile error:', e)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    log('Resetting — clearing all persisted data')
    hasData.value = false
    stats.value = null
    entries.value = []
    error.value = null
    fileName.value = null
    if (originalHtmlUrl.value) {
      URL.revokeObjectURL(originalHtmlUrl.value)
      originalHtmlUrl.value = null
    }
    localStorage.removeItem(STATS_KEY)
    clearAll()
      .then(() => log('IndexedDB cleared'))
      .catch((e) => warn('IndexedDB clear failed:', e))
  }

  return { hasData, stats, entries, originalHtmlUrl, loading, loadingEntries, error, fileName, loadFile, reset }
})
