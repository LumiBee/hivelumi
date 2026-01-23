<template>
  <div class="article-page-argon">
    <!-- 顶部阅读进度条 (Hive Gold) -->
    <div class="reading-progress" :style="{ width: readingProgress + '%' }"></div>

    <!-- 导航栏占位 (防止内容被遮挡) -->
    <div class="nav-spacer"></div>

    <!-- 1. Argon 风格 Banner -->
    <header class="argon-banner" v-if="article">
      <!-- 背景图 (模糊处理) -->
      <div class="banner-bg" :style="{ backgroundImage: `url(${getBackgroundUrl(article.backgroundUrl) || article.coverImageUrl || defaultCover})` }"></div>
      <div class="banner-overlay"></div>
      
      <div class="banner-container">
        <div class="banner-content" data-aos="zoom-in" data-aos-duration="1000">
          <!-- 标签 Pills -->
          <div class="banner-tags" v-if="article.tags && article.tags.length">
            <router-link 
              v-for="tag in article.tags" 
              :key="tag.tagId" 
              :to="`/tags/${tag.slug}`"
              class="argon-tag-pill"
            >
              {{ tag.name }}
            </router-link>
          </div>

          <!-- 标题 -->
          <h1 class="banner-title">{{ article.title }}</h1>
          
          <!-- 副标题/摘要 (可选) -->
          <p class="banner-subtitle" v-if="article.summary">{{ article.summary }}</p>

          <!-- 作者 & 日期 -->
          <div class="banner-meta">
            <router-link :to="`/profile/${article.userName}`" class="banner-author">
              <img :src="getAuthorAvatarUrl(article.avatarUrl)" alt="Author" class="author-img">
              <span class="author-name">{{ article.userName }}</span>
            </router-link>
            <span class="meta-divider">|</span>
            <span class="publish-date"><i class="far fa-calendar-alt"></i> {{ formatDate(article.gmtModified) }}</span>
            <span class="meta-divider">|</span>
            <span class="view-count"><i class="far fa-eye"></i> {{ article.viewCount || 0 }} 次阅读</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 核心内容区域 -->
    <main class="argon-container" v-if="article">
      <div class="article-layout">
        <!-- 左侧：文章主体 -->
        <div class="layout-main">
          <!-- 2. 文章正文 (Argon Card) -->
          <article class="article-card argon-card" data-aos="fade-up" data-aos-delay="200">
            <div class="post-content" id="post_content">
              <div v-html="renderedContent" class="markdown-content"></div>
            </div>
          </article>

          <!-- 3. 底部相关推荐 (Grid Layout) -->
          <section class="related-section" v-if="relatedArticles.length" data-aos="fade-up">
            <h3 class="section-title">更多推荐</h3>
            <div class="related-grid">
              <router-link 
                v-for="item in relatedArticles" 
                :key="item.articleId"
                :to="`/article/${item.slug}`"
                class="related-card glass-panel"
              >
                <div class="related-content">
                  <h4>{{ item.title }}</h4>
                  <div class="related-meta">
                    <span><i class="fas fa-eye"></i> {{ item.viewCount }}</span>
                    <span><i class="fas fa-heart"></i> {{ item.likes }}</span>
                  </div>
                </div>
              </router-link>
            </div>
          </section>

          <!-- 4. 评论区 -->
          <section class="comments-section" id="comments" data-aos="fade-up">
            <CommentSection :article-id="article.articleId" />
          </section>
        </div>

        <!-- 右侧：作者侧边栏 -->
        <aside class="layout-sidebar">
          <div class="sidebar-sticky-wrapper">
            <!-- 3.5 关于作者 (Argon Card) -->
            <section 
              class="author-card-container"
              data-aos="fade-left" 
              data-aos-delay="300"
            >
              <div class="argon-card author-card">
                  <div class="author-card-content">
                    <div class="author-header">
                      <div class="hexagon-avatar-wrapper lg">
                        <img :src="getAuthorAvatarUrl(article.avatarUrl)" alt="Author" class="hexagon-avatar">
                      </div>
                      <div class="author-info-lg">
                        <router-link :to="`/profile/${article.userName}`" class="author-name-link">
                          <h3 class="author-name-lg">{{ article.userName }}</h3>
                        </router-link>
                        <p class="author-bio">{{ article.userBio || '这位作者很神秘，什么都没写...' }}</p>
                      </div>
                    </div>
                    
                    <div class="author-actions">
                      <button 
                        v-if="authStore.isAuthenticated && article.userId !== authStore.user?.id"
                        @click.stop="toggleFollow"
                        class="argon-btn-outline full-width"
                        :class="{ 'active': article.isFollowed }"
                      >
                        {{ article.isFollowed ? '已关注' : '关注作者' }}
                      </button>
                    </div>

                    <div class="author-stats">
                      <div class="stat-box">
                        <span class="stat-val">{{ article.userArticleCount || 0 }}</span>
                        <span class="stat-label">文章</span>
                      </div>
                      <div class="stat-box">
                        <span class="stat-val">{{ article.userFollowersCount || 0 }}</span>
                        <span class="stat-label">粉丝</span>
                      </div>
                      <div class="stat-box">
                        <span class="stat-val">{{ article.userFollowingCount || 0 }}</span>
                        <span class="stat-label">关注</span>
                      </div>
                    </div>
                  </div>
                </div>

            </section>
          </div>
        </aside>
      </div>
    </main>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner-border text-gold" role="status"></div>
    </div>

    <!-- 5. 灵动岛风格底部 Dock (悬浮操作栏) -->
    <div class="dock-wrapper" :class="{ 'dock-hidden': !showDock }">
      <div class="apple-dock glass-panel">
        <!-- 点赞 -->
        <button class="dock-item" @click="toggleLike" :class="{ 'active': article?.liked }">
          <i :class="article?.liked ? 'fas fa-heart' : 'far fa-heart'"></i>
          <span class="dock-badge" v-if="article?.likes">{{ article.likes }}</span>
        </button>
        
        <!-- 收藏 -->
        <button class="dock-item" @click="toggleFavorite" :class="{ 'active': article?.isFavorited }">
          <i :class="article?.isFavorited ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
        </button>

        <!-- 评论 (滚动) -->
        <button class="dock-item" @click="scrollToComments">
          <i class="far fa-comment"></i>
        </button>

        <!-- 分享 -->
        <button class="dock-item" @click="shareArticle">
          <i class="fas fa-share-alt"></i>
        </button>

        <div class="dock-divider"></div>

        <!-- 目录 (Toggle Drawer) -->
        <button class="dock-item" @click="showToc = !showToc" :class="{ 'active': showToc }">
          <i class="fas fa-list-ul"></i>
        </button>
      </div>
    </div>

    <!-- 6. 智能目录抽屉 (侧边弹出) -->
    <transition name="slide-fade">
      <aside class="toc-drawer glass-panel" v-show="showToc">
        <div class="toc-header">
          <h3>目录</h3>
          <button @click="showToc = false" class="toc-close-btn" title="关闭目录">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <nav class="toc-content">
          <ul class="toc-list">
            <li 
              v-for="item in tableOfContents" 
              :key="item.id"
              :class="['toc-item', `level-${item.level}`, { 'active': activeHeading === item.id }]"
              @click="scrollToHeading(item.id)"
            >
              {{ cleanText(item.text) }}
            </li>
          </ul>
        </nav>
      </aside>
    </transition>

    <!-- Lightbox Overlay -->
    <transition name="fade">
      <div v-if="isZoomed" class="lightbox-overlay" @click="closeZoom">
        <button class="lightbox-close" @click.stop="closeZoom">
          <i class="fas fa-times"></i>
        </button>
        <div class="lightbox-content" @click.stop>
          <img :src="zoomedImageSrc" :alt="zoomedImageAlt" class="lightbox-img">
        </div>
      </div>
    </transition>

    <!-- 收藏弹窗 -->
    <FavoriteModal
      v-if="article?.articleId"
      :visible="showFavoriteModal"
      :article-id="article.articleId"
      @close="showFavoriteModal = false"
      @success="handleFavoriteSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { articleAPI } from '@/api/article'
import { userAPI } from '@/api/user'
import { favoriteAPI } from '@/api/favorite'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import FavoriteModal from '@/components/FavoriteModal.vue'
import CommentSection from '@/components/CommentSection.vue'
import { getAuthorAvatarUrl, getBackgroundUrl } from '@/utils/avatar-helper'
import { ensureBigIntAsString } from '@/utils/bigint-helper'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

// === State ===
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const article = ref(null)
const loading = ref(true)
const relatedArticles = ref([])
const tableOfContents = ref([])
const renderedContent = ref('')
const readingProgress = ref(0)
const showDock = ref(true)
// 默认在宽屏下打开目录
const showToc = ref(window.innerWidth > 1200)
const activeHeading = ref('')
const isZoomed = ref(false)
const zoomedImageSrc = ref('')
const zoomedImageAlt = ref('')
const showFavoriteModal = ref(false)
const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
const isCardFlipped = ref(false) // Keeping for compatibility if needed, but unused in new UI
const isLiking = ref(false) // 防止重复点击

let lastScrollTop = 0

// === Core Logic ===
const loadArticleData = async () => {
  try {
    loading.value = true
    const slug = route.params.slug
    if (!slug) return

    const response = await articleAPI.getArticleBySlug(slug)
    if (response) {
      article.value = response
      
      // Always fetch author profile to get the background URL
      if (response.userName) {
        try {
          const userProfile = await userAPI.getProfile(response.userName)
          if (userProfile?.user?.backgroundImgUrl) {
            // Use getBackgroundUrl to process the URL
            article.value.backgroundUrl = userProfile.user.backgroundImgUrl
          }
        } catch (err) {
          console.warn('Failed to fetch author profile:', err)
        }
      }

      relatedArticles.value = response.relatedArticles || []
      renderMarkdown()
    }
  } catch (error) {
    console.error('Failed to load article:', error)
  } finally {
    loading.value = false
  }
}

const renderMarkdown = () => {
  if (!article.value?.content) return

  const headings = []
  const renderer = new marked.Renderer()
  const slugCounts = {}

  renderer.heading = (text, level, raw) => {
    // Allow Chinese and other Unicode characters, replace spaces/punctuation with dashes
    let id = raw.toLowerCase().trim().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    
    // Remove leading/trailing dashes
    id = id.replace(/^-+|-+$/g, '')
    
    // Fallback for empty IDs (e.g. if heading was only punctuation)
    if (!id) id = `heading-${Math.random().toString(36).substr(2, 9)}`

    // Handle duplicates
    if (slugCounts[id]) {
      slugCounts[id]++
      id = `${id}-${slugCounts[id]}`
    } else {
      slugCounts[id] = 1
    }

    headings.push({ id, text, level })
    return `<h${level} id="${id}">${text}</h${level}>`
  }

  // Mac Window Code Block
  renderer.code = (code, language) => {
    const validLang = hljs.getLanguage(language) ? language : 'plaintext'
    const highlighted = hljs.highlight(code, { language: validLang }).value
    return `
      <div class="mac-window">
        <div class="mac-header">
          <div class="mac-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <span class="mac-title">${language || 'code'}</span>
          <button class="mac-copy-btn" data-clipboard-text="${encodeURIComponent(code)}">
            <i class="far fa-copy"></i>
          </button>
        </div>
        <div class="mac-body">
          <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
        </div>
      </div>
    `
  }

  renderedContent.value = DOMPurify.sanitize(marked(article.value.content, { 
    renderer,
    gfm: true,
    breaks: true
  }))
  tableOfContents.value = headings

  nextTick(() => {
    installImageZoom()
    installCopyButtons()
  })
}

// === Actions ===
const toggleLike = async () => {
  if (!checkAuth() || isLiking.value) return
  
  isLiking.value = true
  try {
    const res = await articleAPI.toggleLike(article.value.articleId)
    if (res) {
      article.value.liked = res.liked
      article.value.likes = res.likeCount
      if (res.liked) window.$toast?.success('点赞成功')
    }
  } catch (e) {
    console.error(e)
    window.$toast?.error('操作失败，请重试')
  } finally {
    isLiking.value = false
  }
}

const toggleFavorite = () => {
  if (!checkAuth()) return
  if (article.value.isFavorited) {
    // Simple unfavorite for demo, ideally show modal
    favoriteAPI.removeFromAllFolders(article.value.articleId).then(() => {
      article.value.isFavorited = false
      window.$toast?.info('从收藏夹中移除')
    })
  } else {
    showFavoriteModal.value = true
  }
}

const handleFavoriteSuccess = () => {
  article.value.isFavorited = true
  showFavoriteModal.value = false
  window.$toast?.success('已保存到收藏夹')
}

const toggleFollow = async () => {
  if (!checkAuth()) return
  try {
    const userId = ensureBigIntAsString(article.value.userId)
    const res = await userAPI.toggleFollow(userId)
    article.value.isFollowed = res.isFollowing
  } catch (e) {
    console.error(e)
  }
}

const shareArticle = () => {
  navigator.clipboard.writeText(window.location.href)
  window.$toast?.success('已复制链接')
}

const checkAuth = () => {
  if (!authStore.isAuthenticated) {
    window.$toast?.warning('请先登录')
    return false
  }
  return true
}

// === UI Logic ===
const handleScroll = () => {
  const st = window.scrollY
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  
  // Reading Progress
  readingProgress.value = (st / docHeight) * 100

  // Smart Dock (Hide on down, Show on up)
  if (st > lastScrollTop && st > 200) {
    showDock.value = false
  } else {
    showDock.value = true
  }
  lastScrollTop = st

  // Active TOC
  for (const heading of tableOfContents.value) {
    const el = document.getElementById(heading.id)
    if (el && el.getBoundingClientRect().top < 150) {
      activeHeading.value = heading.id
    }
  }
}

const scrollToHeading = (id) => {
  const el = document.getElementById(id)
  if (el) {
    window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' })
    // showToc.value = false // 保持目录打开，除非用户手动关闭
  }
}

const scrollToComments = () => {
  document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const cleanText = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// 3D Flip logic removed in favor of Argon Cards
const toggleCardFlip = () => {
  // isCardFlipped.value = !isCardFlipped.value
}

// === Image Zoom (Lightbox) ===
const handleImageClick = (e) => {
  e.stopPropagation()
  const img = e.currentTarget
  zoomedImageSrc.value = img.src
  zoomedImageAlt.value = img.alt || 'Image preview'
  isZoomed.value = true
  document.body.style.overflow = 'hidden'
}

const installImageZoom = () => {
  const imgs = document.querySelectorAll('.markdown-content img')
  imgs.forEach(img => {
    img.removeEventListener('click', handleImageClick)
    img.addEventListener('click', handleImageClick)
  })
}

const closeZoom = () => {
  isZoomed.value = false
  zoomedImageSrc.value = ''
  document.body.style.overflow = ''
}

const installCopyButtons = () => {
  const btns = document.querySelectorAll('.mac-copy-btn')
  btns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const code = decodeURIComponent(btn.getAttribute('data-clipboard-text'))
      try {
        await navigator.clipboard.writeText(code)
        const icon = btn.querySelector('i')
        icon.className = 'fas fa-check'
        setTimeout(() => {
          icon.className = 'far fa-copy'
        }, 2000)
        window.$toast?.success('Copied!')
      } catch (err) {
        console.error('Failed to copy:', err)
        window.$toast?.error('Failed to copy')
      }
    })
  })
}

// === Lifecycle ===
onMounted(() => {
  loadArticleData()
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

watch(() => route.params.slug, (newSlug) => {
  if (newSlug) loadArticleData()
})
</script>

<style scoped>
/* === Variables (Argon Theme) === */
.article-page-argon {
  --argon-primary: #5e72e4;
  --argon-success: #2dce89;
  --argon-info: #11cdef;
  --argon-warning: #fb6340;
  --argon-danger: #f5365c;
  --argon-text: #364863;
  --argon-text-muted: #8898aa;
  --argon-bg: #f4f5f7;
  --card-radius: 15px;
  
  font-family: 'echo', Georgia, -apple-system, 'Nimbus Roman No9 L', 'PingFang SC', 'Hiragino Sans GB', 'Noto Serif SC', 'Microsoft Yahei', 'WenQuanYi Micro Hei', 'ST Heiti', sans-serif;
  background-color: var(--argon-bg);
  color: var(--argon-text);
  min-height: 100vh;
  padding-bottom: 120px;
}

/* === Layout === */
.argon-container {
  max-width: 1140px;
  margin: -100px auto 0;
  padding: 0 15px;
  position: relative;
  z-index: 10;
}

.article-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.layout-main {
  flex: 1;
  min-width: 0;
}

.layout-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.sidebar-sticky-wrapper {
  position: sticky;
  top: 100px;
}

/* === Argon Card (Glassmorphism) === */
.argon-card {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--card-radius);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
  overflow: hidden;
  margin-bottom: 30px;
  padding: 30px;
}

/* Noise Overlay */
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

/* Ensure content is above noise */
.glass-panel > * {
  position: relative;
  z-index: 1;
}

/* === 1. Argon Banner === */
.argon-banner {
  position: relative;
  height: 500px;
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  color: #fff;
}

.banner-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  filter: brightness(0.7);
  transform: scale(1.05);
  transition: transform 0.5s ease;
}

.banner-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(150deg, rgba(var(--themecolor-R), var(--themecolor-G), var(--themecolor-B), 0.6) 15%, rgba(var(--themecolor-R), var(--themecolor-G), var(--themecolor-B), 0.8) 70%, rgba(var(--themecolor-R), var(--themecolor-G), var(--themecolor-B), 0.9) 94%);
  z-index: 1;
}

.banner-container {
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 15px;
  position: relative;
  z-index: 2;
}

.banner-content {
  max-width: 800px;
}

.banner-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.banner-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 30px;
  line-height: 1.6;
}

.banner-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
}

.argon-tag-pill {
  padding: 5px 15px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  font-size: 0.85rem;
  color: #fff;
  text-decoration: none;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.argon-tag-pill:hover {
  background: #fff;
  color: var(--argon-primary);
}

.banner-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.95rem;
  opacity: 0.9;
}

.banner-author {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}

.author-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.8);
}

.meta-divider {
  opacity: 0.5;
}

.apple-pill {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
  text-decoration: none;
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.apple-pill:hover { 
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-3px) scale(1.05);
  border-color: var(--hive-gold);
  color: var(--hive-gold);
  box-shadow: 0 8px 24px rgba(246, 185, 59, 0.25);
  text-shadow: 0 0 8px rgba(246, 185, 59, 0.5);
}

/* Hexagon Avatar */
/* Hexagon Avatar -> Circle Avatar */
.hexagon-avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%; /* Pure Circle */
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 2px solid rgba(255,255,255,0.8);
  
  background: var(--hive-gold);
  transition: transform 0.3s ease;
}
.hexagon-avatar-wrapper:hover {
  transform: scale(1.05);
}
.hexagon-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 20px;
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #fff;
}

.publish-date {
  font-size: 0.85rem;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modified-date {
  font-size: 0.75rem;
  opacity: 0.6;
  font-style: italic;
}

.meta-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.author-name { font-weight: 600; font-size: 1.1rem; }
.publish-date { font-size: 0.85rem; opacity: 0.8; }

.apple-btn-sm {
  padding: 6px 16px;
  border-radius: 100px;
  border: none;
  background: var(--hive-gold);
  color: #000;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.apple-btn-sm:hover { transform: scale(1.05); background: var(--hive-gold-hover); }
.apple-btn-sm.active { background: rgba(255,255,255,0.2); color: #fff; }

/* === 2. Article Body === */
/* === 2. Article Body (Rhythm) === */
.article-body {
  font-size: 1.25rem;
  line-height: 1.8;
  color: #364863;
}

/* Typography Overrides */
:deep(.markdown-content) {
  max-width: 720px;
  margin: 0 auto;
}

:deep(.post-content h1) {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  color: #111;
}

:deep(.post-content h2) {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  letter-spacing: -0.01em;
  color: #111;
}

:deep(.post-content h3) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

:deep(.post-content p) { 
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  line-height: 1.8;
}

:deep(.post-content li) {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

:deep(.post-content blockquote) {
  background: rgba(94, 114, 228, 0.1) !important;
  border-left: 4px solid #5e72e4;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 4px;
}

:deep(.post-content code:not(pre code)) {
  color: #5e72e4;
  background: rgba(94, 114, 228, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

:deep(.post-content img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 2rem auto;
  border-radius: 12px;
  cursor: zoom-in;
  transition: transform 0.3s ease;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

:deep(.post-content img:hover) {
  transform: scale(1.01);
}

/* Lightbox Styles */
.lightbox-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  transform: scale(1);
  animation: zoomIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.lightbox-close {
  position: absolute;
  top: 30px;
  right: 30px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10001;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Fade Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Markdown Tables */
:deep(.markdown-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  font-size: 0.95rem;
  overflow-x: auto;
  display: block; /* For responsive scrolling */
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
:deep(.markdown-content th),
:deep(.markdown-content td) {
  padding: 12px 16px;
  border: 1px solid #e1e1e1;
  text-align: left;
}
:deep(.markdown-content th) {
  background-color: #f5f5f7;
  font-weight: 600;
  color: #1d1d1f;
}
:deep(.markdown-content tr:nth-child(even)) {
  background-color: #fafafa;
}
:deep(.markdown-content tr:hover) {
  background-color: #f5f5f7;
  transition: background-color 0.2s;
}

/* Mac Window Code Block */
:deep(.mac-window) {
  background: #1e1e1e;
  border-radius: 12px;
  margin: 2rem 0;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
:deep(.mac-header) {
  background: #2d2d2d;
  padding: 6px 16px; /* Reduced vertical padding */
  display: flex;
  align-items: center;
  position: relative;
}
:deep(.mac-dots) { display: flex; gap: 8px; }
:deep(.dot) { width: 12px; height: 12px; border-radius: 50%; }
:deep(.dot.red) { background: #ff5f56; }
:deep(.dot.yellow) { background: #ffbd2e; }
:deep(.dot.green) { background: #27c93f; }
:deep(.mac-title) {
  position: absolute;
  left: 50%; transform: translateX(-50%);
  color: #999; font-size: 0.8rem;
}
:deep(.mac-copy-btn) {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}
:deep(.mac-copy-btn:hover) {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
:deep(.mac-body) { 
  padding: 12px 16px 6px 16px; /* Reduced bottom padding */
  overflow-x: auto; 
}
:deep(code.hljs) {
  padding: 0; /* Remove default hljs padding to rely on container */
  background: transparent; /* Ensure background matches container */
}
:deep(code) { font-family: 'Menlo', 'Monaco', monospace; font-size: 0.9rem; }

/* === 5. Floating Dock (Liquid Physics) === */
.dock-wrapper {
  position: fixed;
  bottom: 40px;
  left: 0; width: 100%;
  display: flex;
  justify-content: center;
  z-index: 100;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); /* Springy show/hide */
}
.dock-wrapper.dock-hidden { transform: translateY(200%); }

.apple-dock {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.7); /* More transparent for glass effect */
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.5);
}

.dock-item {
  width: 50px; height: 50px;
  border-radius: 16px;
  border: none;
  background: rgba(255,255,255,0.5);
  color: var(--apple-text);
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Liquid Scale */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.dock-item:hover { 
  background: #fff; 
  transform: translateY(-8px) scale(1.15); 
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
.dock-item:active {
  transform: translateY(-4px) scale(0.95);
}
.dock-item.active { 
  color: var(--hive-gold); 
  background: #fff;
}
.dock-item.active i { transform: scale(1.1); }

.dock-badge {
  position: absolute;
  top: -5px; right: -5px;
  background: var(--hive-gold);
  color: #000;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
}

.dock-divider {
  width: 1px; height: 24px;
  background: rgba(0,0,0,0.1);
  margin: 0 4px;
}

/* === 6. TOC Drawer (Argon Style) === */
.toc-drawer {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 120px);
  border-radius: var(--card-radius);
  padding: 24px;
  z-index: 100;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 15px 35px rgba(50, 50, 93, 0.1);
  transition: all 0.3s ease;
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toc-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--hive-gold);
  margin: 0;
}

.toc-close-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.05);
  color: var(--argon-text-muted);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.toc-close-btn:hover {
  background: var(--argon-danger);
  color: #fff;
}
.toc-list { list-style: none; padding: 0; margin: 0; }
.toc-item {
  padding: 8px 0;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--argon-text-muted);
  transition: all 0.2s;
  border-bottom: 1px solid rgba(0,0,0,0.03);
}

.toc-item:last-child { border-bottom: none; }

.toc-item:hover { color: var(--hive-gold); }

.toc-item.active {
  color: var(--hive-gold);
  font-weight: 600;
  padding-left: 5px;
  border-left: 3px solid var(--hive-gold);
}

.level-2 { padding-left: 15px; }
.level-3 { padding-left: 25px; }

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.slide-fade-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .toc-drawer {
    /* 在小屏幕上变成全屏或侧边抽屉，默认隐藏由 v-show 控制 */
    top: auto;
    bottom: 100px; /* Dock 上方 */
    right: 20px;
    max-height: 60vh;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
  }
}

@media (max-width: 768px) {
  .hero-card {
    border-radius: 0;
    margin: -20px -20px 20px -20px; /* Full width */
    width: calc(100% + 40px);
  }

  .hero-content {
    padding: 24px 20px;
  }

  .hero-title { 
    font-size: 1.75rem; 
    line-height: 1.3;
  }

  .article-layout {
    flex-direction: column;
  }

  .article-body {
    padding: 20px;
    font-size: 1.05rem; /* Slightly larger for mobile readability */
    line-height: 1.7;
  }

  /* Markdown Content Mobile Optimization */
  :deep(.markdown-content) h1 { font-size: 1.75rem; margin-top: 32px; }
  :deep(.markdown-content) h2 { font-size: 1.5rem; margin-top: 28px; }
  :deep(.markdown-content) h3 { font-size: 1.25rem; margin-top: 24px; }
  
  :deep(.markdown-content) pre {
    margin: 16px -20px; /* Full width code blocks */
    border-radius: 0;
    font-size: 0.9rem;
  }

  :deep(.markdown-content) blockquote {
    margin: 16px 0;
    padding: 12px 16px;
  }

  /* TOC Mobile */
  .toc-drawer {
    width: 85vw;
    max-width: 320px;
    position: fixed;
    right: -100%; /* Hidden by default */
    top: 0;
    bottom: 0;
    height: 100vh;
    max-height: none;
    border-radius: 0;
    z-index: 1000;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    visibility: hidden; /* Ensure it doesn't take space or focus when hidden */
  }

  .toc-drawer.active {
    right: 0;
    visibility: visible;
    box-shadow: -10px 0 30px rgba(0,0,0,0.15);
  }
}

/* === Author Card (Argon Style) === */
.author-card-container {
  width: 100%;
  margin-bottom: 30px;
}

.author-card.argon-card {
  padding: 25px;
  text-align: center;
}

.author-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.hexagon-avatar-wrapper.lg {
  width: 100px;
  height: 100px;
}

.author-name-link {
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.author-name-link:hover {
  opacity: 0.7;
}

.author-name-lg {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--argon-text);
  margin: 0;
  cursor: pointer;
  transition: color 0.3s ease;
}

.author-name-link:hover .author-name-lg {
  color: var(--hive-gold);
}

.author-bio {
  font-size: 0.9rem;
  color: var(--argon-text-muted);
  line-height: 1.5;
  margin: 10px 0 0;
}

.author-actions {
  margin-bottom: 25px;
}

.argon-btn-outline {
  width: 100%;
  padding: 10px 20px;
  border-radius: 50px;
  border: 1px solid var(--argon-primary);
  background: #fff;
  color: var(--argon-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.apple-btn-outline:hover {
  background: var(--argon-primary);
  color: #fff;
  box-shadow: 0 4px 11px rgba(94, 114, 228, 0.35);
}

.author-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.05);
}

.stat-box {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--argon-text);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--argon-text-muted);
  text-transform: uppercase;
  margin-top: 5px;
}

/* === Responsive Argon === */
@media (max-width: 991px) {
  .argon-banner { height: 400px; }
  .banner-title { font-size: 2.2rem; }
  
  .argon-container { margin-top: -50px; }
  
  .article-layout { flex-direction: column; }
  .layout-sidebar { width: 100%; }
}

@media (max-width: 767px) {
  .argon-banner { height: 350px; }
  .banner-title { font-size: 1.8rem; }
  .banner-meta { font-size: 0.85rem; flex-wrap: wrap; }
  
  .argon-card { padding: 20px; }
  .post-content { font-size: 1.15rem; }
}
</style>