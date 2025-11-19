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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

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

    // Initialize finalSrc, but rely on the watcher to set the correct value for lazy images
    const finalSrc = ref(props.noLazy ? props.src : '')

    // Watch for changes in the src prop to handle dynamic updates
    watch(() => props.src, (newSrc) => {
      if (props.noLazy) {
        finalSrc.value = newSrc;
      }
      // For lazy images, the IntersectionObserver will handle the update.
    });

    const imageSource = computed(() => {
      let imageUrl = props.noLazy ? finalSrc.value : (finalSrc.value || props.placeholder);
      if (hasError.value) return '/img/default.jpg';
      
      if (!imageUrl || imageUrl === props.placeholder) return imageUrl;

      // --- URL Processing Logic ---
      const isOptimizable = (imageUrl.startsWith('/img/') && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.png')));
      if (isOptimizable) {
        const originalPath = imageUrl.substring(4);
        const webpPath = `/img/optimized${originalPath.replace(/\.(jpg|png)$/, '.webp')}`;
        imageUrl = webpPath;
      }
      
      if (imageUrl.startsWith('http://localhost:8090/')) {
        imageUrl = imageUrl.replace('http://localhost:8090', '');
      }
      
      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = '/api' + imageUrl;
      }
      
      return imageUrl;
    });

    const loadImage = () => {
      if (isLoaded.value || hasError.value || props.noLazy) return
      
      let imageUrl = props.src
      if (!imageUrl) {
        hasError.value = true
        emit('error')
        return
      }

      const isOptimizable = (imageUrl.startsWith('/img/') && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.png')));
      if (isOptimizable) {
        const originalPath = imageUrl.substring(4);
        const webpPath = `/img/optimized${originalPath.replace(/\.(jpg|png)$/, '.webp')}`;
        imageUrl = webpPath;
      }
      
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
        if (isOptimizable) {
          console.warn(`Optimized image not found, falling back to original: ${props.src}`);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            finalSrc.value = props.src;
            isLoaded.value = true;
            emit('load');
          };
          fallbackImg.onerror = () => {
            hasError.value = true;
            emit('error');
          }
          fallbackImg.src = props.src;
        } else {
          hasError.value = true
          emit('error')
        }
      }
      img.src = imageUrl
    }

    onMounted(() => {
      if (props.noLazy) {
        const img = imageRef.value;
        if (img) {
          const checkImage = () => {
            if (img.complete) {
              if (img.naturalWidth > 0) isLoaded.value = true;
              else hasError.value = true;
            }
          };
          if (img.complete) {
            checkImage();
          } else {
            img.addEventListener('load', () => isLoaded.value = true);
            img.addEventListener('error', () => hasError.value = true);
          }
        }
        return
      }

      if ('IntersectionObserver' in window) {
        observer.value = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                loadImage()
                if (imageRef.value) observer.value.unobserve(imageRef.value)
              }
            })
          },
          { rootMargin: '50px 0px', threshold: 0.01 }
        )
        
        if (imageRef.value) observer.value.observe(imageRef.value)
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
