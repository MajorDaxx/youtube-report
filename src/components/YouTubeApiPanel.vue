<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoMetadataStore } from '@/stores/videoMetadata'
import { useWatchHistoryStore } from '@/stores/watchHistory'

const metaStore = useVideoMetadataStore()
const watchStore = useWatchHistoryStore()

const keyInput = ref(metaStore.apiKey)
const showKey = ref(false)

function saveKey() {
  metaStore.saveApiKey(keyInput.value.trim())
}

const scopeCount = computed(() =>
  watchStore.entries.filter((e) => !e.isDeleted && !e.isShort && !!e.videoId).length
)

const alreadyCachedCount = computed(() =>
  watchStore.entries.filter(
    (e) => !e.isDeleted && !e.isShort && metaStore.metadata.has(e.videoId),
  ).length,
)

const skippedShorts = computed(() => watchStore.entries.filter((e) => e.isShort).length)

const progress = computed(() =>
  metaStore.fetchTotal > 0
    ? Math.round((metaStore.fetchProgress / metaStore.fetchTotal) * 100)
    : 0,
)

const canFetch = computed(
  () => !!metaStore.apiKey && !metaStore.fetching && watchStore.entries.length > 0,
)


</script>

<template>
  <UCard class="bg-gray-900 border-gray-800 overflow-visible">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-database" class="w-4 h-4 text-gray-400" />
          <h2 class="font-semibold text-white">Enrich with YouTube API</h2>
        </div>
        <UBadge v-if="metaStore.enrichedCount > 0" variant="soft" color="success">
          {{ metaStore.enrichedCount.toLocaleString() }} cached
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-gray-400 text-sm">
        Fetches video duration and category from YouTube. Genre is then derived from official
        YouTube categories. Video IDs are sent to Google's API.
      </p>

      <!-- Stats row -->
      <div v-if="watchStore.entries.length" class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-gray-800 rounded-lg p-3">
          <p class="text-white font-semibold">{{ scopeCount.toLocaleString() }}</p>
          <p class="text-gray-500 text-xs mt-0.5">To fetch</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
          <p class="text-gray-400 font-semibold">{{ skippedShorts.toLocaleString() }}</p>
          <p class="text-gray-500 text-xs mt-0.5">Shorts skipped</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
          <p class="text-green-400 font-semibold">{{ alreadyCachedCount.toLocaleString() }}</p>
          <p class="text-gray-500 text-xs mt-0.5">Cached</p>
        </div>
      </div>

      <!-- API key -->
      <div class="flex gap-2">
        <UInput
          v-model="keyInput"
          :type="showKey ? 'text' : 'password'"
          placeholder="AIza…"
          class="flex-1 font-mono text-sm"
          @keyup.enter="saveKey"
        />
        <UButton
          variant="ghost"
          color="neutral"
          :icon="showKey ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          @click="showKey = !showKey"
        />
        <UButton variant="outline" color="neutral" @click="saveKey">Save</UButton>
      </div>

      <!-- Progress -->
      <div v-if="metaStore.fetching || (metaStore.fetchTotal > 0 && metaStore.fetchProgress === metaStore.fetchTotal)" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ metaStore.fetching ? 'Fetching…' : 'Done' }}</span>
          <span class="text-gray-400 tabular-nums">
            {{ metaStore.fetchProgress.toLocaleString() }} / {{ metaStore.fetchTotal.toLocaleString() }}
            ({{ progress }}%)
          </span>
        </div>
        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="metaStore.fetching ? 'bg-red-500' : 'bg-green-500'"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <UAlert
        v-if="metaStore.fetchError"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :description="metaStore.fetchError"
      />

      <div class="flex gap-2">
        <UButton
          color="error"
          :disabled="!canFetch"
          :loading="metaStore.fetching"
          icon="i-lucide-download"
          @click="metaStore.enrichAll()"
        >
          {{ !watchStore.entries.length ? 'Re-upload file first' : 'Fetch metadata' }}
        </UButton>
        <UButton
          v-if="metaStore.enrichedCount > 0"
          variant="ghost"
          color="neutral"
          icon="i-lucide-trash-2"
          :disabled="metaStore.fetching"
          @click="metaStore.clearMetadata()"
        >
          Clear cache
        </UButton>
      </div>
    </div>
  </UCard>
</template>
