import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/main.scss'
import toastPlugin from '@/plugins/toast'

// 添加性能优化工具
import { minimalImageOptimization } from '@/utils/minimal-image-optimization'
import { safeAPIPreloader } from '@/utils/safe-api-preloader'
import { smartPreloader } from '@/utils/smart-preloader'
import { imageOptimizer } from '@/utils/image-optimizer'
import { performanceMonitor } from '@/utils/advanced-performance'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(toastPlugin)

app.mount('#app')
