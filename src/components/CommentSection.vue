<template>
  <div id="article-comments" class="comment-section">
    <div class="comment-header">
      <h3 class="comment-title">
        <i class="fas fa-comments me-2"></i>
        评论 <span class="comment-count">({{ totalComments }})</span>
      </h3>
    </div>

    <!-- 评论输入框 -->
    <div v-if="authStore.isAuthenticated" class="comment-form-wrapper">
      <div class="comment-form">
        <div class="comment-form-header">
          <img 
            :src="getAuthorAvatarUrl(authStore.user?.avatarUrl)" 
            alt="我的头像" 
            class="comment-form-avatar"
          />
          <span class="comment-form-username">{{ authStore.user?.name || '我' }}</span>
        </div>
        <div class="comment-form-body">
          <textarea
            v-model="newComment"
            class="comment-input"
            placeholder="写下你的评论..."
            rows="4"
            :disabled="submitting"
            @keydown.ctrl.enter="submitComment"
            @keydown.meta.enter="submitComment"
          ></textarea>
          <div class="comment-form-footer">
            <div class="comment-tips">
              <small class="text-muted">
                <i class="fas fa-lightbulb me-1"></i>
                支持 Markdown 语法，Ctrl/Cmd + Enter 快速提交
              </small>
            </div>
            <button
              @click="submitComment"
              class="btn btn-warning comment-submit-btn"
              :disabled="!newComment.trim() || submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-paper-plane me-1"></i>
              {{ submitting ? '提交中...' : '发表评论' }}
            </button>
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { commentAPI } from '@/api/comment'
import { getAuthorAvatarUrl } from '@/utils/avatar-helper'
import CommentItem from './CommentItem.vue'

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
</script>

<style scoped>
.comment-section {
  margin-top: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.comment-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.comment-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
}

.comment-title i {
  color: #f6d55c;
}

.comment-count {
  font-size: 1rem;
  font-weight: 400;
  color: #718096;
  margin-left: 0.5rem;
}

/* 评论表单 */
.comment-form-wrapper {
  margin-bottom: 2rem;
}

.comment-form {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.comment-form-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.comment-form-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f6d55c;
}

.comment-form-username {
  font-weight: 600;
  color: #2d3748;
}

.comment-form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
}

.comment-input:focus {
  outline: none;
  border-color: #f6d55c;
  box-shadow: 0 0 0 3px rgba(246, 213, 92, 0.1);
}

.comment-input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.comment-form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-tips {
  flex: 1;
}

.comment-submit-btn {
  padding: 0.6rem 1.5rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.comment-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(246, 213, 92, 0.3);
}

.comment-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 未登录提示 */
.comment-login-prompt {
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #fff9c4 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px dashed #f6d55c;
  text-align: center;
}

.login-prompt-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.login-prompt-icon {
  font-size: 3rem;
  color: #f6d55c;
}

.login-prompt-text {
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0;
}

/* 评论列表 */
.comments-list {
  margin-top: 2rem;
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
}

.empty-text {
  color: #718096;
  font-size: 1.1rem;
  margin: 0;
}

.comments-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
</style>

