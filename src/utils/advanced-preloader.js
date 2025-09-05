// 高级资源预加载工具
export class AdvancedPreloader {
  constructor() {
    this.preloadedResources = new Set()
    this.init()
  }

  init() {
    // 立即预加载关键资源
    this.preloadCriticalResources()
    
    // 智能预加载基于用户行为
    this.setupIntelligentPreloading()
  }

  preloadCriticalResources() {
    const criticalResources = [
      // 关键API端点
      { url: 'https://api.hivelumi.com/api/home', type: 'fetch' },
      { url: 'https://api.hivelumi.com/api/tags', type: 'fetch' },
      
      // 关键图片
      { url: '/img/logo.png', type: 'image' },
      { url: '/img/bg.jpg', type: 'image' },
      
      // 关键字体
      { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2', type: 'font', mimeType: 'font/woff2' },
      { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-brands-400.woff2', type: 'font', mimeType: 'font/woff2' }
    ]

    criticalResources.forEach(resource => {
      this.preloadResource(resource)
    })
  }

  preloadResource({ url, type, mimeType }) {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = type
    
    if (mimeType) {
      link.type = mimeType
    }
    
    if (type === 'fetch' || type === 'font') {
      link.crossOrigin = 'anonymous'
    }

    document.head.appendChild(link)
    this.preloadedResources.add(url)
  }

  setupIntelligentPreloading() {
    // 预加载基于路由的组件
    this.preloadRouteComponents()
    
    // 预加载基于用户交互的资源
    this.setupInteractionBasedPreloading()
  }

  preloadRouteComponents() {
    const routeComponents = {
      '/': ['Home'],
      '/tags': ['Tags'],
      '/portfolio': ['Portfolio'],
      '/favorites': ['Favorites'],
      '/profile': ['Profile'],
      '/settings': ['Settings'],
      '/publish': ['Publish']
    }

    // 预加载首页相关组件
    const homeComponents = routeComponents['/'] || []
    homeComponents.forEach(component => {
      this.preloadComponent(component)
    })
  }

  preloadComponent(componentName) {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = `/src/views/${componentName}.vue`
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  setupInteractionBasedPreloading() {
    // 监听鼠标悬停，预加载相关资源
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]')
      if (link) {
        const href = link.getAttribute('href')
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          this.preloadRouteResources(href)
        }
      }
    })

    // 监听滚动，预加载即将可见的内容
    let scrollTimeout
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.preloadVisibleContent()
      }, 100)
    })
  }

  preloadRouteResources(route) {
    const routeResources = {
      '/tags': ['https://api.hivelumi.com/api/tags'],
      '/portfolio': ['https://api.hivelumi.com/api/portfolio'],
      '/favorites': ['https://api.hivelumi.com/api/favorites'],
      '/profile': ['https://api.hivelumi.com/api/user/profile']
    }

    const resources = routeResources[route] || []
    resources.forEach(resource => {
      this.preloadResource({ url: resource, type: 'fetch' })
    })
  }

  preloadVisibleContent() {
    // 预加载即将可见的图片
    const images = document.querySelectorAll('img[data-src]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.getAttribute('data-src')
          if (src) {
            this.preloadResource({ url: src, type: 'image' })
          }
        }
      })
    }, { rootMargin: '100px' })

    images.forEach(img => observer.observe(img))
  }

  // 预加载API数据
  async preloadAPIData(endpoints) {
    const promises = endpoints.map(endpoint => {
      if (this.preloadedResources.has(endpoint)) return Promise.resolve()
      
      return fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }).then(response => {
        if (response.ok) {
          this.preloadedResources.add(endpoint)
        }
      }).catch(() => {
        // 静默处理错误
      })
    })

    await Promise.allSettled(promises)
  }
}

// 创建全局实例
export const advancedPreloader = new AdvancedPreloader()
