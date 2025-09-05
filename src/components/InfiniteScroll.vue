<template>
  <div class="infinite-scroll" ref="containerRef">
    <slot :items="items" :loading="loading" :hasMore="hasMore" />
    
    <!-- 加载指示器 -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>
    
    <!-- 没有更多数据提示 -->
    <div v-if="!hasMore && !loading && items.length > 0" class="no-more-data">
      没有更多内容了
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'InfiniteScroll',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 100
    }
  },
  emits: ['load-more'],
  setup(props, { emit }) {
    const containerRef = ref(null)
    const observer = ref(null)

    const handleIntersection = (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && props.hasMore && !props.loading) {
        emit('load-more')
      }
    }

    onMounted(() => {
      if ('IntersectionObserver' in window) {
        observer.value = new IntersectionObserver(handleIntersection, {
          rootMargin: `${props.threshold}px`
        })
        
        if (containerRef.value) {
          observer.value.observe(containerRef.value)
        }
      }
    })

    onUnmounted(() => {
      if (observer.value) {
        observer.value.disconnect()
      }
    })

    return {
      containerRef
    }
  }
}
</script>

<style scoped>
.infinite-scroll {
  width: 100%;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-more-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
