<template>
  <picture>
    <!-- 现代浏览器优先使用AVIF格式 -->
    <source 
      v-if="avifSrc" 
      :srcset="avifSrc" 
      type="image/avif"
    >
    <!-- 支持WebP的浏览器 -->
    <source 
      v-if="webpSrc" 
      :srcset="webpSrc" 
      type="image/webp"
    >
    <!-- 回退到优化后的JPEG/PNG -->
    <img 
      :src="fallbackSrc" 
      :alt="alt"
      :loading="loading"
      :decoding="decoding"
      :class="imgClass"
      :style="imgStyle"
      @load="onLoad"
      @error="onError"
    >
  </picture>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 图片名称（不包含扩展名）
  name: {
    type: String,
    required: true
  },
  // 图片目录，默认为optimized
  directory: {
    type: String,
    default: 'optimized'
  },
  // 图片扩展名，默认为jpg
  extension: {
    type: String,
    default: 'jpg'
  },
  // alt文本
  alt: {
    type: String,
    default: ''
  },
  // 加载方式
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => ['lazy', 'eager'].includes(value)
  },
  // 解码方式
  decoding: {
    type: String,
    default: 'async',
    validator: (value) => ['async', 'sync', 'auto'].includes(value)
  },
  // 图片样式类
  imgClass: {
    type: String,
    default: ''
  },
  // 图片内联样式
  imgStyle: {
    type: Object,
    default: () => ({})
  },
  // 是否启用现代格式
  enableModernFormats: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['load', 'error'])

// 构建图片路径
const buildImagePath = (ext) => {
  return `/img/${props.directory}/${props.name}.${ext}`
}

// 回退图片路径
const fallbackSrc = computed(() => {
  return buildImagePath(props.extension)
})

// WebP图片路径
const webpSrc = computed(() => {
  if (!props.enableModernFormats) return null
  return buildImagePath('webp')
})

// AVIF图片路径
const avifSrc = computed(() => {
  if (!props.enableModernFormats) return null
  return buildImagePath('avif')
})

// 事件处理
const onLoad = (event) => {
  emit('load', event)
}

const onError = (event) => {
  emit('error', event)
}
</script>

<style scoped>
picture {
  display: block;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}
</style>
