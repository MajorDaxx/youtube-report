export interface WatchEntry {
  videoId: string
  videoTitle: string
  videoUrl: string
  channelName: string
  channelUrl: string
  date: Date
  isDeleted: boolean
  isShort: boolean   // estimated via #shorts hashtag — confirmed only after API enrichment
}

export interface WatchStats {
  entries: WatchEntry[]
  totalCount: number
  deletedCount: number
  estimatedShortCount: number   // #shorts tag only — not definitive
  dateRange: { from: Date; to: Date }
  byChannel: { name: string; count: number }[]
  byDayOfWeek: number[]         // 0 = Mon … 6 = Sun
  byHour: number[]              // 0–23
  byMonth: { label: string; count: number }[]
  byDate: { date: string; count: number }[]
  topRewatched: { videoId: string; videoTitle: string; channelName: string; count: number }[]
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

function parseGermanDate(raw: string): Date | null {
  const m = raw.match(/(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2}):(\d{2})/)
  if (!m) return null
  const [, day, month, year, hour, min, sec] = m
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`)
}

function extractVideoId(url: string): string {
  return url.match(/[?&]v=([^&]+)/)?.[1] ?? ''
}

function detectShort(title: string): boolean {
  return /#shorts?\b/i.test(title)
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseWatchHistoryHtml(html: string): WatchStats {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const cells = doc.querySelectorAll(
    '.content-cell.mdl-cell--6-col.mdl-typography--body-1',
  )

  const entries: WatchEntry[] = []

  for (const cell of cells) {
    const links = cell.querySelectorAll('a')
    const videoLink = links[0]
    if (!videoLink) continue

    const videoUrl = videoLink.getAttribute('href') ?? ''
    if (!videoUrl.includes('/watch')) continue

    const linkText = videoLink.textContent?.trim() ?? ''
    const isDeleted = linkText.startsWith('https://')

    const channelLink = links[1]
    const rawText = cell.textContent ?? ''
    const dateMatch = rawText.match(/(\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2})/)
    if (!dateMatch?.[1]) continue

    const date = parseGermanDate(dateMatch[1])
    if (!date) continue

    const videoTitle = isDeleted ? '' : linkText

    entries.push({
      videoId: extractVideoId(videoUrl),
      videoTitle,
      videoUrl,
      channelName: isDeleted ? '' : (channelLink?.textContent?.trim() ?? ''),
      channelUrl: channelLink?.getAttribute('href') ?? '',
      date,
      isDeleted,
      isShort: !isDeleted && detectShort(videoTitle),
    })
  }

  return buildStats(entries)
}

export function buildStats(entries: WatchEntry[]): WatchStats {
  const empty: WatchStats = {
    entries: [],
    totalCount: 0,
    deletedCount: 0,
    estimatedShortCount: 0,
    dateRange: { from: new Date(), to: new Date() },
    byChannel: [],
    byDayOfWeek: Array(7).fill(0),
    byHour: Array(24).fill(0),
    byMonth: [],
    byDate: [],
    topRewatched: [],
  }
  if (!entries.length) return empty

  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return empty

  // Channel counts
  const channelMap = new Map<string, number>()
  for (const e of entries) {
    if (!e.isDeleted && e.channelName) {
      channelMap.set(e.channelName, (channelMap.get(e.channelName) ?? 0) + 1)
    }
  }
  const byChannel = [...channelMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Day of week (0 = Mon)
  const byDayOfWeek = Array(7).fill(0)
  for (const e of entries) byDayOfWeek[(e.date.getDay() + 6) % 7]++

  // Hour
  const byHour = Array(24).fill(0)
  for (const e of entries) byHour[e.date.getHours()]++

  // By month
  const monthMap = new Map<string, number>()
  for (const e of entries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
  }
  const byMonth = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({ label, count }))

  // By date
  const dateMap = new Map<string, number>()
  for (const e of entries) {
    const key = e.date.toISOString().slice(0, 10)
    dateMap.set(key, (dateMap.get(key) ?? 0) + 1)
  }
  const byDate = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  // Rewatch: entries with same videoId appearing more than once
  const rewatchMap = new Map<string, { videoTitle: string; channelName: string; count: number }>()
  for (const e of entries) {
    if (!e.videoId || e.isDeleted) continue
    const existing = rewatchMap.get(e.videoId)
    if (existing) {
      existing.count++
    } else {
      rewatchMap.set(e.videoId, { videoTitle: e.videoTitle, channelName: e.channelName, count: 1 })
    }
  }
  const topRewatched = [...rewatchMap.entries()]
    .filter(([, v]) => v.count > 1)
    .map(([videoId, v]) => ({ videoId, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    entries,
    totalCount: entries.length,
    deletedCount: entries.filter((e) => e.isDeleted).length,
    estimatedShortCount: entries.filter((e) => e.isShort).length,
    dateRange: { from: first.date, to: last.date },
    byChannel,
    byDayOfWeek,
    byHour,
    byMonth,
    byDate,
    topRewatched,
  }
}
