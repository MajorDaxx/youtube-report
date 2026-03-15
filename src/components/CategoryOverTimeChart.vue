<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/utils/enrichedStats'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{
  data: { month: string; cats: Record<string, number> }[]
}>()

// Collect all category IDs that appear, sorted by total descending
const allCats = computed((): string[] => {
  const totals = new Map<string, number>()
  for (const row of props.data) {
    for (const [id, n] of Object.entries(row.cats)) {
      totals.set(id, (totals.get(id) ?? 0) + n)
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
})

const labels = computed(() =>
  props.data.map((d) => {
    const [year, month] = d.month.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleString('en', {
      month: 'short',
      year: '2-digit',
    })
  }),
)

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: labels.value,
  datasets: allCats.value.map((id) => ({
    label: CATEGORY_LABELS[id] ?? id,
    data: props.data.map((row) => row.cats[id] ?? 0),
    backgroundColor: CATEGORY_COLORS[id] ?? '#6b7280',
    borderWidth: 0,
  })),
}))

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#9ca3af',
        font: { size: 11 },
        padding: 10,
        boxWidth: 12,
        boxHeight: 12,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { color: '#374151' },
      ticks: { color: '#9ca3af' },
    },
    y: {
      stacked: true,
      grid: { color: '#374151' },
      ticks: { color: '#9ca3af' },
      title: { display: true, text: 'Videos', color: '#6b7280', font: { size: 11 } },
    },
  },
}
</script>

<template>
  <Bar :data="chartData" :options="options" />
</template>
