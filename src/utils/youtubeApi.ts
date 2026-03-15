import type { Genre } from './classifyGenre'

export interface VideoMetadata {
  durationSeconds: number
  categoryId: string
  publishedAt: string
  language: string    // defaultAudioLanguage ?? defaultLanguage ?? ''
}

export function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (Number(m[1] ?? 0) * 3600) + (Number(m[2] ?? 0) * 60) + Number(m[3] ?? 0)
}

// Map YouTube category IDs → our Genre type
export const CATEGORY_TO_GENRE: Record<string, Genre> = {
  '1':  'Film & TV',               // Film & Animation
  '2':  'Other',                   // Autos & Vehicles
  '10': 'Music',                   // Music
  '15': 'Other',                   // Pets & Animals
  '17': 'Sports',                  // Sports
  '18': 'Film & TV',               // Short Movies
  '19': 'Other',                   // Travel & Events
  '20': 'Gaming',                  // Gaming
  '21': 'Comedy & Entertainment',  // Videoblogging
  '22': 'Comedy & Entertainment',  // People & Blogs
  '23': 'Comedy & Entertainment',  // Comedy
  '24': 'Comedy & Entertainment',  // Entertainment
  '25': 'News & Politics',         // News & Politics
  '26': 'Education',               // Howto & Style
  '27': 'Education',               // Education
  '28': 'Science & Tech',          // Science & Technology
  '29': 'Other',                   // Nonprofits & Activism
}

interface YtApiItem {
  id: string
  contentDetails: { duration: string }
  snippet: { categoryId: string; publishedAt: string; defaultLanguage?: string; defaultAudioLanguage?: string }
}

const BATCH_SIZE = 50
const CONCURRENCY = 10

interface BatchItem extends VideoMetadata {
  id: string
}

async function fetchOneBatch(ids: string[], apiKey: string): Promise<BatchItem[]> {
  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=contentDetails,snippet` +
    `&id=${ids.join(',')}` +
    `&key=${encodeURIComponent(apiKey)}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `YouTube API error ${res.status}`)
  }
  const data = (await res.json()) as { items?: YtApiItem[] }
  return (data.items ?? []).map((item) => ({
    id: item.id,
    durationSeconds: parseDuration(item.contentDetails.duration),
    categoryId: item.snippet.categoryId,
    publishedAt: item.snippet.publishedAt,
    language: item.snippet.defaultAudioLanguage ?? item.snippet.defaultLanguage ?? '',
  }))
}

export async function fetchVideoMetadata(
  videoIds: string[],
  apiKey: string,
  onProgress: (done: number, total: number) => void,
): Promise<Map<string, VideoMetadata>> {
  const unique = [...new Set(videoIds.filter(Boolean))]

  const chunks: string[][] = []
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    chunks.push(unique.slice(i, i + BATCH_SIZE))
  }

  const total = unique.length
  const result = new Map<string, VideoMetadata>()
  let done = 0
  let firstError: Error | null = null

  // Worker pool — CONCURRENCY workers drain the shared queue in parallel
  const queue = [...chunks]
  async function worker() {
    while (queue.length > 0) {
      const chunk = queue.shift()
      if (!chunk) break
      try {
        const items = await fetchOneBatch(chunk, apiKey)
        for (const item of items) {
          const { id, ...meta } = item
          result.set(id, meta)
        }
      } catch (e) {
        if (!firstError) firstError = e instanceof Error ? e : new Error(String(e))
      }
      done += chunk.length
      onProgress(Math.min(done, total), total)
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker))

  // Guarantee progress reaches 100% even if last batch errored
  onProgress(total, total)

  if (firstError) throw firstError
  return result
}
