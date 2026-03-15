<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartData,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  data: { label: string; count: number }[]
}>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.data.map((d) => {
    const [year, month] = d.label.split('-')
    return new Date(Number(year), Number(month) - 1).toLocaleString('en', {
      month: 'short',
      year: '2-digit',
    })
  }),
  datasets: [
    {
      data: props.data.map((d) => d.count),
      backgroundColor: '#ef4444cc',
      borderRadius: 6,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
    y: {
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
