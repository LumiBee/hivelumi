import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/main.scss'
import toastPlugin from '@/plugins/toast'

// 安全地添加性能优化工具
import { safeImageOptimization } from '@/utils/safe-image-optimization'
import { advancedPreloader } from '@/utils/advanced-preloader'

// 初始化安全的图片优化
safeImageOptimization.preloadCriticalImages()

// 初始化高级预加载
advancedPreloader.preloadAPIData([
  'https://api.hivelumi.com/api/home',
  'https://api.hivelumi.com/api/tags'
])

const app = createApp(App)

app.use(store)
app.use(router)
app.use(toastPlugin)

app.mount('#app')
