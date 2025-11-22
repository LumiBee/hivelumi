<template>
  <div class="profile-page-wrapper">
    <!-- 1. Cinematic Cover -->
    <div class="cinematic-cover">
      <div class="cover-bg-wrapper">
        <LazyImage 
          v-if="profileData.user?.backgroundImgUrl"
          :src="getProcessedImageUrl(profileData.user.backgroundImgUrl)"
          :alt="`${profileData.user?.name || '用户'}的封面`"
          class="cover-image"
          fetchpriority="high"
        />
        <div class="cover-overlay"></div>
      </div>
      
      <!-- Cover Actions -->
      <div class="container position-relative h-100">
        <div v-if="isOwner" class="cover-actions">
          <button 
            class="apple-glass-btn" 
            :class="{ 'loading': isLoading }"
            @click="triggerFileUpload"
            :disabled="isLoading"
          >
            <i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-camera'"></i>
            <span class="btn-text">{{ isLoading ? '上传中...' : '更换封面' }}</span>
          </button>
          <input 
            ref="fileInput"
            type="file" 
            class="d-none" 
            accept="image/*"
            @change="handleCoverUpload"
            :disabled="isLoading"
          >
        </div>
      </div>
    </div>

    <!-- 2. Main Layout -->
    <div class="apple-container">
      <div class="profile-layout">
        
        <!-- Left: Main Content (Tabs & Lists) -->
        <div class="layout-main">
          <!-- Glass Tabs -->
          <div class="glass-tabs glass-panel mb-4">
            <button 
              class="tab-item" 
              :class="{ active: activeTab === 'articles' }"
              @click="activeTab = 'articles'"
            >
              <span class="tab-label">文章</span>
              <span class="tab-count">{{ profileData.articleCount || 0 }}</span>
              <div class="active-indicator"></div>
            </button>
            <button 
              class="tab-item" 
              :class="{ active: activeTab === 'followers' }"
              @click="activeTab = 'followers'"
            >
              <span class="tab-label">粉丝</span>
              <span class="tab-count">{{ profileData.followersCount || 0 }}</span>
              <div class="active-indicator"></div>
            </button>
            <button
              class="tab-item"
              :class="{ active: activeTab === 'followings'}"
              @click="activeTab = 'followings'"
            >
              <span class="tab-label">关注</span>
              <span class="tab-count">{{ profileData.followingCount || 0 }}</span>
              <div class="active-indicator"></div>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content-wrapper">
            <!-- Articles Tab -->
            <div v-if="activeTab === 'articles'" class="articles-section fade-in">
              <div v-if="isLoading" class="loading-state">
                <div class="spinner-border text-gold" role="status"></div>
              </div>
              
              <div v-else-if="articles.length === 0" class="empty-state glass-panel">
                <div class="empty-icon"><i class="far fa-folder-open"></i></div>
                <h4>暂无文章</h4>
                <p>{{ isOwner ? '开始创作您的第一篇文章吧！' : '该用户还没有发布任何文章' }}</p>
                <router-link v-if="isOwner" to="/publish" class="apple-btn-primary mt-3">
                  <i class="fas fa-pen me-2"></i> 写文章
                </router-link>
              </div>
              
              <div v-else class="articles-list">
                <div v-for="(article, index) in articles" :key="article.id || article.articleId" class="article-item-wrapper" :style="{animationDelay: index * 0.05 + 's'}">
                  <div class="article-card glass-panel">
                    <div class="card-body">
                      <div class="article-main">
                        <router-link :to="`/article/${article.slug}`" class="article-link">
                          <h3 class="article-title">{{ article.title }}</h3>
                          <p class="article-excerpt">{{ article.excerpt }}</p>
                        </router-link>
                        <div class="article-meta">
                          <span class="meta-item"><i class="far fa-calendar"></i> {{ formatDate(article.gmtCreate || article.gmtModified) }}</span>
                          <span class="meta-item"><i class="far fa-eye"></i> {{ article.viewCount || 0 }}</span>
                          <span class="meta-item"><i class="far fa-heart"></i> {{ article.likes || 0 }}</span>
                        </div>
                      </div>
                      <router-link :to="`/article/${article.slug}`" class="article-cover-link" v-if="article.coverImg">
                        <LazyImage 
                          :src="article.coverImg" 
                          class="article-thumb"
                        />
                      </router-link>
                    </div>
                    
                    <!-- Owner Actions -->
                    <div v-if="isOwner" class="card-actions">
                      <router-link :to="`/publish?edit=${article.slug}`" class="action-icon" title="编辑">
                        <i class="fas fa-pen"></i>
                      </router-link>
                      <button @click="confirmDeleteArticle(article, index)" class="action-icon delete" title="删除">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Pagination -->
                <div class="pagination-wrapper">
                  <button @click="loadPreviousPage" :disabled="currentPage <= 1" class="page-btn prev">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <div class="page-numbers">
                    <button 
                      v-for="page in visiblePages" 
                      :key="page"
                      @click="goToPage(page)"
                      class="page-num"
                      :class="{ active: page === currentPage, disabled: page === '...' }"
                      :disabled="page === '...'"
                    >
                      {{ page }}
                    </button>
                  </div>
                  <button @click="loadNextPage" :disabled="!hasNextPage" class="page-btn next">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Followers Tab -->
            <div v-if="activeTab === 'followers'" class="followers-section fade-in">
              <UserFollowers :username="username" />
            </div>

            <!-- Following Tab -->
            <div v-if="activeTab === 'followings'" class="following-section fade-in">
              <UserFollowings :username="username" />
            </div>
          </div>
        </div>

        <!-- Right: Sticky Profile Sidebar -->
        <aside class="layout-sidebar">
          <div class="sidebar-sticky">
            <div class="profile-card glass-panel">
              <div class="profile-header">
                <div class="avatar-wrapper">
                  <div class="avatar-container">
                    <LazyImage 
                      :src="getAvatarUrl(profileData.user?.avatarUrl) || logo" 
                      :alt="profileData.user?.name" 
                      class="profile-avatar"
                    />
                  </div>
                  <div class="status-indicator" v-if="isOwner"></div>
                </div>
                <h2 class="profile-name">{{ profileData.user?.name || 'Loading...' }}</h2>
                <p class="profile-handle">@{{ profileData.user?.name }}</p>
              </div>

              <div class="profile-bio-box">
                <p>{{ profileData.user?.bio || '这位创作者很神秘，还没有写简介。' }}</p>
              </div>

              <div class="profile-stats-row">
                <div class="stat-col">
                  <span class="stat-num">{{ profileData.articleCount || 0 }}</span>
                  <span class="stat-lbl">文章</span>
                </div>
                <div class="stat-col">
                  <span class="stat-num">{{ profileData.followersCount || 0 }}</span>
                  <span class="stat-lbl">粉丝</span>
                </div>
                <div class="stat-col">
                  <span class="stat-num">{{ profileData.followingCount || 0 }}</span>
                  <span class="stat-lbl">关注</span>
                </div>
              </div>

              <div class="profile-actions-row">
                <button 
                  v-if="!isOwner" 
                  class="apple-btn-primary full-width" 
                  :class="{ 'followed': profileData.isFollowed }"
                  @click="toggleFollow"
                  :disabled="isLoading"
                >
                  {{ profileData.isFollowed ? '已关注' : '关注' }}
                </button>
                <router-link 
                  v-if="isOwner" 
                  to="/settings" 
                  class="apple-btn-outline full-width"
                >
                  编辑资料
                </router-link>
              </div>

              <div class="profile-meta-list">
                <div class="meta-row">
                  <i class="far fa-calendar-alt"></i>
                  <span>加入于 {{ formatDate(profileData.user?.gmtCreate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>

    <!-- Modals -->
    <SimpleImageCropper
      :visible="showCropper"
      :image-src="selectedImage"
      @close="closeCropper"
      @crop="handleCropComplete"
    />
    
    <ConfirmDeleteModal
      :visible="showDeleteModal"
      title="删除文章"
      :message="`您确定要删除文章「${articleToDelete?.title}」吗？`"
      warning-message="删除后，该文章将无法恢复。"
      confirm-text="确认删除"
      @confirm="deleteArticle"
      @cancel="closeDeleteModal"
      @close="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { request } from '@/api'
import { articleAPI } from '@/api/article'
import { ensureBigIntAsString, debugId } from '@/utils/bigint-helper'
import { toasts } from '@/plugins/toast'
import SimpleImageCropper from '@/components/SimpleImageCropper.vue'
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal.vue'
import { getAvatarUrl } from '@/utils/avatar-helper'
import { userAPI } from '@/api/user'
import { preloadCriticalImages, preloadLCPImage, getOptimizedImageUrl, ImageLoader } from '@/utils/imageOptimizer'
import UserFollowers from '../components/UserFollowers.vue'
import UserFollowings from '../components/UserFollowings.vue'
import logo from '@/assets/img/default.webp';
import LazyImage from '@/components/LazyImage.vue';

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('articles')

// 响应式数据
const profileData = ref({})
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const username = ref('')
const errorMessage = ref('') // 添加错误信息

// 图片裁剪相关
const showCropper = ref(false)
const selectedImage = ref(null)
const croppedImageData = ref(null)
const fileInput = ref(null)

// 删除相关
const showDeleteModal = ref(false)
const articleToDelete = ref(null)

const isOwner = computed(() => {
  // 如果profileData.isOwner存在，使用它
  if (profileData.value.isOwner !== undefined) {
    console.log('使用profileData.isOwner:', profileData.value.isOwner)
    return profileData.value.isOwner
  }
  
  // 否则根据用户名判断
  if (authStore.isAuthenticated && username.value && authStore.userName) {
    const isOwnerByUsername = username.value === authStore.userName
    console.log('根据用户名判断isOwner:', {
      username: username.value,
      authStoreUserName: authStore.userName,
      isOwner: isOwnerByUsername
    })
    return isOwnerByUsername
  }
  
  console.log('isOwner为false，原因:', {
    authStoreIsAuthenticated: authStore.isAuthenticated,
    username: username.value,
    authStoreUserName: authStore.userName
  })
  return false
})
const articles = computed(() => profileData.value.articles?.records || [])
const hasNextPage = computed(() => {
  if (!profileData.value.articles) return false
  return currentPage.value < Number(profileData.value.articles.pages)
})

// 计算可见的页码
const visiblePages = computed(() => {
  if (!profileData.value.articles || Number(profileData.value.articles.pages) <= 1) {
    return []
  }
  
  const totalPages = Number(profileData.value.articles.pages)
  const current = currentPage.value
  const pages = []
  
  // 如果总页数小于等于7，显示所有页码
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }
  
  // 如果总页数大于7，显示部分页码
  if (current <= 4) {
    // 当前页在前4页，显示前5页 + ... + 最后一页
    for (let i = 1; i <= 5; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(totalPages)
  } else if (current >= totalPages - 3) {
    // 当前页在后4页，显示第一页 + ... + 后5页
    pages.push(1)
    pages.push('...')
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // 当前页在中间，显示第一页 + ... + 当前页前后各2页 + ... + 最后一页
    pages.push(1)
    pages.push('...')
    for (let i = current - 2; i <= current + 2; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(totalPages)
  }
  
  return pages
})

// 处理图片URL的函数

// 处理图片URL的函数
const getProcessedImageUrl = (url) => {
  if (!url) return url
  
  // 如果是完整的后端URL，转换为相对路径
  if (url.startsWith('http://localhost:8090/')) {
    url = url.replace('http://localhost:8090', '')
  }
  
  // 如果是相对路径的uploads，需要添加/api前缀（因为后端设置了全局API前缀）
  if (url.startsWith('/uploads/')) {
    url = '/api' + url
  }
  
  return url
}

// 监听路由参数变化
watch(() => route.params.name, (newName, oldName) => {
  if (newName) {
    username.value = newName
    // 重置页码到第一页
    currentPage.value = 1
    // 使用 nextTick 优化DOM更新
    nextTick(() => {
      fetchProfileData()
    })
  }
})

// 监听整个路由变化，确保任何路由变化都重置页码
watch(() => route.fullPath, (newPath, oldPath) => {
  // 如果路径包含 profile，重置页码
  if (newPath.includes('/profile')) {
    currentPage.value = 1
    // 强制重新获取数据
    nextTick(() => {
      fetchProfileData(true) // 强制刷新
    })
  }
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知日期'
  
  try {
    let date
    
    // 处理不同的日期格式
    if (typeof dateString === 'string') {
      // 如果是字符串，尝试解析
      date = new Date(dateString)
    } else if (dateString instanceof Date) {
      // 如果已经是Date对象
      date = dateString
    } else if (typeof dateString === 'number') {
      // 如果是时间戳
      date = new Date(dateString)
    } else {
      return '日期格式错误'
    }
    
    if (isNaN(date.getTime())) {
      return '日期无效'
    }
    
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (error) {
    console.error('日期格式化错误:', error, '输入:', dateString)
    return '日期错误'
  }
}

// 获取个人资料数据
const fetchProfileData = async (forceRefresh = false) => {
  isLoading.value = true
  
  try {
    const params = { 
      page: currentPage.value, 
      size: pageSize.value 
    }
    
    // 如果需要强制刷新，添加时间戳参数破坏缓存
    if (forceRefresh) {
      params._t = Date.now()
    }
    
    const response = await request({
      url: `/profile/${username.value}`,
      method: 'get',
      params,
      timeout: 30000 // 增加超时时间到30秒
    })
    
    profileData.value = response
    
    // 添加调试信息
    console.log('个人资料数据加载完成:', {
      isOwner: response.isOwner,
      user: response.user,
      username: username.value,
      authStoreUserName: authStore.userName
    })
  } catch (error) {
    console.error('获取个人资料失败:', error)
    // 显示更详细的错误信息
    if (error.response) {
      console.error('错误响应状态:', error.response.status)
      console.error('错误响应数据:', error.response.data)
      errorMessage.value = `服务器错误 (${error.response.status}): ${error.message}`
    } else if (error.request) {
      console.error('请求发送但无响应:', error.request)
      errorMessage.value = '服务器未响应，请检查网络连接或稍后再试'
    } else {
      console.error('请求设置错误:', error.message)
      errorMessage.value = `请求错误: ${error.message}`
    }
  } finally {
    isLoading.value = false
  }
}

// 关注/取消关注
const toggleFollow = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  
  try {
    isLoading.value = true
    // 确保用户ID作为字符串处理，避免JavaScript大整数精度丢失
    const userIdStr = ensureBigIntAsString(profileData.value.user.id);
    debugId(profileData.value.user.id, '目标用户ID');
    const response = await request({
      url: `/user/${userIdStr}/follow`,
      method: 'post'
    })

    
    // 检查响应格式并更新关注状态 - 响应数据直接是对象
    if (response && response.isFollowing !== undefined) {
      // 后端返回的是 isFollowing，我们需要更新为 isFollowed
      profileData.value.isFollowed = response.isFollowing
      
      // 更新粉丝数
      if (response.isFollowing) {
        profileData.value.followersCount++
      } else {
        profileData.value.followersCount--
      }
    } else {
      console.error('响应格式错误:', response)
    }
  } catch (error) {
    console.error('关注操作失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 触发文件选择
const triggerFileUpload = () => {
  console.log('触发文件上传按钮点击')
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('文件输入框引用不存在')
  }
}

// 处理图片选择
const handleCoverUpload = (event) => {
  console.log('文件选择事件触发:', event.target.files)
  const file = event.target.files[0]
  if (!file) {
    console.log('没有选择文件')
    return
  }
  
  console.log('选择的文件:', file.name, file.type, file.size)
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    console.log('文件类型不支持:', file.type)
    window.$toast?.error('请选择有效的图片文件（JPG、PNG、GIF、WebP）')
    event.target.value = ''
    return
  }
  
  // 验证文件大小（5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    console.log('文件大小超限:', file.size)
    window.$toast?.error('图片文件大小不能超过5MB')
    event.target.value = ''
    return
  }
  
  console.log('文件验证通过，准备显示裁剪器')
  
  // 创建图片URL并显示裁剪界面
  const imageUrl = URL.createObjectURL(file)
  selectedImage.value = imageUrl
  showCropper.value = true
  
  console.log('裁剪器状态:', showCropper.value, '图片URL:', imageUrl)
  
  // 清空文件输入，允许再次选择同一文件
  event.target.value = ''
}

// 处理裁剪完成
const handleCropComplete = async (croppedData) => {
  try {
    isLoading.value = true
    
    // 将base64数据转换为Blob
    const base64Data = croppedData.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })
    
    // 创建FormData
    const formData = new FormData()
    formData.append('coverImageFile', blob, 'cropped-cover.jpg')
    
    const response = await request({
      url: '/update-cover',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    
    if (response && response.success) {
      // 更新封面图片
      profileData.value.user.backgroundImgUrl = response.newImageUrl
      window.$toast?.success('封面图片更新成功！')
    } else {
      console.error('上传失败，响应:', response)
      window.$toast?.error(response?.message || '上传失败，请稍后重试')
    }
  } catch (error) {
    console.error('上传封面失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      window.$toast?.error(error.response.data?.message || '上传失败，请稍后重试')
    } else if (error.request) {
      window.$toast?.error('网络连接失败，请检查网络连接')
    } else {
      window.$toast?.error('上传失败，请稍后重试')
    }
  } finally {
    isLoading.value = false
  }
}

// 关闭裁剪界面
const closeCropper = () => {
  showCropper.value = false
  selectedImage.value = null
  croppedImageData.value = null
}

// 加载上一页
const loadPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    // 使用 nextTick 优化DOM更新
    nextTick(() => {
      fetchProfileData()
    })
  }
}

// 加载下一页
const loadNextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++
    // 使用 nextTick 优化DOM更新
    nextTick(() => {
      fetchProfileData()
    })
  }
}

// 跳转到指定页面
const goToPage = (page) => {
  if (page === '...' || page === currentPage.value) return
  
  const totalPages = Number(profileData.value.articles?.pages) || 1
  if (page >= 1 && page <= totalPages) {
    currentPage.value = page
    // 使用 nextTick 优化DOM更新
    nextTick(() => {
      fetchProfileData()
    })
  }
}

// 确认删除文章
const confirmDeleteArticle = (article, index) => {
  articleToDelete.value = article
  showDeleteModal.value = true
}

// 删除文章
const deleteArticle = async () => {
  if (!articleToDelete.value) {
    window.$toast?.error('删除失败：文章信息丢失')
    return
  }
  
  // 检查文章ID，支持多种字段名
  const articleId = articleToDelete.value.id || articleToDelete.value.articleId
  if (!articleId) {
    window.$toast?.error('删除失败：文章ID无效')
    return
  }
  
  // 保存文章信息，防止在异步操作中被修改
  const articleTitle = articleToDelete.value.title
  
  // 立即关闭弹窗，防止重复点击
  showDeleteModal.value = false
  
  try {
    isLoading.value = true
    await articleAPI.deleteArticle(articleId)
    
    // 显示成功消息
    window.$toast?.success(`文章「${articleTitle}」删除成功！`)
    
    // 检查当前页是否还有文章，如果没有则回到上一页
    const currentArticles = profileData.value.articles?.records || []
    if (currentArticles.length === 1 && currentPage.value > 1) {
      // 如果当前页只有一篇文章且不是第一页，则回到上一页
      currentPage.value--
    }
    
    // 强制刷新数据，破坏缓存
    await fetchProfileData(true)
  } catch (error) {
    console.error('删除文章失败:', error)
    window.$toast?.error('删除文章失败，请稍后重试')
  } finally {
    isLoading.value = false
    // 清理状态
    articleToDelete.value = null
  }
}

// 关闭删除确认弹窗
const closeDeleteModal = () => {
  showDeleteModal.value = false
  articleToDelete.value = null
}

// 预加载关键图片资源
const preloadProfileImages = () => {
  const criticalImages = [
    // Preload optimized images if necessary, for now, this is empty
  ]
  
  // 使用 Intersection Observer 优化图片预加载
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          imageObserver.unobserve(img)
        }
      })
    })
    
    criticalImages.forEach(src => {
      const img = new Image()
      img.dataset.src = src
      imageObserver.observe(img)
    })
  } else {
    // 降级处理
    criticalImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }
}

// 组件挂载时获取数据
onMounted(() => {
  // 预加载关键图片
  preloadProfileImages()
  
  // 重置页码到第一页
  currentPage.value = 1
  
  // 从路由参数中获取用户名
  if (route.params.name) {
    username.value = route.params.name
    // 使用 nextTick 优化DOM更新
    nextTick(() => {
      fetchProfileData()
    })
  } else {
    // 如果没有指定用户名，则获取当前登录用户的资料
    if (authStore.isAuthenticated) {
      username.value = authStore.userName
      // 使用 nextTick 优化DOM更新
      nextTick(() => {
        fetchProfileData()
      })
    } else {
      router.push({ name: 'Login', query: { redirect: route.fullPath } })
    }
  }
})
</script>

<style scoped>
/* === Variables (Apple x Hive) === */
.profile-page-wrapper {
  --apple-bg: #f5f5f7;
  --apple-text: #1d1d1f;
  --apple-gray: #86868b;
  --hive-gold: #f6b93b;
  --hive-gold-hover: #e5a52a;
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-highlight: rgba(255, 255, 255, 0.5);
  --glass-shadow: rgba(0, 0, 0, 0.05);
  --noise-pattern: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
  --shadow-sm: 0 4px 24px -4px var(--glass-shadow);
  --shadow-lg: 0 24px 48px -12px rgba(0, 0, 0, 0.1);
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--apple-bg);
  color: var(--apple-text);
  min-height: 100vh;
  padding-bottom: 80px;
  
  /* Background Texture */
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(246, 185, 59, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(66, 153, 225, 0.08) 0%, transparent 40%);
}

/* === Glass Panel Utility === */
.glass-panel {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 
    var(--shadow-sm),
    inset 0 1px 0 0 var(--glass-highlight),
    inset 0 -1px 0 0 rgba(0,0,0,0.05);
  border-radius: 24px;
  overflow: hidden;
}
.glass-panel::before {
  content: "";
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: var(--noise-pattern);
  opacity: 1;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}
.glass-panel > * { position: relative; z-index: 1; }

/* === 1. Cinematic Cover === */
.cinematic-cover {
  position: relative;
  height: 320px;
  width: 100%;
  margin-bottom: -80px; /* Overlap effect */
  z-index: 0;
}
.cover-bg-wrapper {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  overflow: hidden;
}
.cover-image {
  width: 100%; height: 100%;
  object-fit: cover;
}
.cover-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%);
}
.cover-actions {
  position: absolute;
  bottom: 100px;
  right: 20px;
}
.apple-glass-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 100px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.apple-glass-btn:hover { background: rgba(255, 255, 255, 0.3); }

/* === 2. Layout === */
.apple-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}
.profile-layout {
  display: flex;
  gap: 60px;
  align-items: flex-start;
}
.layout-main { flex: 1; min-width: 0; }
.layout-sidebar { width: 320px; flex-shrink: 0; }
.sidebar-sticky { position: sticky; top: 100px; }

/* === 3. Glass Tabs === */
.glass-tabs {
  display: flex;
  padding: 6px;
  gap: 4px;
  border-radius: 16px; /* Pill shape container */
}
.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: none;
  background: transparent;
  color: var(--apple-gray);
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
}
.tab-item:hover { color: var(--apple-text); background: rgba(0,0,0,0.03); }
.tab-item.active {
  color: var(--apple-text);
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.active-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--hive-gold);
  border-radius: 3px 3px 0 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.tab-item.active .active-indicator { opacity: 1; }

.tab-label { font-size: 0.95rem; }
.tab-count {
  font-size: 0.75rem;
  background: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 100px;
  color: var(--apple-gray);
}
.tab-item.active .tab-count { background: var(--apple-text); color: #fff; }

/* === 4. Article Cards === */
.article-item-wrapper { margin-bottom: 24px; animation: fadeInUp 0.5s ease backwards; }
.article-card {
  padding: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.article-card:hover { transform: translateY(-4px); }
.card-body {
  display: flex;
  padding: 24px;
  gap: 24px;
  align-items: flex-start;
}
.article-main { flex: 1; }
.article-link { text-decoration: none; display: block; }
.article-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--apple-text);
  line-height: 1.3;
  transition: color 0.2s;
}
.article-link:hover .article-title { color: var(--hive-gold); }
.article-excerpt {
  font-size: 0.95rem;
  color: var(--apple-gray);
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.article-meta {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--apple-gray);
}
.meta-item { display: flex; align-items: center; gap: 6px; }
.article-thumb {
  width: 120px; height: 80px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}
.card-actions {
  position: absolute;
  top: 16px; right: 16px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}
.article-card:hover .card-actions { opacity: 1; }
.action-icon {
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: var(--apple-text);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
.action-icon:hover { background: var(--hive-gold); color: #fff; transform: scale(1.1); }
.action-icon.delete:hover { background: #ff4757; }

/* === 5. Profile Sidebar === */
.profile-card {
  padding: 40px 24px;
  text-align: center;
}
.profile-header { margin-bottom: 24px; }
.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
}
.avatar-container {
  position: relative;
  width: 100%; 
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fff;
  box-shadow: var(--shadow-lg);
}
.profile-avatar {
  width: 100%; 
  height: 100%;
  object-fit: cover;
  display: block;
}
.status-indicator {
  position: absolute;
  bottom: 4px; 
  right: 4px;
  width: 16px; height: 16px;
  background: #2ecc71;
  border: 3px solid #fff;
  border-radius: 50%;
  z-index: 1;
}
.profile-name { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.5px; }
.profile-handle { color: var(--apple-gray); font-size: 0.95rem; }

.profile-bio-box {
  margin-bottom: 32px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  padding: 0 10px;
}

.profile-stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.stat-col { display: flex; flex-direction: column; gap: 4px; }
.stat-num { font-size: 1.2rem; font-weight: 700; color: var(--apple-text); }
.stat-lbl { font-size: 0.8rem; color: var(--apple-gray); text-transform: uppercase; letter-spacing: 0.5px; }

.profile-actions-row { margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; }
.apple-btn-primary {
  background: var(--apple-text);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 100px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  font-size: 0.95rem;
}
.apple-btn-primary:hover { transform: scale(1.02); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.apple-btn-primary.followed { background: rgba(0,0,0,0.05); color: var(--apple-text); box-shadow: none; }
.apple-btn-outline {
  display: block;
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 100px;
  color: var(--apple-text);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  text-align: center;
  font-size: 0.95rem;
}
.apple-btn-outline:hover { border-color: var(--apple-text); background: #fff; }

.meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--apple-gray);
  font-size: 0.85rem;
}

/* === Pagination === */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 40px;
}
.page-btn {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: none;
  background: #fff;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  color: var(--apple-text);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.page-btn:not(:disabled):hover { transform: scale(1.1); }
.page-num {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  color: var(--apple-gray);
  transition: all 0.2s;
}
.page-num:hover { color: var(--apple-text); }
.page-num.active { background: var(--apple-text); color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

/* === Empty & Loading === */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-icon { font-size: 3rem; color: rgba(0,0,0,0.1); margin-bottom: 16px; }
.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px;
}
.text-gold { color: var(--hive-gold); }

/* === Responsive === */
@media (max-width: 992px) {
  .profile-layout { flex-direction: column-reverse; gap: 40px; }
  .layout-sidebar { width: 100%; }
  .sidebar-sticky { position: relative; top: 0; margin-top: -80px; }
  .cinematic-cover { height: 240px; margin-bottom: -60px; }
  .profile-card { padding: 32px 20px; }
  .avatar-container { width: 100px; height: 100px; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeInUp 0.5s ease backwards; }
</style>