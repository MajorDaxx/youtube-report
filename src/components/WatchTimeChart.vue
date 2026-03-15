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
  data: { month: string; seconds: number }[]
}>()

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtMonth(yyyymm: string): string {
  const [year, mon] = yyyymm.split('-')
  return `${MONTH_NAMES[Number(mon) - 1]} '${year!.slice(2)}`
}

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.data.map((d) => fmtMonth(d.month)),
  datasets: [
    {
      data: props.data.map((d) => Math.round(d.seconds / 3600)),
      backgroundColor: '#3b82f6cc',
      borderRadius: 6,
    },
  ],
}))

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${(ctx.parsed.y as number).toLocaleString()} h`,
      },
    },
  },
  scales: {
    x: { grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
    y: {
      grid: { color: '#374151' },
      ticks: { color: '#9ca3af' },
      title: { display: true, text: 'Hours', color: '#6b7280', font: { size: 11 } },
    },
  },
}
</script>

<template>
  <Bar :data="chartData" :options="options" />
</template>
