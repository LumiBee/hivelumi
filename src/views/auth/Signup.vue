<template>
  <div class="auth-page-wrapper">
    <div class="auth-card glass-panel">
      <!-- Logo Badge -->
      <!-- Logo Badge -->
      <div class="auth-header-icon">
        <div class="hive-emblem">
          <i class="fas fa-cubes"></i>
        </div>
      </div>
      
      <div class="auth-header">
        <h2>加入蜂巢</h2>
        <p class="slogan">开启您的知识分享之旅</p>
      </div>

      <!-- 注册表单 -->
      <form @submit.prevent="handleSignup" class="auth-form">
        <div class="form-group">
          <div class="input-wrapper">
            <i class="fas fa-user input-icon"></i>
            <input
              type="text"
              class="custom-input"
              id="username"
              v-model="username"
              placeholder="用户名"
              required
              :class="{ 'is-invalid': fieldErrors.username }"
            />
          </div>
          <div v-if="fieldErrors.username" class="invalid-feedback d-block ms-2 mt-1">
            {{ fieldErrors.username }}
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <i class="fas fa-envelope input-icon"></i>
            <input
              type="email"
              class="custom-input"
              id="email"
              v-model="email"
              placeholder="邮箱地址"
              required
              :class="{ 'is-invalid': fieldErrors.email }"
            />
          </div>
          <div v-if="fieldErrors.email" class="invalid-feedback d-block ms-2 mt-1">
            {{ fieldErrors.email }}
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <i class="fas fa-lock input-icon"></i>
            <input
              :type="showPassword ? 'text' : 'password'"
              class="custom-input"
              id="password"
              v-model="password"
              placeholder="密码 (至少6位)"
              required
              :class="{ 'is-invalid': fieldErrors.password }"
            />
            <button
              class="password-toggle"
              type="button"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <div v-if="fieldErrors.password" class="invalid-feedback d-block ms-2 mt-1">
            {{ fieldErrors.password }}
          </div>
        </div>

        <div class="form-group">
          <div class="input-wrapper">
            <i class="fas fa-check-circle input-icon"></i>
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              class="custom-input"
              id="confirmPassword"
              v-model="confirmPassword"
              placeholder="确认密码"
              required
              :class="{ 'is-invalid': fieldErrors.confirmPassword }"
            />
            <button
              class="password-toggle"
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <div v-if="fieldErrors.confirmPassword" class="invalid-feedback d-block ms-2 mt-1">
            {{ fieldErrors.confirmPassword }}
          </div>
        </div>

        <div class="form-actions">
          <label class="custom-checkbox">
            <input
              type="checkbox"
              v-model="agreeTerms"
              required
            />
            <span class="checkmark"></span>
            <span class="label-text">
              我已阅读并同意 <a href="#" class="link-highlight">用户协议</a> 和 <a href="#" class="link-highlight">隐私政策</a>
            </span>
          </label>
        </div>

        <button type="submit" class="btn-liquid-amber" :disabled="isLoading || !isFormValid">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span v-else>立即注册</span>
        </button>
      </form>

      <!-- 跳转登录页面 -->
      <div class="auth-footer">
        <p>已有账户？ <router-link to="/login" class="link-highlight">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/plugins/toast';

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreeTerms = ref(false); // Added this ref based on template usage

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const fieldErrors = ref({})

// 计算属性
const isFormValid = computed(() => {
  return username.value &&
         email.value &&
         password.value &&
         confirmPassword.value &&
         agreeTerms.value &&
         password.value === confirmPassword.value &&
         password.value.length >= 6
})

// 表单验证
const validateForm = () => {
  fieldErrors.value = {}
  let isValid = true

  // 验证用户名
  if (!username.value) {
    fieldErrors.value.username = '请输入用户名'
    isValid = false
  } else if (username.value.length < 3) {
    fieldErrors.value.username = '用户名至少需要3个字符'
    isValid = false
  } else if (username.value.length > 20) {
    fieldErrors.value.username = '用户名不能超过20个字符'
    isValid = false
  }

  // 验证邮箱
  if (!email.value) {
    fieldErrors.value.email = '请输入邮箱地址'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    fieldErrors.value.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 验证密码
  if (!password.value) {
    fieldErrors.value.password = '请输入密码'
    isValid = false
  } else if (password.value.length < 6) {
    fieldErrors.value.password = '密码长度至少需要6位'
    isValid = false
  } else if (password.value.length > 50) {
    fieldErrors.value.password = '密码长度不能超过50位'
    isValid = false
  }

  // 验证确认密码
  if (!confirmPassword.value) {
    fieldErrors.value.confirmPassword = '请确认密码'
    isValid = false
  } else if (password.value !== confirmPassword.value) {
    fieldErrors.value.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

// 处理注册
const handleSignup = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isLoading.value = true
    fieldErrors.value = {}

    const result = await authStore.register({
      username: username.value,
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value
    })

    // 检查结果类型
    if (result === true) {
      toast.success('注册成功！正在为您登录...')
      // 注册成功，跳转到登录页面
      router.push({ name: 'Login', query: { registered: 'true' } })
    } else if (result && typeof result === 'object' && result.fieldErrors) {
      // 处理字段级别的错误
      fieldErrors.value = result.fieldErrors
      toast.error('请检查表单填写是否正确')
    } else {
      // 处理一般错误
      const error = authStore.error
      
      // 尝试从错误消息中识别特定字段错误
      if (error && error.toLowerCase().includes('用户名')) {
        fieldErrors.value.username = '该用户名已被注册'
        toast.error('该用户名已被注册')
      } else if (error && error.toLowerCase().includes('邮箱')) {
        fieldErrors.value.email = '该邮箱已被注册'
        toast.error('该邮箱已被注册')
      } else {
        toast.error(error || '注册失败，请稍后重试')
      }
    }
  } catch (error) {
    console.error('注册失败:', error)
    toast.error('注册失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

// 监听密码变化，实时验证确认密码
watch(() => signupForm.value.password, () => {
  if (signupForm.value.confirmPassword && fieldErrors.value.confirmPassword) {
    if (signupForm.value.password === signupForm.value.confirmPassword) {
      delete fieldErrors.value.confirmPassword
    }
  }
})

watch(() => signupForm.value.confirmPassword, () => {
  if (signupForm.value.password && signupForm.value.confirmPassword) {
    if (signupForm.value.password !== signupForm.value.confirmPassword) {
      fieldErrors.value.confirmPassword = '两次输入的密码不一致'
    } else {
      delete fieldErrors.value.confirmPassword
    }
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
@media (max-height: 900px) {
  .auth-card {
    padding: 2rem 2rem;
    transform: scale(0.9);
    max-height: calc(100vh - 90px);
    overflow-y: auto; /* 如果内容实在太多，允许卡片内部滚动 */
  }
  
  .auth-card::-webkit-scrollbar {
    width: 4px;
  }
  
  .auth-card::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
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
}

@media (max-height: 700px) {
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

/* Logo 徽章 - Hive Emblem */
.auth-header-icon {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  margin-top: -1rem; /* Slight negative margin to pull it up */
}

.hive-emblem {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
  backdrop-filter: blur(20px);
  -webkit-clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Use filter for outer shadow that respects clip-path */
  filter: drop-shadow(0 10px 20px rgba(246, 185, 59, 0.3));
  /* Use inset box-shadow for the border effect (clipped inside) */
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.5);
  transform: rotate(0deg);
  transition: all 0.5s ease;
}

/* Pseudo-element removed as border is now handled by inset shadow */

.hive-emblem i {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #F6B93B, #E0A800);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 8px rgba(246, 185, 59, 0.3));
}

.auth-card:hover .hive-emblem {
  transform: rotate(0deg) scale(1.05);
  filter: drop-shadow(0 15px 30px rgba(246, 185, 59, 0.4));
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

.custom-input.is-invalid {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.05);
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

.alert-danger {
  background: rgba(220, 53, 69, 0.1);
  color: #721c24;
}

.invalid-feedback {
  font-size: 0.8rem;
  color: #dc3545;
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
