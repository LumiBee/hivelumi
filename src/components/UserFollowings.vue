<template>
  <div class="following-list-wrapper">
    <div v-if="loading && list.length === 0" class="text-center py-5 modern-loading">
      <div class="spinner-border text-warning" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="list.length === 0" class="text-center py-5 text-muted empty-state">
      <div class="empty-icon mb-3">
        <i class="fas fa-user-plus fa-3x"></i>
      </div>
      <p>还没有关注任何人哦~</p>
    </div>

    <div v-else>
      <div class="row g-3">
        <div class="col-md-6" v-for="user in list" :key="user.id">
          <div class="user-card d-flex align-items-center p-3 h-100">
            <img 
              :src="user.avatarUrl || '/img/default01.jpg'" 
              class="rounded-circle me-3 border"
              width="50" 
              height="50" 
              alt="Avatar"
              style="object-fit: cover;"
            >
            <div class="flex-grow-1 overflow-hidden">
              <h6 class="mb-0 text-truncate">
                <router-link :to="`/profile/${user.name}`" class="text-decoration-none text-dark fw-bold stretched-link">
                  {{ user.name }}
                </router-link>
              </h6>
              <small class="text-muted text-truncate d-block" style="font-size: 0.8rem;">
                Bio: {{ user.bio }}
              </small>
            </div>
            </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-container modern-pagination mt-4 pt-2">
        <button 
          @click="loadPreviousPage" 
          :disabled="currentPage <= 1"
          class="pagination-btn"
        >
          <i class="fas fa-chevron-left"></i> 上一页
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            class="page-number-btn"
            :class="{ active: page === currentPage, disabled: page === '...' }"
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="loadNextPage" 
          :disabled="currentPage >= totalPages"
          class="pagination-btn"
        >
          下一页 <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { userAPI } from '@/api/user';

const props = defineProps({
  username: {
    type: String,
    required: true
  }
});

const loading = ref(false);
const list = ref([]);
const currentPage = ref(1);
const pageSize = ref(6);
const totalPages = ref(0);

// 计算可见页码 (复用通用逻辑)
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 1) return [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  return pages;
});

const fetchFollowings = async () => {
  if (!props.username) return;
  
  loading.value = true;
  try {
    const response = await userAPI.getFollowings(props.username, currentPage.value, pageSize.value);
    
    // 打印日志调试
    console.log('关注列表响应:', response);
    
    const responseData = response.data || response;
    
    // 【关键】后端返回的 key 是 "followings" (参考您的 ProfileController)
    list.value = responseData.followings || [];
    
    // 处理分页信息
    if (responseData.pages) {
      totalPages.value = Number(responseData.pages);
    } else {
      const total = Number(responseData.total) || 0;
      totalPages.value = Math.ceil(total / pageSize.value) || 1;
    }

    if (window.scrollY > 200) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
  } catch (error) {
    console.error('获取关注列表失败:', error);
    list.value = [];
  } finally {
    loading.value = false;
  }
};

// --- 翻页方法 ---
const loadPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchFollowings();
  }
};

const loadNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchFollowings();
  }
};

const goToPage = (page) => {
  if (page !== '...' && page !== currentPage.value) {
    currentPage.value = page;
    fetchFollowings();
  }
};

watch(() => props.username, (newVal) => {
  if (newVal) {
    currentPage.value = 1;
    fetchFollowings();
  }
});

onMounted(() => {
  fetchFollowings();
});
</script>

<style scoped>
.user-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  position: relative;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-color: rgba(246, 213, 92, 0.3);
}

.empty-state .empty-icon {
  color: #dee2e6;
}

/* ===== 样式复用 (Pagination) ===== */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.modern-pagination .pagination-btn {
  padding: 8px 20px;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  background-color: white;
  color: #495057;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  margin: 0 5px;
  font-size: 0.9rem;
  cursor: pointer;
}

.modern-pagination .pagination-btn:hover:not(:disabled) {
  background-color: #f6d55c;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(246, 213, 92, 0.3);
}

.modern-pagination .pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8f9fa;
  color: #adb5bd;
  box-shadow: none;
}

.page-numbers {
  display: flex;
  gap: 5px;
  margin: 0 10px;
}

.page-number-btn {
  padding: 0;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  background-color: white;
  color: #495057;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
}

.page-number-btn:hover:not(:disabled) {
  background-color: #f6d55c;
  color: white;
  transform: translateY(-1px);
}

.page-number-btn.active {
  background-color: #f6d55c;
  color: white;
  box-shadow: 0 4px 12px rgba(246, 213, 92, 0.4);
}

.page-number-btn.disabled {
  opacity: 0.5;
  cursor: default;
  background-color: transparent;
  box-shadow: none;
  color: #6c757d;
}

@media (max-width: 576px) {
  .pagination-container {
    flex-wrap: wrap;
    gap: 10px;
  }
  .page-numbers {
    order: 2;
    width: 100%;
    justify-content: center;
    margin: 10px 0;
  }
}
</style>