<template>
  <img
    :src="imageSource"
    :alt="alt"
    :class="['lazy-image', imageClass]"
    :style="imageStyle"
    loading="lazy"
  />
</template>

<script>
import { computed } from 'vue';
import logo from '@/assets/img/default.webp';

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
  },
  setup(props) {
    const imageSource = computed(() => {
      if (!props.src) {
        return logo;
      }
      // If it's an external URL or already optimized, return it directly
      if (props.src.startsWith('http') || props.src.endsWith('.webp') || props.src.endsWith('.avif')) {
        return props.src;
      }
      // For local, non-optimized images, convert to optimized WebP
      if (props.src.startsWith('/img/') && (props.src.endsWith('.jpg') || props.src.endsWith('.png'))) {
        const baseName = props.src.replace(/\.(jpg|png)$/, '');
        return `/img/optimized${baseName.substring(4)}.webp`;
      }
      return props.src;
    });

    return {
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
