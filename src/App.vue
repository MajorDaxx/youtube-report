<script setup lang="ts">
import { useWatchHistoryStore } from '@/stores/watchHistory'
import UploadView from '@/views/UploadView.vue'
import AppLayout from '@/components/AppLayout.vue'

const store = useWatchHistoryStore()
</script>

<template>
  <UApp>
    <UploadView v-if="!store.hasData" />
    <AppLayout v-else>
      <RouterView />
    </AppLayout>
  </UApp>
</template>
