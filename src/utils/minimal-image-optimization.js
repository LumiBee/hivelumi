// 最小化的图片优化 - 只做最安全的优化
export class MinimalImageOptimization {
  constructor() {
    this.init()
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupOptimizations())
    } else {
      this.setupOptimizations()
    }
  }

  setupOptimizations() {
    // 只对文章详情页的图片进行最基本的优化
    this.optimizeArticleImages()
  }

  optimizeArticleImages() {
    // 只优化文章内容中的图片
    const articleImages = document.querySelectorAll('article img, .article-content img')
    
    if (articleImages.length === 0) return

    articleImages.forEach(img => {
      // 添加基本的加载效果
      img.style.transition = 'opacity 0.3s ease'
      
      // 如果图片还没加载，先设置透明度
      if (!img.complete) {
        img.style.opacity = '0.7'
      }
      
      img.onload = () => {
        img.style.opacity = '1'
      }

      img.onerror = () => {
        img.style.opacity = '1'
        // 设置默认图片
        if (!img.src.includes('default')) {
          img.src = '/img/optimized/logo.png'
        }
      }
    })
  }
}

// 创建全局实例
export const minimalImageOptimization = new MinimalImageOptimization()
