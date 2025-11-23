<template>
  <div class="lazy-image-wrapper">
    <img
      v-if="hasSource"
      :src="imageSource"
      :alt="alt"
      :class="['lazy-image', imageClass, { 'shape-hexagon': shape === 'hexagon' }]"
      :style="imageStyle"
      loading="lazy"
      :fetchpriority="fetchpriority"
    />
    <div v-else class="placeholder"></div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'LazyImage',
  props: {
    src: {
      type: String,
      default: ''
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
    fetchpriority: {
      type: String,
      default: null
    },
    shape: {
      type: String,
      default: 'rect', // 'rect' | 'hexagon'
      validator: (value) => ['rect', 'hexagon', 'circle'].includes(value)
    }
  },
  setup(props) {
    const hasSource = computed(() => !!props.src);

    const imageSource = computed(() => {
      if (!props.src) {
        return '';
      }
      if (props.src.startsWith('http') || props.src.endsWith('.webp') || props.src.endsWith('.avif')) {
        return props.src;
      }
      if (props.src.startsWith('/img/') && (props.src.endsWith('.jpg') || props.src.endsWith('.png'))) {
        const baseName = props.src.replace(/\.(jpg|png)$/, '');
        return `/img/optimized${baseName.substring(4)}.webp`;
      }
      return props.src;
    });

    return {
      hasSource,
      imageSource
    };
  }
};
</script>

<style scoped>
.lazy-image-wrapper {
  width: 100%;
  height: 100%;
}
.placeholder {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
}
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
