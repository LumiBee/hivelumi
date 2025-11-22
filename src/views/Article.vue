<template>
  <div class="article-page">
    <!-- 回到顶部按钮 -->
    <div class="back-to-top" @click="scrollToTop" v-show="showBackToTop">
      <i class="fas fa-arrow-up"></i>
    </div>
    <div class="article-hero" v-if="article" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="container-fluid" style="max-width: 1400px; position: relative; z-index: 2;">
        <div class="article-hero-content">
          <!-- 文章标题 -->
          <h1 class="article-hero-title">{{ article.title }}</h1>
          
          <!-- 文章标签和作品集信息 -->
          <div class="hero-tags-portfolio" v-if="article.tags && article.tags.length > 0 || article.portfolio">
            <!-- 标签 -->
            <div class="hero-tags" v-if="article.tags && article.tags.length > 0">
              <div class="tags-container">
                <router-link
                  v-for="tag in article.tags"
                  :key="tag.tagId"
                  :to="`/tags/${tag.slug}`"
                  class="hero-tag"
                >
                  <i class="fas fa-tag"></i>
                  {{ tag.name }}
                </router-link>
              </div>
            </div>
            
            <!-- 作品集 -->
            <div class="hero-portfolio" v-if="article.portfolio">
              <router-link
                :to="`/portfolio/${article.portfolio.id}`"
                class="portfolio-link"
                @click="console.log('作品集链接点击:', article.portfolio)"
              >
                <i class="fas fa-book-open"></i>
                <span>{{ article.portfolio.name }}</span>
              </router-link>
            </div>
          </div>
          
          <!-- 文章基本信息 -->
          <div class="article-hero-meta">
            <div class="meta-left">
              <div class="author-info">
                <router-link :to="`/profile/${article.userName}`" class="hero-avatar-link">
                  <img :src="getAuthorAvatarUrl(article.avatarUrl)" alt="作者头像" class="hero-avatar">
                </router-link>
                <div class="author-details">
                  <span class="hero-author">{{ article.userName || '匿名' }}</span>
                  <span class="hero-date">{{ formatDate(article.gmtCreate) }}</span>
                </div>
              </div>
            </div>
            <div class="meta-right">
              <button
                v-if="authStore.isAuthenticated && article.userId !== authStore.user?.id"
                @click="toggleFollow"
                :class="['btn btn-sm follow-btn', article.isFollowed ? 'btn-secondary' : 'btn-warning']"
              >
                <i class="fas fa-user-plus me-1"></i>
                {{ article.isFollowed ? '已关注' : '关注' }}
              </button>
            </div>
          </div>
          
          <!-- 作者详细信息 -->
          <div class="hero-author-details">
            <div class="author-bio-hero">{{ article.userBio || '这个用户很懒，什么都没有留下...' }}</div>
            <div class="author-stats-hero">
              <span class="stat-item-hero">
                <i class="fas fa-file-alt"></i>
                <span class="stat-number">{{ article.userArticleCount || 0 }}</span>
                <span class="stat-label">文章</span>
              </span>
              <span class="stat-item-hero">
                <i class="fas fa-users"></i>
                <span class="stat-number">{{ article.userFollowersCount || 0 }}</span>
                <span class="stat-label">粉丝</span>
              </span>
              <span class="stat-item-hero">
                <i class="fas fa-user-plus"></i>
                <span class="stat-number">{{ article.userFollowingCount || 0 }}</span>
                <span class="stat-label">关注</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container-fluid" style="max-width: 1400px;">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
      </div>
      
      <div v-else-if="article" class="row">
        <!-- 文章内容 -->
        <div class="col-lg-8 position-relative">
          <!-- 左侧快捷按钮栏 -->
                      <div class="article-quick-actions-panel">
              <div class="quick-action-item" @click="toggleLike" :class="[{ 'active': article.liked }, {'heart-pulse-anim': article.liked && animateLike}]" @animationend="animateLike = false" :title="article.liked ? '取消点赞' : '点赞'">
                <i :class="[article.liked ? 'fas fa-heart' : 'far fa-heart']"></i>
                <span class="item-label">点赞</span>
                <span class="item-count">{{ article.likes || 0 }}</span>
              </div>
            <div class="quick-action-item" @click="toggleFavorite" :class="[{ 'active': article.isFavorited }, {'bookmark-fill-anim': article.isFavorited && animateFavorite}]" @animationend="animateFavorite = false" :title="article.isFavorited ? '取消收藏' : '收藏'">
              <i :class="[article.isFavorited ? 'fas fa-bookmark' : 'far fa-bookmark']"></i>
              <span class="item-label">收藏</span>
            </div>
            <div class="quick-action-item" @click="shareArticle" title="分享">
              <i class="fas fa-share-alt"></i>
              <span class="item-label">分享</span>
            </div>
            <div class="quick-action-item" @click="scrollToComments" title="查看评论">
              <i class="fas fa-comment-alt"></i>
              <span class="item-label">评论</span>
            </div>
          </div>
          <article class="article-content-wrapper shadow-sm rounded p-4 bg-white">
            <!-- 文章头部 -->
            <header class="article-header mb-4" data-aos="fade-up">
              
              <div class="article-meta d-flex align-items-center justify-content-between">
                <div class="author-info d-flex align-items-center">
                  <router-link :to="`/profile/${article.userName}`" class="author-avatar-link">
                    <img
                      :src="getAuthorAvatarUrl(article.avatarUrl)"
                      alt="作者头像"
                      class="author-avatar me-3"
                    />
                  </router-link>
                  <div>
                    <div class="author-name">{{ article.userName || '匿名' }}</div>
                    <div class="publish-time text-muted small">
                      发布于 {{ formatDate(article.gmtCreate) }}
                      <span v-if="article.gmtModified && article.gmtModified !== article.gmtCreate">
                        · 更新于 {{ formatDate(article.gmtModified) }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="article-stats d-flex align-items-center">
                  <span class="stat-item me-3">
                    <i class="fas fa-eye me-1"></i>
                    {{ article.viewCount || 0 }}
                  </span>
                  <span class="stat-item">
                    <i class="fas fa-heart me-1"></i>
                    {{ article.likes || 0 }}
                  </span>
                </div>
              </div>
            </header>
            
            <!-- 文章内容 -->
            <div class="article-content" data-aos="fade-up" data-aos-delay="200">
              <div v-html="renderedContent" class="markdown-content"></div>
            </div>
            
            <!-- 文章操作 -->
            <div class="article-actions mt-4 pt-4 border-top" data-aos="fade-up" data-aos-delay="400">
              <div class="d-flex justify-content-between align-items-center">
                <div class="action-buttons">
                  <button
                    @click="toggleLike"
                    :class="['action-btn', 'action-btn-like', { 'active': article.liked }]"
                    :disabled="!authStore.isAuthenticated"
                  >
                    <i :class="[article.liked ? 'fas fa-heart' : 'far fa-heart']"></i>
                    <span class="btn-text">{{ article.liked ? '已点赞' : '点赞' }}</span>
                    <span class="btn-count">{{ article.likes || 0 }}</span>
                  </button>
                  
                  <button
                    @click="toggleFavorite"
                    :class="['action-btn', 'action-btn-favorite', { 'active': article.isFavorited }]"
                    :disabled="!authStore.isAuthenticated"
                  >
                    <i :class="[article.isFavorited ? 'fas fa-bookmark' : 'far fa-bookmark']"></i>
                    <span class="btn-text">{{ article.isFavorited ? '已收藏' : '收藏' }}</span>
                  </button>
                </div>
                
                <div class="share-buttons">
                  <button class="action-btn action-btn-share" @click="shareArticle">
                      <i class="fas fa-share-alt"></i>
                      <span class="btn-text">分享</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
          
          <!-- 评论区 -->
          <div v-if="article?.articleId" id="comment-section" class="mt-4">
            <CommentSection :article-id="article.articleId" />
          </div>
        </div>
        
        <!-- 侧边栏 -->
        <div class="col-lg-4">
          <div class="sidebar-sticky">
            <!-- 文章目录 - 移到最上面 -->
            <div v-if="tableOfContents.length > 0" class="article-toc-panel" data-aos="fade-left">
              <div class="article-toc-panel__header">
                <h6 class="mb-0"><i class="fas fa-list-ul me-2"></i>文章目录</h6>
              </div>
              <div class="article-toc-panel__body">
                <nav class="article-toc">
                  <ul class="toc-list">
                    <li v-for="(item, index) in tableOfContents" :key="index" :class="['toc-item', `toc-level-${item.level}`]" :data-id="item.id">
                      <a :href="`#${item.id}`" class="toc-link" @click.prevent="scrollToHeading(item.id)">
                        <span class="toc-text">{{ cleanText(item.text) }}</span>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
            
            <!-- 相关文章 -->
            <div v-if="relatedArticles.length > 0" class="related-articles card shadow-sm border-0" data-aos="fade-left" data-aos-delay="200">
              <div class="card-header">
                <h6 class="mb-0">相关文章</h6>
              </div>
              <div class="card-body p-0">
                <router-link
                  v-for="relatedArticle in relatedArticles"
                  :key="relatedArticle.articleId || relatedArticle.id"
                  :to="`/article/${relatedArticle.slug}`"
                  class="related-article-item"
                  @click="handleRelatedArticleClick(relatedArticle)"
                >
                  <div class="d-flex">
                    <div class="related-article-content">
                      <h6 class="related-article-title">{{ relatedArticle.title }}</h6>
                      <div class="related-article-meta">
                        <small class="text-muted">
                          <i class="fas fa-eye me-1"></i>{{ relatedArticle.viewCount || 0 }}
                          <i class="fas fa-heart ms-2 me-1"></i>{{ relatedArticle.likes || 0 }}
                        </small>
                      </div>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-5">
        <h3>文章未找到</h3>
        <p class="text-muted">抱歉，您访问的文章不存在或已被删除。</p>
        <router-link to="/" class="btn btn-warning">返回首页</router-link>
      </div>
    </div>
    
    <!-- 收藏选择模态框 -->
    <FavoriteModal
      v-if="article?.articleId"
      :visible="showFavoriteModal"
      :article-id="article.articleId"
      @close="closeFavoriteModal"
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
import { ensureBigIntAsString, debugId } from '@/utils/bigint-helper'
import { getAuthorAvatarUrl } from '@/utils/avatar-helper'
import hljs from 'highlight.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Reactive State
const article = ref(null);
const loading = ref(true);
const relatedArticles = ref([]);
const tableOfContents = ref([]);
const renderedContent = ref('');
const showFavoriteModal = ref(false);
const showBackToTop = ref(false);
const animateLike = ref(false);
const animateFavorite = ref(false);

const heroStyle = computed(() => {
  if (article.value?.coverImageUrl) {
    return { backgroundImage: `url(${article.value.coverImageUrl})` };
  }
  return { backgroundImage: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' };
});

watch(article, () => {
  animateLike.value = false;
  animateFavorite.value = false;
});

// --- Core Logic ---

const loadArticleData = async () => {
  try {
    loading.value = true
    const slug = route.params.slug
    if (!slug) {
      console.error('Article slug not found in route')
      loading.value = false
      return
    }

    const response = await articleAPI.getArticleBySlug(slug)
    if (response) {
      article.value = response
      relatedArticles.value = response.relatedArticles || []
      renderMarkdownContent()
    } else {
      article.value = null
    }
  } catch (error) {
    console.error('Failed to load article:', error)
    article.value = null
  } finally {
    loading.value = false
  }
}

const renderMarkdownContent = () => {
  if (!article.value?.content) {
    renderedContent.value = ''
    return
  }

  const headings = []
  const renderer = new marked.Renderer()

  renderer.heading = (text, level, raw) => {
    const id = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    headings.push({ id, text, level, raw });
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  // 彻底接管行内代码的渲染，强制应用我们自己的样式
  renderer.codespan = (text) => {
    // 直接返回带有最高优先级内联样式的HTML
    return `<code style="background-color: #edf2f7 !important; color: #e83e8c; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.9em;">${text}</code>`;
  };

  renderer.code = (code, language) => {
    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    const highlightedCode = hljs.highlight(code, { language: validLanguage, ignoreIllegals: true }).value;
    
    // 新的、更健壮的 HTML 结构
    const copyButton = `<button class="copy-btn" type="button" title="复制代码">复制</button>`;
    const header = `
      <div class="mac-window-header">
        <div class="mac-window-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="mac-window-title">${language || ''}</div>
        ${copyButton}
      </div>`;
    
    const body = `
      <div class="mac-window-body">
        <pre><code class="language-${language}">${highlightedCode}</code></pre>
      </div>`;

    return `<div class="code-block-wrapper mac-window">${header}${body}</div>`;
  };
  
  renderedContent.value = DOMPurify.sanitize(marked(article.value.content, { renderer }));
  tableOfContents.value = headings;

  nextTick(() => {
    installDelegatedCopy();
  });
}

// --- User Actions ---

const toggleLike = async () => {
  if (!authStore.isAuthenticated) {
    window.$toast?.warning('请先登录后再点赞');
    return;
  }
  try {
    const response = await articleAPI.toggleLike(article.value.articleId)
    if (response) {
      article.value.liked = response.liked
      article.value.likes = response.likeCount
      if (response.liked) { // 成功点赞时触发动画
        animateLike.value = true;
        window.$toast?.success('点赞成功！');
      } else {
        window.$toast?.info('已取消点赞');
      }
    }
  } catch (error) {
    console.error('Toggle like failed:', error)
    window.$toast?.error('操作失败，请稍后重试');
  }
}

const toggleFavorite = () => {
  if (!authStore.isAuthenticated) {
    window.$toast?.warning('请先登录后再收藏');
    return;
  }
  if (article.value.isFavorited) {
    unfavoriteArticle();
  } else {
    showFavoriteModal.value = true
    animateFavorite.value = true; // 成功收藏时触发动画
  }
}

const unfavoriteArticle = async () => {
  try {
    await favoriteAPI.removeFromAllFolders(article.value.articleId);
    article.value.isFavorited = false;
    window.$toast?.info('已取消收藏');
  } catch (error) {
    console.error('Unfavorite failed:', error);
    window.$toast?.error('取消收藏失败，请稍后重试');
  }
};


const handleFavoriteSuccess = () => {
  article.value.isFavorited = true;
  showFavoriteModal.value = false;
  animateFavorite.value = true; // 成功时触发动画
  window.$toast?.success('收藏成功！');
}

const closeFavoriteModal = () => {
  showFavoriteModal.value = false
}

const toggleFollow = async () => {
  if (!authStore.isAuthenticated) {
    window.$toast?.warning('请先登录后再关注');
    return;
  }
  try {
    const userIdStr = ensureBigIntAsString(article.value.userId);
    const response = await userAPI.toggleFollow(userIdStr)
    if (response) {
      article.value.isFollowed = response.isFollowing
      window.$toast?.[response.isFollowing ? 'success' : 'info'](response.isFollowing ? '关注成功！' : '已取消关注');
    }
  } catch (error) {
    console.error('Toggle follow failed:', error)
    window.$toast?.error('操作失败，请稍后重试');
  }
}

const shareArticle = () => {
  if (navigator.share) {
    navigator.share({
      title: article.value.title,
      text: article.value.excerpt,
      url: window.location.href,
    }).catch(err => {
      if (err.name !== 'AbortError') console.error('Share failed:', err)
    });
  } else {
    navigator.clipboard.writeText(window.location.href)
      .then(() => window.$toast?.success('链接已复制到剪贴板'))
      .catch(() => window.$toast?.error('复制失败，请手动复制链接'));
  }
}

// --- UI & Navigation ---

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
}

const cleanText = (text) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  return tempDiv.textContent || tempDiv.innerText || '';
};

const scrollToHeading = (id) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 100;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    history.pushState(null, null, `#${id}`);
  }
};

const scrollToHashOnLoad = () => {
  if (route.hash) {
    scrollToHeading(route.hash.substring(1));
  }
}

const scrollToComments = () => {
  const commentSection = document.querySelector('#comment-section');
  if (commentSection) {
    commentSection.scrollIntoView({ behavior: 'smooth' });
  }
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300;
  highlightCurrentHeading();
};

const highlightCurrentHeading = () => {
  if (tableOfContents.value.length === 0) return;

  const TOP_OFFSET = 101; // 为顶部导航栏和一些缓冲留出空间
  const scrollPosition = window.scrollY + TOP_OFFSET;

  let currentHeadingId = null;

  for (let i = tableOfContents.value.length - 1; i >= 0; i--) {
    const heading = tableOfContents.value[i];
    const element = document.getElementById(heading.id);
    
    if (element && element.offsetTop <= scrollPosition) {
      currentHeadingId = heading.id;
      break;
    }
    
  }

  // 移除所有旧的 active class
  document.querySelectorAll('.toc-item.active').forEach(item => item.classList.remove('active'));

  if (currentHeadingId) {
    const activeItem = document.querySelector(`.toc-item[data-id="${currentHeadingId}"]`);
    if (activeItem) {
      // 唯一的工作：添加 active 类
      activeItem.classList.add('active');
    }
  }
};

const handleRelatedArticleClick = (relatedArticle) => {
  if (relatedArticle.slug) {
    router.push(`/article/${relatedArticle.slug}`);
  }
}

// --- Code Block Copy Logic ---

let delegatedCopyHandler = null;
const installDelegatedCopy = () => {
  const container = document.querySelector('.markdown-content');
  if (!container || delegatedCopyHandler) return;

  delegatedCopyHandler = async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    // 新的查找逻辑：先找到父容器，再向下找到pre
    const wrapper = btn.closest('.code-block-wrapper');
    if (!wrapper) return;
    const pre = wrapper.querySelector('pre');
    if (!pre) return;

    const code = pre.querySelector('code')?.innerText || '';
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = '已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '复制';
        btn.classList.remove('copied');
      }, 1500);
    } catch (err) {
      console.warn('Copy failed', err);
      btn.textContent = '失败';
    }
  };
  container.addEventListener('click', delegatedCopyHandler);
};

const uninstallDelegatedCopy = () => {
  const container = document.querySelector('.markdown-content');
  if (container && delegatedCopyHandler) {
    container.removeEventListener('click', delegatedCopyHandler);
    delegatedCopyHandler = null;
  }
};

// --- Lifecycle Hooks ---

onMounted(async () => {
  await loadArticleData();
  window.addEventListener('scroll', handleScroll);
  nextTick(scrollToHashOnLoad);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  uninstallDelegatedCopy();
});

watch(() => route.params.slug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    scrollToTop();
    loadArticleData();
  }
});
</script>

<style scoped>
/* === 全新 macOS 风格代码块样式 (适配新HTML结构, 使用 :deep() 穿透 v-html) Start === */
:deep(.mac-window) {
  margin: 1.8rem 0;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background-color: #2d3748; /* 默认深色背景，适配常见代码主题 */
}

:deep(.mac-window-header) {
  display: flex;
  align-items: center;
  height: 40px;
  background-color: #f1f5f9;
  border-bottom: 1px solid #d1d5db;
  padding: 0 12px;
  position: relative;
}

:deep(.mac-window-dots) {
  display: flex;
  gap: 8px;
}

:deep(.dot) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
:deep(.dot.red) { background-color: #ff5f56; }
:deep(.dot.yellow) { background-color: #ffbd2e; }
:deep(.dot.green) { background-color: #27c93f; }

:deep(.mac-window-title) {
  color: #4a5568;
  font-size: 0.85rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 500;
}

:deep(.mac-window-body) {
  /* 这个容器让 pre/code 可以自由滚动 */
  overflow: auto;
}

/* 让 pre 标签填充 body，并移除我们之前的所有强制样式 */
:deep(.mac-window-body pre) {
  margin: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding: 1.25rem !important; /* 增加一点内边距 */
}

/* 复制按钮样式 */
:deep(.copy-btn) {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background-color: rgba(0,0,0,0.08);
  border: none;
  color: rgba(0,0,0,0.5);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
}

:deep(.copy-btn:hover) {
  background-color: rgba(0,0,0,0.15);
  color: #000;
}
:deep(.copy-btn.copied) {
  background-color: #27c93f;
  color: #fff;
}

/* === 全新 macOS 风格代码块样式 End === */



.article-hero {

  /* 1. 结构与布局 */

  position: relative;

  height: 500px; /* 设定最小高度，确保视觉冲击力 */
  display: flex; /* 使用 Flexbox 布局 */
  align-items: center; /* 垂直居中内容 */
  justify-content: center; /* 水平居中内容 */
  background-size: cover; /* 确保背景图片覆盖整个区域 */
  background-position: center center; /* 背景图片居中 */
  background-repeat: no-repeat; /* 不重复背景图片 */
  overflow: hidden; /* 隐藏溢出内容 */
  isolation: isolate; /* 创建新的堆叠上下文，确保 overlay 在其之上 */
  padding: 4rem 0; /* 顶部和底部留白 */
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 柔和的渐变蒙版，提升文本对比度 */
  background: linear-gradient(
    180deg,
    rgba(26, 32, 44, 0.4) 0%, /* 顶部稍透明 */
    rgba(26, 32, 44, 0.7) 100% /* 底部更深 */
  );
  z-index: 1; /* 确保在背景图片之上，内容之下 */
}

.article-hero-content {
  position: relative;
  z-index: 2; /* 确保内容在蒙版之上 */
  text-align: center; /* 文本居中 */
  color: #ffffff; /* 确保文本颜色在高对比度背景下可见 */
  max-width: 800px; /* 限制内容宽度，避免过宽 */
  padding: 0 1rem; /* 左右内边距 */
}

.article-hero-title {
  font-family: 'Playfair Display', Georgia, serif; /* 引入更具吸引力的字体 */
  font-size: 3.5rem; /* 更大的标题字体 */
  font-weight: 700; /* 加粗 */
  margin-bottom: 1.5rem; /* 增加底部间距 */
  line-height: 1.2;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); /* 添加柔和的阴影，提升立体感 */
}

/* 标签和作品集样式 */
.hero-tags-portfolio {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap; /* 允许标签换行 */
  gap: 1rem; /* 标签和作品集之间的间距 */
  margin-bottom: 1.5rem;
}

.hero-tags .tags-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem; /* 标签之间的间距 */
}

.hero-tag {
  background-color: rgba(255, 255, 255, 0.2); /* 半透明背景 */
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px); /* 增加模糊效果 */
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3); /* 轻微边框 */
}

.hero-tag:hover {
  background-color: rgba(246, 185, 59, 0.8); /* 悬停时品牌色 */
  border-color: #f6b93b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.hero-tag i {
  margin-right: 0.3rem;
  font-size: 0.8rem;
}

.hero-portfolio .portfolio-link {
  background-color: rgba(246, 185, 59, 0.7); /* 作品集使用品牌色 */
  color: #2d3748; /* 深色文本 */
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  text-decoration: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(246, 185, 59, 0.8);
}

.hero-portfolio .portfolio-link:hover {
  background-color: #f6b93b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.hero-portfolio .portfolio-link i {
  margin-right: 0.3rem;
  font-size: 0.8rem;
}

/* 作者信息区域 */
.article-hero-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem; /* 左右间距 */
  margin-top: 1.5rem;
  padding: 1rem 0; /* 顶部和底部内边距 */
  border-top: 1px solid rgba(255, 255, 255, 0.2); /* 分隔线 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* 分隔线 */
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hero-avatar {
  width: 56px; /* 更大的头像 */
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f6b93b; /* 品牌色边框 */
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3); /* 双层阴影 */
  transition: transform 0.3s ease;
}

.hero-avatar:hover {
  transform: scale(1.05);
}

.hero-author {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.2rem;
  display: block;
}

.hero-date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.follow-btn {
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-width: 1.5px;
  padding: 8px 20px;
  font-size: 0.9rem;
}

.follow-btn.btn-warning {
  background-color: #f6b93b;
  border-color: #f6b93b;
  color: #2d3748;
}

.follow-btn.btn-warning:hover {
  background-color: #e0a800;
  border-color: #e0a800;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(246, 185, 59, 0.4);
}

.follow-btn.btn-secondary {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.follow-btn.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 作者详细信息区域 */
.hero-author-details {
  margin-top: 1.5rem;
  text-align: center;
  padding: 0 1rem;
}

.author-bio-hero {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto 1rem auto;
  line-height: 1.6;
}

.author-stats-hero {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.stat-item-hero i {
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
  color: #f6b93b; /* 图标使用品牌色 */
}

.stat-item-hero .stat-number {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

.stat-item-hero .stat-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .article-hero {
    height: auto; /* 移动端高度自适应 */
    padding: 3rem 0;
  }

  .article-hero-title {
    font-size: 2.5rem; /* 移动端标题字体略小 */
    margin-bottom: 1rem;
  }

  .hero-tags-portfolio {
    flex-direction: column;
    gap: 0.75rem;
  }

  .article-hero-meta {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border-top: none;
    border-bottom: none;
  }

  .author-info {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
  }

  .hero-avatar {
    width: 48px;
    height: 48px;
    border-width: 2px;
  }

  .hero-author {
    font-size: 1rem;
  }

  .hero-date {
    font-size: 0.85rem;
  }

  .author-stats-hero {
    gap: 1.5rem;
  }
}

@media (max-width: 576px) {
  .article-hero-title {
    font-size: 2rem;
  }
  .author-bio-hero {
    font-size: 0.85rem;
  }
}

/* === 目录美化 V6: 返璞归真 · macOS 控制中心风格 Start === */
.article-toc-panel {
  /* 布局补偿 */
  margin-bottom: 1.5rem;

  /* 1. 纯粹的玻璃 (Purity) */
  background-color: rgba(242, 245, 248, 0.82); /* 带有极轻微蓝色调的半透明背景 */
  backdrop-filter: blur(20px) saturate(180%);

  /* 2. 微妙的光影 (Subtlety) */
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1), /* 主阴影 */
              inset 0 0 0 0.5px rgba(255, 255, 255, 0.5); /* 微光内边框 */

  padding: 0.75rem;
  transition: all 0.3s ease;
}

.article-toc-panel:hover {
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.12),
                inset 0 0 0 0.5px rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
}

/* 3. 精致化的标题栏 */
.article-toc-panel__header {
  display: flex;
  align-items: center;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  padding: 0.5rem 0.75rem 0.75rem 0.75rem;
  margin: 0;
}

.article-toc-panel__header h6 {
  color: rgba(0, 0, 0, 0.7) !important;
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  margin: 0 !important;
  line-height: 1 !important;
}

.article-toc-panel__header .fas {
  color: rgba(0, 0, 0, 0.4); /* 图标颜色更柔和 */
  font-size: 0.95rem;
  margin-right: 0.65rem;
}

/* 4. 优化的内部布局 */
.article-toc-panel__body {
  padding: 0.75rem 0 0.25rem 0;
}

.article-toc { width: 100%; }

.toc-list {
  position: relative;
  list-style: none;
  padding: 0 1.25rem;
  margin: 0;
}

/* 时间线轨迹 */
.toc-list::before {
  content: '';
  position: absolute;
  left: 1.25rem;
  top: 0.75rem;
  bottom: 0.75rem;
  width: 1.5px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 1px;
}

.toc-item {
  position: relative;
  padding-left: 0.75rem;
  margin: 0;
}

.toc-link {
  display: block;
  padding: 0.4rem 0;
  color: rgba(0, 0, 0, 0.65);
  text-decoration: none;
  transition: color 0.25s ease;
  font-size: 0.88rem;
  line-height: 1.45;
}

/* 时间线上的节点 */
.toc-link::before {
  content: '';
  position: absolute;
  left: -2.25px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  transition: all 0.25s ease;
  z-index: 1;
}

.toc-link:hover .toc-text {
  color: #000;
}

.toc-link:hover::before {
  transform: translateY(-50%) scale(1.2);
}

.toc-item.active .toc-link .toc-text {
  color: #000;
  font-weight: 600;
}

.toc-item.active .toc-link::before {
  background-color: #f6b93b; /* 激活时才显示品牌色 */
  transform: translateY(-50%) scale(1.5);
  box-shadow: 0 0 8px 0 rgba(246, 185, 59, 0.5);
}

/* 动态指示器 - 简化为激活节点的背景光晕，不再需要独立元素 */
.toc-indicator { display: none; } /* 彻底隐藏旧的指示器 */

/* 层级样式 */
.toc-level-1 { font-weight: 500; }
.toc-level-2 { margin-left: 0.85rem; }
.toc-level-2 .toc-link::before { width: 7px; height: 7px; left: -1.75px; }

.toc-level-3 { margin-left: 1.7rem; }
.toc-level-3 .toc-link { color: rgba(0, 0, 0, 0.5); font-size: 0.85rem; }
.toc-level-3 .toc-link::before { width: 6px; height: 6px; left: -1.25px; background-color: rgba(0, 0, 0, 0.15); }

.toc-level-4, .toc-level-5, .toc-level-6 { display: none; }

/* === 目录美化 V6: 返璞归真 · macOS 控制中心风格 End === */

/* === 底部文章操作按钮美化 Start (双子星动效按钮) === */
.article-actions {
  padding: 1.5rem 0;
  margin-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center; /* 居中显示按钮组 */
  align-items: center;
  gap: 1rem; /* 按钮组内部间距 */
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.share-buttons {
  margin-left: 2rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-radius: 14px; /* 柔和的圆角 */
  background-color: rgba(255, 255, 255, 0.6); /* 半透明的轻量背景 */
  border: 1px solid rgba(0, 0, 0, 0.08); /* 轻微的边框感 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 柔和阴影 */
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
  backdrop-filter: blur(8px);
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.8); /* 悬停时背景稍亮 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
  color: rgba(0, 0, 0, 0.85);
  border-color: rgba(0, 0, 0, 0.1);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  background-color: rgba(255, 255, 255, 0.4);
}

.action-btn i {
  margin-right: 0.6rem;
  font-size: 1.1rem;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
}

.action-btn .btn-text {
  line-height: 1;
}

.action-btn .btn-count {
  margin-left: 0.4rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
}

/* 点赞按钮 */
.action-btn-like i {
  color: #e53e3e; /* 默认红色 */
}

.action-btn-like.active {
  background-color: rgba(246, 185, 59, 0.15); /* 激活时带品牌色背景 */
  border-color: rgba(246, 185, 59, 0.3);
  color: #c59306;
  box-shadow: 0 4px 15px rgba(246, 185, 59, 0.2);
}

.action-btn-like.active i {
  color: #f6b93b; /* 激活时金色 */
}

.action-btn-like.active .btn-count {
  color: #c59306;
}

/* 收藏按钮 */
.action-btn-favorite i {
  color: #f6b93b; /* 默认金色 */
}

.action-btn-favorite.active {
  background-color: rgba(246, 185, 59, 0.15);
  border-color: rgba(246, 185, 59, 0.3);
  color: #c59306;
  box-shadow: 0 4px 15px rgba(246, 185, 59, 0.2);
}

.action-btn-favorite.active i {
  color: #f6b93b; /* 激活时金色 */
}

/* 分享按钮 */
.action-btn-share i {
  color: #4a5568;
}

/* --- 动画 --- */
/* 点赞心跳动画 */
@keyframes heart-pulse {
  0% { transform: scale(1); opacity: 1; }
  25% { transform: scale(1.2); opacity: 0.8; }
  50% { transform: scale(0.9); opacity: 1; }
  75% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* 收藏填充动画 (用于图标) */
@keyframes bookmark-fill {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}

.heart-pulse-anim i { animation: heart-pulse 0.6s ease-out; }
.bookmark-fill-anim i { animation: bookmark-fill 0.6s ease-out; }
.btn-count-pulse-anim { animation: heart-pulse 0.6s ease-out; }

/* === 底部文章操作按钮美化 End === */

/* === 左侧快捷操作按钮美化 Start (macOS 胶囊导航) === */
.article-quick-actions-panel {
  position: fixed;
  left: calc(50% - 700px - 3rem - 27px); /* 50% - (max-width/2) - desired_gap - (panel_width/2) */
  top: 45%;
  transform: translateY(-50%); /* Vertical centering only */
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 按钮间距 */
  z-index: 100;

  /* macOS 胶囊面板质感 */
  background-color: rgba(242, 245, 248, 0.82); /* 带有极轻微蓝色调的半透明背景 */
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px; /* 胶囊形状 */
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1), /* 主阴影 */
              inset 0 0 0 0.5px rgba(255, 255, 255, 0.5); /* 微光内边框 */
  padding: 0.75rem 0.6rem; /* 垂直内边距，左右为图标宽度 */

  /* 展开动画 */
  width: 54px; /* 默认宽度 (图标 + 左右padding) */
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.4, 1),
              background-color 0.3s ease,
              box-shadow 0.3s ease,
              transform 0.3s ease;
}

.article-quick-actions-panel:hover {
  width: 140px; /* 悬停展开宽度 */
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.12),
              inset 0 0 0 0.5px rgba(255, 255, 255, 0.6);
  transform: translateY(-50%) scale(1.01); /* Only vertical transform and scale */
}

.quick-action-item {
  display: flex;
  align-items: center;
  justify-content: center; /* Default: center the icon */
  width: 100%;
  height: 40px; /* 统一高度 */
  border-radius: 20px; /* 圆角 */
  padding: 0 0.6rem; /* 左右内边距 */
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
  position: relative;
}

.article-quick-actions-panel:hover .quick-action-item {
  justify-content: flex-start; /* On hover: align to start for text */
}

.quick-action-item i {
  font-size: 1.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px; /* Fixed width for the icon area */
  height: 40px;
  flex-shrink: 0;
  margin-right: 0; /* No margin in default state */
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.4, 1);
}

.article-quick-actions-panel:hover .quick-action-item i {
  margin-right: 0.2rem; /* Add margin on hover */
}

.quick-action-item .item-label {
  opacity: 0;
  white-space: nowrap;
  flex-grow: 0; /* Don't grow in default state */
  width: 0; /* Collapse width in default state */
  overflow: hidden; /* Hide overflow when width is 0 */
  padding-left: 0;
  transition: opacity 0.15s ease-in-out 0.1s, width 0.3s ease, flex-grow 0.3s ease; /* Add width and flex-grow to transition */
}

.article-quick-actions-panel:hover .quick-action-item .item-label {
  opacity: 1;
  width: auto; /* Expand width on hover */
  flex-grow: 1; /* Allow to grow on hover */
}

.quick-action-item .item-count {
  margin-left: 0; /* Remove default margin */
  opacity: 0;
  white-space: nowrap;
  width: 0; /* Collapse width in default state */
  overflow: hidden; /* Hide overflow when width is 0 */
  font-size: 0.75rem;
  font-weight: 600;
  transition: opacity 0.15s ease-in-out 0.1s, width 0.3s ease, margin-left 0.3s ease; /* Add width and margin-left to transition */
}

.article-quick-actions-panel:hover .quick-action-item .item-count {
  opacity: 1;
  width: auto; /* Expand width on hover */
  margin-left: auto; /* Push to right on hover */
}

/* 点赞按钮 */
.quick-action-item:nth-child(1) i { color: rgba(0, 0, 0, 0.4); } /* 默认图标颜色 */
.quick-action-item:nth-child(1).active i { color: #f6b93b; } /* 激活时金色 */

/* 收藏按钮 */
.quick-action-item:nth-child(2) i { color: rgba(0, 0, 0, 0.4); } /* 默认图标颜色 */
.quick-action-item:nth-child(2).active i { color: #f6b93b; } /* 激活时金色 */

/* 分享按钮 */
.quick-action-item:nth-child(3) i { color: rgba(0, 0, 0, 0.4); }

/* 评论按钮 */
.quick-action-item:nth-child(4) i { color: rgba(0, 0, 0, 0.4); }
/* === 左侧快捷操作按钮美化 End === */

/* Media Queries */

@media (max-width: 1490px) {
  .article-quick-actions-panel {
    left: 3rem; /* Fixed margin from left viewport edge */
    transform: translateY(-50%); /* Only vertical centering */
  }
}

@media (max-width: 768px) {
  .article-hero {
    padding: 2rem 0 1.5rem;
  }
  
  .article-hero-title {
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }
  
  .hero-tags-portfolio {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .article-hero-meta {
    flex-direction: row;
    gap: 1rem;
    padding: 1rem;
    align-items: center;
  }
  
  .meta-left {
    flex: 1;
  }
  
  .meta-right {
    flex-shrink: 0;
  }
  
  .author-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .article-stats {
    justify-content: flex-start;
    gap: 1rem;
  }
  
  .hero-author-details {
    padding: 1.5rem;
  }
  
  .author-stats-hero {
    gap: 1rem;
  }
  
  .stat-item-hero {
    padding: 0.5rem 0.75rem;
  }
  
  .article-title {
    font-size: 2rem;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }
  
  .sidebar-sticky {
    position: static;
    margin-top: 2rem;
  }
  
  /* 移动端目录卡片顶部间距 */
  .article-toc-panel {
    margin-top: 1rem;
  }
  
  .hero-avatar {
    width: 40px;
    height: 40px;
  }
  
  .hero-author {
    font-size: 1rem;
  }
  
  .hero-date {
    font-size: 0.8rem;
  }
  
  .follow-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .back-to-top {
    bottom: 5rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
  .article-quick-actions-panel {
    left: 1rem; /* Even smaller margin on very small screens */
    transform: translateY(-50%); /* Only vertical centering */
  }
}

@media (max-width: 576px) {
  .article-hero-meta {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .author-info {
    gap: 0.5rem;
  }
  
  .hero-avatar {
    width: 36px;
    height: 36px;
  }
  
  .hero-author {
    font-size: 0.9rem;
  }
  
  .hero-date {
    font-size: 0.75rem;
  }
  
  .follow-btn {
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
  }
  
  .follow-btn i {
    font-size: 0.7rem;
  }
}
</style>