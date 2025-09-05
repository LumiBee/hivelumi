// 性能监控工具
export class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.observers = []
  }

  // 监控Core Web Vitals
  initWebVitals() {
    if (typeof window === 'undefined') return

    // 监控LCP (Largest Contentful Paint)
    this.observeLCP()
    
    // 监控FID (First Input Delay)
    this.observeFID()
    
    // 监控CLS (Cumulative Layout Shift)
    this.observeCLS()
    
    // 监控FCP (First Contentful Paint)
    this.observeFCP()
  }

  observeLCP() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.metrics.lcp = {
        value: lastEntry.startTime,
        rating: this.getRating(lastEntry.startTime, [2500, 4000])
      }
      
      console.log('LCP:', this.metrics.lcp)
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })
    this.observers.push(observer)
  }

  observeFID() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        this.metrics.fid = {
          value: entry.processingStart - entry.startTime,
          rating: this.getRating(entry.processingStart - entry.startTime, [100, 300])
        }
        
        console.log('FID:', this.metrics.fid)
      })
    })

    observer.observe({ entryTypes: ['first-input'] })
    this.observers.push(observer)
  }

  observeCLS() {
    if (!('PerformanceObserver' in window)) return

    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      this.metrics.cls = {
        value: clsValue,
        rating: this.getRating(clsValue, [0.1, 0.25])
      }
      
      console.log('CLS:', this.metrics.cls)
    })

    observer.observe({ entryTypes: ['layout-shift'] })
    this.observers.push(observer)
  }

  observeFCP() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        this.metrics.fcp = {
          value: entry.startTime,
          rating: this.getRating(entry.startTime, [1800, 3000])
        }
        
        console.log('FCP:', this.metrics.fcp)
      })
    })

    observer.observe({ entryTypes: ['paint'] })
    this.observers.push(observer)
  }

  getRating(value, thresholds) {
    if (value <= thresholds[0]) return 'good'
    if (value <= thresholds[1]) return 'needs-improvement'
    return 'poor'
  }

  // 监控资源加载时间
  observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.duration > 1000) { // 超过1秒的资源
          console.warn('Slow resource:', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          })
        }
      })
    })

    observer.observe({ entryTypes: ['resource'] })
    this.observers.push(observer)
  }

  // 监控长任务
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        console.warn('Long task detected:', {
          duration: entry.duration,
          startTime: entry.startTime
        })
      })
    })

    observer.observe({ entryTypes: ['longtask'] })
    this.observers.push(observer)
  }

  // 获取性能报告
  getReport() {
    return {
      metrics: this.metrics,
      navigation: this.getNavigationTiming(),
      memory: this.getMemoryInfo()
    }
  }

  getNavigationTiming() {
    if (!('performance' in window)) return null

    const timing = performance.timing
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domContentLoadedEventEnd - timing.domLoading,
      load: timing.loadEventEnd - timing.loadEventStart
    }
  }

  getMemoryInfo() {
    if (!('memory' in performance)) return null

    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    }
  }

  // 清理观察器
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// 自动初始化
if (typeof window !== 'undefined') {
  performanceMonitor.initWebVitals()
  performanceMonitor.observeResourceTiming()
  performanceMonitor.observeLongTasks()
}