<template>
  <div class="home-page">
    <!-- Cinematic Hero Section -->
    <section class="hero-section">
      <div class="cinematic-carousel-container">
        <div
          id="modernCarousel"
          class="modern-carousel"
          data-bs-ride="carousel"
        >
          <div class="modern-carousel-inner">
            <!-- Featured Articles -->
            <div 
              v-for="(article, index) in featuredArticles" 
              :key="article.articleId"
              :class="['modern-carousel-item', { active: index === 0 }]"
              @click="$router.push(`/article/${article.slug}`)"
            >
              <div class="carousel-image-wrapper">
                <LazyImage 
                  :src="getProcessedImageUrl(article.backgroundUrl) || '/img/optimized/demo/1.webp'" 
                  :alt="article.title"
                  class="carousel-image"
                  :no-lazy="index === 0"
                />
                <div class="carousel-overlay cinematic-overlay"></div>
              </div>
              
              <div class="carousel-content-wrapper">
                <div class="carousel-content">
                  <div class="carousel-meta">
                    <div class="carousel-author">
                      <div class="author-avatar-wrapper">
                          <LazyImage 
                            :src="getAuthorAvatarUrl(article.avatarUrl)" 
                            :alt="article.userName || '匿名'"
                            class="author-avatar-img"
                            shape="hexagon"
                          />
                      </div>
                      <span class="author-name">{{ article.userName || '匿名' }}</span>
                    </div>
                    <span class="meta-dot">·</span>
                    <span class="publish-date">{{ formatTime(article.gmtModified) }}</span>
                  </div>
                  
                  <h2 class="carousel-title">{{ article.title }}</h2>
                  <p class="carousel-excerpt">{{ getExcerpt(article) }}</p>
                  
                  <div class="carousel-actions">
                    <button class="apple-glass-btn">
                      <span class="btn-text">阅读文章</span>
                      <i class="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Default Slides (if no featured articles) -->
            <div v-if="!featuredArticles.length" class="modern-carousel-item active">
              <div class="carousel-image-wrapper">
                <LazyImage src="/img/optimized/demo/1.webp" alt="欢迎来到Lumi Hive" class="carousel-image" :no-lazy="true" />
                <div class="carousel-overlay"></div>
              </div>
              <div class="carousel-content-wrapper">
                <div class="carousel-content">
                  <h1 class="carousel-title">欢迎来到 Lumi Hive</h1>
                  <p class="carousel-excerpt">探索、分享、连接 —— 您的优质知识社区</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Indicators -->
          <div class="carousel-indicators-wrapper">
            <div class="modern-carousel-indicators">
              <button 
                v-for="(article, index) in featuredArticles.length ? featuredArticles : [1]" 
                :key="index"
                type="button" 
                :class="{ active: index === 0 }"
                @click="changeSlide(index)"
                :aria-label="`Go to slide ${index + 1}`"
              ></button>
            </div>
          </div>
          
          <!-- Controls -->
          <button class="carousel-control prev" @click="prevSlide" aria-label="Previous slide">
            <div class="control-icon-wrapper glass-panel">
              <i class="fas fa-chevron-left"></i>
            </div>
          </button>
          <button class="carousel-control next" @click="nextSlide" aria-label="Next slide">
            <div class="control-icon-wrapper glass-panel">
              <i class="fas fa-chevron-right"></i>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Main Content Section -->
    <section class="content-section" style="padding: 80px 0;">
      <div class="apple-container">
        <div class="row">
          <!-- Main Column: Article List -->
          <div class="col-lg-8">
            <div class="section-header">
              <h2 class="section-title">最新文章</h2>
              <div class="section-line"></div>
            </div>
            
            <!-- Article List -->
            <div class="article-list" v-if="articles.length > 0">
              <div
                v-for="(article, index) in articles"
                :key="article.articleId"
                class="article-card-wrapper"
                data-aos="fade-up"
                :data-aos-delay="index * 50"
                @click="$router.push(`/article/${article.slug}`)"
              >
                <div class="article-card glass-panel hover-magnetic">
                  <div class="card-body">
                    <div class="article-main">
                      <h3 class="article-title">{{ article.title }}</h3>
                      <p class="article-excerpt">{{ getExcerpt(article) }}</p>
                      
                      <div class="article-meta">
                        <div class="author-info">
                          <div class="author-avatar-sm">
                            <LazyImage 
                              :src="getAuthorAvatarUrl(article.avatarUrl)" 
                              :alt="article.userName"
                              class="avatar-img"
                              shape="hexagon"
                            />
                          </div>
                          <span class="author-name">{{ article.userName || '佚名' }}</span>
                        </div>
                        <span class="meta-separator">·</span>
                        <span class="publish-time">{{ formatTime(article.gmtModified) }}</span>
                        
                        <div class="article-stats">
                          <span class="stat-item">
                            <i class="far fa-eye"></i> {{ article.viewCount || 0 }}
                          </span>
                          <span class="stat-item">
                            <i class="far fa-heart"></i> {{ article.likes || 0 }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Optional Thumbnail -->
                    <div class="article-thumbnail" v-if="article.thumbnailUrl || article.backgroundUrl">
                       <LazyImage 
                        :src="getProcessedImageUrl(article.thumbnailUrl || article.backgroundUrl)" 
                        :alt="article.title"
                        class="thumbnail-img"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Empty State -->
            <div v-else-if="!loading" class="empty-state glass-panel">
              <div class="empty-icon">📝</div>
              <h3>暂无文章</h3>
              <p>敬请期待精彩内容的到来</p>
            </div>
            
            <!-- Pagination -->
            <nav v-if="pagination.totalPages > 1" class="pagination-wrapper">
              <ul class="apple-pagination">
                <li :class="{ disabled: pagination.current === 1 }">
                  <button @click.prevent="changePage(pagination.current - 1)" class="page-btn prev">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                </li>
                
                <li v-for="i in pageRange" :key="i" :class="{ active: i === pagination.current }">
                  <button @click.prevent="changePage(i)" class="page-btn number">{{ i }}</button>
                </li>
                
                <li :class="{ disabled: pagination.current === pagination.totalPages }">
                  <button @click.prevent="changePage(pagination.current + 1)" class="page-btn next">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <!-- Sidebar -->
          <div class="col-lg-4 ps-lg-5">
            <div class="sidebar-sticky">
              <!-- Popular Articles -->
              <div class="sidebar-widget glass-panel mb-4">
                <h3 class="widget-title">热门阅读</h3>
                <div class="popular-list">
                  <div
                    v-for="(article, index) in popularArticles"
                    :key="article.articleId"
                    class="popular-item"
                    @click="$router.push(`/article/${article.slug}`)"
                  >
                    <div class="popular-index" :class="{'top-3': index < 3}">{{ index + 1 }}</div>
                    <div class="popular-content">
                      <h4 class="popular-title" style="font-size: 1.2rem;">{{ article.title }}</h4>
                      <div class="popular-meta">
                        <span>{{ article.userName || '佚名' }}</span>
                        <span>·</span>
                        <span>{{ article.viewCount || 0 }} 阅读</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tags Cloud -->
              <div class="sidebar-widget glass-panel">
                <h3 class="widget-title">热门标签</h3>
                <div
                  v-if="tags.length > 0"
                  id="tagBubbleContainer"
                  class="tag-cloud-container"
                >
                  <router-link
                    v-for="tag in (isTagCloudExpanded ? tags : tags.slice(0, 19))"
                    :key="tag.id"
                    :to="`/tags#${tag.name}`"
                    class="tag-bubble"
                    :data-count="tag.articleCount || 0"
                  >
                    <span class="tag-text">{{ tag.name }}</span>
                  </router-link>
                </div>
                <div v-else class="text-center py-3 text-muted">暂无标签</div>
                
                <!-- Expand Button -->
                <div v-if="tags.length > 19" class="text-center mt-3">
                  <button 
                    @click="toggleTagCloud" 
                    class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                    style="backdrop-filter: blur(10px); background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.6);"
                  >
                    {{ isTagCloudExpanded ? '收起' : '展开更多' }} 
                    <i :class="['fas', isTagCloudExpanded ? 'fa-chevron-up' : 'fa-chevron-down', 'ms-1']"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { articleAPI, tagAPI } from '@/api'
import { getAuthorAvatarUrl } from '@/utils/avatar-helper'
import LazyImage from '@/components/LazyImage.vue'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore();

// 响应式数据
const loading = ref(true)
const articles = ref([])
const featuredArticles = ref([])
const popularArticles = ref([])
const tags = ref([])
const pagination = ref({
  current: 1,
  size: 8,
  totalPages: 1,
  total: 0
})
const isTagCloudExpanded = ref(false)

// 计算属性
const pageRange = computed(() => {
  const current = pagination.value.current
  const total = pagination.value.totalPages
  const range = []
  
  // 显示最多7个页码
  const maxPages = 7
  let start = Math.max(1, current - Math.floor(maxPages / 2))
  let end = Math.min(total, start + maxPages - 1)
  
  // 调整start以确保显示maxPages个页码（如果可能）
  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  
  return range
})

// 方法
const loadHomeData = async (page = 1) => {
  try {
    loading.value = true
    
    // 使用统一的首页API获取数据
    const homeRes = await articleAPI.getHomeArticles(page, pagination.value.size)
    
    
    if (homeRes.articles && homeRes.articles.records) {
      articles.value = homeRes.articles.records
      pagination.value = {
        current: parseInt(homeRes.articles.current),
        size: parseInt(homeRes.articles.size),
        totalPages: parseInt(homeRes.articles.pages),
        total: parseInt(homeRes.articles.total)
      }
    } else {
      articles.value = []
    }
    
    // 处理其他数据
    popularArticles.value = homeRes.popularArticles || []
    featuredArticles.value = homeRes.featuredArticles || []
    tags.value = homeRes.tags || []
    
    // 调试信息
    console.log('首页数据加载完成:', {
      articles: articles.value.length,
      featuredArticles: featuredArticles.value.length,
      popularArticles: popularArticles.value.length,
      tags: tags.value.length
    })
    
    if (featuredArticles.value.length > 0) {
      console.log('特色文章数据:', featuredArticles.value[0])
    }
    
    // 初始化智能标签云
    initSmartTagCloud()
    
  } catch (error) {
    console.error('加载首页数据失败:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    loadHomeData(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const formatTime = (dateString) => {
  if (!dateString) return '日期未知'
  
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

const navigateToTag = (tagName) => {
  router.push({ name: 'Tags', hash: `#${encodeURIComponent(tagName)}` })
}

// 处理图片URL的函数
const getProcessedImageUrl = (url) => {
  if (!url) return '/img/demo/1.jpg'
  
  // 如果是完整的后端URL，转换为相对路径以使用Vite代理
  if (url.startsWith('http://localhost:8090/')) {
    url = url.replace('http://localhost:8090', '')
  }
  
  // 如果是相对路径的uploads，需要添加/api前缀（因为后端设置了全局API前缀）
  if (url.startsWith('/uploads/')) {
    url = '/api' + url
  }
  
  // 如果是OSS域名，直接使用，不需要添加/api前缀
  if (url.startsWith('https://files.hivelumi.com/')) {
    // OSS文件直接使用，不需要修改
  }
  
  return url
}

// 获取文章摘要，如果为空则从内容生成
const getExcerpt = (article) => {
  if (article.excerpt && article.excerpt.trim()) {
    return article.excerpt
  }
  
  // 如果没有摘要，尝试从内容生成
  if (article.content) {
    // 移除HTML标签
    const textContent = article.content.replace(/<[^>]+>/g, '')
    // 截取前100个字符
    return textContent.slice(0, 100) + (textContent.length > 100 ? '...' : '')
  }
  
  return '暂无摘要'
}

// 蜂巢拼图标签云实现
// 蜂巢拼图标签云实现
const initSmartTagCloud = () => {
  nextTick(() => {
    const container = document.getElementById('tagBubbleContainer');
    if (!container) return;

    const bubbles = Array.from(container.getElementsByClassName('tag-bubble'));
    if (bubbles.length === 0) return;

    const containerWidth = container.offsetWidth;
    
    // 蜂巢配置 - 缩小尺寸以适应侧边栏
    const hexSize = 70; // 缩小到 70px
    const hexHeight = hexSize; 
    const hexWidth = hexSize * 0.866; // sqrt(3)/2 * size
    const margin = 4; // 间隙
    
    // 计算每行能放多少个
    // 考虑错位：奇数行 offset = hexWidth / 2
    // 有效宽度 = cols * (hexWidth + margin) + (hexWidth / 2)
    const effectiveHexWidth = hexWidth + margin;
    const cols = Math.floor((containerWidth - (hexWidth / 2)) / effectiveHexWidth);
    
    // 如果展开，高度自动适应；否则固定高度
    if (isTagCloudExpanded.value) {
      const rows = Math.ceil(bubbles.length / cols) + 1;
      const estimatedHeight = rows * (hexHeight * 0.75 + margin) + 50;
      container.style.height = `${estimatedHeight}px`;
    } else {
      container.style.height = '400px';
    }
    
    const containerHeight = container.offsetHeight;
    
    // 计算中心点 (用于未展开时的居中)
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    // 颜色板
    const colorPalette = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA',
      '#F0B67F', '#FE4A49', '#547980', '#8A9B0F', '#C3D89F',
      '#FF9E9D', '#3D405B', '#81B29A', '#F2CC8F', '#E07A5F',
      '#D81E5B', '#F4A261', '#2A9D8F', '#E9C46A', '#264653',
      '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#E84393'
    ];

    // 响应式行布局算法
    bubbles.forEach((bubble, index) => {
      // 计算网格坐标 (row, col)
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // 计算像素坐标
      // 偶数行: x = col * effectiveHexWidth
      // 奇数行: x = col * effectiveHexWidth + (hexWidth / 2)
      // y = row * (hexHeight * 0.75 + margin)
      
      const xOffset = (row % 2 === 1) ? (hexWidth / 2) : 0;
      const x = col * effectiveHexWidth + xOffset + (effectiveHexWidth / 2); // + half width to center
      const y = row * (hexHeight * 0.75 + margin) + (hexHeight / 2);
      
      // 计算整体偏移以居中
      // 总宽度 = cols * effectiveHexWidth + (hexWidth / 2)
      const totalGridWidth = cols * effectiveHexWidth + (hexWidth / 2);
      const startX = (containerWidth - totalGridWidth) / 2;
      
      // 如果未展开，尝试垂直居中显示前19个
      let finalX = startX + x - (hexSize / 2); // left position
      let finalY = y - (hexSize / 2); // top position
      
      if (!isTagCloudExpanded.value) {
         // 简单的居中偏移，假设前19个大概占4-5行
         finalY += 40; 
      }

      const count = parseInt(bubble.getAttribute('data-count') || '0');
      const fontSize = Math.max(11, Math.min(14, 11 + count * 0.4)); // 稍微调小字体
      
      Object.assign(bubble.style, {
        position: 'absolute',
        left: `${finalX}px`,
        top: `${finalY}px`,
        width: `${hexSize}px`,
        height: `${hexSize}px`,
        background: colorPalette[index % colorPalette.length],
        fontSize: `${fontSize}px`,
        clipPath: 'var(--shape-hexagon)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        textAlign: 'center',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: '0',
        transform: 'scale(0.5)'
      });
      
      // 入场动画
      setTimeout(() => {
        bubble.style.opacity = '1';
        bubble.style.transform = 'scale(1)';
      }, index * 30);
    });
  });
};

const toggleTagCloud = () => {
  isTagCloudExpanded.value = !isTagCloudExpanded.value;
  // 等待DOM更新后重新计算布局
  nextTick(() => {
    initSmartTagCloud();
  });
};

// 获取六边形螺旋坐标 (q, r)
const getHexSpiralCoords = (n) => {
  if (n === 0) return { q: 0, r: 0 };
  
  // 简单的螺旋生成是不够的，我们需要一个确定的序列
  // 这里硬编码前20个坐标，或者使用算法
  // 算法：层层向外
  
  let q = 0, r = 0;
  // 这是一个简化的查找，对于少量标签足够了
  // 更好的方式是使用 axial coordinates 遍历
  
  // 预计算的螺旋路径 (q, r)
  const path = [
    {q:0, r:0}, 
    {q:0, r:-1}, {q:1, r:-1}, {q:1, r:0}, {q:0, r:1}, {q:-1, r:1}, {q:-1, r:0}, // Ring 1
    {q:0, r:-2}, {q:1, r:-2}, {q:2, r:-2}, {q:2, r:-1}, {q:2, r:0}, {q:1, r:1}, {q:0, r:2}, {q:-1, r:2}, {q:-2, r:2}, {q:-2, r:1}, {q:-2, r:0}, {q:-1, r:-1} // Ring 2
  ];
  
  if (n < path.length) return path[n];
  
  // Fallback for > 19 tags: just stack them somewhere or repeat
  return { q: (n % 5) - 2, r: Math.floor(n / 5) + 2 };
}

// 轮播图相关方法
const currentSlide = ref(0);
const totalSlides = computed(() => featuredArticles.value.length || 3);

// 切换到指定幻灯片
const changeSlide = (index) => {
  // 移除所有幻灯片的激活状态
  const carouselItems = document.querySelectorAll('.modern-carousel-item');
  carouselItems.forEach(item => item.classList.remove('active'));
  
  // 移除所有指示器的激活状态
  const indicators = document.querySelectorAll('.modern-carousel-indicators button');
  indicators.forEach(indicator => indicator.classList.remove('active'));
  
  // 激活当前幻灯片和指示器
  // 添加安全检查，确保元素存在
  if (index < carouselItems.length && carouselItems[index]) {
    carouselItems[index].classList.add('active');
  }
  
  if (index < indicators.length && indicators[index]) {
    indicators[index].classList.add('active');
  }
  
  // 更新当前幻灯片索引
  currentSlide.value = index;
};

// 下一张幻灯片
const nextSlide = () => {
  const next = (currentSlide.value + 1) % totalSlides.value;
  changeSlide(next);
};

// 上一张幻灯片
const prevSlide = () => {
  const prev = (currentSlide.value - 1 + totalSlides.value) % totalSlides.value;
  changeSlide(prev);
};

// 自动轮播
let autoplayInterval = null;
const startAutoplay = () => {
  autoplayInterval = setInterval(() => {
    nextSlide();
  }, 8000); // 8秒切换一次
};

const stopAutoplay = () => {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
  }
};

// 生命周期
onMounted(async() => {
  loadHomeData();

  // On-demand import and initialize Bootstrap Carousel
  const bootstrap = await import('bootstrap/js/dist/carousel');
  const carouselElement = document.getElementById('modernCarousel');
  if (carouselElement) {
    new bootstrap.default(carouselElement);
  }

  // 初始化轮播图
  nextTick(() => {
    // 等待DOM渲染完成后初始化轮播图
    setTimeout(() => {
      const firstSlide = document.querySelector('.modern-carousel-item');
      const firstIndicator = document.querySelector('.modern-carousel-indicators button');
      
      if (firstSlide) firstSlide.classList.add('active');
      if (firstIndicator) firstIndicator.classList.add('active');
      
      // 启动自动轮播
      startAutoplay();
      
      // 鼠标悬停时暂停自动轮播
      const carousel = document.querySelector('.modern-carousel');
      if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
      }
    }, 500);
  });
});

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  stopAutoplay();
  
  // 移除事件监听器
  const carousel = document.querySelector('.modern-carousel');
  if (carousel) {
    carousel.removeEventListener('mouseenter', stopAutoplay);
    carousel.removeEventListener('mouseleave', startAutoplay);
  }
})
</script>

<style scoped>
/* ===== Global Variables & Reset ===== */
:root {
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --glass-dark-bg: rgba(0, 0, 0, 0.6);
  --hive-gold: #F6B93B;
  --hive-gold-glow: rgba(246, 185, 59, 0.4);
  --apple-gray: #86868b;
  --apple-text: #1d1d1f;
  --noise-pattern: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
}

.home-page {
  background-color: #fbfbfd;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(246, 185, 59, 0.05) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(66, 153, 225, 0.05) 0%, transparent 40%);
  min-height: 100vh;
  padding-top: 60px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  color: var(--apple-text);
}

/* ===== Glass Panel Utility ===== */
.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px -1px rgba(0, 0, 0, 0.02),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  position: relative;
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

.glass-panel-dark {
  background: rgba(28, 28, 30, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  border-radius: 24px;
  color: white;
}

/* ===== Cinematic Hero Section ===== */
.hero-section {
  padding: 20px 0 40px;
  position: relative;
}

.cinematic-carousel-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 500px;
  position: relative;
}

.modern-carousel {
  height: 100%;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
  position: relative;
}

.modern-carousel-inner, .modern-carousel-item {
  height: 100%;
}

.modern-carousel-item {
  position: relative;
  cursor: pointer;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

.carousel-image-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 8s ease;
}

.modern-carousel-item:hover .carousel-image {
  transform: scale(1.05);
}

.carousel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);
}

.cinematic-overlay {
  background: linear-gradient(to top, 
    rgba(0,0,0,0.9) 0%, 
    rgba(0,0,0,0.5) 40%, 
    rgba(0,0,0,0.1) 70%, 
    transparent 100%
  );
}

.carousel-content-wrapper {
  position: absolute;
  bottom: 60px;
  left: 60px;
  max-width: 600px;
  z-index: 2;
}

.carousel-content {
  padding: 40px;
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  transition-delay: 0.1s;
}

.modern-carousel-item.active .carousel-content {
  transform: translateY(0);
  opacity: 1;
}

.carousel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.author-avatar-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.8);
}

.author-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.carousel-excerpt {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.apple-glass-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 12px 24px;
  border-radius: 100px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.apple-glass-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.02);
}

/* Indicators & Controls */
.carousel-indicators-wrapper {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.modern-carousel-indicators {
  display: flex;
  gap: 8px;
  background: rgba(0,0,0,0.3);
  padding: 8px 12px;
  border-radius: 100px;
  backdrop-filter: blur(10px);
}

.modern-carousel-indicators button {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.4);
  padding: 0;
  transition: all 0.3s ease;
}

.modern-carousel-indicators button.active {
  background: white;
  transform: scale(1.2);
}

.carousel-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: none;
  border: none;
  padding: 20px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modern-carousel:hover .carousel-control {
  opacity: 1;
}

.carousel-control.prev { left: 20px; }
.carousel-control.next { right: 20px; }

.control-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--apple-text);
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.control-icon-wrapper:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.8);
}

/* ===== Main Content ===== */
.apple-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--apple-text);
  letter-spacing: -0.02em;
  margin: 0;
}

.section-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, rgba(0,0,0,0.05), transparent);
  border-radius: 2px;
}

/* Article List */
.article-card-wrapper {
  margin-bottom: 24px;
  cursor: pointer;
}

.article-card {
  padding: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.article-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.card-body {
  padding: 32px;
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.article-main {
  flex: 1;
}

.article-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
  color: var(--apple-text);
  transition: color 0.2s ease;
}

.article-card:hover .article-title {
  color: var(--hive-gold);
}

.article-excerpt {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--apple-gray);
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--apple-gray);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-name {
  font-weight: 500;
  color: var(--apple-text);
}

.article-stats {
  margin-left: auto;
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-thumbnail {
  width: 160px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.article-card:hover .thumbnail-img {
  transform: scale(1.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--apple-gray);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

/* Pagination */
.pagination-wrapper {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.apple-pagination {
  display: flex;
  list-style: none;
  padding: 0;
  gap: 12px;
  background: rgba(255, 255, 255, 0.65);
  padding: 12px 24px;
  border-radius: 24px;
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 10px 40px -10px rgba(0,0,0,0.15),
    inset 0 0 0 1px rgba(255,255,255,0.5);
  transition: all 0.3s ease;
  align-items: flex-end; /* Align items to bottom for wave effect */
}

.page-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px; /* Rounded square like app icons */
  border: none;
  background: transparent;
  color: var(--apple-text);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  font-size: 1.1rem;
}

.page-btn:active {
  transform: scale(0.9); /* Spring click effect */
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-8px) scale(1.2); /* Wave magnification */
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  z-index: 10;
}

.active .page-btn {
  background: var(--hive-gold);
  color: white;
  box-shadow: 0 8px 20px var(--hive-gold-glow);
  font-weight: 700;
  transform: translateY(-8px) scale(1.2);
}

.disabled .page-btn {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ===== Sidebar ===== */
.sidebar-sticky {
  position: sticky;
  top: 90px;
}

.widget-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: var(--apple-text);
}

.sidebar-widget {
  padding: 24px;
  margin-bottom: 24px;
}

/* Popular List */
.popular-item {

  display: flex;
  gap: 16px;
  padding: 12px 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.popular-item:hover {
  transform: translateX(4px);
}

.popular-index {
  font-size: 1.5rem;
  font-weight: 800;
  color: #e5e5e5;
  line-height: 1;
  min-width: 24px;
}

.popular-index.top-3 {
  color: var(--hive-gold);
  opacity: 0.8;
}

.popular-content {
  flex: 1;
}

.carousel-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  text-shadow: 0 4px 12px rgba(0,0,0,0.5);
  font-family: "SF Pro Display", var(--font-family-base);
}

.carousel-excerpt {
  font-size: 1.25rem;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 32px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  max-width: 80%;
}

.popular-meta {
  font-size: 0.8rem;
  color: var(--apple-gray);
  display: flex;
  gap: 6px;
}

/* Tag Cloud */
.tag-cloud-container {
  position: relative;
  height: 400px; /* Reduced height for better fit */
  overflow: hidden;
}

.tag-bubble {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-decoration: none;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  will-change: transform;
}

.tag-bubble:hover {
  transform: scale(1.1) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.tag-text {
  text-align: center;
  line-height: 1.2;
  pointer-events: none;
}

/* Responsive */
@media (max-width: 992px) {
  .cinematic-carousel-container {
    height: 500px;
    padding: 0 16px;
  }
  
  .carousel-content-wrapper {
    left: 30px;
    bottom: 30px;
    right: 30px;
  }
  
  .carousel-title {
    font-size: 1.8rem;
  }
  
  .card-body {
    flex-direction: column;
  }
  
  .article-thumbnail {
    width: 100%;
    height: 200px;
    order: -1;
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding-top: 0;
  }
  
  .cinematic-carousel-container {
    height: 400px;
    padding: 0;
  }
  
  .modern-carousel {
    border-radius: 0;
  }
  
  .carousel-content {
    padding: 24px;
    background: rgba(0, 0, 0, 0.7); /* Darker for better readability on mobile */
  }
  
  .carousel-title {
    font-size: 1.5rem;
  }
  
  .carousel-excerpt {
    display: none; /* Hide excerpt on mobile */
  }
  
  .apple-container {
    padding: 0 16px;
  }
}
</style>
