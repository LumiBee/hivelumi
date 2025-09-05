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
      
      const img = new Image()
      img.onload = () => {
        actualSrc.value = props.src
        isLoaded.value = true
        emit('load')
      }
      img.onerror = () => {
        hasError.value = true
        emit('error')
      }
      img.src = props.src
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
