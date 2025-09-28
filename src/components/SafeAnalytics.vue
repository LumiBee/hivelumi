<template>
  <div style="display: none;">
    <!-- 静默加载，不显示任何内容 -->
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Analytics } from '@vercel/analytics/vue'

const isLoaded = ref(false)
const loadError = ref(null)

// 安全加载 Analytics
const loadAnalytics = async () => {
  // 只在生产环境且 Vercel 平台上加载
  if (!import.meta.env.PROD || !window.location.hostname.includes('vercel.app')) {
    console.log('非生产环境或非 Vercel 平台，跳过 Analytics 加载')
    return
  }

  try {
    // 检查网络连接
    if (!navigator.onLine) {
      console.warn('网络离线，跳过 Analytics 加载')
      return
    }

    // 检查是否被广告拦截器阻止
    const testScript = document.createElement('script')
    testScript.src = 'https://va.vercel-scripts.com/v1/script.debug.js'
    testScript.onerror = () => {
      console.warn('Analytics 脚本被阻止，可能是广告拦截器')
      loadError.value = 'blocked'
    }
    testScript.onload = () => {
      isLoaded.value = true
      console.log('Analytics 加载成功')
    }
    
    // 设置超时
    setTimeout(() => {
      if (!isLoaded.value && !loadError.value) {
        console.warn('Analytics 加载超时')
        loadError.value = 'timeout'
      }
    }, 5000)

    // 添加到页面
    document.head.appendChild(testScript)
    
  } catch (error) {
    console.warn('Analytics 加载失败:', error)
    loadError.value = error.message
  }
}

onMounted(() => {
  // 延迟加载，避免阻塞主要功能
  setTimeout(loadAnalytics, 1000)
})
</script>

<style scoped>
/* 无样式，这是一个功能组件 */
</style>
