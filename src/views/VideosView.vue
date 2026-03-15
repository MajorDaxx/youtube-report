<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWatchHistoryStore } from '@/stores/watchHistory'

const store = useWatchHistoryStore()

const search = ref('')
const selectedFilter = ref<'All' | 'Shorts' | 'Videos' | 'Deleted'>('All')
const page = ref(1)
const PAGE_SIZE = 50

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.entries.filter((e) => {
    if (selectedFilter.value === 'Deleted' && !e.isDeleted) return false
    if (selectedFilter.value === 'Shorts' && !e.isShort) return false
    if (selectedFilter.value === 'Videos' && (e.isShort || e.isDeleted)) return false
    if (q && !e.videoTitle.toLowerCase().includes(q) && !e.channelName.toLowerCase().includes(q)) return false
    return true
  })
})

const totalPages = computed(() => Math.ceil(filtered.value.length / PAGE_SIZE))

const pageItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

function onFilterChange() {
  page.value = 1
}

function formatDate(d: Date) {
  return d.toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })
}

const filterOptions = [
  { label: 'All', value: 'All' },
  { label: 'Videos only', value: 'Videos' },
  { label: 'Shorts only', value: 'Shorts' },
  { label: 'Deleted', value: 'Deleted' },
]

const noEntries = computed(() => store.entries.length === 0)
</script>

<template>
  <div class="max-w-5xl mx-auto px-6 py-8 space-y-4">
    <!-- Filters -->
    <div class="flex items-center gap-3 flex-wrap">
      <UInput
        v-model="search"
        placeholder="Search by title or channel…"
        icon="i-lucide-search"
        class="flex-1 min-w-48"
        @update:model-value="onFilterChange"
      />
      <USelect
        v-model="selectedFilter"
        :options="filterOptions"
        option-attribute="label"
        value-attribute="value"
        class="w-40"
        @update:model-value="onFilterChange"
      />
      <span class="text-gray-400 text-sm shrink-0">
        {{ filtered.length.toLocaleString() }} videos
      </span>
    </div>

    <!-- No entries notice -->
    <UAlert
      v-if="noEntries"
      color="warning"
      variant="soft"
      icon="i-lucide-info"
      title="Individual videos not available"
      description="Video entries are only available in the current session. Re-upload the file to browse all videos."
    />

    <!-- List -->
    <div v-else class="space-y-0.5">
      <div
        v-for="(entry, i) in pageItems"
        :key="i"
        class="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-900 transition-colors group"
      >
        <span class="text-gray-600 text-xs w-8 text-right pt-0.5 shrink-0">
          {{ (page - 1) * PAGE_SIZE + i + 1 }}
        </span>

        <!-- Status dot -->
        <div
          class="w-2 h-2 rounded-full mt-2 shrink-0"
          :class="entry.isDeleted ? 'bg-red-600' : entry.isShort ? 'bg-purple-500' : 'bg-gray-600'"
        />

        <div class="flex-1 min-w-0">
          <p v-if="entry.isDeleted" class="text-sm text-gray-500 italic leading-snug">
            Video deleted / unavailable
            <span class="text-gray-600 text-xs ml-1 not-italic">{{ entry.videoId }}</span>
          </p>
          <p v-else class="text-sm text-gray-100 leading-snug truncate">
            {{ entry.videoTitle }}
          </p>
          <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span v-if="!entry.isDeleted">
              {{ entry.channelName }}<span class="mx-1 text-gray-700">·</span>
            </span>
            <span
              v-if="entry.isDeleted"
              class="inline-block px-1 py-0.5 rounded text-xs bg-red-500/20 text-red-400"
            >Deleted</span>
            <span
              v-else-if="entry.isShort"
              class="inline-block px-1 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400"
            >Short</span>
            <span v-if="!entry.isDeleted && !entry.isShort"
              class="inline-block px-1 py-0.5 rounded text-xs bg-gray-700/60 text-gray-400"
            >Video</span>
            <span class="text-gray-700">·</span>
            {{ formatDate(entry.date) }}
          </p>
        </div>

        <a
          v-if="entry.videoUrl"
          :href="entry.videoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300 mt-1 shrink-0"
        >
          <UIcon name="i-lucide-external-link" class="w-4 h-4" />
        </a>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
      <UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-chevron-left"
        :disabled="page === 1" @click="page--" />
      <span class="text-sm text-gray-400">{{ page }} / {{ totalPages }}</span>
      <UButton size="sm" variant="ghost" color="neutral" icon="i-lucide-chevron-right"
        :disabled="page === totalPages" @click="page++" />
    </div>
  </div>
</template>
