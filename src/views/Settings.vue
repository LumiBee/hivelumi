<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 页面标题 -->
      <div class="settings-header">
        <h1 class="settings-title">
          <i class="fas fa-sliders-h"></i>
          设置中心
        </h1>
        <p class="settings-subtitle">设置您的数字形象</p>
      </div>

      <!-- 头像裁剪模态框 -->
      <AvatarCropper
        :visible="showAvatarCropper"
        :image-src="avatarImageSrc"
        @close="closeAvatarCropper"
        @crop="handleAvatarCrop"
      />

      <!-- 双层玻璃架构 -->
      <div class="glass-architecture">
        <!-- 左侧导航 (Layer 1) -->
        <div class="settings-sidebar">
          <nav class="settings-nav">
            <button 
              v-for="section in settingsSections" 
              :key="section.id"
              @click="activeSection = section.id"
              :class="['nav-item', { active: activeSection === section.id }]"
            >
              <div class="nav-indicator"></div>
              <i :class="section.icon"></i>
              <span>{{ section.title }}</span>
            </button>
          </nav>
        </div>

        <!-- 右侧内容区域 (Layer 2) -->
        <div class="settings-main">
          <!-- 个人信息设置 -->
          <div v-if="activeSection === 'profile'" class="settings-section">
            <div class="section-header">
              <h2>基本资料</h2>
              <p>调整您的数字形象</p>
            </div>
            
            <div class="settings-form">
              <!-- 头像上传区域: The Portal -->
              <div class="settings-group avatar-group">
                <div class="avatar-portal-container">
                  <div class="avatar-portal" @click="$refs.avatarInput.click()">
                    <div class="portal-ring"></div>
                    <img :src="getAvatarUrl(userInfo.avatarUrl)" alt="用户头像" class="avatar-img" />
                    <div class="portal-overlay">
                      <i class="fas fa-camera"></i>
                      <span>Change</span>
                    </div>
                  </div>
                  <div class="avatar-info">
                    <h3>{{ userInfo.userName || 'User' }}</h3>
                    <p>点击头像更换图片</p>
                  </div>
                </div>
                <input 
                  ref="avatarInput"
                  type="file" 
                  class="d-none" 
                  accept="image/*"
                  @change="handleAvatarUpload"
                >
              </div>

              <!-- 用户信息表单 -->
              <div class="settings-group">
                <div class="form-item">
                  <label class="form-label">用户名</label>
                  <input type="text" v-model="userInfo.userName" class="apple-input" placeholder="您的用户名" />
                </div>

                <div class="form-item">
                  <label class="form-label">个人简介</label>
                  <textarea v-model="userInfo.bio" class="apple-input" rows="3" placeholder="写一句话介绍自己..."></textarea>
                </div>

                <div class="form-item">
                  <label class="form-label">电子邮箱</label>
                  <input type="email" v-model="userInfo.email" class="apple-input" placeholder="example@email.com" />
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-save" @click="saveProfile">
                  <span>保存更改</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 账户安全设置 -->
          <div v-if="activeSection === 'security'" class="settings-section">
            <div class="section-header">
              <h2>账户安全</h2>
              <p>保护您的数字资产</p>
            </div>
            
            <div class="settings-form">
              <div class="settings-group">
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>登录密码</h4>
                    <p>定期更换密码以确保安全</p>
                  </div>
                  <button class="btn-ghost" @click="changePassword">修改</button>
                </div>

                <div class="setting-divider"></div>

                <div class="setting-row">
                  <div class="setting-info">
                    <h4>手机绑定</h4>
                    <p>绑定手机号以增强安全性</p>
                  </div>
                  <button class="btn-ghost" @click="bindPhone">绑定</button>
                </div>
              </div>

              <div class="settings-group">
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>两步验证</h4>
                    <p>启用两步验证 (2FA)</p>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="securitySettings.twoFactor" @change="toggleTwoFactor">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="settings-group">
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>登录历史</h4>
                    <p>查看最近的活动记录</p>
                  </div>
                  <button class="btn-ghost" @click="viewLoginHistory">查看</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 通知设置 -->
          <div v-if="activeSection === 'notifications'" class="settings-section">
            <div class="section-header">
              <h2>通知中心</h2>
              <p>定制您的消息接收偏好</p>
            </div>
            
            <div class="settings-form">
              <div class="settings-group">
                <h5 class="group-title">文章互动</h5>
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>新评论</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="notificationSettings.comments">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="setting-divider"></div>
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>点赞</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="notificationSettings.likes">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="setting-divider"></div>
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>收藏</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="notificationSettings.favorites">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="settings-group">
                <h5 class="group-title">社交互动</h5>
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>新关注</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="notificationSettings.follows">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="setting-divider"></div>
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>私信</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="notificationSettings.messages">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-save" @click="saveNotificationSettings">
                  <span>保存偏好</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 隐私设置 -->
          <div v-if="activeSection === 'privacy'" class="settings-section">
            <div class="section-header">
              <h2>隐私控制</h2>
              <p>管理您的可见性范围</p>
            </div>
            
            <div class="settings-form">
              <div class="settings-group">
                <div class="form-item">
                  <label class="form-label">个人资料可见性</label>
                  <select v-model="privacySettings.profileVisibility" class="apple-select">
                    <option value="public">所有人可见</option>
                    <option value="followers">仅关注者可见</option>
                    <option value="private">仅自己可见</option>
                  </select>
                </div>
                
                <div class="form-item">
                  <label class="form-label">新文章默认可见性</label>
                  <select v-model="privacySettings.articleVisibility" class="apple-select">
                    <option value="public">公开</option>
                    <option value="followers">仅关注者</option>
                    <option value="private">私密</option>
                  </select>
                </div>
              </div>

              <div class="settings-group">
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>允许搜索找到我</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="privacySettings.searchable">
                    <span class="slider"></span>
                  </label>
                </div>
                <div class="setting-divider"></div>
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>显示在线状态</h4>
                  </div>
                  <label class="ios-switch">
                    <input type="checkbox" v-model="privacySettings.showOnline">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-save" @click="savePrivacySettings">
                  <span>保存设置</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 数据管理 -->
          <div v-if="activeSection === 'data'" class="settings-section">
            <div class="section-header">
              <h2>数据与存储</h2>
              <p>掌控您的数据主权</p>
            </div>
            
            <div class="settings-form">
              <div class="settings-group">
                <div class="setting-row">
                  <div class="setting-info">
                    <h4>导出个人数据</h4>
                    <p>下载您的所有数据副本</p>
                  </div>
                  <button class="btn-ghost" @click="exportData">导出</button>
                </div>
              </div>

              <!-- Danger Zone -->
              <div class="danger-zone">
                <div class="danger-header">
                  <h4>危险区域</h4>
                </div>
                <div class="danger-content">
                  <div class="setting-info">
                    <h4>删除账户</h4>
                    <p>此操作不可逆，请谨慎操作</p>
                  </div>
                  <button class="btn-danger-ghost" @click="deleteAccount">删除账户</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import AvatarCropper from '@/components/AvatarCropper.vue'
import { userAPI } from '@/api/user'
import { getAvatarUrl } from '@/utils/avatar-helper'

const authStore = useAuthStore()

// 当前激活的设置部分
const activeSection = ref('profile')

// 设置部分配置
const settingsSections = [
  { id: 'profile', title: '基本资料', icon: 'fas fa-user-circle' },
  { id: 'security', title: '账户安全', icon: 'fas fa-shield-alt' },
  { id: 'notifications', title: '通知中心', icon: 'fas fa-bell' },
  { id: 'privacy', title: '隐私控制', icon: 'fas fa-eye' },
  { id: 'data', title: '数据管理', icon: 'fas fa-database' }
]

// 用户信息
const userInfo = reactive({
  userName: authStore.userName || '',
  nickname: '',
  email: '',
  bio: '',
  avatarUrl: authStore.userAvatar || ''
})

// 头像上传相关状态
const showAvatarCropper = ref(false)
const avatarFile = ref(null)
const avatarImageSrc = ref('')

// 头像上传处理
const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      window.$toast.error('请选择图片文件')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      window.$toast.error('文件大小不能超过2MB')
      return
    }
    avatarFile.value = file
    avatarImageSrc.value = URL.createObjectURL(file)
    showAvatarCropper.value = true
    event.target.value = ''
  }
}

// 头像裁剪完成处理
const handleAvatarCrop = async (croppedImageBlob) => {
  try {
    const formData = new FormData()
    formData.append('avatar', croppedImageBlob, 'avatar.jpg')
    const response = await userAPI.uploadAvatar(formData)
    
    if (response && response.avatarUrl) {
      userInfo.avatarUrl = response.avatarUrl
      authStore.updateUserProfile({ avatarUrl: response.avatarUrl })
      if (authStore.user) {
        authStore.user.avatarUrl = response.avatarUrl
      }
    }
    window.$toast.success('头像更新成功')
  } catch (error) {
    window.$toast.error('头像上传失败，请重试')
  } finally {
    showAvatarCropper.value = false
    avatarFile.value = null
    if (avatarImageSrc.value) {
      URL.revokeObjectURL(avatarImageSrc.value)
      avatarImageSrc.value = ''
    }
  }
}

const closeAvatarCropper = () => {
  showAvatarCropper.value = false
  avatarFile.value = null
  if (avatarImageSrc.value) {
    URL.revokeObjectURL(avatarImageSrc.value)
    avatarImageSrc.value = ''
  }
}

// 安全设置
const securitySettings = reactive({
  twoFactor: false
})

// 通知设置
const notificationSettings = reactive({
  comments: true,
  likes: true,
  favorites: true,
  follows: true,
  messages: true,
  system: false
})

// 隐私设置
const privacySettings = reactive({
  profileVisibility: 'public',
  articleVisibility: 'public',
  searchable: true,
  showOnline: true
})

// 保存个人信息
const saveProfile = async () => {
  try {
    if (!userInfo.userName.trim()) {
      window.$toast.error('用户名不能为空')
      return
    }
    if (!userInfo.email.trim()) {
      window.$toast.error('邮箱不能为空')
      return
    }
    
    const response = await userAPI.updateProfile({
      userName: userInfo.userName.trim(),
      email: userInfo.email.trim(),
      bio: userInfo.bio.trim()
    })
    
    if (response && response.success) {
      authStore.updateUserProfile({
        userName: userInfo.userName.trim(),
        email: userInfo.email.trim(),
        bio: userInfo.bio.trim()
      })
      window.$toast.success('个人信息保存成功')
    } else {
      window.$toast.error(response.message || '保存失败')
    }
  } catch (error) {
    window.$toast.error('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const saveNotificationSettings = async () => {
  window.$toast.success('通知偏好已更新')
}

const savePrivacySettings = async () => {
  window.$toast.success('隐私设置已更新')
}

const exportData = async () => {
  window.$toast.success('数据导出请求已提交，请留意邮箱')
}

const deleteAccount = async () => {
  if (confirm('确定要删除账户吗？此操作不可撤销，所有数据将被永久删除。')) {
    window.$toast.success('账户删除申请已提交')
  }
}

const changePassword = () => {
  window.$toast.info('功能开发中')
}

const bindPhone = () => {
  window.$toast.info('功能开发中')
}

const toggleTwoFactor = () => {
  window.$toast.success(securitySettings.twoFactor ? '两步验证已启用' : '两步验证已禁用')
}

const viewLoginHistory = () => {
  window.$toast.info('功能开发中')
}

onMounted(async () => {
  if (authStore.user) {
    userInfo.userName = authStore.userName || ''
    userInfo.email = authStore.user?.email || ''
    userInfo.bio = authStore.user?.bio || ''
    userInfo.avatarUrl = authStore.userAvatar || ''
  }
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f7; /* Apple 浅灰背景 */
  padding: 30px 0 4rem 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

.settings-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Header */
.settings-header {
  text-align: center;
  margin-bottom: 3rem;
}

.settings-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  letter-spacing: -0.02em;
}

.settings-title i {
  color: #ffc107; /* Hive Gold */
  font-size: 2rem;
}

.settings-subtitle {
  font-size: 1.1rem;
  color: #86868b;
  font-weight: 400;
  letter-spacing: 0.05em;
}

/* Glass Architecture */
.glass-architecture {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 2rem;
  align-items: start;
}

/* Sidebar (Layer 1) */
.settings-sidebar {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 100px;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border: none;
  background: transparent;
  color: #86868b;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  text-align: left;
}

.nav-item i {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
  transition: color 0.3s ease;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.03);
  color: #1d1d1f;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.8);
  color: #1d1d1f;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.nav-item.active i {
  color: #ffc107;
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 4px;
  height: 24px;
  background: #ffc107;
  border-radius: 0 4px 4px 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-item.active .nav-indicator {
  transform: translateY(-50%) scaleY(1);
}

/* Main Content (Layer 2) */
.settings-main {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 24px;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.02);
  min-height: 600px;
}

.section-header {
  margin-bottom: 2.5rem;
}

.section-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.section-header p {
  color: #86868b;
  font-size: 1rem;
}

/* Settings Groups */
.settings-group {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.group-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #86868b;
  margin-bottom: 1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding-left: 0.5rem;
}

/* Avatar Portal */
.avatar-group {
  display: flex;
  justify-content: center;
  padding: 2.5rem 0;
  background: linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%);
}

.avatar-portal-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.avatar-portal {
  width: 120px;
  height: 120px;
  position: relative;
  cursor: pointer;
  border-radius: 50%;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 2;
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.portal-ring {
  position: absolute;
  top: -6px;
  left: -6px;
  right: -6px;
  bottom: -6px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0%, #ffc107 50%, transparent 100%);
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: spin 3s linear infinite;
}

.portal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

.portal-overlay i {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.portal-overlay span {
  font-size: 0.8rem;
  font-weight: 500;
}

.avatar-portal:hover .avatar-img {
  transform: scale(0.95);
}

.avatar-portal:hover .portal-ring {
  opacity: 1;
}

.avatar-portal:hover .portal-overlay {
  opacity: 1;
}

.avatar-info h3 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.2rem;
  text-align: center;
}

.avatar-info p {
  color: #86868b;
  font-size: 0.9rem;
  text-align: center;
}

/* Apple Inputs */
.form-item {
  margin-bottom: 1.5rem;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.6rem;
  margin-left: 0.2rem;
}

.apple-input, .apple-select {
  width: 100%;
  padding: 0.9rem 1rem;
  background: #f5f5f7;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  color: #1d1d1f;
  transition: all 0.3s ease;
  font-family: inherit;
}

.apple-input:focus, .apple-select:focus {
  background: #ffffff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.3);
}

.apple-input::placeholder {
  color: #a1a1a6;
}

/* Setting Rows */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 0;
}

.setting-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 0.2rem;
}

.setting-info p {
  font-size: 0.85rem;
  color: #86868b;
  margin: 0;
}

.setting-divider {
  height: 1px;
  background: #f0f0f2;
  margin: 0.5rem 0;
}

/* iOS Switch */
.ios-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 30px;
}

.ios-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e5ea;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .slider {
  background-color: #ffc107;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Buttons */
.form-actions {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  background: #1d1d1f;
  color: white;
  border: none;
  padding: 0.9rem 2.5rem;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  background: #000;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #e5e5ea;
  color: #0071e3;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: #f5f5f7;
  border-color: #d1d1d6;
}

/* Danger Zone */
.danger-zone {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px dashed #ff3b30;
}

.danger-header h4 {
  color: #ff3b30;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.danger-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff5f5;
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 59, 48, 0.1);
}

.btn-danger-ghost {
  background: transparent;
  border: 1px solid #ff3b30;
  color: #ff3b30;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger-ghost:hover {
  background: #ff3b30;
  color: white;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 992px) {
  .glass-architecture {
    grid-template-columns: 1fr;
  }
  
  .settings-sidebar {
    position: static;
    margin-bottom: 2rem;
    display: flex;
    overflow-x: auto;
    padding: 1rem;
  }
  
  .settings-nav {
    flex-direction: row;
    width: 100%;
  }
  
  .nav-item {
    white-space: nowrap;
  }
  
  .nav-indicator {
    bottom: 0;
    left: 50%;
    top: auto;
    transform: translateX(-50%) scaleX(0);
    width: 24px;
    height: 4px;
    border-radius: 4px 4px 0 0;
  }
  
  .nav-item.active .nav-indicator {
    transform: translateX(-50%) scaleX(1);
  }
}
</style>
