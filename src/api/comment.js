import request from './config'

/**
 * 评论相关API
 */
export const commentAPI = {
  /**
   * 获取文章评论列表
   * @param {number} articleId - 文章ID
   */
  getCommentsByArticleId(articleId) {
    return request({
      url: `/comments/article/${articleId}`,
      method: 'get'
    })
  },

  /**
   * 添加评论
   * @param {number} articleId - 文章ID
   * @param {string} content - 评论内容
   * @param {number|null} parentId - 父评论ID（可选，用于回复）
   */
  addComment(articleId, content, parentId = null) {
    // 构建查询参数，只有当parentId不为null时才添加
    const params = new URLSearchParams()
    params.append('articleId', articleId.toString())
    params.append('content', content)
    
    // 只有当parentId不为null时才添加到参数中
    if (parentId != null && parentId !== undefined) {
      params.append('parentId', parentId.toString())
    }
    
    return request({
      url: '/comments/add',
      method: 'post',
      data: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  /**
   * 删除评论
   * @param {number} commentId - 评论ID
   */
  deleteComment(commentId) {
    return request({
      url: `/comments/${commentId}`,
      method: 'delete'
    })
  }
}

