<script setup lang="ts">
import { useWatchHistoryStore } from '@/stores/watchHistory'

const store = useWatchHistoryStore()
</script>

<template>
  <div class="h-[calc(100vh-53px)] flex flex-col">
    <UAlert
      v-if="!store.originalHtmlUrl"
      color="warning"
      variant="soft"
      icon="i-lucide-info"
      class="m-4"
      title="Original file not available"
      description="The original HTML is only available in the current session. Re-upload the file to view it."
    />
    <iframe
      v-else
      :src="store.originalHtmlUrl"
      class="flex-1 w-full border-0"
      sandbox="allow-same-origin"
      title="Original Wiedergabeverlauf.html"
    />
  </div>
</template>
