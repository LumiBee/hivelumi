<template>
  <div v-if="isLoaded" class="lazy-component">
    <component :is="loadedComponent" v-bind="$attrs" />
  </div>
  <div v-else-if="isLoading" class="lazy-loading">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">加载中...</span>
    </div>
  </div>
  <div v-else-if="hasError" class="lazy-error">
    <div class="alert alert-warning" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      组件加载失败，请刷新页面重试
    </div>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 组件导入函数
  loader: {
    type: Function,
    required: true
  },
  // 延迟加载时间（毫秒）
  delay: {
    type: Number,
    default: 200
  },
  // 超时时间（毫秒）
  timeout: {
    type: Number,
    default: 10000
  },
  // 是否在视口中时加载
  loadOnVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['loaded', 'error'])

// 状态管理
const isLoaded = ref(false)
const isLoading = ref(false)
const hasError = ref(false)
const loadedComponent = ref(null)

// 延迟加载定时器
let loadTimer = null
let timeoutTimer = null

// 观察器（用于视口检测）
let observer = null

// 加载组件
const loadComponent = async () => {
  if (isLoaded.value || isLoading.value) return

  isLoading.value = true
  hasError.value = false

  try {
    // 设置超时
    timeoutTimer = setTimeout(() => {
      hasError.value = true
      isLoading.value = false
      emit('error', new Error('组件加载超时'))
    }, props.timeout)

    // 加载组件
    const component = await props.loader()
    loadedComponent.value = component
    isLoaded.value = true
    isLoading.value = false

    // 清除超时定时器
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
      timeoutTimer = null
    }

    emit('loaded', component)
  } catch (error) {
    hasError.value = true
    isLoading.value = false
    
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
      timeoutTimer = null
    }

    emit('error', error)
  }
}

// 延迟加载
const scheduleLoad = () => {
  if (loadTimer) return

  loadTimer = setTimeout(() => {
    loadComponent()
    loadTimer = null
  }, props.delay)
}

// 视口检测
const setupIntersectionObserver = () => {
  if (!props.loadOnVisible) return

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        scheduleLoad()
        observer?.disconnect()
      }
    })
  })

  // 观察当前元素
  const element = document.querySelector('.lazy-component')
  if (element) {
    observer.observe(element)
  }
}

// 生命周期
onMounted(() => {
  if (props.loadOnVisible) {
    setupIntersectionObserver()
  } else {
    scheduleLoad()
  }
})

onUnmounted(() => {
  if (loadTimer) {
    clearTimeout(loadTimer)
  }
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
  }
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.lazy-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  padding: 2rem;
}

.lazy-error {
  padding: 1rem;
}

.spinner-border {
  width: 2rem;
  height: 2rem;
}
</style>
