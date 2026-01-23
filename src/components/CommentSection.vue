<template>
  <div id="article-comments" class="comment-section glass-panel">
    <div class="comment-header">
      <h3 class="comment-title">
        <i class="fas fa-comments me-2"></i>
        评论 <span class="comment-count">({{ totalComments }})</span>
      </h3>
    </div>

    <!-- 评论输入框 (Creation Stage) -->
    <div v-if="authStore.isAuthenticated" class="comment-creation-wrapper">
      <div 
        class="comment-creation-stage glass-panel"
        :class="{ 'is-active': isFocused || newComment }"
      >
        <div class="stage-params">
          <img 
            :src="getAuthorAvatarUrl(authStore.user?.avatarUrl)" 
            alt="My Avatar" 
            class="stage-avatar"
          />
          
          <div class="stage-content">
            <textarea
              v-model="newComment"
              class="stage-input"
              :class="{ 'expanded': isFocused || newComment }"
              :placeholder="isFocused ? '' : '分享你的见解...'"
              :rows="isFocused || newComment ? 4 : 1"
              :disabled="submitting"
              ref="commentTextarea"
              @focus="handleFocus"
              @keydown.ctrl.enter="submitComment"
              @keydown.meta.enter="submitComment"
            ></textarea>

            <div v-if="!isFocused && !newComment" class="stage-placeholder" @click="handleFocus">
              分享你的见解...
            </div>
            
            <!-- Tool Bar (Slides out) -->
            <div class="stage-toolbar" v-show="isFocused || newComment">
              <div class="stage-tools-left">
                <div class="emoji-wrapper">
                  <button 
                    class="tool-btn" 
                    title="Add Emoji" 
                    @click.stop="toggleEmojiPicker($event)"
                    :class="{ 'active': showEmojiPicker }"
                  >
                    <i class="far fa-smile"></i>
                  </button>
                  
                  <!-- Use Teleport to move the picker to body to avoid ANY stacking context / overflow issues -->
                  <teleport to="body">
                    <transition name="pop-up">
                      <div v-if="showEmojiPicker" class="emoji-popover fixed-picker" :style="pickerStyle">
                         <EmojiPicker 
                           :native="true" 
                           @select="onSelectEmoji"
                           @emoji-click="onSelectEmoji"
                           theme="light"
                           :hide-search="false"
                           :hide-group-icons="false"
                           :hide-group-names="true"
                           class="isolated-emoji-picker"
                         />
                      </div>
                    </transition>
                  </teleport>
                </div>

                <button class="tool-btn" title="Add Image (Coming Soon)">
                  <i class="far fa-image"></i>
                </button>
                <span class="tool-divider"></span>
                <span class="markdown-hint">
                  <i class="fab fa-markdown"></i> 支持 Markdown
                </span>
              </div>
              
              <div class="stage-actions">
                <button 
                  v-if="!newComment.trim()"
                  @click="isFocused = false" 
                  class="btn-text-cancel"
                >
                  收起
                </button>
                <button
                  @click="submitComment"
                  class="apple-btn-primary"
                  :disabled="!newComment.trim() || submitting"
                >
                  <div v-if="submitting" class="spinner-inline me-1"></div>
                  <i v-else class="fas fa-paper-plane me-1"></i>
                  {{ submitting ? '发送中' : '发布' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未登录提示 -->
    <div v-else class="comment-login-prompt">
      <div class="login-prompt-content">
        <i class="fas fa-sign-in-alt login-prompt-icon"></i>
        <p class="login-prompt-text">请先登录后再发表评论</p>
        <router-link to="/login" class="btn btn-warning btn-sm">
          <i class="fas fa-sign-in-alt me-1"></i>
          立即登录
        </router-link>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <!-- 加载中 -->
      <div v-if="loading" class="comments-loading">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <p class="mt-3 text-muted">正在加载评论...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="comments.length === 0" class="comments-empty">
        <i class="fas fa-comment-slash empty-icon"></i>
        <p class="empty-text">还没有评论，快来抢沙发吧！</p>
      </div>

      <!-- 评论项 -->
      <div v-else class="comments-container">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :article-id="articleId"
          @reply="handleReply"
          @refresh="loadComments"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { commentAPI } from '@/api/comment'
import { getAuthorAvatarUrl } from '@/utils/avatar-helper'
import CommentItem from './CommentItem.vue'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

const props = defineProps({
  articleId: {
    type: Number,
    required: true
  }
})

const authStore = useAuthStore()
const comments = ref([])
const newComment = ref('')
const submitting = ref(false)
const loading = ref(true)
const replyingTo = ref(null)
const isFocused = ref(false)
const showEmojiPicker = ref(false)
const commentTextarea = ref(null)
const pickerStyle = ref({ top: '0px', left: '0px' })

const toggleEmojiPicker = (event) => {
  if (!showEmojiPicker.value) {
    // Calculate position before showing
    const rect = event.currentTarget.getBoundingClientRect()
    pickerStyle.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${rect.left + window.scrollX}px`
    }
    showEmojiPicker.value = true
    
    // Add one-time click-away listener
    setTimeout(() => {
      window.addEventListener('click', closeField)
    }, 10)
  } else {
    showEmojiPicker.value = false
    window.removeEventListener('click', closeField)
  }
}

const closeField = (e) => {
  if (!e.target.closest('.isolated-emoji-picker')) {
    showEmojiPicker.value = false
    window.removeEventListener('click', closeField)
  }
}

onUnmounted(() => {
  window.removeEventListener('click', closeField)
})

// Focus handlers
const handleFocus = () => {
  isFocused.value = true
}

const handleCancel = () => {
  if (!newComment.value.trim()) {
    isFocused.value = false
  }
}

// Click outside to collapse if empty
const handleBlur = (e) => {
  // We'll handle this via a click-outside directive or just relying on the "Cancel" button for now to keep it simple and explicit as per "Creative Stage" metaphor (you don't just accidentally leave a stage).
  // But strictly, if user clicks away and it's empty, it's nice to collapse.
  // For now, let's keep it expanded until they hit cancel or submit if they typed something, 
  // or if they didn't type anything, maybe we can auto-collapse on blur? 
  // Let's stick to explicit interactions for "Ceremony".
}

// 计算总评论数（包括回复）
const totalComments = computed(() => {
  let count = comments.value.length
  comments.value.forEach(comment => {
    if (comment.replies && comment.replies.length > 0) {
      count += comment.replies.length
    }
  })
  return count
})

// 加载评论
const loadComments = async () => {
  try {
    loading.value = true
    const response = await commentAPI.getCommentsByArticleId(props.articleId)
    comments.value = response || []
  } catch (error) {
    console.error('加载评论失败:', error)
    if (window.$toast) {
      window.$toast.error('加载评论失败，请稍后重试')
    }
    comments.value = []
  } finally {
    loading.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim() || submitting.value) return

  if (!authStore.isAuthenticated) {
    if (window.$toast) {
      window.$toast.warning('请先登录后再发表评论')
    }
    return
  }

  try {
    submitting.value = true
    await commentAPI.addComment(props.articleId, newComment.value.trim(), replyingTo.value)
    
    // 清空输入框
    newComment.value = ''
    replyingTo.value = null
    
    // 重新加载评论
    await loadComments()
    
    if (window.$toast) {
      window.$toast.success('评论发表成功！')
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    if (error.status === 401) {
      if (window.$toast) {
        window.$toast.warning('登录已过期，请重新登录')
      }
    } else {
      if (window.$toast) {
        window.$toast.error('发表评论失败，请稍后重试')
      }
    }
  } finally {
    submitting.value = false
  }
}

// 处理回复
const handleReply = (commentId) => {
  replyingTo.value = commentId
  // 滚动到评论输入框
  const commentForm = document.querySelector('.comment-form-wrapper')
  if (commentForm) {
    commentForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 聚焦到输入框
    setTimeout(() => {
      const textarea = document.querySelector('.comment-input')
      if (textarea) {
        textarea.focus()
      }
    }, 300)
  }
}

onMounted(() => {
  loadComments()
})

const onSelectEmoji = (emoji) => {
  console.log('TELEPORTED Emoji interaction detected:', emoji)
  
  let char = ''
  if (typeof emoji === 'string') {
    char = emoji
  } else if (emoji) {
    // vue3-emoji-picker 1.1.8+ uses 'i' for character in most cases
    char = emoji.i || emoji.native || emoji.emoji || emoji.data || ''
  }
  
  if (char) {
    newComment.value += char
  }
  
  showEmojiPicker.value = false
  window.removeEventListener('click', closeField)
  
  setTimeout(() => {
    if (commentTextarea.value) {
      commentTextarea.value.focus()
    }
  }, 100)
}
</script>

<style scoped>
.comment-section {
  margin-top: 4rem;
  padding: 2.5rem;
  /* background: white; removed for glass-panel */
  border-radius: 24px;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); removed for glass-panel */
}

.comment-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.comment-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--apple-text);
  margin: 0;
  display: flex;
  align-items: center;
}

.comment-title i {
  color: var(--hive-gold);
}

.comment-count {
  font-size: 1rem;
  font-weight: 400;
  color: #718096;
  margin-left: 0.5rem;
}

/* === Creation Stage (Input Box) === */
.comment-creation-wrapper {
  margin-bottom: 3rem;
  position: relative;
  z-index: 100; /* Increased to ensure popovers overlay the comment list */
}

.comment-creation-stage {
  padding: 10px 16px; /* Compact initially */
  border-radius: 100px; /* Pill shape initially */
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  /* overflow: hidden; Removed to allow popover to spill out if needed, but we check if we need visible */
  overflow: visible; 
}

.comment-creation-stage.is-active {
  border-radius: 24px; /* Card shape when active */
  background: rgba(255, 255, 255, 0.85); /* More opaque */
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  padding: 20px;
  align-items: flex-start;
}

.stage-params {
  display: flex;
  width: 100%;
  gap: 16px;
}

.stage-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 193, 7, 0.3);
  box-shadow: 0 2px 8px rgba(246, 185, 59, 0.2);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.is-active .stage-avatar {
  width: 48px;
  height: 48px;
  border-color: var(--hive-gold);
}

.stage-content {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.stage-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 1rem;
  color: var(--apple-text);
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  transition: height 0.4s ease;
  outline: none;
}

/* Hide placeholder in active mode if we want custom interactions, 
   but native placeholder is fine usually. 
   Here we use a overlay placeholder for the initial 'Pill' look if needed, 
   but changing rows + height is enough.
*/
.stage-input::placeholder {
  color: transparent; /* We use the div placeholder for the pill state */
}

.stage-placeholder {
  position: absolute;
  top: 9px;
  left: 0;
  color: #888;
  pointer-events: none; /* Let clicks pass through to textarea if overlapped, or handle click explicitly */
  font-size: 1rem;
  opacity: 1;
  transition: opacity 0.2s;
  font-weight: 500;
  cursor: text;
}

.stage-input:focus + .stage-placeholder,
.is-active .stage-placeholder {
  opacity: 0;
  pointer-events: none;
}

/* Toolbar */
.stage-toolbar {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideDown 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  border-top: 1px solid rgba(0,0,0,0.05);
  padding-top: 12px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stage-tools-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.tool-btn:hover {
  color: var(--hive-gold);
  background: rgba(246, 185, 59, 0.1);
}

.tool-divider {
  width: 1px;
  height: 16px;
  background: #eee;
  margin: 0 4px;
}

.markdown-hint {
  font-size: 0.8rem;
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stage-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-text-cancel {
  background: none;
  border: none;
  color: #666;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-text-cancel:hover {
  background: rgba(0,0,0,0.05);
}

.apple-btn-primary {
  background: linear-gradient(135deg, var(--hive-gold) 0%, #e5a52a 100%);
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(246, 185, 59, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
}

.apple-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(246, 185, 59, 0.4);
  filter: brightness(1.05);
}

.apple-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}


/* 未登录提示 */
.comment-login-prompt {
  margin-bottom: 2rem;
  padding: 3rem;
  background: rgba(246, 185, 59, 0.05);
  border-radius: 24px;
  border: 1px dashed var(--hive-gold);
  text-align: center;
  backdrop-filter: blur(10px);
}

.login-prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login-prompt-icon {
  font-size: 3rem;
  color: var(--hive-gold);
  margin-bottom: 1rem;
}

.login-prompt-text {
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0;
}

/* 评论列表 */
.comments-list {
  margin-top: 2rem;
  position: relative;
  z-index: 1; /* Explicitly lower than creation-wrapper (100) */
}

.comments-loading {
  text-align: center;
  padding: 3rem 0;
}

.comments-empty {
  text-align: center;
  padding: 3rem 0;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e0;
  margin-bottom: 1rem;
  pointer-events: none; /* Crucial: prevent icon from stealing clicks from floating popovers */
  user-select: none;
}

.empty-text {
  color: #718096;
  font-size: 1.1rem;
  margin: 0;
}

.comments-container {
  display: flex;
  flex-direction: column;
  /* Phase 2: No Lines, Just Space (32px gap) */
  gap: 2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-section {
    padding: 1.5rem;
    margin-top: 2rem;
  }

  .comment-title {
    font-size: 1.3rem;
  }

  .comment-form {
    padding: 1rem;
  }

  .comment-form-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .comment-submit-btn {
    width: 100%;
  }
}

/* Custom Spinner Styles */
.spinner-inline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* === Emoji Picker (Glass Popover) === */
.emoji-wrapper {
  position: relative;
}

.tool-btn.active {
  color: var(--hive-gold);
  background: rgba(246, 185, 59, 0.1);
}

.emoji-popover {
  position: absolute;
  top: 120%; /* Show below instead of above to avoid clipping */
  left: 0;
  margin-top: 8px; /* replaced margin-bottom */
  z-index: 10000 !important; /* Extremely high to overrule everything */
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.2);
  /* Use solid background to ensure it's not transparent to clicks/visibility */
  background: white !important; 
  border: 1px solid rgba(0,0,0,0.1);
  overflow: hidden;
}

.fixed-picker {
  position: absolute !important;
  z-index: 999999 !important; /* Maximum possible */
  background: white !important;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.25);
  border: 1px solid rgba(0,0,0,0.1);
}

.isolated-emoji-picker {
  --ep-color-bg: #ffffff !important;
  height: 320px !important;
  width: 320px !important;
  border-radius: 16px !important;
}

/* Transition for Popover */
.pop-up-enter-active,
.pop-up-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pop-up-enter-from,
.pop-up-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>

