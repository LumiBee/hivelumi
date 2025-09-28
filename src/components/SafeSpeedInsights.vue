<template>
  <div style="display: none;">
    <!-- 静默加载，不显示任何内容 -->
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'

const isLoaded = ref(false)
const loadError = ref(null)

// 安全加载 Speed Insights
const loadSpeedInsights = async () => {
  // 只在生产环境且 Vercel 平台上加载
  if (!import.meta.env.PROD || !window.location.hostname.includes('vercel.app')) {
    return
  }

  try {
    // 检查网络连接
    if (!navigator.onLine) {
      console.warn('网络离线，跳过 Speed Insights 加载')
      return
    }

    // 检查是否被广告拦截器阻止
    const testScript = document.createElement('script')
    testScript.src = 'https://www.hivelumi.com/_vercel/speed-insights/script.js'
    testScript.onerror = () => {
      console.warn('Speed Insights 脚本被阻止，可能是广告拦截器')
      loadError.value = 'blocked'
    }
    testScript.onload = () => {
      isLoaded.value = true
      console.log('Speed Insights 加载成功')
    }
    
    // 设置超时
    setTimeout(() => {
      if (!isLoaded.value && !loadError.value) {
        console.warn('Speed Insights 加载超时')
        loadError.value = 'timeout'
      }
    }, 5000)

    // 添加到页面
    document.head.appendChild(testScript)
    
  } catch (error) {
    console.warn('Speed Insights 加载失败:', error)
    loadError.value = error.message
  }
}

onMounted(() => {
  // 延迟加载，避免阻塞主要功能
  setTimeout(loadSpeedInsights, 1000)
})
</script>

<style scoped>
/* 无样式，这是一个功能组件 */
</style>
