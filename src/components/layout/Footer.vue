<template>
  <footer id="energy-footer" class="energy-bar" ref="footerRef">
    
    <div class="hex-grid-layer"></div>
    
    <div class="noise-overlay"></div>
    
    <div class="hover-light" :style="glowStyle"></div>

    <div class="top-ruler"></div>

    <div class="container-fluid">
      <div class="bar-layout">
        
        <div class="section left">
          <div class="brand-cluster">
            <div class="hex-triad breathing">
              <span></span><span></span><span></span>
            </div>
            <span class="brand-text">LUMI<span class="highlight">HIVE</span></span>
          </div>
          
          <div class="status-chip">
            <span class="status-led"></span>
            <span class="status-text">SYSTEM ONLINE</span>
          </div>
        </div>

        <nav class="section center">
          <router-link to="/" class="hex-btn" active-class="active">
            <span class="btn-text">首页</span>
            <div class="btn-bg"></div>
            <div class="active-bar"></div>
          </router-link>
          
          <router-link to="/tags" class="hex-btn" active-class="active">
            <span class="btn-text">标签</span>
            <div class="btn-bg"></div>
            <div class="active-bar"></div>
          </router-link>
          
          <router-link to="/portfolio" class="hex-btn" active-class="active">
            <span class="btn-text">作品集</span>
            <div class="btn-bg"></div>
            <div class="active-bar"></div>
          </router-link>
          
          <router-link to="/about" class="hex-btn" active-class="active">
            <span class="btn-text">关于</span>
            <div class="btn-bg"></div>
            <div class="active-bar"></div>
          </router-link>
        </nav>

        <div class="section right">
          <a href="https://beian.miit.gov.cn/" target="_blank" class="icp-code">苏ICP备2025185969号</a>
          
          <div class="tool-cluster">
            <a href="https://github.com/LumiBee/community" target="_blank" class="hex-icon-btn" title="GitHub">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
            <button class="hex-icon-btn top-btn" @click="scrollToTop" title="Back to Top">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
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
const mouseX = ref(-500);
const mouseY = ref(-500);

// 开启 GPU 加速的坐标计算
const glowStyle = computed(() => ({
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
      // 移出时将光斑平滑移出视野
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
  /* === 尺寸调整 === */
  height: 64px; /* 调整为更现代的 64px，比 78px 精致，比 48px 丰富 */
  width: 100%;
  margin-top: auto;
  padding: 0;
  
  /* === 核心配色 === */
  background-color: #050505;
  border-top: none;
  
  /* 蜂巢琥珀色系 */
  --hive-amber: #f59e0b;
  --hive-glow: rgba(245, 158, 11, 0.4);
  --hive-dim: rgba(245, 158, 11, 0.08);
  --text-primary: #e5e5e5;
  --text-secondary: #737373;
  
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden; /* 限制光效溢出 */
  user-select: none;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
}

/* === 1. 增强型背景与噪点 === */
.hex-grid-layer {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='30' height='52' viewBox='0 0 30 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0l14.43 8.25v16.5L15 33 .57 24.75V8.25L15 0z' fill='none' stroke='rgba(245, 158, 11, 0.07)' stroke-width='1'/%3E%3C/svg%3E");
  background-size: 30px 52px;
  opacity: 0.8;
  pointer-events: none;
  z-index: 0;
}

/* 新增：噪点纹理 (Noise) - 增加赛博朋克质感 */
.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}

/* === 2. 动态特效 (Effects) === */

/* 鼠标光斑 (Glow) */
.hover-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 400px;
  height: 400px;
  margin-top: -200px;
  margin-left: -200px;
  background: radial-gradient(circle closest-side, var(--hive-glow), transparent 80%);
  mix-blend-mode: screen; /* 强力混合模式，照亮背景 */
  pointer-events: none;
  will-change: transform;
  z-index: 1;
  opacity: 0.6;
}

/* 顶部刻度尺 */
.top-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
  opacity: 0.5;
}
.top-ruler::after {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: repeating-linear-gradient(90deg, var(--hive-amber), var(--hive-amber) 1px, transparent 1px, transparent 10px);
  opacity: 0.3;
}

/* === 3. 内容布局 === */
.container-fluid {
  width: 100%;
  height: 100%;
  padding: 0 2rem; /* 舒适的边距 */
  position: relative;
  z-index: 10;
}

.bar-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

/* === [Left] Brand Cluster === */
.section.left {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.brand-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.03em;
}
.highlight { color: var(--hive-amber); }

.hex-triad { display: flex; gap: 2px; }
.hex-triad span {
  width: 5px;
  height: 10px;
  background: var(--hive-amber);
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  opacity: 0.7;
}
.hex-triad span:nth-child(2) { transform: translateY(3px); opacity: 1; }
/* Logo 呼吸动画 */
.breathing span { animation: breathe 3s infinite ease-in-out alternate; }
@keyframes breathe { 0% { opacity: 0.5; } 100% { opacity: 1; box-shadow: 0 0 5px var(--hive-amber); } }

.status-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 2px;
  clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px); /* 左上切角 */
}
.status-led {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 6px #10b981;
  animation: pulse 2s infinite;
}
@keyframes pulse { 50% { opacity: 0.4; } }
.status-text { font-size: 0.7rem; color: var(--text-secondary); letter-spacing: 0.5px; }

/* === [Center] Hex Navigation === */
.section.center {
  display: flex;
  gap: 6px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.hex-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 42px; /* 增加高度适配触摸 */
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
  overflow: visible;
}

.btn-text { position: relative; z-index: 2; }

/* 按钮背景：默认隐藏，Hover/Active 显现 */
.btn-bg {
  position: absolute;
  inset: 0;
  background: var(--hive-dim);
  clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px); /* 赛博切角矩形 */
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.2s ease-out;
  border: 1px solid rgba(245, 158, 11, 0.2);
  z-index: 1;
}

/* 底部能量条 */
.active-bar {
  position: absolute;
  bottom: -1px;
  left: 15%;
  width: 70%;
  height: 2px;
  background: var(--hive-amber);
  box-shadow: 0 -2px 8px var(--hive-amber);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 3;
}

/* 交互状态 */
.hex-btn:hover { color: var(--text-primary); }
.hex-btn:hover .btn-bg { opacity: 0.4; transform: scale(1); }

.hex-btn.active { color: var(--hive-amber); text-shadow: 0 0 10px rgba(245,158,11,0.3); }
.hex-btn.active .btn-bg { opacity: 1; transform: scale(1); background: rgba(245, 158, 11, 0.12); border-color: var(--hive-amber); }
.hex-btn.active .active-bar { opacity: 1; }

/* === [Right] Tools === */
.section.right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  justify-content: flex-end;
}

.icp-code {
  font-size: 0.75rem;
  color: #555;
  text-decoration: none;
  transition: color 0.2s;
}
.icp-code:hover { color: var(--hive-amber); }

.tool-cluster { display: flex; gap: 8px; }

.hex-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.03);
  border: none;
  color: var(--text-secondary);
  /* 正六边形 */
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hex-icon-btn:hover {
  background: var(--hive-amber);
  color: #000;
  transform: translateY(-2px) scale(1.1);
}
/* 回到顶部按钮特殊样式 */
.top-btn {
  background: rgba(245, 158, 11, 0.15);
  color: var(--hive-amber);
}
.top-btn:hover {
  box-shadow: 0 0 15px var(--hive-amber);
}

/* === 移动端 === */
@media (max-width: 768px) {
  #energy-footer.energy-bar { height: auto; min-height: 54px; padding: 0 10px; }
  .bar-layout { flex-wrap: wrap; justify-content: center; }
  .section.left, .section.right { display: none; } /* 移动端专注导航 */
  
  .section.center {
    position: relative; left: 0; transform: none;
    width: 100%; justify-content: space-between; gap: 0;
  }
  .hex-btn { flex: 1; height: 54px; }
  .hex-btn .btn-bg { clip-path: none; border-bottom: 1px solid var(--hive-amber); border-width: 0 0 1px 0; background: transparent; }
  .hex-btn.active .btn-bg { background: linear-gradient(to top, rgba(245,158,11,0.1), transparent); }
  .active-bar { display: none; } /* 移动端简化 */
}
</style>