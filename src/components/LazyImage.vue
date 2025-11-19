<template>
  <picture ref="pictureRef">
    <!-- AVIF sources -->
    <source v-if="!noLazy" :srcset="avifSrcset" type="image/avif" />
    <source v-if="noLazy && avifSrcset" :srcset="avifSrcset" type="image/avif" />

    <!-- WebP sources -->
    <source v-if="!noLazy" :srcset="webpSrcset" type="image/webp" />
    <source v-if="noLazy && webpSrcset" :srcset="webpSrcset" type="image/webp" />

    <!-- Fallback image -->
    <img
      :src="imageSource"
      :alt="alt"
      :class="['lazy-image', imageClass]"
      :style="imageStyle"
      loading="lazy"
    />
  </picture>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import logo from '@/assets/img/logo.webp';

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
  setup(props) {
    const pictureRef = ref(null);
    const isLoaded = ref(false);
    const SIZES = [480, 800, 1200];

    const getProcessedSrcset = (format) => {
      if (!props.src || !props.src.startsWith('/img/')) return '';
      const baseName = props.src.replace(/\.(jpg|png)$/, '');
      const optimizedBase = `/img/optimized${baseName.substring(4)}`;
      
      return SIZES
        .map(size => `${optimizedBase}-${size}w.${format} ${size}w`)
        .join(', ');
    };

    const avifSrcset = computed(() => getProcessedSrcset('avif'));
    const webpSrcset = computed(() => getProcessedSrcset('webp'));
    
    const imageSource = computed(() => {
      if (!props.src) return logo;
      if (props.src.startsWith('/img/')) {
         const baseName = props.src.replace(/\.(jpg|png)$/, '');
         return `/img/optimized${baseName.substring(4)}.webp`; // Fallback to a default WebP
      }
      return props.src;
    });

    const observer = ref(null);

    onMounted(() => {
      if (props.noLazy) {
        isLoaded.value = true;
        return;
      }

      if ('IntersectionObserver' in window) {
        observer.value = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const picture = pictureRef.value;
                if (picture) {
                  // Find all source elements and update their srcset
                  const sources = picture.querySelectorAll('source');
                  sources.forEach(source => {
                    if (source.dataset.srcset) {
                      source.srcset = source.dataset.srcset;
                    }
                  });
                  isLoaded.value = true;
                }
                observer.value.unobserve(entry.target);
              }
            });
          },
          { rootMargin: '50px 0px', threshold: 0.01 }
        );

        if (pictureRef.value) {
          observer.value.observe(pictureRef.value);
        }
      } else {
        isLoaded.value = true;
      }
    });

    onUnmounted(() => {
      if (observer.value && pictureRef.value) {
        observer.value.unobserve(pictureRef.value);
      }
    });

    return {
      pictureRef,
      avifSrcset,
      webpSrcset,
      imageSource
    };
  }
};
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
