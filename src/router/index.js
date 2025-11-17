import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import  tokenManager from '@/utils/token-manager'

// 页面组件懒加载导入 - 优化首屏加载性能
const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/auth/Login.vue')
const OAuth2Callback = () => import('@/views/auth/OAuth2Callback.vue')
const Signup = () => import('@/views/auth/Signup.vue')
const Article = () => import('@/views/Article.vue')
const Publish = () => import('@/views/Publish.vue')
const Profile = () => import('@/views/Profile.vue')
const Portfolio = () => import('@/views/Portfolio.vue')
const PortfolioDetail = () => import('@/views/PortfolioDetail.vue')
const Favorites = () => import('@/views/Favorites.vue')
const Tags = () => import('@/views/Tags.vue')
const TagArticles = () => import('@/views/TagArticles.vue')
const Search = () => import('@/views/Search.vue')
const Settings = () => import('@/views/Settings.vue')
const Drafts = () => import('@/views/Drafts.vue')
const Messages = () => import('@/views/Messages.vue')
const AiChat = () => import('@/views/AiChat.vue')
const JavaGuide = () => import('@/views/JavaGuide.vue')
const NotFound = () => import('@/views/error/NotFound.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: 'Lumi Hive' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', requiresGuest: true }
  },
  {
    path: '/callback',
    name: 'OAuth2Callback',
    component: OAuth2Callback,
    meta: { title: 'OAuth2回调' }
  },
  {
    path: '/signup', 
    name: 'Signup',
    component: Signup,
    meta: { title: '注册', requiresGuest: true }
  },
  {
    path: '/article/:slug',
    name: 'Article',
    component: Article,
    meta: { title: '文章详情' },
    props: true
  },
  {
    path: '/publish',
    name: 'Publish',
    component: Publish,
    meta: { title: '发布文章', requiresAuth: true }
  },
  {
    path: '/profile/:name?',
    name: 'Profile',
    component: Profile,
    meta: { title: '个人中心' },
    props: true
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: Portfolio,
    meta: { title: '作品集' }
  },
  {
    path: '/portfolio/:id',
    name: 'PortfolioDetail',
    component: PortfolioDetail,
    meta: { title: '作品集详情' },
    props: true
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: Favorites,
    meta: { title: '收藏夹', requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: Tags,
    meta: { title: '标签' }
  },
  {
    path: '/tags/:tagName',
    name: 'TagArticles',
    component: TagArticles,
    meta: { title: '标签文章' },
    props: true
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: { title: '搜索结果' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '设置', requiresAuth: true }
  },
  {
    path: '/drafts',
    name: 'Drafts',
    component: Drafts,
    meta: { title: '草稿箱', requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages,
    meta: { title: '私信', requiresAuth: true }
  },
  {
    path: '/ai-chat',
    name: 'AiChat',
    component: AiChat,
    meta: { title: 'AI对话中心', requiresAuth: true }
  },
  {
    path: '/java-guide',
    name: 'JavaGuide',
    component: JavaGuide,
    meta: { title: 'Java学习指导', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash }
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 尝试从本地 Token 恢复用户状态（避免刷新页面后状态丢失导致的 API 等待）
  const token = tokenManager.getToken()
  
  // 如果本地有 Token 但 Store 中没有用户信息
  if (token && !authStore.user) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        // 解析 JWT Payload (处理 Base64Url 编码和中文乱码)
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        
        const payload = JSON.parse(jsonPayload)
        
        // 构造并恢复用户状态
        authStore.setUser({
          id: payload.userId || payload.sub,
          name: payload.username,
          avatarUrl: payload.avatarUrl || '', // Token中可能不包含头像，给个默认空值
          token: token
        })
      }
    } catch (e) {
      console.warn('路由守卫中 Token 解析失败，将执行清理:', e)
      // Token 格式不对或已损坏，清理掉以免死循环
      tokenManager.removeToken()
      authStore.setUser(null)
    }
  }
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Lumi Hive` : 'Lumi Hive'
  
  // 检查当前路由是否是登录或注册页面
  const isAuthPage = to.name === 'Login' || to.name === 'Signup'
  
  // 检查用户是否已认证
  const isAuthenticated = authStore.isAuthenticated
  
  // 如果用户未认证且需要认证的页面，先尝试检查认证状态
  if (!isAuthenticated && to.meta.requiresAuth) {
    // 避免重复检查，如果已经在检查中，直接重定向
    if (authStore.isLoading) {
      next({ 
        name: 'Login', 
        query: { redirect: to.fullPath } 
      })
      return
    }
    
    try {
      // 尝试从后端检查认证状态
      const authStatus = await authStore.checkAuthStatus()
      if (authStatus) {
        // 认证成功，继续导航
        next()
        return
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
    }
    
    // 认证失败，重定向到登录页
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    })
    return
  }
  
  // 如果是游客页面(登录/注册)，但用户已认证，则重定向到首页
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Home' })
    return
  }
  
  next()
})

export default router
