<script setup lang="ts">
import { useWatchHistoryStore } from '@/stores/watchHistory'
import { useVideoMetadataStore } from '@/stores/videoMetadata'
import { useRoute } from 'vue-router'

const store = useWatchHistoryStore()
const metaStore = useVideoMetadataStore()
const route = useRoute()

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'i-lucide-layout-dashboard' },
  { to: '/enriched', label: 'Deep Dive', icon: 'i-lucide-sparkles' },
  { to: '/metadata', label: 'Metadata', icon: 'i-lucide-table' },
  { to: '/videos', label: 'Videos', icon: 'i-lucide-list-video' },
  { to: '/original', label: 'Original', icon: 'i-lucide-file-code' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white flex flex-col">
    <header class="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <UIcon name="i-simple-icons-youtube" class="text-red-500 w-6 h-6" />
          <span class="font-bold text-white">YouTube Report</span>
        </div>
        <nav class="flex items-center gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            :class="route.path === item.to
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'"
          >
            <UIcon :name="item.icon" class="w-4 h-4" />
            {{ item.label }}
            <span
              v-if="item.to === '/enriched' && metaStore.hasEnriched"
              class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
            />
          </RouterLink>
        </nav>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="store.loadingEntries" class="flex items-center gap-1.5 text-gray-500 text-xs">
          <UIcon name="i-lucide-loader-circle" class="w-3.5 h-3.5 animate-spin" />
          Restoring…
        </div>
        <span v-else-if="store.fileName" class="text-gray-500 text-xs hidden sm:block">{{ store.fileName }}</span>
        <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-upload" @click="store.reset()">
          New file
        </UButton>
      </div>
    </header>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>
