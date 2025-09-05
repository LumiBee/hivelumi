<template>
  <img
    :src="placeholderSrc"
    :data-src="actualSrc"
    :alt="alt"
    :class="['lazy-image', imageClass]"
    :style="imageStyle"
    @load="onLoad"
    @error="onError"
    ref="imageRef"
  />
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCA0MiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQyIiBoZWlnaHQ9IjQyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMSAxMkMxNi4wMjg5IDEyIDEyIDE2LjAyODkgMTIgMjFTMTYuMDI4OSAzMCAyMSAzMFMzMCAyNS45NzExIDMwIDIxUzI1Ljk3MTEgMTIgMjEgMTJaTTIxIDI4QzE3LjY4NjMgMjggMTUgMjUuMzEzNyAxNSAyMlMxNy42ODYzIDE2IDIxIDE2UzI3IDE4LjY4NjMgMjcgMjFTMjQuMzEzNyAyOCAyMSAyOFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
    },
    imageClass: {
      type: String,
      default: ''
    },
    imageStyle: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const imageRef = ref(null)
    const isLoaded = ref(false)
    const hasError = ref(false)
    const observer = ref(null)

    const placeholderSrc = ref(props.placeholder)
    const actualSrc = ref('')

    const loadImage = () => {
      if (isLoaded.value || hasError.value) return
      
      // 处理图片URL
      let imageUrl = props.src
      if (!imageUrl) {
        hasError.value = true
        emit('error')
        return
      }
      
      // 如果是完整的后端URL，转换为相对路径以使用Vite代理
      if (imageUrl.startsWith('http://localhost:8090/')) {
        imageUrl = imageUrl.replace('http://localhost:8090', '')
      }
      
      // 如果是相对路径的uploads，需要添加/api前缀
      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = '/api' + imageUrl
      }
      
      const img = new Image()
      img.onload = () => {
        actualSrc.value = imageUrl
        isLoaded.value = true
        emit('load')
      }
      img.onerror = () => {
        hasError.value = true
        // 设置默认图片
        actualSrc.value = '/img/default.jpg'
        emit('error')
      }
      img.src = imageUrl
    }

    const onLoad = () => {
      emit('load')
    }

    const onError = () => {
      hasError.value = true
      emit('error')
    }

    onMounted(() => {
      if ('IntersectionObserver' in window) {
        observer.value = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                loadImage()
                observer.value.unobserve(entry.target)
              }
            })
          },
          {
            rootMargin: '50px 0px',
            threshold: 0.01
          }
        )
        
        if (imageRef.value) {
          observer.value.observe(imageRef.value)
        }
      } else {
        // 降级处理：直接加载图片
        loadImage()
      }
    })

    onUnmounted(() => {
      if (observer.value) {
        observer.value.disconnect()
      }
    })

    return {
      imageRef,
      placeholderSrc,
      actualSrc,
      onLoad,
      onError
    }
  }
}
</script>

<style scoped>
.lazy-image {
  transition: opacity 0.3s ease;
  background-color: #f3f4f6;
}

.lazy-image[data-src] {
  opacity: 0.7;
}

.lazy-image:not([data-src]) {
  opacity: 1;
}
</style>
