<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoMetadataStore } from '@/stores/videoMetadata'
import { useWatchHistoryStore } from '@/stores/watchHistory'
import { CATEGORY_LABELS } from '@/utils/enrichedStats'
import { formatDuration } from '@/utils/enrichedStats'

const metaStore = useVideoMetadataStore()
const watchStore = useWatchHistoryStore()

const search = ref('')
const page = ref(1)
const PAGE_SIZE = 50

// Build a title/channel lookup from entries (first occurrence per videoId)
const entryInfo = computed(() => {
  const map = new Map<string, { title: string; channel: string }>()
  for (const e of watchStore.entries) {
    if (e.videoId && !map.has(e.videoId)) {
      map.set(e.videoId, { title: e.videoTitle, channel: e.channelName })
    }
  }
  return map
})

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  const result = []
  for (const [id, meta] of metaStore.metadata) {
    const info = entryInfo.value.get(id)
    const title = info?.title ?? ''
    const channel = info?.channel ?? ''
    if (q && !id.includes(q) && !title.toLowerCase().includes(q) && !channel.toLowerCase().includes(q)) continue
    result.push({ id, title, channel, meta })
  }
  return result
})

const totalPages = computed(() => Math.ceil(rows.value.length / PAGE_SIZE))

const pageRows = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return rows.value.slice(start, start + PAGE_SIZE)
})

function onSearch() { page.value = 1 }

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en', { dateStyle: 'medium' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-4">

    <div v-if="metaStore.metadata.size === 0" class="text-center py-24 space-y-2">
      <UIcon name="i-lucide-database" class="w-10 h-10 text-gray-700 mx-auto" />
      <p class="text-gray-500">No metadata fetched yet. Use the <strong class="text-gray-400">Deep Dive</strong> tab to fetch it.</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Search by title, channel or video ID…"
          icon="i-lucide-search"
          class="flex-1 min-w-56"
          @update:model-value="onSearch"
        />
        <span class="text-gray-400 text-sm shrink-0">
          {{ rows.length.toLocaleString() }} / {{ metaStore.metadata.size.toLocaleString() }} entries
        </span>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-lg border border-gray-800">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wide">
              <th class="px-3 py-2 font-medium">#</th>
              <th class="px-3 py-2 font-medium">Video</th>
              <th class="px-3 py-2 font-medium">Duration</th>
              <th class="px-3 py-2 font-medium">Category</th>
              <th class="px-3 py-2 font-medium">Published</th>
              <th class="px-3 py-2 font-medium">Language</th>
              <th class="px-3 py-2 font-medium">ID</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/60">
            <tr
              v-for="(row, i) in pageRows"
              :key="row.id"
              class="hover:bg-gray-900/50 transition-colors"
            >
              <td class="px-3 py-2 text-gray-600 tabular-nums w-10">
                {{ (page - 1) * PAGE_SIZE + i + 1 }}
              </td>
              <td class="px-3 py-2 max-w-xs">
                <p class="text-gray-100 truncate leading-snug">{{ row.title || '—' }}</p>
                <p class="text-gray-500 text-xs truncate">{{ row.channel }}</p>
              </td>
              <td class="px-3 py-2 text-gray-300 tabular-nums whitespace-nowrap">
                {{ row.meta.durationSeconds > 0 ? formatDuration(row.meta.durationSeconds) : '—' }}
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                <span v-if="row.meta.categoryId" class="text-gray-300">
                  {{ CATEGORY_LABELS[row.meta.categoryId] ?? row.meta.categoryId }}
                </span>
                <span v-else class="text-gray-600">—</span>
              </td>
              <td class="px-3 py-2 text-gray-400 whitespace-nowrap tabular-nums">
                {{ fmtDate(row.meta.publishedAt) }}
              </td>
              <td class="px-3 py-2 text-gray-400 whitespace-nowrap">
                {{ row.meta.language || '—' }}
              </td>
              <td class="px-3 py-2">
                <a
                  :href="`https://www.youtube.com/watch?v=${row.id}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-mono text-xs text-gray-500 hover:text-blue-400 transition-colors"
                >{{ row.id }}</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
        <UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-chevron-left"
          :disabled="page === 1" @click="page--" />
        <span class="text-sm text-gray-400">{{ page }} / {{ totalPages }}</span>
        <UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-chevron-right"
          :disabled="page === totalPages" @click="page++" />
      </div>
    </template>
  </div>
</template>
