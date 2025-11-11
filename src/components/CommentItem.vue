<template>
  <div class="comment-item" :class="{ 'has-replies': comment.replies && comment.replies.length > 0 }">
    <div class="comment-main">
      <div class="comment-avatar-wrapper">
        <router-link :to="`/profile/${comment.userName}`" class="comment-avatar-link">
          <img 
            :src="getAuthorAvatarUrl(comment.avatarUrl)" 
            :alt="comment.userName" 
            class="comment-avatar"
          />
        </router-link>
      </div>
      
      <div class="comment-content-wrapper">
        <div class="comment-header">
          <div class="comment-author-info">
            <router-link :to="`/profile/${comment.userName}`" class="comment-author-name">
              {{ comment.userName || '匿名用户' }}
            </router-link>
            <span class="comment-time">{{ formatTime(comment.gmtCreate) }}</span>
          </div>
        </div>
        
        <div class="comment-body">
          <p class="comment-text">{{ comment.content }}</p>
        </div>
        
        <div class="comment-actions">
          <button
            v-if="authStore.isAuthenticated"
            @click="handleReplyClick"
            class="comment-action-btn"
            :class="{ 'replying': isReplying }"
          >
            <i class="fas fa-reply me-1"></i>
            {{ isReplying ? '取消回复' : '回复' }}
          </button>
          <button
            v-if="authStore.isAuthenticated && isMyComment"
            @click="handleDeleteClick"
            class="comment-action-btn comment-delete-btn"
            :disabled="deleting"
          >
            <i v-if="deleting" class="fas fa-spinner fa-spin me-1"></i>
            <i v-else class="fas fa-trash me-1"></i>
            {{ deleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 回复表单 -->
    <div v-if="isReplying && authStore.isAuthenticated" class="reply-form-wrapper">
      <div class="reply-form">
        <div class="reply-form-header">
          <img 
            :src="getAuthorAvatarUrl(authStore.user?.avatarUrl)" 
            alt="我的头像" 
            class="reply-form-avatar"
          />
          <span class="reply-form-username">回复 {{ comment.userName }}</span>
        </div>
        <div class="reply-form-body">
          <textarea
            v-model="replyContent"
            class="reply-input"
            placeholder="写下你的回复..."
            rows="3"
            :disabled="submitting"
          ></textarea>
          <div class="reply-form-footer">
            <button
              @click="cancelReply"
              class="btn btn-sm btn-outline-secondary"
              :disabled="submitting"
            >
              取消
            </button>
            <button
              @click="submitReply"
              class="btn btn-sm btn-warning"
              :disabled="!replyContent.trim() || submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin me-1"></i>
              <i v-else class="fas fa-paper-plane me-1"></i>
              {{ submitting ? '提交中...' : '发表回复' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 回复列表 -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
      <div class="replies-divider"></div>
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :article-id="articleId"
        :is-reply="true"
        @reply="handleReply"
        @refresh="handleRefresh"
      />
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDeleteModal
      :visible="showDeleteModal"
      title="删除评论"
      message="您确定要删除这条评论吗？"
      warning-message="删除后，该评论将无法恢复。"
      confirm-text="确认删除"
      @confirm="handleDeleteConfirm"
      @cancel="closeDeleteModal"
      @close="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { commentAPI } from '@/api/comment'
import { getAuthorAvatarUrl } from '@/utils/avatar-helper'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  articleId: {
    type: Number,
    required: true
  },
  isReply: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['reply', 'refresh'])

const authStore = useAuthStore()
const isReplying = ref(false)
const replyContent = ref('')
const submitting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)

// 判断是否是当前用户的评论
const isMyComment = computed(() => {
  return authStore.user && props.comment.userId === authStore.user.id
})

// 格式化时间
const formatTime = (dateString) => {
  if (!dateString) return ''
  
  const now = new Date()
  const date = new Date(dateString)
  const diff = now - date
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)
  
  if (years > 0) return `${years}年前`
  if (months > 0) return `${months}个月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 处理回复点击
const handleReplyClick = () => {
  if (!authStore.isAuthenticated) {
    if (window.$toast) {
      window.$toast.warning('请先登录后再回复')
    }
    return
  }
  
  isReplying.value = !isReplying.value
  if (isReplying.value) {
    emit('reply', props.comment.id)
    // 聚焦到回复输入框
    setTimeout(() => {
      const textarea = document.querySelector('.reply-input')
      if (textarea) {
        textarea.focus()
      }
    }, 100)
  }
}

// 取消回复
const cancelReply = () => {
  isReplying.value = false
  replyContent.value = ''
}

// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim() || submitting.value) return

  try {
    submitting.value = true
    await commentAPI.addComment(props.articleId, replyContent.value.trim(), props.comment.id)
    
    // 清空输入框并关闭回复表单
    replyContent.value = ''
    isReplying.value = false
    
    // 刷新评论列表
    emit('refresh')
    
    if (window.$toast) {
      window.$toast.success('回复发表成功！')
    }
  } catch (error) {
    console.error('发表回复失败:', error)
    if (error.status === 401) {
      if (window.$toast) {
        window.$toast.warning('登录已过期，请重新登录')
      }
    } else {
      if (window.$toast) {
        window.$toast.error('发表回复失败，请稍后重试')
      }
    }
  } finally {
    submitting.value = false
  }
}

// 处理子组件的回复事件
const handleReply = (commentId) => {
  emit('reply', commentId)
}

// 处理子组件的刷新事件
const handleRefresh = () => {
  emit('refresh')
}

// 处理删除点击
const handleDeleteClick = () => {
  showDeleteModal.value = true
}

// 关闭删除弹窗
const closeDeleteModal = () => {
  showDeleteModal.value = false
}

// 确认删除
const handleDeleteConfirm = async () => {
  try {
    deleting.value = true
    showDeleteModal.value = false
    
    await commentAPI.deleteComment(props.comment.id)
    
    // 刷新评论列表
    emit('refresh')
    
    if (window.$toast) {
      window.$toast.success('评论已删除')
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    if (error.status === 401) {
      if (window.$toast) {
        window.$toast.warning('登录已过期，请重新登录')
      }
    } else if (error.status === 403) {
      if (window.$toast) {
        window.$toast.warning('无权删除该评论')
      }
    } else {
      if (window.$toast) {
        window.$toast.error('删除评论失败，请稍后重试')
      }
    }
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.comment-item {
  position: relative;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.comment-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #f6d55c;
}

.comment-item.has-replies {
  padding-bottom: 0.5rem;
}

.comment-main {
  display: flex;
  gap: 1rem;
}

.comment-avatar-wrapper {
  flex-shrink: 0;
}

.comment-avatar-link {
  display: block;
  transition: transform 0.3s ease;
}

.comment-avatar-link:hover {
  transform: scale(1.05);
}

.comment-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f1f5f9;
  transition: all 0.3s ease;
}

.comment-avatar-link:hover .comment-avatar {
  border-color: #f6d55c;
  box-shadow: 0 2px 8px rgba(246, 213, 92, 0.3);
}

.comment-content-wrapper {
  flex: 1;
  min-width: 0;
}

.comment-header {
  margin-bottom: 0.75rem;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.comment-author-name {
  font-weight: 600;
  color: #2d3748;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;
}

.comment-author-name:hover {
  color: #f6d55c;
  text-decoration: none;
}

.comment-time {
  font-size: 0.85rem;
  color: #718096;
}

.comment-body {
  margin-bottom: 1rem;
}

.comment-text {
  margin: 0;
  color: #4a5568;
  line-height: 1.7;
  font-size: 1rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.comment-action-btn {
  background: none;
  border: none;
  color: #718096;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.comment-action-btn:hover {
  background: #f8f9fa;
  color: #f6d55c;
}

.comment-action-btn.replying {
  color: #f6d55c;
  background: rgba(246, 213, 92, 0.1);
}

.comment-delete-btn {
  color: #e53e3e;
}

.comment-delete-btn:hover:not(:disabled) {
  background: rgba(229, 62, 62, 0.1);
  color: #c53030;
}

.comment-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 回复表单 */
.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 3.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.reply-form {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.reply-form-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.reply-form-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f6d55c;
}

.reply-form-username {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3748;
}

.reply-form-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reply-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
}

.reply-input:focus {
  outline: none;
  border-color: #f6d55c;
  box-shadow: 0 0 0 3px rgba(246, 213, 92, 0.1);
}

.reply-input:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

.reply-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 回复列表 */
.replies-container {
  margin-top: 1rem;
  margin-left: 3.5rem;
  padding-left: 1.5rem;
  border-left: 2px solid #e2e8f0;
}

.replies-divider {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 1rem;
}

/* 回复项样式调整 */
.replies-container .comment-item {
  background: #f8f9fa;
  border-color: #e2e8f0;
  padding: 1rem;
}

.replies-container .comment-avatar {
  width: 40px;
  height: 40px;
}

.replies-container .comment-author-name {
  font-size: 0.95rem;
}

.replies-container .comment-text {
  font-size: 0.95rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-item {
    padding: 1rem;
  }

  .comment-main {
    gap: 0.75rem;
  }

  .comment-avatar {
    width: 40px;
    height: 40px;
  }

  .replies-container {
    margin-left: 2.5rem;
    padding-left: 1rem;
  }

  .reply-form-wrapper {
    margin-left: 2.5rem;
  }
}
</style>

