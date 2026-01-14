/**
 * 图片URL处理工具函数
 * 统一处理头像、背景图片等各种图片URL
 */

const defaultAvatar = '/img/default.jpg';

/**
 * 处理图片URL，支持相对路径和绝对路径
 * @param {string} url - 原始图片URL
 * @param {boolean} addTimestamp - 是否添加时间戳防止缓存，默认false（避免图片闪烁）
 * @returns {string} 处理后的图片URL
 */
export const processImageUrl = (url, addTimestamp = false) => {
  if (!url) return url;

  let processedUrl = url;

  // 处理后端URL
  if (processedUrl.includes('localhost:8090')) {
    processedUrl = processedUrl.replace('http://localhost:8090', '');
  }

  // 处理相对路径（如 "avatars/xxx.jpg" 或 "backgrounds/xxx.jpg"）
  if (!processedUrl.startsWith('/') && !processedUrl.startsWith('http')) {
    // 如果是相对路径，添加 /api/uploads/ 前缀
    processedUrl = '/api/uploads/' + processedUrl;
  }
  // 为本地上传的图片添加 /api 前缀（如果路径是 /uploads/ 开头但没有 /api）
  else if (processedUrl.startsWith('/uploads/') && !processedUrl.startsWith('/api/')) {
    processedUrl = '/api' + processedUrl;
  }

  // 只在明确要求时才添加时间戳（避免图片闪烁）
  if (addTimestamp && !processedUrl.startsWith('https://files.hivelumi.com/') && !processedUrl.startsWith('https://avatars.githubusercontent.com/')) {
    const timestamp = new Date().getTime();
    const separator = processedUrl.includes('?') ? '&' : '?';
    return `${processedUrl}${separator}t=${timestamp}`;
  }

  return processedUrl;
};

/**
 * 获取头像URL
 * @param {string} avatarUrl - 原始头像URL
 * @returns {string} 处理后的头像URL
 */
export const getAvatarUrl = (avatarUrl) => {
  // 如果为空或者是默认头像路径，返回默认头像
  if (!avatarUrl || avatarUrl === defaultAvatar || avatarUrl === '/img/default.jpg' || avatarUrl === '/img/default01.jpg') {
    return defaultAvatar;
  }

  return processImageUrl(avatarUrl, false);
};

/**
 * 获取作者头像URL
 * @param {string} avatarUrl - 原始头像URL
 * @returns {string} 处理后的头像URL
 */
export const getAuthorAvatarUrl = (avatarUrl) => {
  // 如果为空或者是默认头像路径，返回默认头像
  if (!avatarUrl || avatarUrl === defaultAvatar || avatarUrl === '/img/default.jpg' || avatarUrl === '/img/default01.jpg') {
    return defaultAvatar;
  }

  return processImageUrl(avatarUrl, false);
};

/**
 * 获取背景图片URL
 * @param {string} backgroundUrl - 原始背景图片URL
 * @returns {string} 处理后的背景图片URL
 */
export const getBackgroundUrl = (backgroundUrl) => {
  if (!backgroundUrl) return backgroundUrl;

  return processImageUrl(backgroundUrl, false);
};
