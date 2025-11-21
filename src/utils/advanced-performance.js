// 高级性能监控工具
export class AdvancedPerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
    this.init()
  }

  init() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring())
    } else {
      this.startMonitoring()
    }
  }

  startMonitoring() {
    // 监控Core Web Vitals
    this.observeLCP()
    this.observeFID()
    this.observeCLS()
    this.observeFCP()
    
    // 监控资源加载
    this.observeResourceTiming()
    
    // 监控长任务
    this.observeLongTasks()
    
    // 监控内存使用
    this.observeMemoryUsage()
    
    // 监控网络状态
    this.observeNetworkStatus()
  }

  // 监控LCP (Largest Contentful Paint)
  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
        console.log('LCP:', lastEntry.startTime + 'ms')
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    }
  }

  // 监控FID (First Input Delay)
  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          this.metrics.fid = entry.processingStart - entry.startTime
          console.log('FID:', entry.processingStart - entry.startTime + 'ms')
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    }
  }

  // 监控CLS (Cumulative Layout Shift)
  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.cls = clsValue
            // console.log('CLS:', clsValue)
          }
        })
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    }
  }

  // 监控FCP (First Contentful Paint)
  observeFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          this.metrics.fcp = entry.startTime
          console.log('FCP:', entry.startTime + 'ms')
        })
      })
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    }
  }

  // 监控资源加载时间
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          // 监控慢资源
          if (entry.duration > 1000) {
            console.warn('Slow resource:', entry.name, entry.duration + 'ms')
          }
          
          // 监控大资源
          if (entry.transferSize > 100000) {
            console.warn('Large resource:', entry.name, (entry.transferSize / 1024) + 'KB')
          }
        })
      })
      observer.observe({ entryTypes: ['resource'] })
      this.observers.push(observer)
    }
  }

  // 监控长任务
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          console.warn('Long task detected:', entry.duration + 'ms')
          // 可以在这里添加长任务处理逻辑
        })
      })
      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)
    }
  }

  // 监控内存使用
  observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        this.metrics.memory = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
        
        // 检查内存使用率
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        if (usagePercent > 80) {
          console.warn('High memory usage:', usagePercent.toFixed(2) + '%')
        }
      }, 5000)
    }
  }

  // 监控网络状态
  observeNetworkStatus() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      this.metrics.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      }
      
      // 根据网络状态调整策略
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.enableSlowNetworkMode()
      }
    }
  }

  // 慢网络模式
  enableSlowNetworkMode() {
    console.log('Enabling slow network mode')
    
    // 延迟加载非关键资源
    const nonCriticalImages = document.querySelectorAll('img[data-lazy]')
    nonCriticalImages.forEach(img => {
      img.loading = 'lazy'
    })
    
    // 减少动画
    document.documentElement.style.setProperty('--animation-duration', '0.1s')
  }

  // 获取性能指标
  getMetrics() {
    return this.metrics
  }

  // 清理观察者
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 创建全局实例
export const performanceMonitor = new AdvancedPerformanceMonitor()
