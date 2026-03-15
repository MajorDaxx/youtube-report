<script setup lang="ts">
import { computed } from 'vue'
import { useWatchHistoryStore } from '@/stores/watchHistory'
import MonthlyChart from '@/components/MonthlyChart.vue'
import HourChart from '@/components/HourChart.vue'
import DayOfWeekChart from '@/components/DayOfWeekChart.vue'

const store = useWatchHistoryStore()

const s = computed(() => store.stats!)

const dateFrom = computed(() =>
  s.value.dateRange.from.toLocaleDateString('en', { dateStyle: 'medium' })
)
const dateTo = computed(() =>
  s.value.dateRange.to.toLocaleDateString('en', { dateStyle: 'medium' })
)

const daysSpan = computed(() => {
  const ms = s.value.dateRange.to.getTime() - s.value.dateRange.from.getTime()
  return Math.ceil(ms / 86_400_000)
})

const avgPerDay = computed(() =>
  (s.value.totalCount / daysSpan.value).toFixed(1)
)

const deletedPct = computed(() =>
  ((s.value.deletedCount / s.value.totalCount) * 100).toFixed(1)
)

const shortPct = computed(() =>
  ((s.value.estimatedShortCount / s.value.totalCount) * 100).toFixed(1)
)

const topChannels = computed(() => s.value.byChannel.slice(0, 15))

const peakHour = computed(() => {
  const max = Math.max(...s.value.byHour)
  const h = s.value.byHour.indexOf(max)
  return `${String(h).padStart(2, '0')}:00`
})

const peakDay = computed(() => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const max = Math.max(...s.value.byDayOfWeek)
  return days[s.value.byDayOfWeek.indexOf(max)]
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">

    <!-- ── Phase 1: HTML-only stats ───────────────────────────────────── -->

    <!-- KPI row -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-1">
          <p class="text-gray-400 text-xs uppercase tracking-wide">Videos Watched</p>
          <p class="text-3xl font-bold text-white">{{ s.totalCount.toLocaleString() }}</p>
        </div>
      </UCard>
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-1">
          <p class="text-gray-400 text-xs uppercase tracking-wide">Period</p>
          <p class="text-lg font-semibold">{{ daysSpan }} days</p>
          <p class="text-gray-500 text-xs">{{ dateFrom }} – {{ dateTo }}</p>
        </div>
      </UCard>
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-1">
          <p class="text-gray-400 text-xs uppercase tracking-wide">Avg / Day</p>
          <p class="text-3xl font-bold text-white">{{ avgPerDay }}</p>
        </div>
      </UCard>
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-1">
          <p class="text-gray-400 text-xs uppercase tracking-wide">Shorts (est.)</p>
          <p class="text-3xl font-bold text-white">{{ s.estimatedShortCount.toLocaleString() }}</p>
          <p class="text-gray-500 text-xs">{{ shortPct }}% · via #shorts tag</p>
        </div>
      </UCard>
      <UCard class="bg-gray-900 border-gray-800">
        <div class="space-y-1">
          <p class="text-gray-400 text-xs uppercase tracking-wide">Deleted</p>
          <p class="text-3xl font-bold text-white">{{ s.deletedCount.toLocaleString() }}</p>
          <p class="text-gray-500 text-xs">{{ deletedPct }}% of total</p>
        </div>
      </UCard>
    </div>

    <!-- Monthly activity -->
    <UCard class="bg-gray-900 border-gray-800">
      <template #header>
        <h2 class="font-semibold text-white">Monthly Activity</h2>
      </template>
      <div class="h-56">
        <MonthlyChart :data="s.byMonth" />
      </div>
    </UCard>

    <!-- Top channels + rewatched -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h2 class="font-semibold text-white">Top Channels</h2>
        </template>
        <div class="space-y-2">
          <div
            v-for="(ch, i) in topChannels"
            :key="ch.name"
            class="flex items-center gap-3"
          >
            <span class="text-gray-600 text-xs w-5 text-right">{{ i + 1 }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-200 truncate">{{ ch.name }}</span>
                <span class="text-xs text-gray-400 ml-2 shrink-0">{{ ch.count }}</span>
              </div>
              <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-red-500 rounded-full"
                  :style="{ width: `${(ch.count / (topChannels[0]?.count ?? 1)) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h2 class="font-semibold text-white">Most Rewatched</h2>
        </template>
        <div class="space-y-2">
          <div
            v-for="(v, i) in s.topRewatched.slice(0, 10)"
            :key="v.videoId"
            class="flex items-start gap-3"
          >
            <span class="text-gray-600 text-xs w-5 text-right pt-0.5 shrink-0">{{ i + 1 }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-200 truncate leading-snug">{{ v.videoTitle }}</p>
              <p class="text-xs text-gray-500">
                {{ v.channelName }}
                <span class="text-gray-700 mx-1">·</span>
                <span class="text-red-400 font-medium">{{ v.count }}×</span>
              </p>
            </div>
          </div>
          <p v-if="s.topRewatched.length === 0" class="text-sm text-gray-500 italic">
            No rewatched videos found.
          </p>
        </div>
      </UCard>
    </div>

    <!-- Hour + Day of week -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-white">Time of Day</h2>
            <UBadge variant="soft" color="error">Peak: {{ peakHour }}</UBadge>
          </div>
        </template>
        <div class="h-48">
          <HourChart :data="s.byHour" />
        </div>
      </UCard>

      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-white">Day of Week</h2>
            <UBadge variant="soft" color="error">Peak: {{ peakDay }}</UBadge>
          </div>
        </template>
        <div class="h-48">
          <DayOfWeekChart :data="s.byDayOfWeek" />
        </div>
      </UCard>
    </div>

  </div>
</template>
