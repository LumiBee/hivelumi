// 安全的图片优化工具 - 不会破坏现有功能
export class SafeImageOptimization {
  constructor() {
    this.observer = null
    this.init()
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupLazyLoading())
    } else {
      this.setupLazyLoading()
    }
  }

  setupLazyLoading() {
    // 只对文章详情页的图片进行懒加载
    const articleImages = document.querySelectorAll('img[src*="/uploads/"]')
    
    if (articleImages.length === 0) return

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            this.optimizeImage(img)
            this.observer.unobserve(img)
          }
        })
      }, {
        rootMargin: '50px 0px'
      })

      articleImages.forEach(img => {
        this.observer.observe(img)
      })
    } else {
      // 降级处理
      articleImages.forEach(img => this.optimizeImage(img))
    }
  }

  optimizeImage(img) {
    // 添加加载效果
    img.style.opacity = '0.7'
    img.style.transition = 'opacity 0.3s ease'
    
    img.onload = () => {
      img.style.opacity = '1'
    }

    img.onerror = () => {
      img.style.opacity = '1'
      // 可以设置默认图片
      if (!img.src.includes('default')) {
        img.src = '/img/default.jpg'
      }
    }
  }

  // 预加载关键图片
  preloadCriticalImages() {
    const criticalImages = [
      '/img/logo.png',
      '/img/bg.jpg'
    ]

    criticalImages.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = src
      link.as = 'image'
      document.head.appendChild(link)
    })
  }
}

// 创建全局实例
export const safeImageOptimization = new SafeImageOptimization()
