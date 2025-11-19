// 高级图片优化工具
export class ImageOptimizer {
  constructor() {
    this.processedImages = new Set()
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
    // 优化所有图片
    this.optimizeAllImages()
    
    // 监听DOM变化，优化新添加的图片
    this.observeDOMChanges()
    
    // 添加图片错误处理
    this.setupErrorHandling()
  }

  optimizeAllImages() {
    // 获取所有图片
    const images = document.querySelectorAll('img')
    
    images.forEach(img => {
      this.optimizeImage(img)
    })
  }

  optimizeImage(img) {
    // 避免重复处理
    if (this.processedImages.has(img)) return
    this.processedImages.add(img)
    
    // 添加加载效果
    img.style.transition = 'opacity 0.3s ease'
    
    // 如果图片还没加载，先设置透明度
    if (!img.complete) {
      img.style.opacity = '0.7'
    }
    
    // 添加loading属性
    img.loading = 'lazy'
    
    // 添加尺寸属性（如果没有）
    if (!img.getAttribute('width') && !img.getAttribute('height')) {
      // 设置默认尺寸，减少布局偏移
      img.setAttribute('width', '100%')
      img.setAttribute('height', 'auto')
    }
    
    // 添加解码属性
    img.decoding = 'async'
    
    // 添加事件处理
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
  }

  observeDOMChanges() {
    // 监听DOM变化，优化新添加的图片
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            // 检查是否是元素节点
            if (node.nodeType === 1) {
              // 优化新添加的图片
              const images = node.querySelectorAll('img')
              images.forEach(img => this.optimizeImage(img))
              
              // 检查节点本身是否是图片
              if (node.tagName === 'IMG') {
                this.optimizeImage(node)
              }
            }
          })
        }
      })
    })
    
    // 开始监听
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  setupErrorHandling() {
    // 全局图片错误处理
    window.addEventListener('error', (event) => {
      const target = event.target
      
      // 检查是否是图片加载错误
      if (target.tagName === 'IMG') {
        // 设置默认图片
        if (!target.src.includes('default')) {
          target.src = '/img/default.jpg'
        }
      }
    }, true)
  }

  // 转换图片为WebP格式（如果浏览器支持）
  convertToWebP(url) {
    // 检查浏览器是否支持WebP
    const supportsWebP = document.createElement('canvas')
      .toDataURL('image/webp')
      .indexOf('data:image/webp') === 0
    
    if (supportsWebP) {
      // 如果是JPG或PNG，转换为WebP
      if (url.match(/\.(jpg|jpeg|png)(\?.*)?$/i)) {
        // 检查是否已经是WebP
        if (!url.includes('.webp')) {
          // 如果URL包含查询参数
          if (url.includes('?')) {
            return url.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2')
          } else {
            return url.replace(/\.(jpg|jpeg|png)$/i, '.webp')
          }
        }
      }
    }
    
    return url
  }
}

// 创建全局实例
export const imageOptimizer = new ImageOptimizer()
