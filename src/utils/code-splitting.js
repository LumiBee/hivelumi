// 代码分割和懒加载优化
export class CodeSplitting {
  constructor() {
    this.loadedChunks = new Set()
    this.loadingChunks = new Set()
  }

  // 懒加载组件
  async loadComponent(componentPath, priority = 'normal') {
    if (this.loadedChunks.has(componentPath)) {
      return Promise.resolve()
    }

    if (this.loadingChunks.has(componentPath)) {
      return new Promise(resolve => {
        const checkLoaded = () => {
          if (this.loadedChunks.has(componentPath)) {
            resolve()
          } else {
            setTimeout(checkLoaded, 50)
          }
        }
        checkLoaded()
      })
    }

    this.loadingChunks.add(componentPath)

    try {
      const component = await import(/* webpackChunkName: "[request]" */ `@/views/${componentPath}.vue`)
      this.loadedChunks.add(componentPath)
      this.loadingChunks.delete(componentPath)
      return component
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error)
      this.loadingChunks.delete(componentPath)
      throw error
    }
  }

  // 预加载组件
  preloadComponent(componentPath) {
    if (this.loadedChunks.has(componentPath) || this.loadingChunks.has(componentPath)) {
      return
    }

    // 使用link preload
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = `/src/views/${componentPath}.vue`
    document.head.appendChild(link)
  }

  // 智能预加载 - 基于路由
  preloadRouteComponents(routeName) {
    const routeComponents = {
      '/': ['Home'],
      '/tags': ['Tags'],
      '/portfolio': ['Portfolio'],
      '/favorites': ['Favorites'],
      '/profile': ['Profile'],
      '/settings': ['Settings'],
      '/publish': ['Publish']
    }

    const components = routeComponents[routeName] || []
    components.forEach(component => {
      this.preloadComponent(component)
    })
  }

  // 懒加载图片
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]')
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            img.classList.add('loaded')
            observer.unobserve(img)
          }
        })
      }, {
        rootMargin: '50px 0px'
      })

      images.forEach(img => imageObserver.observe(img))
    } else {
      // 降级处理
      images.forEach(img => {
        img.src = img.dataset.src
        img.removeAttribute('data-src')
      })
    }
  }

  // 懒加载CSS
  lazyLoadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.onload = resolve
      link.onerror = reject
      document.head.appendChild(link)
    })
  }

  // 懒加载JavaScript
  lazyLoadJS(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      // 关键CSS
      '/css/core.css',
      '/css/main.css',
      
      // 关键JS
      '/js/vendor.js',
      '/js/app.js'
    ]

    criticalResources.forEach(resource => {
      if (resource.endsWith('.css')) {
        this.lazyLoadCSS(resource)
      } else if (resource.endsWith('.js')) {
        this.lazyLoadJS(resource)
      }
    })
  }

  // 延迟加载非关键资源
  loadNonCriticalResources() {
    const nonCriticalResources = [
      // 非关键CSS
      '/css/article.css',
      '/css/portfolio.css',
      '/css/settings.css',
      
      // 非关键JS
      '/js/article-effects.js',
      '/js/portfolio.js',
      '/js/settings.js'
    ]

    // 使用requestIdleCallback延迟加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        nonCriticalResources.forEach(resource => {
          if (resource.endsWith('.css')) {
            this.lazyLoadCSS(resource)
          } else if (resource.endsWith('.js')) {
            this.lazyLoadJS(resource)
          }
        })
      })
    } else {
      setTimeout(() => {
        nonCriticalResources.forEach(resource => {
          if (resource.endsWith('.css')) {
            this.lazyLoadCSS(resource)
          } else if (resource.endsWith('.js')) {
            this.lazyLoadJS(resource)
          }
        })
      }, 2000)
    }
  }

  // 初始化
  init() {
    this.preloadCriticalResources()
    this.lazyLoadImages()
    
    // 页面加载完成后加载非关键资源
    window.addEventListener('load', () => {
      this.loadNonCriticalResources()
    })
  }
}

// 创建全局实例
export const codeSplitting = new CodeSplitting()

// 自动初始化
if (typeof window !== 'undefined') {
  codeSplitting.init()
}
