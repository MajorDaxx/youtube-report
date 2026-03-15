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
import { GENRE_COLORS, type Genre } from '@/utils/classifyGenre'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: { genre: Genre; count: number }[]
}>()

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.data.map((d) => d.genre),
  datasets: [
    {
      data: props.data.map((d) => d.count),
      backgroundColor: props.data.map((d) => GENRE_COLORS[d.genre]),
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
