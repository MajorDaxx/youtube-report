# Potentials & Known Issues

A candid review of what works, what's incomplete, and what could be added.

---

## Dead Code — Safe to Delete

| File | Reason |
|---|---|
| `src/components/GenreChart.vue` | Never imported anywhere; depends on classifyGenre |
| `src/components/GenreOverTimeChart.vue` | Never imported anywhere; same dependency |
| `src/utils/classifyGenre.ts` | All exports (classifyGenre, GENRE_COLORS, Genre) are completely unused |
| `src/stores/counter.ts` | Vite scaffold boilerplate; no references |

The genre classification system was replaced by the official YouTube `categoryId` from the API, but the old files were never removed.

---

## Data Computed but Not Shown

These fields exist in the data model and are populated correctly, but no view renders them.

### `WatchStats.byDate`
Populated in `buildStats()` — full daily time series (ISO date → count). Could power:
- A calendar heatmap (like GitHub's contribution graph)
- "Busiest single day" KPI
- Weekly streak analysis

### `topRewatched` truncated at 10
Top 20 rewatched videos are computed, but `DashboardView` slices to 10. The remaining 10 are silently discarded. A dedicated section or separate view would surface them.

### `EnrichedStats.confirmedVideoCount`
Computed and logged but never shown in the UI. Would make a useful KPI next to `confirmedShortCount`.

### `EnrichedStats.watchTimeSeconds` per category
`byCategory` includes `watchTimeSeconds` per category but the `CategoryChart` only uses `count`. A toggle between "by views" and "by watch time" would add depth.

---

## Features That Are Natural Next Steps

### Daily Activity Heatmap
`byDate` already contains every day's watch count. A calendar heatmap would immediately answer "which weeks/seasons do I watch the most?" — similar to GitHub's contribution graph.

### Full Channel Analytics
`byChannel` is already sorted by count and shown in a top-15 bar list. Missing:
- Watch **time** per channel (needs API enrichment)
- Channel trend over time (did you start or stop watching a channel?)
- Ability to see channels beyond position 15

### Rewatched Videos View
`topRewatched` with count is computed. A dedicated view with sorting (by count, by date last watched) and a frequency distribution chart would be valuable.

### Deleted Video Analysis
`deletedCount` is shown as a KPI but never broken down. Useful questions:
- How many deleted videos per month?
- Which channels had the most deletions?
- What % of each month's watches are now gone?

### Search History Cross-Reference
The Takeout ZIP also contains `Suchverlauf.html` (search history). Parsing it and cross-referencing with watch timestamps could answer: "What did I search for before watching this?" The `MoreDataInfo` panel already mentions this as possible.

### Video Statistics (view/like counts)
`videos.list?part=statistics` returns `viewCount`, `likeCount`, `commentCount` per video at no extra quota cost (just add `statistics` to the existing `part=` parameter). Could show: "You tend to watch videos with X average views."

### Channel Subscriber Counts
`channels.list?part=statistics` gives subscriber counts. Useful for visualising whether you prefer large or niche creators.

### API Key Validation
The API key is saved and used without any test call. An invalid key is only discovered after initiating a full fetch run. A cheap single-ID test call on save would give immediate feedback.

---

## Bugs & Edge Cases

### Division by Zero in Avg/Day KPI
`DashboardView` line ~27: `s.value.totalCount / daysSpan.value` — if the entire history spans a single day, `daysSpan` is 0, and the result is `NaN`, which renders as `"NaN"` in the UI. Should guard with `Math.max(1, daysSpan.value)`.

### Peak Day Tie Not Handled
`byDayOfWeek.indexOf(max)` returns the *first* day with the maximum count. If Monday and Friday are both equally the peak, Monday always "wins" silently.

### Zero-Duration Videos Not Classified
`parseDuration()` returns `0` on a parse failure or a genuinely unknown duration. The short detection check is `dur > 0 && dur <= 60`, so a video with `durationSeconds: 0` is silently classified as a regular video even though its status is unknown. These should be flagged separately.

### Videos Returning No API Result
When a video is private or deleted at fetch time, the YouTube API simply omits it from `items[]`. There is no per-ID error tracking — the video silently gets no metadata. Currently there is no way to tell the difference between "not fetched yet" and "fetched but returned nothing."

### Shorts Status After API Failure
If the enrichment fetch fails partway through, `WatchEntry.isShort` values are partially updated based on duration, and `buildStats` + `computeEnrichedStats` still run in the worker on the partial result. The enriched stats are then saved and shown as complete. There should be a warning when coverage falls significantly below 100%.

### Data Staleness After Re-Upload
If the user uploads a new watch-history file, the `metadata` Map in localStorage remains from the previous file. The video IDs may partially overlap (coincidence) or not at all. There is no "cache belongs to file X" check — stale enriched stats can be shown for a new file.

---

## UX Gaps

### No Export
All stats and metadata are computed in-browser with no way to get the data out. A CSV download of the metadata table or enriched stats (e.g., watch time by month) would be useful.

### Progress Bar on Cache Hit
When all IDs are already cached, `fetchProgress` jumps to `1/1` instantly with no visual distinction from an actual API call. A "Loaded from cache" message instead of the progress bar would be less confusing.

### No Download for Original File
`OriginalView` shows the HTML in a sandboxed iframe but offers no way to download the blob back to disk. A download button using the stored `Blob` URL would be straightforward.

### Metadata Table Missing Watch Count
`MetadataView` shows per-video API fields but not how many times the video was watched. This is directly available by counting entries per `videoId` and would be the most immediately useful column in that table.

### "Show Deleted" Default
`VideosView` hides deleted entries by default (checkbox opt-in). Deleted videos are ~8% of entries. This is a reasonable default but there is no count shown of how many are hidden — the entry count changing when the checkbox is toggled can surprise users.

---

## Code Quality Notes

### `store.stats!` Non-Null Assertion
`DashboardView` and `EnrichedView` use `store.stats!`. They are protected by a `v-if` guard in `App.vue`, but the coupling is implicit. If the guard is ever moved or removed, these views will throw at runtime.

### Hardcoded Colours
Chart colours are hardcoded hex strings scattered across components (`'#ef4444cc'`, `'#3b82f6cc'`, etc.) rather than drawn from a shared palette. Changes require hunting across multiple files.

### `peakDay` Index Assumption
`days[s.value.byDayOfWeek.indexOf(max)]` — if `indexOf` returns `-1` (impossible here, but if the array were empty), this would return `undefined` and render as an empty badge rather than crashing visibly.

### Partial IndexedDB Failure
If IndexedDB restore fails (storage quota, browser restriction), `loadingEntries` is cleared, `entries` stays empty, and the user sees no error — the Videos tab just shows the "Re-upload" notice. There is no notification that persistence failed.

### Two Separate Entry Loops in Worker
`statsWorker.ts` calls `buildStats()` then `computeEnrichedStats()` sequentially — each does a full pass over all entries. They share no intermediate result. For 56K+ entries this is two full O(n) sweeps; a single fused pass would halve the work.

---

## Architecture Observations

### Genre System Half-Removed
`CATEGORY_TO_GENRE` in `youtubeApi.ts` maps YouTube `categoryId` values to a 10-value `Genre` type, but `Genre` comes from `classifyGenre.ts` which is otherwise dead. The mapping exists in the API file but is never used. Either wire it up to the enriched stats pipeline or remove it alongside `classifyGenre.ts`.

### Three-Tier Storage Has No Sync
Stats live in `localStorage`, entries in `IndexedDB`, and the blob in `IndexedDB`. If any layer fails or is cleared independently (e.g., browser clears IndexedDB but not localStorage), the app shows KPIs from old stats with empty entries in the Videos tab — a confusing inconsistent state with no recovery path.

### No File Identity Tracking
The file name is stored (`yt-report-stats → fileName`) but no hash or entry count is stored alongside the metadata cache. There is no way to detect that a different file was uploaded since the last enrichment run.
