// 资源预加载优化工具
export class ResourcePreloader {
  constructor() {
    this.preloadedResources = new Set()
    this.priorityQueue = []
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      // 关键字体
      '/fonts/roboto-v30-latin-regular.woff2',
      '/fonts/roboto-v30-latin-700.woff2',
      
      // 关键图片
      '/img/logo.png',
      '/img/bg.jpg',
      
      // 关键API数据
      '/api/home',
      '/api/tags'
    ]

    criticalResources.forEach(resource => {
      this.preloadResource(resource, 'high')
    })
  }

  // 预加载资源
  preloadResource(url, priority = 'low') {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    // 根据文件类型设置as属性
    if (url.endsWith('.woff2') || url.endsWith('.woff') || url.endsWith('.ttf')) {
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
    } else if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp')) {
      link.as = 'image'
    } else if (url.startsWith('/api/')) {
      link.as = 'fetch'
      link.crossOrigin = 'anonymous'
    } else {
      link.as = 'script'
    }

    // 设置优先级
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high')
    }

    document.head.appendChild(link)
    this.preloadedResources.add(url)
  }

  // 预加载路由相关资源
  preloadRouteResources(routeName) {
    const routeResources = {
      '/': ['/api/home', '/api/tags'],
      '/tags': ['/api/tags'],
      '/portfolio': ['/api/portfolios'],
      '/favorites': ['/api/favorites'],
      '/profile': ['/api/user/profile']
    }

    const resources = routeResources[routeName] || []
    resources.forEach(resource => {
      this.preloadResource(resource, 'medium')
    })
  }

  // 预加载图片
  preloadImages(imageUrls) {
    imageUrls.forEach(url => {
      if (!this.preloadedResources.has(url)) {
        const img = new Image()
        img.src = url
        this.preloadedResources.add(url)
      }
    })
  }

  // 预加载字体
  preloadFonts(fontUrls) {
    fontUrls.forEach(url => {
      this.preloadResource(url, 'high')
    })
  }

  // 智能预加载 - 基于用户行为
  intelligentPreload() {
    // 监听鼠标悬停
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]')
      if (link) {
        const href = link.getAttribute('href')
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          this.preloadRouteResources(href)
        }
      }
    })

    // 监听滚动 - 预加载即将可见的内容
    let scrollTimeout
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.preloadVisibleContent()
      }, 100)
    })
  }

  // 预加载可见内容
  preloadVisibleContent() {
    const images = document.querySelectorAll('img[data-src]')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.getAttribute('data-src')
          if (src) {
            this.preloadResource(src, 'medium')
          }
        }
      })
    }, { rootMargin: '50px' })

    images.forEach(img => observer.observe(img))
  }

  // 预加载API数据
  preloadAPIData(endpoints) {
    endpoints.forEach(endpoint => {
      if (!this.preloadedResources.has(endpoint)) {
        fetch(endpoint, {
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
      }
    })
  }

  // 初始化
  init() {
    this.preloadCriticalResources()
    this.intelligentPreload()
    
    // 页面加载完成后预加载其他资源
    window.addEventListener('load', () => {
      this.preloadVisibleContent()
    })
  }
}

// 创建全局实例
export const resourcePreloader = new ResourcePreloader()

// 自动初始化
if (typeof window !== 'undefined') {
  resourcePreloader.init()
}
