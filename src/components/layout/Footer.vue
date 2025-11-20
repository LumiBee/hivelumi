<template>
  <footer id="energy-footer" class="energy-bar" ref="footerRef">
    
    <div class="hex-grid-layer"></div>
    
    <div class="hover-light" :style="glowStyle"></div>

    <div class="top-ruler"></div>

    <div class="container-fluid">
      <div class="bar-layout">
        
        <div class="section left">
          <div class="brand-cluster">
            <div class="hex-triad">
              <span></span><span></span><span></span>
            </div>
            <span class="brand-text">LUMI<span class="highlight">HIVE</span></span>
          </div>
          <div class="status-chip">
            <span class="status-led"></span>
            <span class="status-text">HIVE.NET ONLINE</span>
          </div>
        </div>

        <nav class="section center">
          <router-link to="/" class="hex-btn" active-class="active">
            <span class="btn-content">首页</span>
            <div class="btn-bg"></div>
          </router-link>
          <router-link to="/tags" class="hex-btn" active-class="active">
            <span class="btn-content">标签</span>
            <div class="btn-bg"></div>
          </router-link>
          <router-link to="/portfolio" class="hex-btn" active-class="active">
            <span class="btn-content">作品集</span>
            <div class="btn-bg"></div>
          </router-link>
          <router-link to="/about" class="hex-btn" active-class="active">
            <span class="btn-content">关于</span>
            <div class="btn-bg"></div>
          </router-link>
        </nav>

        <div class="section right">
          <a href="https://beian.miit.gov.cn/" target="_blank" class="icp-code">苏ICP备2025185969号</a>
          
          <div class="tool-cluster">
            <a href="https://github.com" target="_blank" class="hex-icon-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <button class="hex-icon-btn top" @click="scrollToTop">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

const footerRef = ref(null);
const mouseX = ref(-200);
const mouseY = ref(-200);

const glowStyle = computed(() => ({
  // 使用 translate3d 开启 GPU 加速
  transform: `translate3d(${mouseX.value}px, ${mouseY.value}px, 0)`
}));

const handleMouseMove = (e) => {
  const footer = footerRef.value;
  if (!footer) return;
  const rect = footer.getBoundingClientRect();
  mouseX.value = e.clientX - rect.left;
  mouseY.value = e.clientY - rect.top;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

onMounted(() => {
  const footer = footerRef.value;
  if (footer) {
    footer.addEventListener('mousemove', handleMouseMove);
    footer.addEventListener('mouseleave', () => {
      // 移出时把光斑藏到看不见的地方
      mouseX.value = -500;
      mouseY.value = -500;
    });
  }
});

onUnmounted(() => {
  const footer = footerRef.value;
  if (footer) {
    footer.removeEventListener('mousemove', handleMouseMove);
  }
});
</script>

<style scoped>
#energy-footer.energy-bar {
  min-height: unset ;
  height: 78px;
  padding: 0 ;
  margin-top: auto ;
  background-color: #050505;
  border-top: none;
  
  /* === 蜂巢主题色 === */
  --hive-amber: #fbbf24; /* 更亮的蜜黄色 */
  --hive-dark: #09090b;
  --hive-dim: rgba(251, 191, 36, 0.1);
  --hive-border: rgba(251, 191, 36, 0.3);
  --text-main: #e4e4e7;
  --text-muted: #525252;
  
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  user-select: none;
  font-family: 'JetBrains Mono', monospace;
  box-sizing: border-box;
}

/* === 1. 显著的蜂巢背景 (High Visibility) === */
.hex-grid-layer {
  position: absolute;
  inset: 0;
  /* 使用更清晰的六边形 SVG */
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='42' viewBox='0 0 24 42' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 11l12-7 12 7v14l-12 7-12-7z' fill='none' stroke='rgba(251, 191, 36, 0.06)' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 24px 42px;
  pointer-events: none;
  z-index: 0;
}

/* 鼠标光斑 - 混合模式产生“点亮”效果 */
.hover-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 250px;
  height: 250px;
  margin-top: -125px;
  margin-left: -125px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%);
  /* Color Dodge 会让背景的线条在光斑下变得极亮 */
  mix-blend-mode: color-dodge; 
  pointer-events: none;
  will-change: transform;
  z-index: 1;
}

/* 顶部刻度尺装饰 */
.top-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 5%, var(--hive-border) 20%, var(--hive-border) 80%, transparent 95%);
  opacity: 0.4;
}
/* 用伪元素画刻度 */
.top-ruler::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background-image: repeating-linear-gradient(90deg, var(--hive-amber), var(--hive-amber) 1px, transparent 1px, transparent 20px);
  opacity: 0.3;
}

/* === 布局 === */
.container-fluid {
  width: 100%;
  height: 100%;
  padding: 0 1.5rem !important;
  position: relative;
  z-index: 10;
}

.bar-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  flex-wrap: nowrap;
}

.section {
  display: flex;
  align-items: center;
  height: 100%;
}

/* === 左侧 Logo 升级 === */
.section.left { gap: 1rem; min-width: 220px; }

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--text-main);
  font-size: 0.9rem;
  letter-spacing: -0.5px;
}
.highlight { color: var(--hive-amber); }

/* 三联蜂巢图标 */
.hex-triad {
  display: flex;
  gap: 2px;
}
.hex-triad span {
  width: 6px;
  height: 10px;
  background-color: var(--hive-amber);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  opacity: 0.8;
}
.hex-triad span:nth-child(2) { margin-top: 3px; opacity: 1; } /* 中间错位 */
.hex-triad span:nth-child(3) { opacity: 0.6; }

.status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background: rgba(255,255,255,0.03);
  /* 关键：六边形斜切角背景 */
  clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
  border-right: 1px solid rgba(255,255,255,0.1);
}
.status-led {
  width: 4px;
  height: 4px;
  background-color: #10b981;
  box-shadow: 0 0 5px #10b981;
}
.status-text { font-size: 0.65rem; color: var(--text-muted); }

/* === 中间导航：六边形按钮 (Hex Buttons) === */
.section.center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  gap: 8px;
}

.hex-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 30px; /* 比 Bar 稍微矮一点 */
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

/* 按钮背景层：平时隐藏，Active时显示 */
.hex-btn .btn-bg {
  position: absolute;
  inset: 0;
  background: var(--hive-dim);
  z-index: -1;
  /* 核心：梯形切割，模拟蜂巢边缘 */
  clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--hive-border); /* 边框 */
}

/* Hover 效果 */
.hex-btn:hover {
  color: var(--text-main);
}
.hex-btn:hover .btn-bg {
  opacity: 0.3;
  transform: scale(1);
}

/* Active (选中) 效果 */
.hex-btn.active {
  color: var(--hive-amber);
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}
.hex-btn.active .btn-bg {
  opacity: 1;
  transform: scale(1);
  background: rgba(251, 191, 36, 0.15); /* 选中时背景变亮 */
  border-color: var(--hive-amber);
  box-shadow: inset 0 0 10px rgba(251, 191, 36, 0.1);
}

/* === 右侧工具 === */
.section.right {
  gap: 1rem;
  min-width: 200px;
  justify-content: flex-end;
}

.icp-code {
  font-size: 0.7rem;
  color: #444;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.icp-code:hover { opacity: 1; color: var(--text-muted); }

.tool-cluster { display: flex; gap: 6px; }

/* 六边形小图标按钮 */
.hex-icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  background: rgba(255,255,255,0.03);
  /* 六边形切割 */
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.hex-icon-btn:hover {
  background: var(--hive-amber);
  color: #000;
  transform: scale(1.1);
}
.hex-icon-btn.top {
  background: rgba(251, 191, 36, 0.2);
  color: var(--hive-amber);
}
.hex-icon-btn.top:hover {
  background: var(--hive-amber);
  color: #000;
  box-shadow: 0 0 15px var(--hive-amber);
}

/* === 移动端适配 === */
@media (max-width: 768px) {
  #energy-footer.energy-bar { height: auto !important; min-height: 48px !important; }
  .bar-layout { flex-wrap: wrap; justify-content: center; }
  .section.left, .section.right { display: none; } /* 隐藏次要信息 */
  
  .section.center {
    position: relative; left: 0; transform: none; 
    width: 100%; 
    justify-content: space-evenly;
    gap: 2px;
  }
  .hex-btn { 
    flex: 1; 
    height: 48px; /* 手机上增加点击面积 */
    font-size: 0.8rem; 
  }
  /* 手机上去除 clip-path 以便占满底部 */
  .hex-btn .btn-bg { clip-path: none; border-bottom: 2px solid transparent; border-width: 0 0 2px 0; background: transparent; }
  .hex-btn.active .btn-bg { border-color: var(--hive-amber); }
}
</style>