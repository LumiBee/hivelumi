<template>
  <div class="search-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container-fluid" style="max-width: 1200px;">
        <div class="hero-content">
          <h1 class="hero-title">搜索结果</h1>
          <p class="hero-subtitle" v-if="searchQuery">
            搜索关键词：<span class="search-keyword">"{{ searchQuery }}"</span>
          </p>
          <p class="hero-subtitle" v-else>
            发现更多精彩内容
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="content-section">
      <div class="container-fluid" style="max-width: 1200px;">
        <!-- Search Bar -->
        <div class="search-bar-container">
          <div class="search-bar">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索文章、作者或标签..."
              class="search-input"
              @keyup.enter="performSearch"
              @input="handleSearchInput"
            />
            <button class="search-btn" @click="performSearch" aria-label="搜索">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <span>正在搜索...</span>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchResults.length > 0" class="search-results-container">
          <div class="results-header">
            <h3 class="results-title">
              找到 <span class="results-count">{{ searchResults.length }}</span> 个结果
            </h3>
            <div class="section-actions">
              <div class="custom-select" @click="toggleDropdown" ref="selectContainer">
                <div class="select-display">
                  <span class="select-text">{{ sortOptions[currentSort].label }}</span>
                  <i class="fas fa-chevron-down select-arrow" :class="{ 'rotated': isDropdownOpen }"></i>
                </div>
                <div class="select-dropdown" v-show="isDropdownOpen">
                  <div 
                    v-for="(option, key) in sortOptions" 
                    :key="key"
                    class="select-option"
                    :class="{ 'selected': currentSort === key }"
                    @click.stop="selectOption(key)"
                  >
                    {{ option.label }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 文章列表 - 与首页样式一致 -->
          <ol class="list-unstyled compact-article-list">
            <li
              v-for="article in sortedResults"
              :key="article.id || article.articleId"
              class="compact-article-item"
              @click="$router.push(`/article/${article.slug}`)"
            >
              <div class="compact-article-content">
                <h6 class="compact-article-title">
                  <span class="text-dark">
                    {{ article.title }}
                  </span>
                </h6>
                <p class="compact-article-excerpt">{{ article.excerpt || '暂无摘要' }}</p>
                <div class="compact-article-meta">
                  <div class="compact-author-info">
                    <router-link 
                      :to="`/profile/${article.userName}`" 
                      class="author-avatar-link"
                      @click.stop
                    >
                      <img
                        v-if="article.avatarUrl"
                        :src="getAuthorAvatarUrl(article.avatarUrl)"
                        alt="作者头像"
                        class="compact-author-avatar"
                      />
                      <div class="compact-author-avatar" v-else>
                        {{ (article.userName || '佚名').charAt(0).toUpperCase() }}
                      </div>
                    </router-link>
                    <span class="compact-author-name">{{ article.userName || '佚名' }}</span>
                    <span class="compact-time">{{ formatTime(article.gmtModified || article.createdAt) }}</span>
                  </div>
                  <div class="compact-stats">
                    <span class="compact-stat-item">
                      <i class="fas fa-eye"></i>
                      <span>{{ article.viewCount || 0 }}</span>
                    </span>
                    <span class="compact-stat-item">
                      <i class="fas fa-heart"></i>
                      <span>{{ article.likes || 0 }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-search"></i>
          </div>
          <h3 class="empty-state-title">
            {{ searchQuery ? '未找到相关文章' : '开始搜索吧' }}
          </h3>
          <p class="empty-state-text">
            {{ searchQuery ? '尝试使用其他关键词搜索，或者浏览我们的热门内容' : '输入关键词搜索您感兴趣的文章' }}
          </p>
          <div class="empty-state-actions">
            <button class="btn btn-primary" @click="clearSearch" v-if="searchQuery">
              <i class="fas fa-times"></i>
              清除搜索
            </button>
            <router-link to="/" class="btn btn-outline-primary">
              <i class="fas fa-home"></i>
              返回首页
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleAPI } from '@/api'
import LazyImage from '@/components/LazyImage.vue'
import { getAvatarUrl } from '@/utils/avatar-helper'

const route = useRoute()
const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)
const sortBy = ref('relevance')
const isDropdownOpen = ref(false)
const currentSort = ref('relevance')

// 排序选项
const sortOptions = {
  relevance: { label: '相关度', value: 'relevance' },
  date: { label: '时间', value: 'date' },
  views: { label: '浏览量', value: 'views' }
}

// 获取搜索关键词
const getSearchQuery = () => {
  return route.query.query || ''
}

// 处理搜索输入
const handleSearchInput = () => {
  // 实时搜索可以在这里实现
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  loading.value = true
  try {
    const response = await articleAPI.searchArticles(searchQuery.value)
    searchResults.value = response || []
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  router.push({ name: 'Search' })
}

// 排序结果
const sortResults = (type) => {
  sortBy.value = type
}

// 下拉框控制
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const selectOption = (key) => {
  currentSort.value = key
  sortBy.value = key
  isDropdownOpen.value = false
}

// 排序后的结果
const sortedResults = computed(() => {
  if (!searchResults.value.length) return []
  
  const results = [...searchResults.value]
  
  switch (sortBy.value) {
    case 'date':
      return results.sort((a, b) => new Date(b.gmtModified || b.createdAt) - new Date(a.gmtModified || a.createdAt))
    case 'views':
      return results.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    case 'relevance':
    default:
      return results.sort((a, b) => (b.likes || 0) - (a.likes || 0))
  }
})

// 处理图片URL
const getProcessedImageUrl = (url) => {
  if (!url) return null
  if (url.startsWith('http://localhost:8090/')) {
    return url.replace('http://localhost:8090', '')
  }
  return url
}

// 获取作者头像URL
const getAuthorAvatarUrl = (avatarUrl) => {
  return getAvatarUrl(avatarUrl)
}

// 格式化时间 - 与首页一致
const formatTime = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
  return `${Math.ceil(diffDays / 365)}年前`
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
  return `${Math.ceil(diffDays / 365)}年前`
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 监听路由变化
watch(() => route.query.query, (newQuery) => {
  if (newQuery) {
    searchQuery.value = newQuery
    performSearch()
  }
}, { immediate: true })

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  const selectContainer = document.querySelector('.custom-select')
  if (selectContainer && !selectContainer.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

// 组件挂载
onMounted(() => {
  const query = getSearchQuery()
  if (query) {
    searchQuery.value = query
    performSearch()
  }
  
  // 添加点击外部关闭下拉框的监听器
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载
onUnmounted(() => {
  // 移除点击外部关闭下拉框的监听器
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 页面基础样式 */
.search-page {
  min-height: 100vh;
  background: white;
}

/* Hero Section */
.hero-section {
  padding: 5rem 0 3rem;
  background: white;
  text-align: center;
  position: relative;
  margin-top: 70px; /* 为navbar留出空间 */
}

.hero-content {
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-family: 'Playfair Display', Georgia, serif;
  animation: fadeInUp 0.8s ease-out;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 400;
  margin-bottom: 0;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.hero-content::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #ffc107 0%, #ffda58 100%);
  border-radius: 2px;
}

.search-keyword {
  background: linear-gradient(135deg, #ffc107 0%, #ffda58 100%);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  color: #2c3e50;
}

/* Content Section */
.content-section {
  padding: 3rem 0;
  background: white;
}

/* Search Bar */
.search-bar-container {
  margin-bottom: 3rem;
}

.search-bar {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e9ecef;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-bar:focus-within {
  border-color: #ffc107;
  box-shadow: 0 6px 25px rgba(255, 193, 7, 0.15);
  transform: translateY(-1px);
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  color: #6c757d;
  font-size: 1rem;
  z-index: 1;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1.25rem 0.875rem 3rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #2c3e50;
  outline: none;
  height: 48px;
}

.search-input::placeholder {
  color: #6c757d;
}

.search-btn {
  background: linear-gradient(135deg, #ffc107 0%, #ffda58 100%);
  border: none;
  padding: 0.875rem 1.5rem;
  color: #2c3e50;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  min-width: 48px;
  border-radius: 0 25px 25px 0;
}

.search-btn:hover {
  background: linear-gradient(135deg, #e8ca0f 0%, #d4af37 100%);
  transform: scale(1.02);
}

.search-btn:active {
  transform: scale(0.98);
}

/* Loading State */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  padding: 0;
  text-align: center;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.25rem;
  color: #6c757d;
}

.loading-spinner i {
  font-size: 2rem;
  color: #ffc107;
}

/* Search Results */
.search-results-container {
  animation: fadeInUp 0.6s ease-out;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.results-count {
  color: #ffc107;
  font-weight: 700;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 自定义下拉框样式 */
.custom-select {
  position: relative;
  min-width: 140px;
  cursor: pointer;
  user-select: none;
  margin: 0;
  border: none;
  background: none;
  padding: 0;
}

.select-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.2rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background-color: white;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  width: 100%;
}

.custom-select:hover .select-display {
  border-color: #ffc107;
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.15);
  transform: translateY(-1px);
}

.select-text {
  flex: 1;
}

.select-arrow {
  margin-left: 0.5rem;
  transition: transform 0.3s ease;
  color: #666;
  font-size: 0.8rem;
}

.select-arrow.rotated {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 2px solid #ffc107;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: -2px;
  overflow: hidden;
}

.select-option {
  padding: 0.8rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  background-color: white;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.select-option:last-child {
  border-bottom: none;
}

.select-option:hover {
  background-color: #fff8e1;
  color: #333;
}

.select-option.selected {
  background-color: #ffc107;
  color: #333;
  font-weight: 600;
}

.select-option.selected:hover {
  background-color: #ffb300;
}

/* 紧凑文章列表样式 - 与首页一致 */
.compact-article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.compact-article-item {
  background: white;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 193, 7, 0.08);
  box-shadow: 0 3px 15px rgba(255, 193, 7, 0.05), 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  margin-bottom: 1rem;
  cursor: pointer;
}

.compact-article-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ffc107 0%, #ffda58 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: left;
}

.compact-article-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(255, 193, 7, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(255, 193, 7, 0.2);
}

.compact-article-item:hover::before {
  transform: scaleX(1);
}

.compact-article-content {
  padding: 1.5rem;
}

.compact-article-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.3;
  margin-bottom: 0.75rem;
  transition: color 0.3s ease;
}

.compact-article-item:hover .compact-article-title {
  color: #ffc107;
}

.compact-article-excerpt {
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.compact-article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.compact-author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar-link {
  text-decoration: none;
  transition: transform 0.3s ease;
}

.author-avatar-link:hover {
  transform: scale(1.05);
}

.compact-author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: linear-gradient(135deg, #ffc107 0%, #ffda58 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 6px rgba(255, 193, 7, 0.25);
  transition: transform 0.3s ease;
}

.compact-article-item:hover .compact-author-avatar {
  transform: scale(1.1);
}

.compact-author-name {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.compact-time {
  color: #6c757d;
  font-size: 0.85rem;
}

.compact-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.compact-stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.compact-stat-item i {
  opacity: 0.8;
  color: #ffc107;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.compact-article-item:hover .compact-stat-item i {
  opacity: 1;
  transform: scale(1.1);
}

.compact-article-item:hover .compact-stat-item {
  color: #ffc107;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1.2rem;
  box-shadow: 0 3px 15px rgba(255, 193, 7, 0.05);
}

.empty-state-icon {
  font-size: 4rem;
  color: #ffc107;
  margin-bottom: 1.5rem;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.empty-state-text {
  color: #6c757d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.empty-state-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #ffc107 0%, #ffda58 100%);
  color: #2c3e50;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
  color: #2c3e50;
}

.btn-outline-primary {
  background: transparent;
  color: #ffc107;
  border: 2px solid #ffc107;
}

.btn-outline-primary:hover {
  background: #ffc107;
  color: #2c3e50;
  transform: translateY(-2px);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-section {
    padding: 4rem 0 1.5rem;
    margin-top: 70px; /* 移动端也保持navbar间距 */
  }
  
  .hero-title {
    font-size: 1.8rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-actions {
    width: 100%;
    justify-content: center;
  }
  
  .search-bar {
    margin: 0 1rem;
    max-width: calc(100% - 2rem);
  }
  
  .search-input {
    font-size: 0.95rem;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
  }
  
  .search-icon {
    left: 1rem;
    font-size: 0.9rem;
  }
  
  .search-btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
  
  .empty-state-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 576px) {
  .hero-section {
    padding: 3rem 0 2rem;
  }
  
  .content-section {
    padding: 2rem 0;
  }
  
  .compact-article-content {
    padding: 1rem;
  }
  
  .compact-stats {
    gap: 0.5rem;
  }
  
  .compact-stat-item {
    font-size: 0.8rem;
  }
}

/* Custom Spinner Styles */
.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 193, 7, 0.2);
  border-radius: 50%;
  border-top-color: #ffc107;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
