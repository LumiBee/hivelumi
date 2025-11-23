<template>
  <div class="article-page-apple">
    <!-- 顶部阅读进度条 (Hive Gold) -->
    <div class="reading-progress" :style="{ width: readingProgress + '%' }"></div>

    <!-- 导航栏占位 (防止内容被遮挡) -->
    <div class="nav-spacer"></div>

    <!-- 核心内容区域 -->
    <main class="apple-container" v-if="article">
      
      <!-- 1. 沉浸式磨砂玻璃 Hero 卡片 -->
      <header class="hero-card glass-panel" data-aos="fade-up" data-aos-duration="800">
        <!-- 背景图 (模糊处理) -->
        <div class="hero-bg" :style="{ backgroundImage: `url(${article.coverImageUrl || defaultCover})` }"></div>
        <div class="hero-overlay"></div>
        
        <div class="hero-content">
          <!-- 标签 Pills -->
          <div class="hero-tags" v-if="article.tags && article.tags.length">
            <router-link 
              v-for="tag in article.tags" 
              :key="tag.tagId" 
              :to="`/tags/${tag.slug}`"
              class="apple-pill"
            >
              # {{ tag.name }}
            </router-link>
          </div>

          <!-- 标题 -->
          <h1 class="hero-title">{{ article.title }}</h1>

          <!-- 作者信息 (Hexagon Avatar) -->
          <div class="hero-meta">
            <router-link :to="`/profile/${article.userName}`" class="meta-author">
              <div class="hexagon-avatar-wrapper">
                <img :src="getAuthorAvatarUrl(article.avatarUrl)" alt="Author" class="hexagon-avatar">
              </div>
              <div class="meta-text">
                <span class="author-name">{{ article.userName }}</span>
                <span class="publish-date">{{ formatDate(article.gmtCreate) }}</span>
              </div>
            </router-link>
            
            <!-- 关注按钮 (Pill Style) -->
            <button 
              v-if="authStore.isAuthenticated && article.userId !== authStore.user?.id"
              @click="toggleFollow"
              class="apple-btn-sm"
              :class="{ 'active': article.isFollowed }"
            >
              {{ article.isFollowed ? '已关注' : '关注' }}
            </button>
          </div>
        </div>
      </header>

      <div class="article-layout">
        <!-- 左侧：文章主体 -->
        <div class="layout-main">
          <!-- 2. 文章正文 (极简阅读模式) -->
          <article class="article-body" data-aos="fade-up" data-aos-delay="200">
            <div v-html="renderedContent" class="markdown-content apple-typography"></div>
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
            <!-- 3.5 关于作者 -->
            <section class="author-section glass-panel" data-aos="fade-left" data-aos-delay="300">
              <div class="author-card-content">
                <div class="author-header">
                  <router-link :to="`/profile/${article.userName}`" class="author-avatar-lg-link">
                    <div class="hexagon-avatar-wrapper lg">
                      <img :src="getAuthorAvatarUrl(article.avatarUrl)" alt="Author" class="hexagon-avatar">
                    </div>
                  </router-link>
                  <div class="author-info-lg">
                    <h3 class="author-name-lg">{{ article.userName }}</h3>
                    <p class="author-bio">{{ article.userBio || '这位作者很神秘，什么都没写...' }}</p>
                  </div>
                </div>
                
                <div class="author-actions">
                  <button 
                    v-if="authStore.isAuthenticated && article.userId !== authStore.user?.id"
                    @click="toggleFollow"
                    class="apple-btn-outline full-width"
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

    <!-- 图片放大遮罩 -->
    <div class="zoom-overlay" :class="{ active: isZoomed }" @click="closeZoom"></div>

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
import { articleAPI, userAPI, favoriteAPI } from '@/api'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import FavoriteModal from '@/components/FavoriteModal.vue'
import CommentSection from '@/components/CommentSection.vue'
import { getAuthorAvatarUrl } from '@/utils/avatar-helper'
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
const zoomedImage = ref(null)
const showFavoriteModal = ref(false)
const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'

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

  renderer.heading = (text, level, raw) => {
    const id = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-')
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

  renderedContent.value = DOMPurify.sanitize(marked(article.value.content, { renderer }))
  tableOfContents.value = headings

  nextTick(() => {
    installImageZoom()
    installCopyButtons()
  })
}

// === Actions ===
const toggleLike = async () => {
  if (!checkAuth()) return
  try {
    const res = await articleAPI.toggleLike(article.value.articleId)
    if (res) {
      article.value.liked = res.liked
      article.value.likes = res.likeCount
      if (res.liked) window.$toast?.success('Liked!')
    }
  } catch (e) {
    console.error(e)
  }
}

const toggleFavorite = () => {
  if (!checkAuth()) return
  if (article.value.isFavorited) {
    // Simple unfavorite for demo, ideally show modal
    favoriteAPI.removeFromAllFolders(article.value.articleId).then(() => {
      article.value.isFavorited = false
      window.$toast?.info('Removed from favorites')
    })
  } else {
    showFavoriteModal.value = true
  }
}

const handleFavoriteSuccess = () => {
  article.value.isFavorited = true
  showFavoriteModal.value = false
  window.$toast?.success('Saved to favorites')
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
  window.$toast?.success('Link copied to clipboard')
}

const checkAuth = () => {
  if (!authStore.isAuthenticated) {
    window.$toast?.warning('Please login first')
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
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const cleanText = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// === Image Zoom ===
const installImageZoom = () => {
  const imgs = document.querySelectorAll('.markdown-content img')
  imgs.forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation()
      if (isZoomed.value && zoomedImage.value === img) {
        closeZoom()
      } else {
        zoomedImage.value = img
        img.classList.add('zoomed')
        isZoomed.value = true
        document.body.style.overflow = 'hidden'
      }
    })
  })
}

const closeZoom = () => {
  if (zoomedImage.value) zoomedImage.value.classList.remove('zoomed')
  isZoomed.value = false
  zoomedImage.value = null
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
/* === Variables (Apple x Hive Theme) === */
.article-page-apple {
  --apple-bg: #fbfbfd;
  --apple-text: #1d1d1f;
  --apple-gray: #86868b;
  --hive-gold: #f6b93b;
  --hive-gold-hover: #e5a52a;
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-highlight: rgba(255, 255, 255, 0.5);
  --glass-shadow: rgba(0, 0, 0, 0.05);
  
  /* Noise Texture (Base64 SVG) */
  --noise-pattern: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");

  --shadow-sm: 0 4px 24px -4px var(--glass-shadow);
  --shadow-lg: 0 24px 48px -12px rgba(0, 0, 0, 0.1);
  
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--apple-bg);
  color: var(--apple-text);
  min-height: 100vh;
  padding-bottom: 120px; /* Space for Dock */
  
  /* 页面背景纹理增强 */
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(246, 185, 59, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(66, 153, 225, 0.08) 0%, transparent 40%);
}

/* === Layout === */
.apple-container {
  max-width: 1200px; /* 增加宽度以容纳侧边栏 */
  margin: 0 auto;
  padding: 0 20px;
}

.article-layout {
  display: flex;
  gap: 60px; /* Increased gap for breathability */
  align-items: flex-start;
}

.layout-main {
  flex: 1;
  min-width: 0; /* 防止 flex 子项溢出 */
  max-width: 720px; /* Limit content width for readability */
}

.layout-sidebar {
  width: 320px;
  flex-shrink: 0;
}

.sidebar-sticky-wrapper {
  position: sticky;
  top: 120px; /* 距离顶部距离 */
}

.nav-spacer { height: 100px; }

/* === Glass Panel Utility (Glassmorphism 2.0) === */
.glass-panel {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 
    var(--shadow-sm),
    inset 0 1px 0 0 var(--glass-highlight),
    inset 0 -1px 0 0 rgba(0,0,0,0.05); /* Edge Highlight */
  overflow: hidden;
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

/* === 1. Hero Card === */
.hero-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 40px;
  padding: 40px;
  text-align: center;
  color: #fff; /* Always white text on hero */
}

.hero-bg {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(10px) brightness(0.8); /* Reduced blur for "Cinematic" feel */
  transform: scale(1.1);
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6)); /* Cinematic Gradient */
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 60px 20px;
}

.hero-title {
  font-size: 3.5rem; /* Huge Title */
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em; /* Tight tracking */
  text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  max-width: 800px;
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

.meta-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  font-size: 1.2rem; /* Slightly larger for reading */
  line-height: 1.8;
  color: #333;
}

/* Typography Overrides */
:deep(.markdown-content) {
  max-width: 680px; /* Narrower for focus */
  margin: 0 auto; /* Center content within layout-main if needed */
}
:deep(.markdown-content h2) {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
  color: #111;
}
:deep(.markdown-content p) { 
  margin-bottom: 2em; /* Breathable paragraphs */
  opacity: 0.9;
}
:deep(.markdown-content img) {
  width: 100%;
  border-radius: 16px;
  margin: 3rem 0;
  cursor: zoom-in;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: var(--shadow-lg);
}
:deep(.markdown-content img:hover) {
  transform: scale(1.02);
}
:deep(.markdown-content img.zoomed) {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(1);
  max-height: 95vh;
  max-width: 95vw;
  z-index: 10001;
  cursor: zoom-out;
  object-fit: contain;
  box-shadow: 0 40px 80px rgba(0,0,0,0.5);
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

/* === 6. TOC Drawer === */
.toc-drawer {
  position: fixed;
  top: 100px; /* 给 Navbar 留出空间 */
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 120px);
  border-radius: 20px;
  padding: 20px;
  z-index: 90; /* 略低于 Dock 和 Modal */
  overflow-y: auto;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.toc-close-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.5);
  color: var(--apple-gray);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.toc-close-btn:hover {
  background: var(--hive-gold);
  color: #fff;
  border-color: transparent;
}
.toc-list { list-style: none; padding: 0; margin: 0; }
.toc-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--apple-gray);
  transition: all 0.2s;
}
.toc-item:hover { background: rgba(0,0,0,0.03); color: var(--apple-text); }
.toc-item.active {
  background: rgba(246, 185, 59, 0.1);
  color: var(--hive-gold);
  font-weight: 600;
  border-left: 3px solid var(--hive-gold);
}
.level-2 { padding-left: 24px; }
.level-3 { padding-left: 36px; }

/* Transitions */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(50px); opacity: 0; }

/* Reading Progress */
.reading-progress {
  position: fixed; top: 0; left: 0; height: 3px;
  background: var(--hive-gold);
  z-index: 1000;
  transition: width 0.1s;
}

/* Zoom Overlay */
.zoom-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255,255,255,0.95);
  z-index: 10000;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
}
.zoom-overlay.active { opacity: 1; pointer-events: auto; }

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
  .hero-title { font-size: 1.8rem; }
  /* 移除 display: none，让 v-show 控制 */
}

/* === Author Section Styles === */
.author-section {
  padding: 24px;
  border-radius: 20px;
}
.author-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  margin-bottom: 20px;
}
.hexagon-avatar-wrapper.lg { 
  width: 90px; 
  height: 90px; 
  /* Inherits mask from base class */
}
.author-info-lg { width: 100%; }
.author-name-lg { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
.author-bio { font-size: 0.9rem; color: var(--apple-gray); line-height: 1.5; }

.author-actions {
  margin-bottom: 20px;
}

.apple-btn-outline {
  padding: 8px 20px;
  border-radius: 100px;
  border: 1px solid var(--hive-gold);
  background: transparent;
  color: var(--hive-gold-hover);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.apple-btn-outline.full-width {
  width: 100%;
  display: block;
}
.apple-btn-outline:hover { background: var(--hive-gold); color: #fff; }
.apple-btn-outline.active { background: rgba(0,0,0,0.05); border-color: transparent; color: var(--apple-gray); }

.author-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.05);
}
.stat-box { display: flex; flex-direction: column; align-items: center; }
.stat-val { font-size: 1.1rem; font-weight: 700; color: var(--apple-text); }
.stat-label { font-size: 0.8rem; color: var(--apple-gray); margin-top: 4px; }

@media (max-width: 992px) {
  .article-layout {
    flex-direction: column;
  }
  .layout-sidebar {
    width: 100%;
    order: 2; /* 移动端放在底部，或者可以改成 0 放在顶部 */
  }
  .author-header { flex-direction: row; text-align: left; }
  .author-info-lg { width: auto; flex: 1; }
  .apple-btn-outline.full-width { width: auto; }
}
</style>