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
      // 调用之前定义的 API
      const response = await userAPI.getFollowers(props.username, 1, 100); // 获取前100个，暂不分页
      followers.value = response.data.followers || [];
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
    } finally {
      loading.value = false;
    }
  };
  
  // 监听用户名变化，如果是在不同用户主页间切换
  watch(() => props.username, () => {
    fetchFollowers();
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