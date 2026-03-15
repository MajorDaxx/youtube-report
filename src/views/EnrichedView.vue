<script setup lang="ts">
import { computed } from 'vue'
import { useVideoMetadataStore } from '@/stores/videoMetadata'
import YouTubeApiPanel from '@/components/YouTubeApiPanel.vue'
import CategoryChart from '@/components/CategoryChart.vue'
import CategoryOverTimeChart from '@/components/CategoryOverTimeChart.vue'
import WatchTimeChart from '@/components/WatchTimeChart.vue'
import DurationDistributionChart from '@/components/DurationDistributionChart.vue'
import ContentAgeChart from '@/components/ContentAgeChart.vue'
import LanguageChart from '@/components/LanguageChart.vue'
import MoreDataInfo from '@/components/MoreDataInfo.vue'
import { formatWatchTime } from '@/utils/enrichedStats'

const metaStore = useVideoMetadataStore()
const e = computed(() => metaStore.enrichedStats)
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">

    <!-- API fetch panel always shown at top -->
    <YouTubeApiPanel />

    <!-- Enriched charts — only after successful fetch -->
    <template v-if="e">

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-gray-800" />
        <span class="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
          API-enriched insights
        </span>
        <div class="flex-1 h-px bg-gray-800" />
      </div>

      <!-- Enriched KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UCard class="bg-gray-900 border-gray-800">
          <div class="space-y-1">
            <p class="text-gray-400 text-xs uppercase tracking-wide">Total Watch Time</p>
            <p class="text-3xl font-bold text-blue-400">{{ formatWatchTime(e.totalWatchTimeSeconds) }}</p>
            <p class="text-gray-500 text-xs">excl. Shorts</p>
          </div>
        </UCard>
        <UCard class="bg-gray-900 border-gray-800">
          <div class="space-y-1">
            <p class="text-gray-400 text-xs uppercase tracking-wide">Avg Video Length</p>
            <p class="text-3xl font-bold text-blue-400">
              {{ Math.round(e.avgDurationSeconds / 60) }} min
            </p>
          </div>
        </UCard>
        <UCard class="bg-gray-900 border-gray-800">
          <div class="space-y-1">
            <p class="text-gray-400 text-xs uppercase tracking-wide">Confirmed Shorts</p>
            <p class="text-3xl font-bold text-purple-400">{{ e.confirmedShortCount.toLocaleString() }}</p>
            <p class="text-gray-500 text-xs">duration ≤ 60 s</p>
          </div>
        </UCard>
        <UCard class="bg-gray-900 border-gray-800">
          <div class="space-y-1">
            <p class="text-gray-400 text-xs uppercase tracking-wide">API Coverage</p>
            <p class="text-3xl font-bold text-green-400">{{ e.coveragePct }}%</p>
            <p class="text-gray-500 text-xs">{{ e.enrichedCount.toLocaleString() }} videos enriched</p>
          </div>
        </UCard>
      </div>

      <!-- Watch time by month -->
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h2 class="font-semibold text-white">Watch Time by Month</h2>
        </template>
        <div class="h-56">
          <WatchTimeChart :data="e.watchTimeByMonth" />
        </div>
      </UCard>

      <!-- Category over time -->
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <div class="space-y-1">
            <h2 class="font-semibold text-white">Category Mix Over Time</h2>
            <p class="text-xs text-gray-500">
              Categories are assigned by YouTube and retrieved via the Data API
              (<code class="text-gray-400">videos.list?part=snippet</code> → <code class="text-gray-400">snippet.categoryId</code>).
              They reflect the category the uploader selected, not an automated classification.
            </p>
          </div>
        </template>
        <div class="h-72">
          <CategoryOverTimeChart :data="e.byCategoryByMonth" />
        </div>
      </UCard>

      <!-- Category + Language -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard class="bg-gray-900 border-gray-800">
          <template #header>
            <h2 class="font-semibold text-white">Category Breakdown</h2>
          </template>
          <div class="h-64">
            <CategoryChart :data="e.byCategory" />
          </div>
        </UCard>

        <UCard class="bg-gray-900 border-gray-800">
          <template #header>
            <h2 class="font-semibold text-white">Language Distribution</h2>
          </template>
          <div class="h-64">
            <LanguageChart :data="e.byLanguage" />
          </div>
        </UCard>
      </div>

      <!-- Duration distribution + Content age -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard class="bg-gray-900 border-gray-800">
          <template #header>
            <h2 class="font-semibold text-white">Video Length Distribution</h2>
          </template>
          <div class="h-56">
            <DurationDistributionChart :data="e.durationBuckets" />
          </div>
        </UCard>

        <UCard class="bg-gray-900 border-gray-800">
          <template #header>
            <h2 class="font-semibold text-white">Content Age When Watched</h2>
          </template>
          <div class="h-56">
            <ContentAgeChart :data="e.contentAgeBuckets" />
          </div>
        </UCard>
      </div>

    </template>

    <!-- More data info always shown -->
    <MoreDataInfo />

  </div>
</template>
