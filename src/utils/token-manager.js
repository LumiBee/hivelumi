/**
 * src/utils/token-manager.js
 * Token 管理工具
 */
const TOKEN_KEY = 'jwt_token';

// ---  核心存储方法 ---
export function getToken() {
  // 优先从 localStorage 获取 (记住我)
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // 如果没有，尝试从 sessionStorage 获取 (临时会话)
    token = sessionStorage.getItem(TOKEN_KEY);
  }
  return token;
}

export function setToken(token, remember = true) {
  if (!token) return;

  if (remember) {
    // 记住我：存入 localStorage
    localStorage.setItem(TOKEN_KEY, token);
    // 清除 sessionStorage 中的副本，避免混淆
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    // 不记住：存入 sessionStorage
    sessionStorage.setItem(TOKEN_KEY, token);
    // 清除 localStorage 中的副本
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// --- 原有的过期检查方法 ---
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

// --- 关键：默认导出对象 ---
export default {
  getToken,
  setToken,
  removeToken,
  getTokenExpiry
};