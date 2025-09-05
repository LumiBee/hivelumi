// 关键CSS提取和内联工具
export class CriticalCSS {
  constructor() {
    this.criticalCSS = ''
    this.isLoaded = false
  }

  // 提取关键CSS
  extractCriticalCSS() {
    // 关键CSS - 首屏可见内容样式
    this.criticalCSS = `
      /* 关键布局样式 */
      .article-page { min-height: 100vh; }
      .article-hero { 
        position: relative; 
        min-height: 60vh; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        color: white;
      }
      .article-hero-content { 
        position: relative; 
        z-index: 2; 
        padding: 2rem 0;
      }
      .article-hero-title { 
        font-size: 3rem; 
        font-weight: 700; 
        margin-bottom: 1.5rem;
        line-height: 1.2;
      }
      .article-hero-meta { 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        margin-top: 2rem;
      }
      .author-info { 
        display: flex; 
        align-items: center; 
        gap: 1rem;
      }
      .hero-avatar { 
        width: 50px; 
        height: 50px; 
        border-radius: 50%; 
        object-fit: cover;
      }
      .author-details { 
        display: flex; 
        flex-direction: column;
      }
      .hero-author { 
        font-weight: 600; 
        font-size: 1.1rem;
      }
      .hero-date { 
        color: rgba(255,255,255,0.8); 
        font-size: 0.9rem;
      }
      .hero-tags { 
        margin: 1rem 0;
      }
      .hero-tag { 
        display: inline-block; 
        background: rgba(255,255,255,0.2); 
        color: white; 
        padding: 0.5rem 1rem; 
        border-radius: 20px; 
        text-decoration: none; 
        margin-right: 0.5rem; 
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .hero-tag:hover { 
        background: rgba(255,255,255,0.3); 
        color: white;
      }
      .hero-overlay { 
        position: absolute; 
        top: 0; 
        left: 0; 
        right: 0; 
        bottom: 0; 
        background: rgba(0,0,0,0.3); 
        z-index: 1;
      }
      
      /* 加载状态 */
      .spinner-border { 
        width: 3rem; 
        height: 3rem; 
        border-width: 0.3em;
      }
      .text-center { 
        text-align: center;
      }
      .py-5 { 
        padding-top: 3rem; 
        padding-bottom: 3rem;
      }
      
      /* 基础布局 */
      .container-fluid { 
        width: 100%; 
        padding-right: 15px; 
        padding-left: 15px; 
        margin-right: auto; 
        margin-left: auto;
      }
      .row { 
        display: flex; 
        flex-wrap: wrap; 
        margin-right: -15px; 
        margin-left: -15px;
      }
      
      /* 响应式 */
      @media (max-width: 768px) {
        .article-hero-title { font-size: 2rem; }
        .article-hero-meta { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .hero-avatar { width: 40px; height: 40px; }
      }
    `
  }

  // 内联关键CSS
  inlineCriticalCSS() {
    if (this.isLoaded) return

    this.extractCriticalCSS()
    
    // 创建style标签
    const style = document.createElement('style')
    style.textContent = this.criticalCSS
    style.setAttribute('data-critical', 'true')
    
    // 插入到head顶部
    const head = document.head || document.getElementsByTagName('head')[0]
    head.insertBefore(style, head.firstChild)
    
    this.isLoaded = true
  }

  // 预加载非关键CSS
  preloadNonCriticalCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])')
    links.forEach(link => {
      if (link.href && !link.href.includes('critical')) {
        // 添加preload
        const preloadLink = document.createElement('link')
        preloadLink.rel = 'preload'
        preloadLink.href = link.href
        preloadLink.as = 'style'
        preloadLink.onload = () => {
          preloadLink.rel = 'stylesheet'
        }
        document.head.appendChild(preloadLink)
      }
    })
  }

  // 延迟加载非关键CSS
  loadNonCriticalCSS() {
    const links = document.querySelectorAll('link[rel="preload"][as="style"]')
    links.forEach(link => {
      link.rel = 'stylesheet'
    })
  }
}

// 创建全局实例
export const criticalCSS = new CriticalCSS()

// 自动初始化
if (typeof window !== 'undefined') {
  // 立即内联关键CSS
  criticalCSS.inlineCriticalCSS()
  
  // 页面加载完成后加载非关键CSS
  window.addEventListener('load', () => {
    criticalCSS.loadNonCriticalCSS()
  })
  
  // 空闲时预加载其他CSS
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalCSS.preloadNonCriticalCSS()
    })
  } else {
    setTimeout(() => {
      criticalCSS.preloadNonCriticalCSS()
    }, 100)
  }
}
