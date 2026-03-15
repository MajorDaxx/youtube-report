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
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  data: { label: string; count: number }[]
}>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.data.map((d) => d.label),
  datasets: [
    {
      data: props.data.map((d) => d.count),
      backgroundColor: '#06b6d4cc',
      borderRadius: 6,
      borderWidth: 0,
    },
  ],
}))

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
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
