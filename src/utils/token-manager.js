/**
 * src/utils/token-manager.js
 * Token 管理工具
 */
const TOKEN_KEY = 'jwt_token';

// --- 1. 核心存储方法 (你目前缺少的) ---
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// --- 2. 你原有的过期检查方法 (保留) ---
export function getTokenExpiry(token) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp) {
      return payload.exp * 1000
    }
    return null
  } catch (error) {
    console.error('解析 JWT token 失败:', error)
    return null
  }
}

// --- 3. 关键：默认导出对象 ---
export default {
  getToken,
  setToken,
  removeToken,
  getTokenExpiry
};