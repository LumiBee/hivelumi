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
           <!-- Mock Like Button (Interactive Micro-feedback) -->
          <button 
            class="comment-action-btn comment-like-btn" 
            :class="{ 'liked': isLiked }"
            @click="toggleLike"
            title="点赞"
          >
            <i :class="isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
          </button>
          
          <button
            v-if="authStore.isAuthenticated"
            @click="handleReplyClick"
            class="comment-action-btn"
            :class="{ 'replying': isReplying }"
          >
            <i class="fas fa-reply"></i>
            {{ isReplying ? '取消' : '回复' }}
          </button>
          
          <button
            class="comment-action-btn"
            title="Report"
          >
             <i class="fas fa-flag"></i>
          </button>

          <button
            v-if="authStore.isAuthenticated && isMyComment"
            @click="handleDeleteClick"
            class="comment-action-btn comment-delete-btn"
            :disabled="deleting"
          >
            <div v-if="deleting" class="spinner-inline me-1"></div>
            <i v-else class="fas fa-trash"></i>
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
          <div class="reply-input-wrapper">
            <textarea
              v-model="replyContent"
              class="reply-input"
              placeholder="写下你的回复..."
              rows="3"
              :disabled="submitting"
              ref="replyTextarea"
            ></textarea>
            
            <div class="reply-tools">
              <div class="emoji-wrapper">
                <button 
                  class="tool-btn" 
                  title="添加表情" 
                  @click.stop="toggleEmojiPicker"
                  :class="{ 'active': showEmojiPicker }"
                >
                  <i class="far fa-smile"></i>
                </button>
                
                <transition name="pop-up">
                  <div v-if="showEmojiPicker" class="emoji-popover glass-panel">
                     <EmojiPicker 
                       :native="true" 
                       @select="onSelectEmoji"
                       @emoji-click="onSelectEmoji"
                       theme="light"
                       :hide-group-names="true"
                       class="custom-emoji-picker"
                     />
                  </div>
                </transition>
              </div>
            </div>
          </div>
          <div class="reply-form-footer">
            <button
              @click="cancelReply"
              class="apple-btn-secondary apple-btn-sm"
              :disabled="submitting"
            >
              取消
            </button>
            <button
              @click="submitReply"
              class="apple-btn-primary apple-btn-sm"
              :disabled="!replyContent.trim() || submitting"
            >
              <div v-if="submitting" class="spinner-inline me-1"></div>
              <i v-else class="fas fa-paper-plane me-1"></i>
              {{ submitting ? '发送中' : '发布回复' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 回复列表 (With Luminescent Thread) -->
    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
      <div class="replies-thread-line"></div>
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
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

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
const isLiked = ref(false)
const showEmojiPicker = ref(false)
const replyTextarea = ref(null)

const onSelectEmoji = (emoji) => {
  console.log('Emoji selected in reply interaction:', emoji)
  let char = ''
  if (typeof emoji === 'string') {
    char = emoji
  } else if (emoji) {
    char = emoji.i || emoji.native || emoji.emoji || emoji.data || ''
  }
  
  if (char) {
    console.log('Inserting emoji character into reply:', char)
    replyContent.value += char
  }
  showEmojiPicker.value = false
  
  // Refocus
  setTimeout(() => {
    if (replyTextarea.value) {
      replyTextarea.value.focus()
    }
  }, 100)
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

// Toggle Like (Visual Only)
const toggleLike = () => {
  isLiked.value = !isLiked.value
  // Optional: Trigger haptic feedback if possible, or just rely on animation
}

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
/* === Phase 2: Card Design (No Lines, Just Space) === */
.comment-item {
  position: relative;
  padding: 1.5rem;
  /* Glass Card Style */
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px; /* Reduced from circle to super-ellipse feel */
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Hover Effect: Lift & Brighten */
.comment-item:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 20px 40px -12px rgba(246, 185, 59, 0.15); /* Golden glow shadow */
  border-color: rgba(255, 255, 255, 0.8);
  z-index: 2;
}

.comment-item.has-replies {
  padding-bottom: 2rem; /* Extra space for threading */
}

.comment-main {
  display: flex;
  gap: 1.25rem;
}

.comment-avatar-wrapper {
  flex-shrink: 0;
  position: relative;
  z-index: 1; /* Above thread line */
}

.comment-avatar-link {
  display: block;
  transition: transform 0.3s ease;
}

.comment-avatar-link:hover {
  transform: scale(1.1) rotate(5deg);
}

.comment-avatar {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border-radius: 50%;
}

.comment-avatar-link:hover .comment-avatar {
  border-color: var(--hive-gold);
  box-shadow: 0 0 15px var(--hive-gold-glow);
}

.comment-content-wrapper {
  flex: 1;
  min-width: 0;
}

.comment-header {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.comment-author-name {
  font-weight: 700;
  color: var(--apple-text);
  text-decoration: none;
  font-size: 1.05rem;
  transition: color 0.3s ease;
}

.comment-author-name:hover {
  color: var(--hive-gold);
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
  background: rgba(0,0,0,0.03);
  padding: 2px 8px;
  border-radius: 100px;
}

.comment-body {
  margin-bottom: 1rem;
}

.comment-text {
  margin: 0;
  color: #4a5568; /* Slightly darker than gray-700 for readability */
  line-height: 1.7;
  font-size: 1.05rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* === Phase 4: Micro-interactions (Actions) === */
.comment-actions {
  display: flex;
  gap: 1rem;
  opacity: 0.4; /* Dimmed by default */
  transform: translateY(5px);
  transition: all 0.3s ease;
}

/* Show actions on hover */
.comment-item:hover .comment-actions {
  opacity: 1;
  transform: translateY(0);
}

.comment-action-btn {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Bouncy */
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Liquid Bounce on Hover */
.comment-action-btn:hover {
  background: rgba(246, 185, 59, 0.1);
  color: var(--hive-gold);
  transform: scale(1.1);
}

.comment-action-btn:active {
  transform: scale(0.95);
}

.comment-action-btn.replying {
  color: var(--hive-gold);
  background: rgba(246, 185, 59, 0.15);
  opacity: 1; /* Always visible if active */
}

/* Like Button Specifics (Mockup) */
.comment-like-btn {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.comment-like-btn:hover {
  transform: scale(1.1);
  background: rgba(224, 36, 94, 0.1);
  color: #e0245e;
}

.comment-like-btn.liked {
  color: #e0245e;
}

.comment-like-btn.liked .fa-heart {
  animation: heartBounce 0.6s cubic-bezier(0.280, 0.840, 0.420, 1);
}

@keyframes heartBounce {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.comment-delete-btn {
  color: #e53e3e;
}

.comment-delete-btn:hover:not(:disabled) {
  background: rgba(229, 62, 62, 0.1);
  color: #c53030;
}

/* 回复表单 (Restored) */
.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 1.5rem;
  padding-top: 1rem;
  /* border-top: 1px solid rgba(0,0,0,0.05); Reduced divider */
}

.reply-form {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.reply-form-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.reply-form-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border: 1px solid var(--hive-gold);
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.reply-form-username {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--apple-text);
  opacity: 0.8;
}

.reply-form-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reply-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;
}

.reply-input:focus {
  outline: none;
  border-color: var(--hive-gold);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 3px rgba(246, 185, 59, 0.15);
}

.reply-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reply-form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* === Phase 3: Nested Replies ("Luminescent Threads") === */
.replies-container {
  margin-top: 1.5rem;
  margin-left: 1.5rem; /* Align relative to avatar center simplified */
  padding-left: 2rem;
  position: relative;
  /* Removed border-left */
}
/* === Button Styles (Apple x Hive) === */
.apple-btn-primary {
  background: linear-gradient(135deg, var(--hive-gold) 0%, #e5a52a 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(246, 185, 59, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 6px;
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

.apple-btn-sm {
  padding: 6px 16px;
  font-size: 0.85rem;
}

.apple-btn-secondary {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #555;
  padding: 8px 20px;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(4px);
}

.apple-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  color: #333;
}

.btn-text-cancel {
  background: none;
  border: none;
  color: #888;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-text-cancel:hover {
  background: rgba(0,0,0,0.05);
  color: #333;
}

/* Luminescent Thread (The connecting line) */
.replies-thread-line {
  position: absolute;
  left: 0;
  top: -20px; /* Start from above to connect to parent */
  bottom: 20px;
  width: 2px;
  background: linear-gradient(
    to bottom, 
    rgba(246, 185, 59, 0) 0%, 
    rgba(246, 185, 59, 0.6) 30%, 
    rgba(246, 185, 59, 0.6) 70%, 
    rgba(246, 185, 59, 0) 100%
  );
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(246, 185, 59, 0.4);
  opacity: 0.7;
}

/* Ensure thread doesn't look weird on first item */
.replies-container .comment-item {
  background: rgba(255, 255, 255, 0.25); /* Slightly more transparent for nested */
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 1rem;
}

/* Override padding for nested items */
@media (max-width: 768px) {
  .replies-container {
    margin-left: 0;
    padding-left: 1rem;
    border-left: 2px solid rgba(246, 185, 59, 0.2); /* Fallback for mobile */
  }
  .replies-thread-line { display: none; } /* Hide complex line on mobile */
}

/* Custom Spinner Styles */
.spinner-inline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  border-top-color: var(--hive-gold);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


/* 回复表情相关样式 */
.reply-input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

.reply-tools {
  display: flex;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0 0 12px 12px;
  margin-top: -1px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-top: none;
}

.reply-input {
  border-radius: 12px 12px 0 0 !important;
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

.tool-btn:hover, .tool-btn.active {
  color: var(--hive-gold);
  background: rgba(246, 185, 59, 0.1);
}

.emoji-wrapper {
  position: relative;
}

.emoji-popover {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10000 !important;
  margin-top: 8px;
  border-radius: 16px;
  background: white !important;
  box-shadow: 0 12px 48px rgba(0,0,0,0.2);
  border: 1px solid rgba(0,0,0,0.1);
}

.custom-emoji-picker {
  height: 300px !important;
  width: 280px !important;
}

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

