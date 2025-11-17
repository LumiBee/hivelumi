<template>
    <div class="followers-list-wrapper">
      <div v-if="loading" class="text-center py-5 modern-loading">
        <div class="spinner-border text-warning" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
  
      <div v-else-if="followers.length === 0" class="text-center py-5 text-muted empty-state">
        <div class="empty-icon mb-3">
          <i class="fas fa-users-slash fa-3x"></i>
        </div>
        <p>还没有粉丝哦~</p>
      </div>
  
      <div v-else class="row g-3">
        <div class="col-md-6" v-for="fan in followers" :key="fan.id">
          <div class="follower-card d-flex align-items-center p-3 h-100">
            <img 
              :src="fan.avatarUrl || '/img/default01.jpg'" 
              class="rounded-circle me-3 border"
              width="50" 
              height="50" 
              alt="Avatar"
              style="object-fit: cover;"
            >
            <div class="flex-grow-1 overflow-hidden">
              <h6 class="mb-0 text-truncate">
                <router-link :to="`/profile/${fan.name}`" class="text-decoration-none text-dark fw-bold stretched-link">
                  {{ fan.name }}
                </router-link>
              </h6>
              <small class="text-muted text-truncate d-block" style="font-size: 0.8rem;">
                ID: {{ fan.id }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { userAPI } from '@/api/user';
  
  const props = defineProps({
    username: {
      type: String,
      required: true
    }
  });
  
  const loading = ref(false);
  const followers = ref([]);
  
  const fetchFollowers = async () => {
    if (!props.username) return;
    
    loading.value = true;
    try {
      const response = await userAPI.getFollowers(props.username, 1, 100);
      
      // 调试日志：您可以在控制台看到实际返回
      console.log('粉丝API响应:', response);
  
      // 修正点3：正确提取数据
      // Axios 默认将服务器返回的 JSON 放在 response.data 中
      // 您的 JSON 结构是 { followers: [...], ... }
      const responseData = response.data || response;
      
      // 安全获取 followers 数组
      followers.value = responseData.followers || [];
      
      console.log('已解析粉丝列表:', followers.value);
  
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
      followers.value = [];
    } finally {
      loading.value = false;
    }
  };
  
  // 监听用户名变化（处理路由切换）
  watch(() => props.username, (newVal) => {
    if (newVal) fetchFollowers();
  });
  
  onMounted(() => {
    fetchFollowers();
  });
  </script>
  
  <style scoped>
  .follower-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.05);
    transition: all 0.2s ease;
    position: relative; /* 让 stretched-link 生效 */
  }
  
  .follower-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: rgba(246, 213, 92, 0.3);
  }
  
  .empty-state .empty-icon {
    color: #dee2e6;
  }
  </style>