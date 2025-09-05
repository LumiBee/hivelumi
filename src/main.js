import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/main.scss'
import toastPlugin from '@/plugins/toast'

// 暂时移除性能优化工具，确保基本功能正常

const app = createApp(App)

app.use(store)
app.use(router)
app.use(toastPlugin)

app.mount('#app')
