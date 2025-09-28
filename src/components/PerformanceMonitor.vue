<template>
  <div v-if="showMetrics" class="performance-monitor">
    <div class="metrics-card">
      <h6 class="metrics-title">
        <i class="fas fa-tachometer-alt me-2"></i>
        性能指标
      </h6>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">FCP:</span>
          <span class="metric-value">{{ metrics.fcp }}ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">LCP:</span>
          <span class="metric-value">{{ metrics.lcp }}ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">FID:</span>
          <span class="metric-value">{{ metrics.fid }}ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">CLS:</span>
          <span class="metric-value">{{ metrics.cls }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">TTFB:</span>
          <span class="metric-value">{{ metrics.ttfb }}ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">资源数量:</span>
          <span class="metric-value">{{ metrics.resourceCount }}</span>
        </div>
      </div>
      <div class="metrics-actions">
        <button @click="refreshMetrics" class="btn btn-sm btn-outline-primary">
          <i class="fas fa-sync-alt me-1"></i>
          刷新
        </button>
        <button @click="exportMetrics" class="btn btn-sm btn-outline-success">
          <i class="fas fa-download me-1"></i>
          导出
        </button>
        <button @click="toggleMonitor" class="btn btn-sm btn-outline-secondary">
          <i class="fas fa-eye-slash me-1"></i>
          隐藏
        </button>
      </div>
    </div>
  </div>
  <div v-else class="performance-toggle">
    <button @click="toggleMonitor" class="btn btn-sm btn-primary">
      <i class="fas fa-tachometer-alt me-1"></i>
      显示性能指标
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

const showMetrics = ref(false)
const metrics = reactive({
  fcp: 0,
  lcp: 0,
  fid: 0,
  cls: 0,
  ttfb: 0,
  resourceCount: 0
})

// 性能观察器
let observer = null

// 收集性能指标
const collectMetrics = () => {
  if (!window.performance) return

  // 获取导航时间
  const navigation = performance.getEntriesByType('navigation')[0]
  if (navigation) {
    metrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart)
  }

  // 获取资源数量
  const resources = performance.getEntriesByType('resource')
  metrics.resourceCount = resources.length

  // 获取Web Vitals（如果可用）
  if (window.webVitals) {
    // 这里可以集成web-vitals库
    console.log('Web Vitals available')
  }

  // 获取Core Web Vitals
  getCoreWebVitals()
}

// 获取Core Web Vitals
const getCoreWebVitals = () => {
  // FCP (First Contentful Paint)
  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
  if (fcpEntry) {
    metrics.fcp = Math.round(fcpEntry.startTime)
  }

  // LCP (Largest Contentful Paint)
  if (window.PerformanceObserver) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.lcp = Math.round(lastEntry.startTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  // FID (First Input Delay)
  if (window.PerformanceObserver) {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        metrics.fid = Math.round(entry.processingStart - entry.startTime)
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
  }

  // CLS (Cumulative Layout Shift)
  if (window.PerformanceObserver) {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      metrics.cls = Math.round(clsValue * 1000) / 1000
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }
}

// 刷新指标
const refreshMetrics = () => {
  collectMetrics()
}

// 导出指标
const exportMetrics = () => {
  const data = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    metrics: { ...metrics }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-metrics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 切换监控显示
const toggleMonitor = () => {
  showMetrics.value = !showMetrics.value
  if (showMetrics.value) {
    collectMetrics()
  }
}

// 生命周期
onMounted(() => {
  // 延迟收集指标，确保页面完全加载
  setTimeout(() => {
    collectMetrics()
  }, 2000)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 300px;
}

.metrics-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.metrics-title {
  margin-bottom: 1rem;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.metric-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.metric-value {
  font-size: 0.8rem;
  color: #495057;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.metrics-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.metrics-actions .btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.performance-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.performance-toggle .btn {
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
}

@media (max-width: 768px) {
  .performance-monitor,
  .performance-toggle {
    position: relative;
    top: auto;
    right: auto;
    margin: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
