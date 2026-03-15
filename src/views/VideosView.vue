<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWatchHistoryStore } from '@/stores/watchHistory'

const store = useWatchHistoryStore()

const search = ref('')
const showDeleted = ref(false)
const page = ref(1)
const PAGE_SIZE = 50

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.entries.filter((e) => {
    if (!showDeleted.value && e.isDeleted) return false
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
      <label class="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
        <UCheckbox v-model="showDeleted" @update:model-value="onFilterChange" />
        Show deleted
      </label>
      <span class="text-gray-400 text-sm shrink-0">
        {{ filtered.length.toLocaleString() }} entries
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
            {{ formatDate(entry.date) }}
          </p>
        </div>

        <a
          v-if="entry.videoUrl && !entry.isDeleted"
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
