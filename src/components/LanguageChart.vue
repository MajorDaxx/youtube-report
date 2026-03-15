<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const LANG_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

const props = defineProps<{
  data: { language: string; count: number }[]
}>()

// Show top 9 + "Other"
const displayed = computed(() => {
  const sorted = [...props.data].sort((a, b) => b.count - a.count)
  if (sorted.length <= 10) return sorted
  const top = sorted.slice(0, 9)
  const otherCount = sorted.slice(9).reduce((acc, d) => acc + d.count, 0)
  return [...top, { language: 'Other', count: otherCount }]
})

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: displayed.value.map((d) => d.language),
  datasets: [
    {
      data: displayed.value.map((d) => d.count),
      backgroundColor: displayed.value.map((_, i) => LANG_COLORS[i % LANG_COLORS.length]!),
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
}))

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#9ca3af',
        font: { size: 12 },
        padding: 12,
        boxWidth: 12,
        boxHeight: 12,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0)
          const pct = ((ctx.parsed / total) * 100).toFixed(1)
          return ` ${ctx.parsed.toLocaleString()} videos (${pct}%)`
        },
      },
    },
  },
}
</script>

<template>
  <Doughnut :data="chartData" :options="options" />
</template>
