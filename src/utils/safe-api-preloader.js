// 安全的API预加载工具
import request from '@/api/config'

export class SafeAPIPreloader {
  constructor() {
    this.preloadedAPIs = new Set()
    this.init()
  }

  init() {
    // 预加载关键API数据
    this.preloadCriticalAPIs()
  }

  preloadCriticalAPIs() {
    // 使用统一的API基础URL配置
    const baseURL = request.defaults.baseURL
    const criticalAPIs = [
      `${baseURL}/home`,
      `${baseURL}/tags`
    ]

    criticalAPIs.forEach(api => {
      this.preloadAPI(api)
    })
  }

  preloadAPI(url) {
    if (this.preloadedAPIs.has(url)) return

    // 使用fetch预加载API数据
    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }).then(response => {
      if (response.ok) {
        this.preloadedAPIs.add(url)
        console.log(`API预加载成功: ${url}`)
      }
    }).catch(error => {
      console.log(`API预加载失败: ${url}`, error)
    })
  }
}

// 创建全局实例
export const safeAPIPreloader = new SafeAPIPreloader()
