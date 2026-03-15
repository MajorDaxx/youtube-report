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

const props = defineProps<{ data: number[] }>()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.data.map((_, i) => `${String(i).padStart(2, '0')}:00`),
  datasets: [
    {
      data: props.data,
      backgroundColor: props.data.map((_, i) => {
        // highlight prime-time hours
        if (i >= 18 && i <= 23) return '#ef4444cc'
        if (i >= 12 && i < 18) return '#f97316cc'
        return '#6b7280cc'
      }),
      borderRadius: 4,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: '#374151' },
      ticks: { color: '#9ca3af', font: { size: 10 } },
      title: { display: true, text: 'Hour of day', color: '#6b7280', font: { size: 11 } },
    },
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
