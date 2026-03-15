import type { WatchEntry } from './parseWatchHistory'
import type { VideoMetadata } from './youtubeApi'

export interface EnrichedStats {
  enrichedCount: number           // videos with API data
  coveragePct: number             // % of fetchable videos enriched
  totalWatchTimeSeconds: number
  avgDurationSeconds: number
  confirmedShortCount: number     // duration ≤ 60 s
  confirmedVideoCount: number     // duration > 60 s (within enriched set)
  byCategory: CategoryStat[]
  byCategoryByMonth: { month: string; cats: Record<string, number> }[]
  watchTimeByMonth: { month: string; seconds: number }[]
  byLanguage: { language: string; count: number }[]
  durationBuckets: { label: string; count: number }[]
  contentAgeBuckets: { label: string; count: number }[]
}

export interface CategoryStat {
  id: string
  label: string
  count: number
  watchTimeSeconds: number
}

export const CATEGORY_LABELS: Record<string, string> = {
  '1':  'Film & Animation',
  '2':  'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '18': 'Short Movies',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '21': 'Videoblogging',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
}

// Colour palette keyed by categoryId
export const CATEGORY_COLORS: Record<string, string> = {
  '1':  '#8b5cf6',
  '2':  '#f97316',
  '10': '#ec4899',
  '15': '#84cc16',
  '17': '#22c55e',
  '18': '#a78bfa',
  '19': '#06b6d4',
  '20': '#6366f1',
  '21': '#f59e0b',
  '22': '#fb923c',
  '23': '#facc15',
  '24': '#f59e0b',
  '25': '#3b82f6',
  '26': '#10b981',
  '27': '#14b8a6',
  '28': '#0ea5e9',
  '29': '#6b7280',
}

function normaliseLanguage(tag: string): string {
  if (!tag || tag === 'unknown') return 'Unknown'
  const base = (tag.split('-')[0] ?? tag).toLowerCase()
  const map: Record<string, string> = {
    de: 'German', en: 'English', fr: 'French', es: 'Spanish',
    pt: 'Portuguese', it: 'Italian', nl: 'Dutch', pl: 'Polish',
    ru: 'Russian', tr: 'Turkish', ar: 'Arabic', ja: 'Japanese',
    ko: 'Korean', zh: 'Chinese', hi: 'Hindi', id: 'Indonesian',
  }
  return map[base] ?? tag.toUpperCase()
}

const DURATION_BUCKETS = [
  { label: 'Shorts  ≤ 1 min',    min: 0,    max: 60   },
  { label: 'Short   1–5 min',    min: 61,   max: 300  },
  { label: 'Medium  5–20 min',   min: 301,  max: 1200 },
  { label: 'Long    20–60 min',  min: 1201, max: 3600 },
  { label: 'Very long  > 1 hr',  min: 3601, max: Infinity },
]

function contentAgeBucket(ageMs: number): string {
  const days = ageMs / 86_400_000
  if (days <  1)   return 'Same day'
  if (days <  7)   return '< 1 week'
  if (days <  30)  return '1 week – 1 month'
  if (days <  180) return '1 – 6 months'
  if (days <  365) return '6 – 12 months'
  if (days < 1095) return '1 – 3 years'
  return '3+ years'
}

const AGE_BUCKET_ORDER = [
  'Same day', '< 1 week', '1 week – 1 month',
  '1 – 6 months', '6 – 12 months', '1 – 3 years', '3+ years',
]

export function computeEnrichedStats(
  entries: WatchEntry[],
  metadata: Map<string, VideoMetadata>,
): EnrichedStats {
  const fetchable = entries.filter((e) => !e.isDeleted && !e.isShort && e.videoId).length

  let totalWatchTime = 0
  let confirmedShorts = 0
  let confirmedVideos = 0
  let enrichedCount = 0

  const categoryMap  = new Map<string, CategoryStat>()
  const catMonthMap  = new Map<string, Map<string, number>>()
  const wtMonthMap   = new Map<string, number>()
  const langMap      = new Map<string, number>()
  const durationCounts = DURATION_BUCKETS.map(() => 0)
  const ageMap       = new Map<string, number>()

  for (const entry of entries) {
    if (entry.isDeleted) continue
    const meta = metadata.get(entry.videoId)
    if (!meta) continue

    enrichedCount++
    const dur = meta.durationSeconds
    const isShort = dur > 0 && dur <= 60

    if (isShort) {
      confirmedShorts++
    } else {
      confirmedVideos++
      totalWatchTime += dur

      // Category
      const catId = meta.categoryId || 'unknown'
      const catLabel = CATEGORY_LABELS[catId] ?? 'Unknown'
      const existing = categoryMap.get(catId)
      if (existing) {
        existing.count++
        existing.watchTimeSeconds += dur
      } else {
        categoryMap.set(catId, { id: catId, label: catLabel, count: 1, watchTimeSeconds: dur })
      }

      // Category by month
      const monthKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`
      const catMonth = catMonthMap.get(monthKey) ?? new Map<string, number>()
      catMonth.set(catId, (catMonth.get(catId) ?? 0) + 1)
      catMonthMap.set(monthKey, catMonth)

      // Watch time by month
      wtMonthMap.set(monthKey, (wtMonthMap.get(monthKey) ?? 0) + dur)

      // Duration bucket
      const bucketIdx = DURATION_BUCKETS.findIndex((b) => dur >= b.min && dur <= b.max)
      if (bucketIdx >= 0) durationCounts[bucketIdx]! ++

      // Content age
      if (meta.publishedAt) {
        const age = entry.date.getTime() - new Date(meta.publishedAt).getTime()
        const bucket = contentAgeBucket(Math.max(0, age))
        ageMap.set(bucket, (ageMap.get(bucket) ?? 0) + 1)
      }
    }

    // Language (all videos, not just non-shorts)
    const lang = normaliseLanguage(meta.language ?? '')
    langMap.set(lang, (langMap.get(lang) ?? 0) + 1)
  }

  const byCategory = [...categoryMap.values()].sort((a, b) => b.count - a.count)

  const byCategoryByMonth = [...catMonthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cats]) => ({
      month,
      cats: Object.fromEntries(cats),
    }))

  const watchTimeByMonth = [...wtMonthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, seconds]) => ({ month, seconds }))

  const byLanguage = [...langMap.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)

  const durationBuckets = DURATION_BUCKETS.map((b, i) => ({
    label: b.label,
    count: durationCounts[i]!,
  }))

  const contentAgeBuckets = AGE_BUCKET_ORDER.map((label) => ({
    label,
    count: ageMap.get(label) ?? 0,
  }))

  return {
    enrichedCount,
    coveragePct: fetchable > 0 ? Math.round((enrichedCount / fetchable) * 100) : 0,
    totalWatchTimeSeconds: totalWatchTime,
    avgDurationSeconds: confirmedVideos > 0 ? Math.round(totalWatchTime / confirmedVideos) : 0,
    confirmedShortCount: confirmedShorts,
    confirmedVideoCount: confirmedVideos,
    byCategory,
    byCategoryByMonth,
    watchTimeByMonth,
    byLanguage,
    durationBuckets,
    contentAgeBuckets,
  }
}

export function formatWatchTime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
