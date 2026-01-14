<template>
  <div class="simple-cropper-modal" v-if="visible" @click.self="closeModal">
    <div class="cropper-container">
      <div class="cropper-header">
        <h5>裁剪封面图片</h5>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="cropper-content">
        <Cropper
          ref="cropperRef"
          class="cropper"
          :src="imageSrc"
          :stencil-props="{
            aspectRatio: 4
          }"
        />
      </div>
      
      <div class="cropper-footer">
        <button class="btn btn-secondary" @click="closeModal">
          取消
        </button>
        <button class="btn btn-primary" @click="cropImage">
          确认裁剪
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'crop'])

const cropperRef = ref(null)

const cropImage = () => {
  if (!cropperRef.value) return
  
  const { canvas } = cropperRef.value.getResult()
  if (canvas) {
    // 转换为base64格式，与原组件保持一致
    const croppedData = canvas.toDataURL('image/jpeg', 0.9)
    emit('crop', croppedData)
    closeModal()
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.simple-cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.cropper-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
}

.cropper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.cropper-header h5 {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 18px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e9ecef;
  color: #333;
}

.cropper-content {
  padding: 24px;
  background: #f8f9fa;
}

.cropper {
  width: 800px;
  height: 500px;
  background: white;
}

.cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: white;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: linear-gradient(45deg, #f6d55c, #f3a712);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(45deg, #f3a712, #f6d55c);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(246, 213, 92, 0.3);
}

@media (max-width: 768px) {
  .cropper {
    width: 500px;
    height: 400px;
  }
}

@media (max-width: 480px) {
  .cropper {
    width: 350px;
    height: 300px;
  }
}
</style>
