import request from './config'

// AI API模块
export const aiAPI = {
  // 生成文章摘要
  generateSummary: async (textContent, maxLength = 100) => {
    try {
      console.log('开始调用AI摘要接口，内容长度:', textContent.length)
      
      // 使用配置好的axios实例，而不是原生fetch
      const response = await request({
        url: '/ai/generate-summary-deepseek',
        method: 'post',
        data: {
          textContent,
          maxLength
        }
      })
      
      console.log('AI摘要接口响应数据:', response)
      
      // 检查响应格式
      if (response && response.summary) {
        return { summary: response.summary }
      } else {
        throw new Error('响应格式异常，缺少summary字段')
      }
    } catch (error) {
      console.error('AI生成摘要失败:', error)
      throw error
    }
  },

  // Java指导同步对话
  javaGuiderSync: async (message, conversationId) => {
    try {
      const response = await request({
        url: '/ai/java_guider/chat/sync',
        method: 'get',
        params: {
          message,
          conversationId
        }
      })
      return response
    } catch (error) {
      console.error('Java指导同步对话失败:', error)
      throw error
    }
  },

  // Java指导异步对话
  javaGuiderAsync: async (message, conversationId) => {
    try {
      const response = await fetch(`/api/ai/java_guider/chat/async?message=${encodeURIComponent(message)}&conversationId=${conversationId}`)
      if (!response.ok) {
        throw new Error('API调用失败')
      }
      return response
    } catch (error) {
      console.error('Java指导异步对话失败:', error)
      throw error
    }
  },

  // Java指导SSE对话
  javaGuiderSSE: async (message, conversationId) => {
    try {
      // 使用统一的API基础URL配置
      const baseURL = request.defaults.baseURL
      const url = `${baseURL}/ai/java_guider/chat/sse/emitter?message=${encodeURIComponent(message)}&conversationId=${conversationId}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`)
      }
      return response
    } catch (error) {
      console.error('Java指导SSE对话失败:', error)
      throw error
    }
  },

  // Manus对话
  manusChat: async (message) => {
    try {
      // 使用统一的API基础URL配置
      const baseURL = request.defaults.baseURL
      const url = `${baseURL}/ai/manus/chat?message=${encodeURIComponent(message)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`)
      }
      return response
    } catch (error) {
      console.error('Manus对话失败:', error)
      throw error
    }
  }
}
