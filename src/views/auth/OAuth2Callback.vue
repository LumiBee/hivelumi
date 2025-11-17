<template>
    <div class="callback-container">
      <p>正在登录，请稍候...</p>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '@/store/auth'; 
  import tokenManager from '@/utils/token-manager'; 
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  
  onMounted(async () => {
    const token = route.query.token;
  
    if (token) {
      try {
        // 1. 保存 Token
        tokenManager.setToken(token);
        
        // 2. 【修改点】直接解析 JWT 负载，填充用户状态
        const parts = token.split('.');
        if (parts.length === 3) {
          // JWT 的 Payload 是 Base64Url 编码，需要替换字符后解码
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          // 处理中文乱码问题
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
  
          const payload = JSON.parse(jsonPayload);
          
          // 构造用户对象（字段名需与后端 JWT claim 保持一致）
          // 后端 JwtUtil.java 中写入的是: userId, username
          const user = {
            id: payload.userId || payload.sub, // 兼容标准 sub 字段
            name: payload.username,
            avatarUrl: payload.avatarUrl || '', // 如果 token 里没带头像，暂时留空
            token: token
          };
  
          console.log('OAuth登录解析成功:', user);
          
          // 更新 Pinia 状态
          authStore.setUser(user);
        } else {
          throw new Error('Invalid Token Format');
        }
  
        // 3. 使用 replace 跳转，防止用户点击“后退”回到这个带 token 的 URL
        router.replace('/profile');
  
      } catch (err) {
        console.error('OAuth 登录处理失败:', err);
        tokenManager.removeToken();
        authStore.setUser(null);
        router.replace('/login'); 
      }
    } else {
      // 没有 token，非法访问
      router.replace('/login');
    }
  });
  </script>
  
  <style scoped>
  .callback-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80vh;
    font-size: 1.2rem;
    color: #666;
  }
  </style>