/**
 * Token 管理工具
 * 处理 JWT token 的过期检测和自动清理
 */

/**
 * 解析 JWT token 获取过期时间
 * @param {string} token - JWT token
 * @returns {number|null} 过期时间戳，如果解析失败返回 null
 */
export function getTokenExpiry(token) {
  if (!token) return null
  
  try {
    // JWT token 由三部分组成：header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // 解码 payload 部分
    const payload = JSON.parse(atob(parts[1]))
    
    // 检查是否有 exp 字段（过期时间）
    if (payload.exp) {
      // exp 是 Unix 时间戳（秒），转换为毫秒
      return payload.exp * 1000
    }
    
    return null
  } catch (error) {
    console.error('解析 JWT token 失败:', error)
    return null
  }
}

/**
 * 检查 token 是否即将过期（5分钟内）
 * @param {string} token - JWT token
 * @returns {boolean} 是否即将过期
 */
export function isTokenExpiringSoon(token) {
  const expiry = getTokenExpiry(token)
  if (!expiry) return false
  
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000 // 5分钟
  
  return (expiry - now) < fiveMinutes
}

/**
 * 检查 token 是否已过期
 * @param {string} token - JWT token
 * @returns {boolean} 是否已过期
 */
export function isTokenExpired(token) {
  const expiry = getTokenExpiry(token)
  if (!expiry) return true
  
  return Date.now() >= expiry
}

/**
 * 获取 token 剩余有效时间（分钟）
 * @param {string} token - JWT token
 * @returns {number} 剩余分钟数，如果已过期返回 0
 */
export function getTokenRemainingMinutes(token) {
  const expiry = getTokenExpiry(token)
  if (!expiry) return 0
  
  const now = Date.now()
  const remaining = expiry - now
  
  if (remaining <= 0) return 0
  
  return Math.floor(remaining / (1000 * 60)) // 转换为分钟
}

/**
 * 自动检查并处理 token 过期
 * @param {Object} authStore - Pinia auth store 实例
 * @returns {boolean} 是否需要重新登录
 */
export function checkAndHandleTokenExpiry(authStore) {
  if (!authStore.isAuthenticated || !authStore.user?.token) {
    return false
  }
  
  const token = authStore.user.token
  
  if (isTokenExpired(token)) {
    console.warn('Token 已过期，清除用户状态')
    
    // 显示过期提示
    if (window.$toast) {
      window.$toast.warning('登录已过期，请重新登录')
    }
    
    // 清除用户状态
    authStore.setUser(null)
    return true
  }
  
  if (isTokenExpiringSoon(token)) {
    const remainingMinutes = getTokenRemainingMinutes(token)
    console.warn(`Token 将在 ${remainingMinutes} 分钟后过期`)
    
    // 可以在这里添加提前警告逻辑
    if (window.$toast && remainingMinutes <= 2) {
      window.$toast.info(`登录将在 ${remainingMinutes} 分钟后过期，请及时保存工作`)
    }
  }
  
  return false
}

/**
 * 定期检查 token 状态
 * @param {Object} authStore - Pinia auth store 实例
 * @param {number} intervalMinutes - 检查间隔（分钟），默认 5 分钟
 * @returns {Function} 停止检查的函数
 */
export function startTokenMonitoring(authStore, intervalMinutes = 5) {
  const interval = setInterval(() => {
    checkAndHandleTokenExpiry(authStore)
  }, intervalMinutes * 60 * 1000)
  
  // 返回停止函数
  return () => {
    clearInterval(interval)
  }
}
