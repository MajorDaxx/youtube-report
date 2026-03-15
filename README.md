# YouTube Report

A browser-only single-page app that visualises your YouTube watch history from a Google Takeout export. No server, no uploads — all data stays in your browser.

## Getting started

```bash
npm install
npm run dev
```

Upload the file at:
```
Takeout/YouTube und YouTube Music/Verlauf/Wiedergabeverlauf.html
```
(German locale Takeout; the path name varies by language but the HTML structure is the same.)

---

## Data model

### Phase 1 — HTML-only

Parsed directly from the Takeout HTML file. No API key required.

#### `WatchEntry`
```ts
interface WatchEntry {
  videoId:     string   // extracted from the watch URL query param ?v=
  videoTitle:  string   // link text; empty string if video is deleted
  videoUrl:    string   // full https://www.youtube.com/watch?v=… URL
  channelName: string   // second <a> in the cell; empty if deleted
  channelUrl:  string
  date:        Date     // parsed from German timestamp "DD.MM.YYYY, HH:MM:SS"
  isDeleted:   boolean  // true when link text is the raw URL, not a title
  isShort:     boolean  // estimated: true if title matches /#shorts?\b/i
}
```

**Deleted videos** — when YouTube removes a video the Takeout entry keeps the watch timestamp and URL but replaces the title with the raw URL string. These entries have `isDeleted: true`, an empty `videoTitle`, and are excluded from channel/rewatch stats.

**Shorts detection (Phase 1)** — `isShort` is set by checking whether the title contains `#shorts` or `#short`. This is a heuristic; the definitive flag comes from Phase 2.

#### `WatchStats`
Derived from all entries by `buildStats()` in `src/utils/parseWatchHistory.ts`:

| Field | Type | Description |
|---|---|---|
| `totalCount` | `number` | Total entries including deleted |
| `deletedCount` | `number` | Entries with `isDeleted: true` |
| `estimatedShortCount` | `number` | Entries where `isShort: true` (hashtag-based) |
| `dateRange` | `{ from: Date; to: Date }` | Earliest and latest watch timestamp |
| `byChannel` | `{ name, count }[]` | Sorted by count desc, deleted excluded |
| `byDayOfWeek` | `number[7]` | Index 0 = Monday … 6 = Sunday |
| `byHour` | `number[24]` | Count per hour of day |
| `byMonth` | `{ label: string; count: number }[]` | `label` = `"YYYY-MM"`, sorted asc |
| `byDate` | `{ date: string; count: number }[]` | ISO date string `"YYYY-MM-DD"`, sorted asc |
| `topRewatched` | `{ videoId, videoTitle, channelName, count }[]` | Top 20 videos watched more than once |

---

### Phase 2 — YouTube Data API v3 enrichment

Requires a YouTube Data API v3 key. Fetches `videos.list?part=contentDetails,snippet` for every non-deleted, non-short video in the history.

#### `VideoMetadata`
```ts
interface VideoMetadata {
  durationSeconds: number   // parsed from ISO 8601 duration (PT4M13S → 253)
  categoryId:      string   // YouTube category ID ("27" = Education, etc.)
  publishedAt:     string   // ISO 8601 upload date
  language:        string   // defaultAudioLanguage ?? defaultLanguage ?? ''
}
```

Stored in `metadata: Map<string, VideoMetadata>` keyed by `videoId`.

**Definitive Shorts detection** — after enrichment, any video with `durationSeconds > 0 && durationSeconds <= 60` has its `WatchEntry.isShort` updated to `true`. This overrides the hashtag estimate and is the authoritative value. `WatchStats` is rebuilt after this update.

#### `EnrichedStats`
Computed by `computeEnrichedStats()` in `src/utils/enrichedStats.ts` from enriched entries:

| Field | Description |
|---|---|
| `enrichedCount` | Videos with API metadata |
| `coveragePct` | `enrichedCount / fetchable * 100` (fetchable = non-deleted, non-short) |
| `totalWatchTimeSeconds` | Sum of durations, Shorts excluded |
| `avgDurationSeconds` | Mean duration, Shorts excluded |
| `confirmedShortCount` | Videos with `durationSeconds ≤ 60` |
| `confirmedVideoCount` | Enriched non-shorts |
| `byCategory` | `{ id, label, count, watchTimeSeconds }[]` sorted by count desc |
| `byCategoryByMonth` | Stacked category counts per month |
| `watchTimeByMonth` | Total watch seconds per month |
| `byLanguage` | `{ language, count }[]` — `de-DE` → `German`, etc. |
| `durationBuckets` | Five buckets: ≤1 min / 1–5 / 5–20 / 20–60 / >60 min |
| `contentAgeBuckets` | Age of video at watch time: same day → 3+ years |

---

## Fetching logic

### Batch fetcher (`src/utils/youtubeApi.ts`)

- Deduplicates all video IDs with `Set` before fetching
- Splits into chunks of **50 IDs** (YouTube API maximum per request)
- Runs **10 concurrent worker coroutines** draining a shared queue
- Each batch takes ~300–400 ms; 10 concurrent → ~1 300 IDs/second throughput
- Progress is reported after each batch; `onProgress(total, total)` is called once after all workers finish to guarantee 100%
- Per-batch errors are caught and stored; remaining batches continue; first error is rethrown after all workers complete

### Cache layer (`src/stores/videoMetadata.ts`)

`metadata: Map<string, VideoMetadata>` is persisted to `localStorage` (`yt-report-metadata`) as a JSON array of `[id, meta]` pairs.

On each `enrichAll()` call:
1. Filter entries in scope (non-deleted, non-short, valid `videoId`)
2. **Skip IDs already in `metadata`** — only new IDs are sent to the API
3. If zero new IDs remain, skip the API call entirely
4. Merge new results into `metadata` and persist to `localStorage`

This means the first full fetch is the only expensive one. Subsequent calls (including after page reload) are instant for already-cached videos.

### Post-fetch computation (Web Worker)

After the API fetch and `isShort` update, two CPU-intensive operations run **off the main thread** in `src/workers/statsWorker.ts`:

1. `buildStats(entries)` — rebuilds all `WatchStats` aggregates (6 passes over ~56K entries)
2. `computeEnrichedStats(entries, metadata)` — computes `EnrichedStats`

The worker receives `entries` and `metadata` via structured clone, computes both results, strips `entries` from the returned `WatchStats` (main thread already has them), and posts back `{ stats, enrichedStats }`. The main thread stays fully responsive during computation.

---

## Persistence

| Store | Key | Contents |
|---|---|---|
| `localStorage` | `yt-report-stats` | Serialised `WatchStats` (no entries), file name |
| `localStorage` | `yt-report-metadata` | `[id, VideoMetadata][]` pairs |
| `localStorage` | `yt-report-enriched` | Serialised `EnrichedStats` |
| `localStorage` | `yt-report-apikey` | YouTube API key |
| `IndexedDB` | `yt-report` / `entries` | Full `WatchEntry[]` array |
| `IndexedDB` | `yt-report` / `html` | Original HTML `Blob` |

On startup, `WatchStats` is restored from `localStorage` synchronously (instant KPIs). `WatchEntry[]` and the HTML blob are restored from IndexedDB in the background (`loadingEntries` spinner shown in nav).

---

## Views

| Route | Description |
|---|---|
| `/` | **Dashboard** — Phase 1 charts: monthly activity, top channels, most rewatched, time-of-day, day-of-week |
| `/enriched` | **Deep Dive** — YouTube API panel + Phase 2 charts (watch time, categories, language, duration distribution, content age). Blue dot in nav when enriched data is loaded. |
| `/videos` | **Videos** — paginated, filterable list of all entries (All / Videos / Shorts / Deleted) |
| `/original` | **Original** — sandboxed iframe of the raw Takeout HTML |

---

## What data is NOT available

- **Watch duration per video** — YouTube does not expose how long you personally watched each video through any public API
- **Discovery source** — no API reveals whether you found a video via search, subscription feed, or recommendations
- **Audience retention / completion rate** — YouTube Analytics only covers your *own* channel's videos

Data that *is* fetchable but not yet implemented: `videos.list?part=statistics` (view/like counts), `channels.list?part=statistics` (subscriber counts), `Suchverlauf.html` (search history cross-reference).
