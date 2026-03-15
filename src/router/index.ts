import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import EnrichedView from '@/views/EnrichedView.vue'
import VideosView from '@/views/VideosView.vue'
import OriginalView from '@/views/OriginalView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/enriched', component: EnrichedView },
    { path: '/videos', component: VideosView },
    { path: '/original', component: OriginalView },
  ],
})
