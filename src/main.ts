import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'
import { router } from '@/router'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(ui)
app.use(router)

app.mount('#app')
