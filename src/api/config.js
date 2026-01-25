import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import { getSafeUserFromStorage } from '@/utils/bigint-helper'
import tokenManager from '@/utils/token-manager'

// 获取API基础URL（带混合内容防护）
const getApiBaseUrl = () => {
  let envApiUrl = import.meta.env.VITE_API_URL

  // 规范化：若存在环境变量，统一补齐 /api 并在 HTTPS 页面上强制 https 协议
  if (envApiUrl) {
    // 补 /api
    if (!envApiUrl.includes('/api')) {
      envApiUrl = `${envApiUrl.replace(/\/$/, '')}/api`
    }

    // 如果当前页面是 https，且 env 是 http，则自动升级为 https，避免 Mixed Content
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && envApiUrl.startsWith('http://')) {
      envApiUrl = envApiUrl.replace('http://', 'https://')
    }

    return envApiUrl
  }

  // 开发环境默认
  if (import.meta.env.DEV) {
    return 'http://localhost:8090/api'
  }

  // Preview模式：使用相对路径，让vite代理处理
  if (import.meta.env.MODE === 'preview') {
    return '/api'
  }

  // 生产环境：使用当前域名下的API路径，避免CORS问题
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = window.location.port ? `:${window.location.port}` : ''
    return `${protocol}//${hostname}${port}/api`
  }

  // 备用方案：使用默认域名
  return 'https://api.hivelumi.com/api'
}

// 创建axios实例
const request = axios.create({
  baseURL: getApiBaseUrl(), // 后端API地址（已包含/api前缀）
  timeout: 600000, // 请求超时时间增加到10分钟（AI生成长内容需要更长时间）
  // 同时兼容 Bearer Token 与 Cookie Session（生产环境常见跨子域部署）
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json'
  },
  // 添加重试配置
  retry: 3, // 重试次数
  retryDelay: 1000 // 重试间隔（毫秒）
})

request.interceptors.request.use(
  config => {
    // 从 tokenManager 获取 token
    const token = tokenManager.getToken(); //
    if (token) {
      // 如果 token 存在，则添加到 Authorization 请求头
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从本地存储中获取用户信息，如果存在则添加JWT认证头
    const storedUser = getSafeUserFromStorage()

    if (storedUser && storedUser.token) {
      config.headers['Authorization'] = `Bearer ${storedUser.token}`
    }
    // 如果标记为已登录但没有token，则打印一次提示，便于线上排查
    else if (storedUser && !storedUser.token) {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('__warn_no_token_once')) {
        console.warn('[Auth] 用户存在但缺少 token，已启用 withCredentials 走 Cookie 模式。若后端不使用 Cookie，请确保登录响应返回 token 字段。')
        sessionStorage.setItem('__warn_no_token_once', '1')
      }
    }

    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 直接返回响应数据，不做额外处理
    return response.data
  },
  async error => {
    console.error('响应错误：', error)

    // 实现请求重试逻辑
    const config = error.config;

    // 如果配置了重试，且未设置重试计数器，则初始化计数器
    if (config && config.retry && !config._retryCount) {
      config._retryCount = 0;
    }

    // 检查是否可以重试
    if (config && config.retry && config._retryCount < config.retry) {
      config._retryCount++;

      console.log(`请求重试中 (${config._retryCount}/${config.retry}): ${config.url}`);

      // 创建新的Promise来处理重试延迟
      return new Promise(resolve => {
        setTimeout(() => {
          console.log(`重试请求: ${config.url}`);
          resolve(axios(config));
        }, config.retryDelay || 1000);
      });
    }

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          console.error('请求参数错误：', data)
          break
        case 401:
          // 未登录或认证过期
          console.error('认证失败：', data)

          // 对于登录请求，我们不重定向，而是在页面上显示错误信息
          if (error.config.url.includes('/login')) {
            return Promise.reject({
              status,
              message: '用户名或密码错误',
              data
            })
          }

          // 对于其他请求，处理 token 过期
          try {
            const authStore = useAuthStore()

            // 只要收到401，无论当前状态如何，都清除登录信息
            if (authStore.isAuthenticated) {
              console.warn('检测到 token 过期，正在清除用户状态...')

              // 显示用户友好的过期提示
              if (window.$toast) {
                window.$toast.warning('登录已过期，请重新登录')
              } else {
                console.warn('登录已过期，请重新登录')
              }

              // 完整清除登录状态（包括token）
              await authStore.logout()

              // 立即跳转到登录页，保存当前路径以便登录后返回
              setTimeout(() => {
                if (window.$router) {
                  const currentPath = window.$router.currentRoute.value.fullPath
                  window.$router.push({
                    path: '/login',
                    query: currentPath !== '/' && currentPath !== '/login'
                      ? { redirect: currentPath }
                      : {}
                  })
                } else {
                  // 备用方案：直接跳转
                  window.location.href = '/login'
                }
              }, 1500) // 稍微延迟让用户看到提示
            }
          } catch (logoutError) {
            console.error('清除用户信息失败:', logoutError)
            // 即使出错也要确保清除本地存储
            try {
              localStorage.removeItem('hive_auth_user')
              tokenManager.removeToken()
            } catch (e) {
              console.error('强制清除本地存储失败:', e)
            }
            // 强制跳转到登录页
            setTimeout(() => {
              window.location.href = '/login'
            }, 1500)
          }
          break
        case 403:
          console.error('权限不足：', data)
          break
        case 404:
          console.error('请求的资源不存在：', data)
          break
        case 500:
          console.error('服务器内部错误：', data)
          break
        default:
          console.error(`HTTP错误 ${status}：`, data)
      }

      // 返回格式化的错误信息
      return Promise.reject({
        status,
        message: data?.message || `HTTP错误 ${status}`,
        data
      })
    } else if (error.request) {
      // 网络错误
      console.error('网络错误：', error.message)
      return Promise.reject({
        status: 0,
        message: '网络连接失败，请检查您的网络',
        data: null
      })
    } else {
      // 其他错误
      console.error('未知错误：', error.message)
      return Promise.reject({
        status: -1,
        message: error.message || '未知错误',
        data: null
      })
    }
  }
)

export default request
