import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/main.scss'
import toastPlugin from '@/plugins/toast'

// 添加最小化的性能优化 - 只做最安全的优化
import { minimalImageOptimization } from '@/utils/minimal-image-optimization'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(toastPlugin)

app.mount('#app')
