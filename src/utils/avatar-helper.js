/**
 * 头像URL处理工具函数
 */

/**
 * 获取头像URL，添加时间戳避免缓存
 * @param {string} avatarUrl - 原始头像URL
 * @returns {string} 处理后的头像URL
 */
import logo from '@/assets/img/logo.webp';

export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || avatarUrl.includes('default')) {
    return logo;
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
  if (!avatarUrl || avatarUrl.includes('default')) {
    return logo;
  }
  
  // Process backend-specific URLs
  if (avatarUrl.startsWith('http://localhost:8090/')) {
    avatarUrl = avatarUrl.replace('http://localhost:8090', '');
  }
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
