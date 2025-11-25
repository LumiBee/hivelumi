<template>
  <div class="auth-page-wrapper">
    <div class="auth-card glass-panel">
      <!-- Logo Badge -->
      <div class="logo-badge">
        <div class="hexagon">
          <img src="/img/logo.png" alt="Hive Logo" />
        </div>
      </div>
      
      <div class="auth-header">
        <h2>欢迎回来</h2>
        <p class="slogan">探索知识的蜂巢</p>
      </div>

      <!-- 成功提示 -->
      <div v-if="showSuccessMessage" class="alert alert-success fade-in" role="alert">
        <i class="fas fa-check-circle me-2"></i>
        {{ successMessage }}
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="alert alert-danger fade-in" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        {{ errorMessage }}
      </div>

      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <div class="input-wrapper">
            <i class="fas fa-user input-icon"></i>
            <input
              type="text"
              class="custom-input"
              id="accountInput"
              v-model="loginForm.account"
              placeholder="邮箱或用户名"
              required
              :class="{ 'is-invalid': errorMessage }"
            />
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              class="custom-input"
              id="password"
              v-model="loginForm.password"
              placeholder="密码"
              required
              :class="{ 'is-invalid': errorMessage }"
            />
            <button
              class="password-toggle"
              type="button"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div class="form-actions">
          <label class="custom-checkbox">
            <input
              type="checkbox"
              v-model="loginForm.rememberMe"
            />
            <span class="checkmark"></span>
            <span class="label-text">记住我</span>
          </label>
          <a href="#" class="forgot-password">忘记密码?</a>
        </div>

        <button type="submit" class="btn-liquid-amber" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span v-else>立即登录</span>
        </button>
      </form>

      <!-- OAuth2登录 -->
      <div class="social-login">
        <p>或通过以下方式登录</p>
        <div class="social-buttons">
          <a href="http://localhost:8090/api/oauth2/authorization/github" class="social-btn github" title="GitHub 登录">
            <i class="fab fa-github"></i>
          </a>
          <button type="button" class="social-btn qq" disabled title="QQ 登录 (即将开放)">
            <i class="fab fa-qq"></i>
          </button>
        </div>
      </div>

      <!-- 跳转注册页面 -->
      <div class="auth-footer">
        <p>还没有账户？ <router-link to="/signup" class="link-highlight">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const loginForm = ref({
  account: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showSuccessMessage = ref(false)
const successMessage = ref('')

// 处理登录
const handleLogin = async () => {
  if (!loginForm.value.account || !loginForm.value.password) {
    errorMessage.value = '请填写账号和密码'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''

    const success = await authStore.login(loginForm.value)

    if (success) {
      // 登录成功，跳转到目标页面或首页
      const redirectTo = route.query.redirect || '/'
      router.push(redirectTo)
    } else {
      errorMessage.value = authStore.error || '登录失败，请检查用户名和密码'
    }
  } catch (error) {
    console.error('登录失败:', error)
    errorMessage.value = '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时检查URL参数
onMounted(() => {
  // 检查是否是注册成功后跳转过来的
  if (route.query.registered === 'true') {
    showSuccessMessage.value = true
    successMessage.value = '注册成功！现在您可以使用新账户登录了。'
  }
  
  // 检查是否有登录错误参数
  if (route.query.error) {
    errorMessage.value = '登录失败，请检查用户名和密码'
  }
})
</script>

<style scoped>
/* 极光背景与页面容器 */
.auth-page-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 70px 1rem 2rem; /* 增加顶部内边距以避开导航栏 */
  margin-top: 0; /* 覆盖默认 margin */
  position: relative;
  background-color: #fbfbfd;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(246, 185, 59, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(66, 153, 225, 0.08) 0%, transparent 40%),
    var(--noise-pattern, url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E"));
  overflow: hidden; /* 禁止页面滚动 */
}

/* 针对较小屏幕高度的响应式调整，确保内容完整显示 */
@media (max-height: 800px) {
  .auth-card {
    padding: 2rem 2rem;
    transform: scale(0.9);
  }
  
  .logo-badge {
    top: -30px;
  }
  
  .hexagon {
    width: 60px;
    height: 60px;
  }
  
  .hexagon img {
    width: 30px;
  }
  
  .auth-header {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .social-login {
    margin-top: 1.5rem;
  }
  
  .auth-footer {
    margin-top: 1.5rem;
  }
}

@media (max-height: 650px) {
  .auth-card {
    transform: scale(0.85);
    padding: 1.5rem;
  }
}

/* 中央悬浮玻璃卡片 */
.auth-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  padding: 3rem 2.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: cardFloat 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes cardFloat {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Logo 徽章 */
.logo-badge {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.hexagon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(246, 185, 59, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.hexagon img {
  width: 40px;
  height: auto;
}

/* 标题与标语 */
.auth-header {
  text-align: center;
  margin-top: 2rem;
  margin-bottom: 2.5rem;
}

.auth-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

.slogan {
  font-family: "Songti SC", "Noto Serif SC", serif;
  color: #86868b;
  font-size: 1rem;
  letter-spacing: 1px;
}

/* 表单样式 */
.auth-form {
  width: 100%;
}

.form-group {
  margin-bottom: 1.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #86868b;
  font-size: 1rem;
  pointer-events: none;
  z-index: 2;
  transition: color 0.3s ease;
}

.custom-input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid transparent;
  border-radius: 16px;
  font-size: 1rem;
  color: #1d1d1f;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-input:focus {
  outline: none;
  background: #fff;
  border-color: rgba(246, 185, 59, 0.3);
  box-shadow: 0 0 0 4px rgba(246, 185, 59, 0.1);
}

.custom-input:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: #F6B93B;
}

.password-toggle {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  color: #86868b;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: #1d1d1f;
}

/* 复选框与忘记密码 */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  margin-right: 8px;
  position: relative;
  transition: all 0.2s ease;
}

.custom-checkbox input:checked ~ .checkmark {
  background: #F6B93B;
}

.checkmark::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: opacity 0.2s;
}

.custom-checkbox input:checked ~ .checkmark::after {
  opacity: 1;
}

.label-text {
  color: #86868b;
}

.forgot-password {
  color: #86868b;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #F6B93B;
}

/* 液态琥珀按钮 */
.btn-liquid-amber {
  /* Structure */
  width: 100%;
  padding: 16px; /* Slightly taller for presence */
  border: none;
  border-radius: 18px; /* Softer corners */
  
  /* Typography */
  color: white;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  /* Background & Depth */
  background: linear-gradient(135deg, #FFC837 0%, #FF8008 100%); /* Richer orange-gold */
  position: relative;
  overflow: hidden;
  cursor: pointer;
  
  /* Initial State Effects */
  box-shadow: 
    0 10px 20px -5px rgba(255, 128, 8, 0.4), /* Colored glow */
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.4), /* Top highlight */
    inset 0 -2px 0 rgba(0, 0, 0, 0.1); /* Bottom lip */
    
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 1;
}

/* Shine effect overlay */
.btn-liquid-amber::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(255, 255, 255, 0.2), 
    transparent
  );
  transition: left 0.5s ease;
  z-index: -1;
}

/* Hover State */
.btn-liquid-amber:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.01);
  background: linear-gradient(135deg, #FFD560 0%, #FF9020 100%); /* Brighter */
  box-shadow: 
    0 15px 30px -5px rgba(255, 128, 8, 0.5),
    0 8px 12px -4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.btn-liquid-amber:hover:not(:disabled)::before {
  left: 100%; /* Swipe shine across */
}

/* Active State */
.btn-liquid-amber:active:not(:disabled) {
  transform: translateY(1px) scale(0.98);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.2); /* Inner shadow for depth */
  background: linear-gradient(135deg, #E0A800 0%, #D06000 100%); /* Darker */
}

/* Disabled State */
.btn-liquid-amber:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.4);
  transform: none;
  box-shadow: none;
}

/* 社交登录 */
.social-login {
  margin-top: 2.5rem;
  text-align: center;
}

.social-login p {
  color: #86868b;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
  padding: 0 1rem;
}

.social-login p::before,
.social-login p::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 40px;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

.social-login p::before { right: 100%; }
.social-login p::after { left: 100%; }

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.social-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #1d1d1f;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.social-btn:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.social-btn.github:hover {
  background: #333;
  color: white;
}

.social-btn.qq:hover {
  background: #12B7F5;
  color: white;
}

.social-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f7;
}

/* 底部链接 */
.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.95rem;
  color: #86868b;
}

.link-highlight {
  color: #F6B93B;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}

.link-highlight:hover {
  color: #E0A800;
  text-decoration: underline;
}

/* 提示框动画 */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.alert {
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  border: none;
}

.alert-success {
  background: rgba(40, 167, 69, 0.1);
  color: #155724;
}

.alert-danger {
  background: rgba(220, 53, 69, 0.1);
  color: #721c24;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .auth-card {
    padding: 2.5rem 1.5rem;
  }
  
  .auth-header h2 {
    font-size: 1.5rem;
  }
  
  .custom-input {
    font-size: 16px; /* 防止 iOS 缩放 */
  }
}
</style>
