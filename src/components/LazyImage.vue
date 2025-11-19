<template>
  <img
    :src="imageSource"
    :alt="alt"
    :class="['lazy-image', imageClass]"
    :style="imageStyle"
    ref="imageRef"
  />
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'

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
    },
    noLazy: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const imageRef = ref(null)
    const isLoaded = ref(false)
    const hasError = ref(false)
    const observer = ref(null)

    const finalSrc = ref('')

    const imageSource = computed(() => {
      if (hasError.value) return '/img/default.jpg'
      return finalSrc.value || props.placeholder
    })

    const loadImage = () => {
      if (isLoaded.value || hasError.value) return
      
      let imageUrl = props.src
      if (!imageUrl) {
        hasError.value = true
        emit('error')
        return
      }

      // --- NEW LOGIC START ---
      // Check if the image is a candidate for optimization (local jpg/png)
      const isOptimizable = (imageUrl.startsWith('/img/') && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.png')));

      if (isOptimizable) {
        // Construct the path to the optimized .webp version
        const originalPath = imageUrl.substring(4); // remove '/img'
        const webpPath = `/img/optimized${originalPath.replace(/\.(jpg|png)$/, '.webp')}`;
        imageUrl = webpPath;
      }
      // --- NEW LOGIC END ---
      
      if (imageUrl.startsWith('http://localhost:8090/')) {
        imageUrl = imageUrl.replace('http://localhost:8090', '')
      }
      
      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = '/api' + imageUrl
      }
      
      const img = new Image()
      img.onload = () => {
        finalSrc.value = imageUrl
        isLoaded.value = true
        emit('load')
      }
      img.onerror = () => {
        // If the optimized image fails, try falling back to the original
        if (isOptimizable) {
          console.warn(`Optimized image not found, falling back to original: ${props.src}`);
          imageUrl = props.src; // Fallback to original src
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            finalSrc.value = imageUrl;
            isLoaded.value = true;
            emit('load');
          };
          fallbackImg.onerror = () => {
            hasError.value = true;
            emit('error');
          }
          fallbackImg.src = imageUrl;
        } else {
          hasError.value = true
          emit('error')
        }
      }
      img.src = imageUrl
    }

    onMounted(() => {
      if (props.noLazy) {
        loadImage()
        return
      }

      if ('IntersectionObserver' in window) {
        observer.value = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                loadImage()
                if (imageRef.value) {
                   observer.value.unobserve(imageRef.value)
                }
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
        loadImage()
      }
    })

    onUnmounted(() => {
      if (observer.value && imageRef.value) {
        observer.value.unobserve(imageRef.value)
      }
    })

    return {
      imageRef,
      imageSource
    }
  }
}
</script>

<style scoped>
.lazy-image {
  transition: opacity 0.5s ease-in-out;
  background-color: #f3f4f6;
  opacity: 0.7;
}

.lazy-image[src*="data:image"] {
  opacity: 0.7;
}

.lazy-image:not([src*="data:image"]) {
  opacity: 1;
}
</style>
