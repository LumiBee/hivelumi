<template>
  <div class="drafts-page">
    <div class="container-fluid" style="max-width: 1600px;">
      <!-- 页面标题 -->
      <div class="page-header mb-5">
        <h1 class="display-title">
          灵感片段
          <span class="draft-count" v-if="drafts.length > 0">{{ drafts.length }}</span>
        </h1>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <p class="mt-3 text-muted">正在整理思绪...</p>
      </div>
      
      <!-- 空状态提示 -->
      <div v-else-if="drafts.length === 0" class="empty-incubator">
        <div class="paper-icon">
          <i class="far fa-file"></i>
          <span class="cursor-blink">|</span>
        </div>
        <h3 class="empty-title">每一个伟大的想法，都始于一次涂鸦。</h3>
        <router-link to="/publish" class="btn btn-hive-gold mt-4">
          开始你的杰作
        </router-link>
      </div>
      
      <!-- 草稿墙 (Masonry/Grid) -->
      <div v-else class="drafts-grid">
        <div
          v-for="(draft, index) in drafts"
          :key="draft.articleId"
          class="draft-note"
          @click="editDraft(draft.articleId)"
          data-aos="fade-up"
          :data-aos-delay="index * 50"
        >
          <div class="note-content">
            <h3 class="note-title">
              {{ draft.title || '无标题灵感' }}
            </h3>
            <p class="note-excerpt">
              {{ draft.content ? (draft.content.length > 150 ? draft.content.substring(0, 150) + '...' : draft.content) : '暂无内容...' }}
            </p>
            <div class="note-meta">
              <span class="note-time">{{ formatTime(draft.gmtModified || draft.gmtCreate) }}</span>
            </div>
          </div>
          
          <!-- 悬浮操作按钮 -->
          <div class="note-actions">
            <button class="action-btn edit-btn" @click.stop="editDraft(draft.articleId)" title="编辑">
              <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn delete-btn" @click.stop="confirmDeleteDraft(draft.articleId)" title="删除">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除草稿确认弹窗 -->
    <ConfirmDeleteModal
      :visible="showDeleteDraftModal"
      title="丢弃灵感"
      :message="`您确定要丢弃「${draftToDelete?.title || '无标题灵感'}」吗？`"
      warning-message="删除后，这个想法将永远消失。"
      confirm-text="确认丢弃"
      @confirm="deleteDraft"
      @cancel="closeDeleteDraftModal"
      @close="closeDeleteDraftModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { articleAPI } from '@/api/article'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'

const router = useRouter()
const drafts = ref([])
const loading = ref(true)
const draftToDelete = ref(null)
const showDeleteDraftModal = ref(false)

// 格式化时间
const formatTime = (dateString) => {
  if (!dateString) return ''
  
  const now = new Date()
  const date = new Date(dateString)
  const diff = now - date
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  return '刚刚'
}

// 加载草稿列表
const loadDrafts = async () => {
  try {
    loading.value = true
    const response = await articleAPI.getDrafts()
    
    if (response && response.records) {
      drafts.value = response.records
    } else if (response && response.data && response.data.records) {
      drafts.value = response.data.records
    } else {
      drafts.value = []
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
    drafts.value = []
  } finally {
    loading.value = false
  }
}

// 编辑草稿
const editDraft = (draftId) => {
  router.push(`/publish?draft=${draftId}`)
}

// 确认删除草稿
const confirmDeleteDraft = (draftId) => {
  const draft = drafts.value.find(d => d.articleId === draftId)
  draftToDelete.value = draft
  showDeleteDraftModal.value = true
}

// 删除草稿
const deleteDraft = async () => {
  if (!draftToDelete.value) return
  
  try {
    await articleAPI.deleteDraft(draftToDelete.value.articleId)
    await loadDrafts()
    window.$toast.success(`灵感「${draftToDelete.value.title || '无标题灵感'}」已丢弃`)
  } catch (error) {
    console.error('删除草稿失败:', error)
    window.$toast.error('操作失败，请稍后重试')
  } finally {
    closeDeleteDraftModal()
  }
}

// 关闭删除草稿弹窗
const closeDeleteDraftModal = () => {
  showDeleteDraftModal.value = false
  draftToDelete.value = null
}

onMounted(() => {
  loadDrafts()
})
</script>

<style scoped>
.drafts-page {
  padding: 4rem 2rem;
  background-color: #fcfcfc; /* 极简白背景 */
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

/* 标题样式 */
.page-header {
  margin-bottom: 3rem;
}

.display-title {
  font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 3rem;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.02em;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.draft-count {
  font-size: 1rem;
  font-weight: 600;
  color: #86868b;
  background: #f5f5f7;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  transform: translateY(5px);
}

/* 网格布局 */
.drafts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  padding-bottom: 4rem;
}

/* 便签卡片 */
.draft-note {
  background-color: #fffdf5; /* 暖黄色便签纸 */
  border: 1px dashed rgba(0, 0, 0, 0.08); /* 虚线边框 */
  padding: 1.5rem;
  min-height: 280px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border-radius: 2px; /* 稍微圆角，保持纸张感 */
}

/* 随机旋转效果 (模拟贴在墙上) - 使用 nth-child */
.draft-note:nth-child(3n+1) { transform: rotate(-1deg); }
.draft-note:nth-child(3n+2) { transform: rotate(1deg); }
.draft-note:nth-child(3n+3) { transform: rotate(0.5deg); }

.draft-note:hover {
  transform: translateY(-5px) rotate(0) scale(1.02);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
  border-color: rgba(255, 193, 7, 0.3);
  z-index: 10;
}

.note-content {
  flex: 1;
}

.note-title {
  font-family: "SF Pro Display", serif; /* 尝试衬线体或手写感 */
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.note-excerpt {
  font-family: "SF Pro Text", sans-serif;
  font-size: 1rem;
  color: rgba(60, 60, 67, 0.7); /* 褪色处理 */
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.note-meta {
  margin-top: auto;
  font-size: 0.85rem;
  color: #a1a1a6;
  font-style: italic;
}

/* 悬浮操作按钮 */
.note-actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.draft-note:hover .note-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.edit-btn {
  color: #0071e3;
}

.edit-btn:hover {
  background: #0071e3;
  color: white;
}

.delete-btn {
  color: #ff3b30;
}

.delete-btn:hover {
  background: #ff3b30;
  color: white;
}

/* 空状态 */
.empty-incubator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  text-align: center;
}

.paper-icon {
  font-size: 5rem;
  color: #e5e5ea;
  margin-bottom: 2rem;
  position: relative;
}

.cursor-blink {
  position: absolute;
  right: -10px;
  bottom: 10px;
  font-size: 3rem;
  color: #ffc107;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.empty-title {
  font-family: "SF Pro Display", sans-serif;
  font-size: 1.8rem;
  font-weight: 500;
  color: #86868b;
  margin-bottom: 1rem;
}

.btn-hive-gold {
  background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
  color: #1d1d1f;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  transition: all 0.3s ease;
}

.btn-hive-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 193, 7, 0.4);
  color: #000;
}

/* 响应式 */
@media (max-width: 768px) {
  .drafts-grid {
    grid-template-columns: 1fr;
  }
  
  .display-title {
    font-size: 2.2rem;
  }
  
  .draft-note:nth-child(n) {
    transform: none; /* 移动端取消旋转，保持整洁 */
  }
  
  .note-actions {
    opacity: 1; /* 移动端常驻显示 */
    transform: translateY(0);
    position: static;
    margin-top: 1rem;
    justify-content: flex-end;
  }
}
</style>
