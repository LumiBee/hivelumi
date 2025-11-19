import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import './assets/styles/main.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import toastPlugin from '@/plugins/toast';

// 添加性能优化工具
import { minimalImageOptimization } from '@/utils/minimal-image-optimization'
import { safeAPIPreloader } from '@/utils/safe-api-preloader'
import { smartPreloader } from '@/utils/smart-preloader'
import { imageOptimizer } from '@/utils/image-optimizer'
import { performanceMonitor } from '@/utils/advanced-performance'

import '@vercel/speed-insights/vue';
import { inject as injectAnalytics } from '@vercel/analytics';

// Vercel Web Analytics
injectAnalytics();

const app = createApp(App)

app.use(store)
app.use(router)
app.use(toastPlugin)

app.mount('#app')
