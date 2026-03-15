import { buildStats, type WatchEntry } from '../utils/parseWatchHistory'
import { computeEnrichedStats } from '../utils/enrichedStats'
import type { VideoMetadata } from '../utils/youtubeApi'

self.onmessage = (e: MessageEvent<{ entries: WatchEntry[]; metadata: Map<string, VideoMetadata> }>) => {
  try {
    const { entries, metadata } = e.data
    const fullStats = buildStats(entries)
    // Strip entries from stats — the main thread already has them
    const { entries: _, ...stats } = fullStats
    const enrichedStats = computeEnrichedStats(entries, metadata)
    self.postMessage({ stats, enrichedStats })
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) })
  }
}
