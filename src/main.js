import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/main.scss'
import toastPlugin from '@/plugins/toast'

// 导入性能优化工具
import { initImageOptimization } from '@/utils/imageOptimizer'
import { initResourcePreloading } from '@/utils/resourcePreloader'
import { initPerformanceMonitoring, initVisibilityPerformanceMonitoring, initUnloadPerformanceMonitoring } from '@/utils/performanceMonitor'
import { performanceMonitor } from '@/utils/performance'
import { criticalCSS } from '@/utils/critical-css'
import { resourcePreloader } from '@/utils/resource-preloader'
import { codeSplitting } from '@/utils/code-splitting'

// 立即内联关键CSS - 必须在其他资源加载前
criticalCSS.inlineCriticalCSS()

// 初始化性能优化
initImageOptimization()
initResourcePreloading()
initPerformanceMonitoring()
initVisibilityPerformanceMonitoring()
initUnloadPerformanceMonitoring()

// 初始化性能监控
performanceMonitor.initWebVitals()
performanceMonitor.observeResourceTiming()
performanceMonitor.observeLongTasks()

// 初始化资源预加载
resourcePreloader.init()

// 初始化代码分割
codeSplitting.init()

const app = createApp(App)

app.use(store)
app.use(router)
app.use(toastPlugin)

app.mount('#app')
