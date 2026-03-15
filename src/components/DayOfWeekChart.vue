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

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: days,
  datasets: [
    {
      data: props.data,
      backgroundColor: props.data.map((_, i) =>
        i >= 5 ? '#ef4444cc' : '#6b7280cc'
      ),
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
