import { defineStore } from 'pinia'
import { ref, computed, shallowRef, toRaw } from 'vue'
import { fetchVideoMetadata, type VideoMetadata } from '@/utils/youtubeApi'
import { type EnrichedStats } from '@/utils/enrichedStats'
import { useWatchHistoryStore } from './watchHistory'
import type { WatchStats } from '@/utils/parseWatchHistory'

const META_KEY    = 'yt-report-metadata'
const ENRICH_KEY  = 'yt-report-enriched'
const API_KEY_STORAGE = 'yt-report-apikey'

const log  = (...a: unknown[]) => console.log('[Metadata]', ...a)
const warn = (...a: unknown[]) => console.warn('[Metadata]', ...a)

// ── Persistence helpers ───────────────────────────────────────────────────────

function saveMeta(meta: Map<string, VideoMetadata>) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify([...meta.entries()]))
    log(`Metadata cache saved (${meta.size} entries)`)
  } catch (e) { warn('localStorage meta save failed:', e) }
}

function loadMeta(): Map<string, VideoMetadata> {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return new Map()
    const map = new Map(JSON.parse(raw) as [string, VideoMetadata][])
    log(`Metadata cache loaded (${map.size} entries)`)
    return map
  } catch (e) { warn('localStorage meta load failed:', e); return new Map() }
}

function saveEnriched(s: EnrichedStats) {
  try { localStorage.setItem(ENRICH_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function loadEnriched(): EnrichedStats | null {
  try {
    const raw = localStorage.getItem(ENRICH_KEY)
    return raw ? JSON.parse(raw) as EnrichedStats : null
  } catch { return null }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useVideoMetadataStore = defineStore('videoMetadata', () => {
  const metadata      = ref<Map<string, VideoMetadata>>(loadMeta())
  const enrichedStats = shallowRef<EnrichedStats | null>(loadEnriched())
  const apiKey        = ref(localStorage.getItem(API_KEY_STORAGE) ?? '')
  const fetching      = ref(false)
  const fetchProgress = ref(0)
  const fetchTotal    = ref(0)
  const fetchError    = ref<string | null>(null)

  const enrichedCount = computed(() => metadata.value.size)
  const hasEnriched   = computed(() => enrichedStats.value !== null)

  function saveApiKey(key: string) {
    apiKey.value = key
    localStorage.setItem(API_KEY_STORAGE, key)
    log('API key saved')
  }

  async function enrichAll() {
    const watchStore = useWatchHistoryStore()
    if (!watchStore.entries.length) {
      fetchError.value = 'No video entries loaded. Re-upload your file first.'
      warn('enrichAll called but entries not loaded')
      return
    }

    fetching.value = true
    fetchError.value = null
    fetchProgress.value = 0
    fetchTotal.value = 0

    log(`Starting enrichment — total entries: ${watchStore.entries.length}`)

    try {
      const toFetch = watchStore.entries.filter((e) => !e.isDeleted && !e.isShort && !!e.videoId)

      const newIds = [...new Set(
        toFetch.filter((e) => !metadata.value.has(e.videoId)).map((e) => e.videoId)
      )]
      log(`To fetch: ${toFetch.length} in scope — ${metadata.value.size} cached, ${newIds.length} new`)

      if (newIds.length > 0) {
        const t0 = performance.now()
        const result = await fetchVideoMetadata(newIds, apiKey.value, (done, total) => {
          fetchProgress.value = done
          fetchTotal.value = total
        })
        log(`All ${newIds.length} requests done in ${(performance.now() - t0).toFixed(0)} ms — received metadata for ${result.size} videos`)
        for (const [id, meta] of result) metadata.value.set(id, meta)
        saveMeta(metadata.value)
      } else {
        log('All IDs already cached — skipping API call')
        fetchProgress.value = 1
        fetchTotal.value = 1
      }

      // Yield so the progress bar renders "Done" before CPU work
      await new Promise((r) => setTimeout(r, 0))

      // Update isShort on entries (duration-based, authoritative)
      log('Applying duration-based Shorts detection…')
      const t1 = performance.now()
      let updatedCount = 0
      const updatedEntries = watchStore.entries.map((entry) => {
        if (entry.isDeleted) return entry
        const meta = metadata.value.get(entry.videoId)
        if (!meta) return entry
        const isShort = meta.durationSeconds > 0 && meta.durationSeconds <= 60
        if (isShort === entry.isShort) return entry
        updatedCount++
        return { ...entry, isShort }
      })
      log(`Updated ${updatedCount} entries in ${(performance.now() - t1).toFixed(0)} ms`)

      watchStore.entries = updatedEntries

      log('Running stats computation in worker…')
      const t2 = performance.now()

      type WorkerOk = { stats: Omit<WatchStats, 'entries'>; enrichedStats: EnrichedStats }
      type WorkerErr = { error: string }
      const workerResult = await new Promise<WorkerOk | WorkerErr>((resolve) => {
        const worker = new Worker(
          new URL('../workers/statsWorker.ts', import.meta.url),
          { type: 'module' },
        )
        worker.onmessage = (ev: MessageEvent<WorkerOk | WorkerErr>) => {
          resolve(ev.data)
          worker.terminate()
        }
        worker.onerror = (ev) => {
          resolve({ error: ev.message })
          worker.terminate()
        }
        worker.postMessage({ entries: updatedEntries, metadata: toRaw(metadata.value) })
      })

      if ('error' in workerResult) throw new Error(workerResult.error)

      log(`Worker done in ${(performance.now() - t2).toFixed(0)} ms — watch time: ${Math.round(workerResult.enrichedStats.totalWatchTimeSeconds / 3600)}h, categories: ${workerResult.enrichedStats.byCategory.length}`)

      watchStore.stats = { ...workerResult.stats, entries: updatedEntries }
      enrichedStats.value = workerResult.enrichedStats
      saveEnriched(workerResult.enrichedStats)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      fetchError.value = msg
      warn('enrichAll failed:', e)
    } finally {
      fetching.value = false
    }
  }

  function clearMetadata() {
    log('Clearing metadata cache and enriched stats')
    metadata.value = new Map()
    enrichedStats.value = null
    localStorage.removeItem(META_KEY)
    localStorage.removeItem(ENRICH_KEY)
  }

  return {
    metadata, enrichedStats, apiKey,
    fetching, fetchProgress, fetchTotal, fetchError,
    enrichedCount, hasEnriched,
    saveApiKey, enrichAll, clearMetadata,
  }
})
