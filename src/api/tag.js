import request from './config'

/**
 * 标签相关API
 */
export const tagAPI = {
  /**
   * 获取所有标签
   */
  getAllTags() {
    return request({
      url: '/tags',
      method: 'get'
    })
  },


  /**
   * 根据标签slug获取文章
   * @param {string} tagSlug - 标签slug
   * @param {number} page - 页码，默认1
   * @param {number} size - 每页大小，默认10
   */
  getArticlesByTagSlug(tagSlug, page = 1, size = 10) {
    return request({
      url: `/tags/${encodeURIComponent(tagSlug)}/articles`,
      method: 'get',
      params: { page, size }
    })
  },


}
