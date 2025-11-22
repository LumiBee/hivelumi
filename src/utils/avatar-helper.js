/**
 * 头像URL处理工具函数
 */

/**
 * 获取头像URL，添加时间戳避免缓存
 * @param {string} avatarUrl - 原始头像URL
 * @returns {string} 处理后的头像URL
 */
// import logo from '@/assets/img/logo.webp'; // No longer used
const defaultAvatar = '/img/default.jpg';

export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || avatarUrl.includes('default')) {
    return defaultAvatar;
  }
  // For other valid URLs, append a timestamp to prevent caching
  const timestamp = new Date().getTime();
  const separator = avatarUrl.includes('?') ? '&' : '?';
  return `${avatarUrl}${separator}t=${timestamp}`;
};

/**
 * 获取作者头像URL
 * @param {string} avatarUrl - 原始头像URL
 * @returns {string} 处理后的头像URL
 */
export const getAuthorAvatarUrl = (avatarUrl) => {
  // Debug log to see what's coming in
  if (!avatarUrl) console.warn('getAuthorAvatarUrl received empty url');

  if (!avatarUrl || avatarUrl.includes('default')) {
    return defaultAvatar;
  }

  // Process backend-specific URLs
  if (avatarUrl.includes('localhost:8090')) {
    avatarUrl = avatarUrl.replace('http://localhost:8090', '');
  }

  // Handle relative paths
  if (!avatarUrl.startsWith('/') && !avatarUrl.startsWith('http')) {
    avatarUrl = '/' + avatarUrl;
  }

  // Add /api prefix for local uploads if missing
  if (avatarUrl.startsWith('/uploads/')) {
    avatarUrl = '/api' + avatarUrl;
  }

  // Append timestamp to prevent caching for non-default, non-OSS images
  if (!avatarUrl.startsWith('https://files.hivelumi.com/')) {
    const timestamp = new Date().getTime();
    const separator = avatarUrl.includes('?') ? '&' : '?';
    return `${avatarUrl}${separator}t=${timestamp}`;
  }

  return avatarUrl;
};
