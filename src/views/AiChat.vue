<template>
  <div class="ai-chat-page">
    <!-- 聊天容器 -->
    <div class="ai-chat-container" :class="{ 'fullscreen': isFullscreen }">
      <div class="container-fluid">
        <div class="chat-wrapper">
          <!-- 侧边栏 - AI助手选择 -->
          <div class="chat-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
            <div class="sidebar-header">
              <h5>AI助手类型</h5>
              <button 
                @click="toggleSidebar" 
                class="btn btn-sm btn-outline-secondary"
              >
                <i class="fas" :class="sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
              </button>
            </div>
            
            <div class="ai-assistants">
              <div 
                v-for="assistant in aiAssistants" 
                :key="assistant.id"
                class="assistant-card"
                :class="{ 'active': selectedAssistant === assistant.id }"
                @click="selectAssistant(assistant.id)"
              >
                <div class="assistant-icon">
                  <i :class="assistant.icon"></i>
                </div>
                <div class="assistant-info">
                  <h6>{{ assistant.name }}</h6>
                  <p>{{ assistant.description }}</p>
                </div>
                <div class="assistant-status" :class="assistant.status">
                  <i class="fas fa-circle"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 主聊天区域 -->
          <div class="chat-main">
            <!-- 聊天消息列表 -->
            <div class="chat-messages" ref="messagesContainer">
              <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-content">
                  <i :class="getCurrentAssistant().icon" class="welcome-icon"></i>
                  <h3>欢迎使用{{ getCurrentAssistant().name }}</h3>
                  <p>{{ getCurrentAssistant().description }}，开始对话吧！</p>
                  <div class="quick-actions">
                    <button 
                      v-for="action in quickActions" 
                      :key="action.text"
                      @click="sendQuickMessage(action.text)"
                      class="btn btn-outline-primary btn-sm"
                    >
                      <i :class="action.icon" class="me-1"></i>
                      {{ action.text }}
                    </button>
                  </div>
                </div>
              </div>

              <div 
                v-for="(message, index) in messages" 
                :key="index"
                class="message-item"
                :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }"
              >
                <div class="message-avatar">
                  <i v-if="message.role === 'user'" class="fas fa-user"></i>
                  <i v-else :class="getCurrentAssistant().icon"></i>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">
                      {{ message.role === 'user' ? '您' : getCurrentAssistant().name }}
                    </span>
                    <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div class="message-text" v-html="formatMessage(message.content)" :class="{ 'typing-effect': message.isTyping }"></div>
                  <div v-if="message.isTyping" class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="chat-input-area">
              <div class="input-wrapper">
                <div class="input-container">
                  <textarea
                    v-model="inputMessage"
                    @keydown="handleKeyDown"
                    @input="handleInput"
                    :placeholder="getCurrentAssistant().type === 'java' ? '输入您的Java相关问题...' : '输入您的问题...'"
                    class="message-input"
                    :disabled="isLoading"
                    rows="1"
                    ref="messageInput"
                  ></textarea>
                  <div class="input-actions">
                    <button 
                      @click="sendMessage" 
                      class="btn btn-warning send-btn"
                      :disabled="!inputMessage.trim() || isLoading"
                    >
                      <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
                <div class="input-footer">
                  <div class="input-tips">
                    <i class="fas fa-lightbulb me-1"></i>
                    按 Enter 发送，Shift + Enter 换行
                  </div>
                  <div class="input-status">
                    <span v-if="isLoading" class="text-warning">
                      <i class="fas fa-spinner fa-spin me-1"></i>
                      AI正在思考中...
                    </span>
                    <span v-else-if="selectedAssistant" class="text-success">
                      <i class="fas fa-circle me-1"></i>
                      {{ getCurrentAssistant().name }} 在线
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { aiAPI } from '@/api'
import { marked } from 'marked'

// 获取API基础URL
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api'
}

// 配置marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true, // 支持GitHub风格的Markdown
  tables: true, // 支持表格
  sanitize: false // 允许HTML标签
})

const authStore = useAuthStore()
const router = useRouter()

// 响应式数据
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const isFullscreen = ref(false)
const sidebarCollapsed = ref(false)
const selectedAssistant = ref('ai-assistant')
const messagesContainer = ref(null)
const messageInput = ref(null)

// AI助手配置
const aiAssistants = ref([
  {
    id: 'ai-assistant',
    name: 'AI智能助手',
    description: '通用AI助手，回答各种问题',
    icon: 'fas fa-robot',
    status: 'online',
    endpoint: '/ai/manus/chat',
    type: 'general'
  },
  {
    id: 'java-guider',
    name: 'Java学习指导',
    description: '专业的Java开发学习指导',
    icon: 'fas fa-code',
    status: 'online',
    endpoint: '/ai/java_guider/chat/sse/emitter',
    type: 'java'
  }
])

// 快速操作 - 根据选择的助手类型动态显示
const quickActions = computed(() => {
  const currentAssistant = getCurrentAssistant()
  if (currentAssistant.type === 'java') {
    return [
      { text: '如何学习Java？', icon: 'fas fa-book' },
      { text: 'Spring Boot最佳实践', icon: 'fas fa-leaf' },
      { text: '解释这段代码', icon: 'fas fa-code' },
      { text: '代码优化建议', icon: 'fas fa-tools' },
      { text: '面向对象概念', icon: 'fas fa-cube' },
      { text: '异常处理', icon: 'fas fa-exclamation-triangle' }
    ]
  } else {
    return [
      { text: '你好，请介绍一下自己', icon: 'fas fa-hand-wave' },
      { text: '帮我写一篇文章', icon: 'fas fa-edit' },
      { text: '解释一个概念', icon: 'fas fa-lightbulb' },
      { text: '翻译这段文字', icon: 'fas fa-language' },
      { text: '总结要点', icon: 'fas fa-list' },
      { text: '代码审查', icon: 'fas fa-search' }
    ]
  }
})

// 计算属性
const getCurrentAssistant = () => {
  return aiAssistants.value.find(a => a.id === selectedAssistant.value) || aiAssistants.value[0]
}

// 方法
const selectAssistant = (assistantId) => {
  selectedAssistant.value = assistantId
  // 清空当前对话
  messages.value = []
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const clearChat = () => {
  if (confirm('确定要清空所有对话吗？')) {
    messages.value = []
    inputMessage.value = ''
  }
}

const sendQuickMessage = (text) => {
  inputMessage.value = text
  sendMessage()
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleInput = () => {
  // 自动调整输入框高度
  const textarea = messageInput.value
  if (textarea) {
    textarea.style.height = 'auto'
    // 减少额外的高度，避免空行
    const newHeight = Math.min(textarea.scrollHeight, 120)
    textarea.style.height = newHeight + 'px'
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const currentInput = inputMessage.value
  inputMessage.value = ''

  // 添加AI思考中的消息
  const thinkingMessage = {
    role: 'assistant',
    content: '',
    isTyping: true,
    timestamp: new Date()
  }
  messages.value.push(thinkingMessage)

  await scrollToBottom()

  try {
    isLoading.value = true
    
    // 根据选择的助手调用不同的API
    const assistant = getCurrentAssistant()
    await callAiAPI(assistant, currentInput)
    
  } catch (error) {
    console.error('AI对话失败:', error)
    // 移除思考中的消息，添加错误消息
    messages.value.pop()
    messages.value.push({
      role: 'assistant',
      content: '抱歉，AI助手暂时无法响应，请稍后再试。',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const callAiAPI = async (assistant, message) => {
  const conversationId = `conv_${Date.now()}`
  
  try {
    if (assistant.type === 'java') {
      await callJavaGuiderAPI(message, conversationId)
    } else if (assistant.type === 'general') {
      await callManusAPI(message)
    }
  } catch (error) {
    throw error
  }
}

const callJavaGuiderAPI = async (message, conversationId) => {
  try {
    // 使用SSE流式接口，实现真正的实时打字机效果
    const url = `${getApiBaseUrl()}/ai/java_guider/chat/sse/emitter?message=${encodeURIComponent(message)}&conversationId=${conversationId}`
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 移除思考中的消息
    messages.value.pop()

    // 添加AI响应消息
    const aiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }
    messages.value.push(aiMessage)

    // 处理SSE流
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulatedData = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      // 解码数据块
      const chunk = decoder.decode(value, { stream: true })
      accumulatedData += chunk
      
      // 按行分割数据
      const lines = accumulatedData.split('\n')
      accumulatedData = lines.pop() || '' // 保留最后一个不完整的行
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim()
          if (data && data !== '[DONE]') {
            // 按词添加，保持Markdown语法完整
            const words = data.split(/(\s+)/) // 按空格分割，保留空格
            for (const word of words) {
              aiMessage.content += word
              
              // 强制触发响应式更新
              await nextTick()
              
              // 直接操作DOM元素来确保更新
              const messageElements = document.querySelectorAll('.message-text')
              const lastMessage = messageElements[messageElements.length - 1]
              if (lastMessage) {
                lastMessage.innerHTML = formatMessage(aiMessage.content)
                
                // 强制设置标题字体大小 - 使用最高优先级
                const h1Elements = lastMessage.querySelectorAll('h1')
                const h2Elements = lastMessage.querySelectorAll('h2')
                const h3Elements = lastMessage.querySelectorAll('h3')
                
                h1Elements.forEach(h1 => {
                  h1.style.setProperty('font-size', '1rem', 'important')
                  h1.style.setProperty('margin', '0.3rem 0', 'important')
                  h1.style.setProperty('font-weight', 'bold', 'important')
                  h1.style.setProperty('line-height', '1.3', 'important')
                  h1.style.setProperty('color', '#2c3e50', 'important')
                })
                
                h2Elements.forEach(h2 => {
                  h2.style.setProperty('font-size', '0.95rem', 'important')
                  h2.style.setProperty('margin', '0.3rem 0', 'important')
                  h2.style.setProperty('font-weight', 'bold', 'important')
                  h2.style.setProperty('line-height', '1.3', 'important')
                  h2.style.setProperty('color', '#34495e', 'important')
                })
                
                h3Elements.forEach(h3 => {
                  h3.style.setProperty('font-size', '0.9rem', 'important')
                  h3.style.setProperty('margin', '0.3rem 0', 'important')
                  h3.style.setProperty('font-weight', 'bold', 'important')
                  h3.style.setProperty('line-height', '1.3', 'important')
                  h3.style.setProperty('color', '#7f8c8d', 'important')
                })
                
                // 移除打字机过程中的样式应用，避免冲突
              }
              
              await scrollToBottom()
              await new Promise(resolve => setTimeout(resolve, 20)) // 20ms延迟，适中的打字机速度
            }
          }
        }
      }
    }
    
    // 打字完成，移除typing状态
    aiMessage.isTyping = false
    
    // 打字机效果完成后，强制应用样式防止字体变大
    setTimeout(() => {
      forceApplyTitleStyles()
    }, 100)
  } catch (error) {
    console.error('Java指导API调用失败:', error)
    // 移除思考中的消息
    messages.value.pop()
    
    // 添加错误消息
    const errorMessage = {
      role: 'assistant',
      content: '抱歉，AI助手暂时无法响应，请稍后再试。',
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
  }
}

const callManusAPI = async (message) => {
  const response = await aiAPI.manusChat(message)
  
  if (!response.ok) {
    throw new Error('API调用失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let aiResponse = ''
  let pendingText = ''
  let accumulatedData = ''

  // 移除思考中的消息
  messages.value.pop()

  // 添加AI响应消息
  const aiMessage = {
    role: 'assistant',
    content: '',
    timestamp: new Date()
  }
  messages.value.push(aiMessage)

  // 打字机效果函数
  const typeWriter = async (text) => {
    for (let i = 0; i < text.length; i++) {
      aiResponse += text[i]
      messages.value[messages.value.length - 1].content = aiResponse
      await scrollToBottom()
      await new Promise(resolve => setTimeout(resolve, 2)) // 2ms延迟，超快速度
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      accumulatedData += chunk
      
      // 处理完整的行
      const lines = accumulatedData.split('\n')
      // 保留最后一个可能不完整的行
      accumulatedData = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5) // 移除 'data:' 前缀
          if (data && data !== '[DONE]') {
            // 处理工具执行结果，提取有用的内容
            const processedData = processManusResponse(data)
            if (processedData) {
              // 使用打字机效果显示文本
              await typeWriter(processedData)
            }
          }
        } else if (line.startsWith('message ')) {
          // 处理message格式的数据
          const data = line.slice(8) // 移除 'message ' 前缀
          const processedData = processManusResponse(data)
          if (processedData) {
            // 使用打字机效果显示文本
            await typeWriter(processedData)
          }
        }
      }
    }
    
    // 处理最后剩余的数据
    if (accumulatedData.trim()) {
      const lines = accumulatedData.split('\n')
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5)
          if (data && data !== '[DONE]') {
            const processedData = processManusResponse(data)
            if (processedData) {
              await typeWriter(processedData)
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// 处理Manus API的响应数据
const processManusResponse = (data) => {
  try {
    // 检查是否是工具执行结果
    if (data.includes('步骤') && data.includes('结果')) {
      // 提取工具执行结果中的有用内容 - 修复正则表达式匹配完整JSON
      const toolResultMatch = data.match(/步骤\s+\d+\s+结果:\s*工具\s+(\w+)\s+执行结果:\s*"(.+)"/)
      if (toolResultMatch) {
        const toolName = toolResultMatch[1]
        const result = toolResultMatch[2]
        
        // 根据工具类型格式化结果
        if (toolName === 'getDailyForecast') {
          // 格式化天气数据
          return formatWeatherResult(result)
        } else if (toolName === 'searchWeb') {
          // 格式化搜索结果
          return formatSearchResult(result)
        } else if (toolName === 'doTerminate') {
          // 任务结束，不显示
          return ''
        } else {
          // 其他工具结果
          return result + '\n\n'
        }
      }
      
      // 如果是思考完成，不显示
      if (data.includes('思考完成') && data.includes('不需要进一步行动')) {
        return ''
      }
      
      // 如果是任务结束，不显示
      if (data.includes('任务结束')) {
        return ''
      }
      
      // 尝试直接提取天气数据
      if (data.includes('Weather Forecast:')) {
        const weatherMatch = data.match(/Weather Forecast:([^"]+)/)
        if (weatherMatch) {
          return formatWeatherResult(weatherMatch[1])
        }
      }
      
      // 如果包含天气相关关键词，尝试直接提取
      if (data.includes('温度') || data.includes('天气') || data.includes('风力')) {
        // 尝试提取引号内的内容
        const contentMatch = data.match(/"([^"]+)"/)
        if (contentMatch) {
          return formatWeatherResult(contentMatch[1])
        }
      }
      
      // 如果包含搜索相关关键词，尝试直接提取
      if (data.includes('searchWeb') || data.includes('搜索结果') || data.includes('position') || data.includes('title')) {
        // 尝试提取引号内的内容，支持多行JSON
        const contentMatch = data.match(/"([^"]*(?:\\.[^"]*)*)"/)
        if (contentMatch) {
          return formatSearchResult(contentMatch[1])
        }
      }
      
      return ''
    }
    
    // 如果不是工具执行结果，直接返回
    return data
  } catch (error) {
    console.error('处理Manus响应失败:', error)
    return data
  }
}

// 格式化天气结果
const formatWeatherResult = (weatherData) => {
  try {
    // 将 \n 转换为实际换行符
    const processedData = weatherData.replace(/\\n/g, '\n')
    
    // 解析天气数据
    const lines = processedData.split('\n').filter(line => line.trim())
    let formatted = '## 天气预报\n\n'
    
    let currentDate = ''
    lines.forEach(line => {
      if (line.includes('日期:')) {
        currentDate = line.replace('日期:', '').trim()
        formatted += `### ${currentDate}\n`
      } else if (line.includes('温度:')) {
        const temp = line.replace('温度:', '').trim()
        formatted += `**温度**: ${temp}\n`
      } else if (line.includes('白天天气:')) {
        const dayWeather = line.replace('白天天气:', '').trim()
        formatted += `**白天**: ${dayWeather}\n`
      } else if (line.includes('夜晚天气:')) {
        const nightWeather = line.replace('夜晚天气:', '').trim()
        formatted += `**夜晚**: ${nightWeather}\n`
      } else if (line.includes('风力:')) {
        const wind = line.replace('风力:', '').trim()
        formatted += `**风力**: ${wind}\n`
      } else if (line.includes('紫外线:')) {
        const uv = line.replace('紫外线:', '').trim()
        formatted += `**紫外线**: ${uv}\n`
      }
    })
    
    return formatted + '\n'
  } catch (error) {
    console.error('格式化天气数据失败:', error)
    return weatherData
  }
}

// 格式化搜索结果
const formatSearchResult = (searchData) => {
  try {
  // 将 \n 转换为实际换行符
  const processedData = searchData.replace(/\\n/g, '\n')
    
    // 尝试解析JSON格式的搜索结果
    let searchResults = null
    
    try {
      // 首先尝试直接解析
      searchResults = JSON.parse(processedData)
    } catch (jsonError) {
      searchResults = null
    }
    
    // 如果直接解析失败，尝试分割多个对象
    if (!searchResults || !Array.isArray(searchResults)) {
      // 将多个用点号连接的对象分割成数组
      const objects = processedData.split('}.{')
      const results = []
      
      for (let i = 0; i < objects.length; i++) {
        let objStr = objects[i]
        if (i > 0) objStr = '{' + objStr
        if (i < objects.length - 1) objStr = objStr + '}'
        
        // 先尝试解析转义的JSON
        try {
          // 使用JSON.parse来解析转义的字符串
          const unescapedStr = JSON.parse('"' + objStr + '"')
          const obj = JSON.parse(unescapedStr)
          results.push(obj)
        } catch (e) {
          // 如果转义解析失败，尝试直接解析
          try {
            const obj = JSON.parse(objStr)
            results.push(obj)
          } catch (e2) {
          }
        }
      }
      
      searchResults = results
    }
    
    if (Array.isArray(searchResults) && searchResults.length > 0) {
      let formatted = '## 🔍 搜索结果\n\n'
      searchResults.forEach((result, index) => {
        formatted += `**${index + 1}. ${result.title || '无标题'}**\n\n`
        if (result.snippet) {
          // 截取snippet的前150个字符，避免过长
          const shortSnippet = result.snippet.length > 150 ? result.snippet.substring(0, 150) + '...' : result.snippet
          formatted += `📝 ${shortSnippet}\n\n`
        }
        if (result.link) {
          formatted += `🔗 [查看详情](${result.link}){target="_blank"}\n\n`
        }
        if (index < searchResults.length - 1) {
          formatted += '---\n\n'
        }
      })
      return formatted
    }
    
    // 如果上面的方法都失败，尝试其他方法
    if (processedData.includes('"title"') || processedData.includes('"position"')) {
      // 如果不是完整JSON格式，尝试提取部分信息
      if (processedData.includes('"title"') || processedData.includes('"position"')) {
        let formatted = '## 搜索结果\n\n'
        
        // 尝试提取多个搜索结果
        const results = []
        let position = 1
        
        // 使用更简单的正则表达式提取每个搜索结果
        const resultPattern = /"position":(\d+),"title":"([^"]+)","link":"([^"]+)","displayed_link":"([^"]+)","snippet":"([^"]*?)"/g
        let match
        
        while ((match = resultPattern.exec(processedData)) !== null) {
          results.push({
            position: parseInt(match[1]),
            title: match[2],
            link: match[3],
            displayedLink: match[4],
            snippet: match[5]
          });
        }
        
        // 如果上面的方法没有提取到结果，尝试更宽松的匹配
        if (results.length === 0) {
          const titlePattern = /"title":"([^"]+)"/g
          let titleMatch
          let position = 1
          
          while ((titleMatch = titlePattern.exec(processedData)) !== null) {
            results.push({
              position: position++,
              title: titleMatch[1],
              link: '',
              displayedLink: '',
              snippet: ''
            })
          }
        }
        
        
        if (results.length > 0) {
          results.forEach((result, index) => {
            formatted += `**${result.position}. ${result.title}**\n\n`
            if (result.snippet && result.snippet.trim()) {
              // 截取snippet的前150个字符，避免过长
              const shortSnippet = result.snippet.length > 150 ? result.snippet.substring(0, 150) + '...' : result.snippet
              formatted += `📝 ${shortSnippet}\n\n`
            }
            if (result.link) {
              formatted += `🔗 [查看详情](${result.link})\n\n`
            }
            if (index < results.length - 1) {
              formatted += '---\n\n'
            }
          })
        } else {
          // 如果上面的方法失败，尝试简单提取
          const titleMatches = processedData.match(/"title":"([^"]+)"/g)
          
          if (titleMatches && titleMatches.length > 0) {
            titleMatches.forEach((match, index) => {
              const title = match.match(/"title":"([^"]+)"/)[1]
              formatted += `**${index + 1}. ${title}**\n\n`
            })
          } else {
            // 最后的备用方案：直接显示原始数据
            formatted += `**搜索结果：**\n\n${processedData}\n\n`
          }
        }
        
        return formatted
      }
    }
    
    // 按普通文本处理
    const lines = processedData.split('\n').filter(line => line.trim())
    let formatted = '## 搜索结果\n\n'
    
    lines.forEach(line => {
      if (line.trim()) {
        formatted += `- ${line.trim()}\n`
      }
    })
    
    return formatted + '\n'
  } catch (error) {
    console.error('格式化搜索结果失败:', error)
    return searchData
  }
}

const formatMessage = (content) => {
  if (!content) return ''
  
  try {
    // 预处理：修复AI输出的Markdown格式问题
    let processedContent = content
      // 第一步：修复标题格式 - 在#后面添加空格
      .replace(/(#{1,6})([^#\s\n])/g, '$1 $2')
      // 第二步：确保标题前面有空行
      .replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2')
      // 第三步：使用字符串替换来处理标题后面有空行的问题
      .replace(/## 学习目标通过/g, '## 学习目标\n\n通过')
      .replace(/## 分阶段路径###/g, '## 分阶段路径\n\n###')
      .replace(/### 第一阶段:/g, '### 第一阶段:\n\n')
      .replace(/### 第二阶段:/g, '### 第二阶段:\n\n')
      .replace(/### 第三阶段:/g, '### 第三阶段:\n\n')
      .replace(/### 第四阶段:/g, '### 第四阶段:\n\n')
      .replace(/## 核心知识点1\./g, '## 核心知识点\n\n1.')
      .replace(/## 实践项目1\./g, '## 实践项目\n\n1.')
      .replace(/## 学习资源1\./g, '## 学习资源\n\n1.')
      .replace(/## 时间规划/g, '## 时间规划\n\n')
      .replace(/## 常见误区1\./g, '## 常见误区\n\n1.')
      .replace(/## 进阶方向1\./g, '## 进阶方向\n\n1.')
      // 第四步：处理数字列表自动分段
      .replace(/(\d+\.\s[^1-9\n]+?)(\d+\.\s)/g, '$1\n\n$2')
      .replace(/(\d+\.\s[^1-9\n]+?)(\d+\.\s)/g, '$1\n\n$2') // 再次处理，确保所有数字列表都被分开
      // 第五步：移除多余的空行
      .replace(/\n{3,}/g, '\n\n')
      // 第六步：确保内容不以代码块开始
      .replace(/^```/gm, '')
      .replace(/```$/gm, '')
    
    const result = marked(processedContent)
    
    // 如果解析失败，尝试更简单的处理
    if (!result.includes('<h1>') && !result.includes('<h2>') && !result.includes('<h3>')) {
      const simpleResult = marked(processedContent.replace(/^```/gm, '').replace(/```$/gm, ''))
      return simpleResult
    }
    
    return result
  } catch (error) {
    console.error('Markdown解析失败:', error)
    // 如果解析失败，返回原始内容
    return content.replace(/\n/g, '<br>')
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 组件挂载
onMounted(() => {
  // 检查用户登录状态
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 添加全屏状态监听
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  
  // 聚焦输入框
  if (messageInput.value) {
    messageInput.value.focus()
  }
  
  // 强制应用标题样式
  setTimeout(() => {
    forceApplyTitleStyles()
  }, 100)
  
  // 监听DOM变化，确保新添加的内容也会应用样式
  // 移除DOM观察器，避免重复应用样式导致冲突
  
  // 移除观察器启动代码，避免重复应用样式
})

// 强制应用标题样式的函数
const forceApplyTitleStyles = () => {
  const h1Elements = document.querySelectorAll('.ai-chat-page h1')
  const h2Elements = document.querySelectorAll('.ai-chat-page h2')
  const h3Elements = document.querySelectorAll('.ai-chat-page h3')
  
  h1Elements.forEach((h1) => {
    h1.style.setProperty('font-size', '1.0rem', 'important')
    h1.style.setProperty('margin', '0.3rem 0', 'important')
    h1.style.setProperty('font-weight', 'bold', 'important')
    h1.style.setProperty('line-height', '1.3', 'important')
    h1.style.setProperty('color', '#2c3e50', 'important')
  })
  
  h2Elements.forEach((h2) => {
    h2.style.setProperty('font-size', '0.95rem', 'important')
    h2.style.setProperty('margin', '0.3rem 0', 'important')
    h2.style.setProperty('font-weight', 'bold', 'important')
    h2.style.setProperty('line-height', '1.3', 'important')
    h2.style.setProperty('color', '#34495e', 'important')
  })
  
  h3Elements.forEach((h3) => {
    h3.style.setProperty('font-size', '0.9rem', 'important')
    h3.style.setProperty('margin', '0.25rem 0', 'important')
    h3.style.setProperty('font-weight', 'bold', 'important')
    h3.style.setProperty('line-height', '1.3', 'important')
    h3.style.setProperty('color', '#7f8c8d', 'important')
  })
  
  // 强制设置正文字体大小，防止打字机效果完成后字体变大
  const pElements = document.querySelectorAll('.ai-chat-page p')
  pElements.forEach((p, index) => {
    p.style.setProperty('font-size', '0.8rem', 'important')
    p.style.setProperty('line-height', '1.5', 'important')
    p.style.setProperty('margin', '0.2rem 0', 'important')
  })
  
  // 强制设置列表项字体大小和布局
  const liElements = document.querySelectorAll('.ai-chat-page li')
  liElements.forEach((li, index) => {
    li.style.setProperty('font-size', '0.8rem', 'important')
    li.style.setProperty('line-height', '1.6', 'important') // 增加行高，提高可读性
    li.style.setProperty('margin', '0.2rem 0', 'important') // 增加列表项间距
    li.style.setProperty('padding-left', '0.5rem', 'important') // 增加左边距
    li.style.setProperty('list-style-position', 'outside', 'important') // 确保列表标记在外部
  })
  
  // 优化有序列表样式
  const olElements = document.querySelectorAll('.ai-chat-page ol')
  olElements.forEach((ol, index) => {
    ol.style.setProperty('padding-left', '1.5rem', 'important')
    ol.style.setProperty('margin', '0.5rem 0', 'important')
  })
  
  // 优化无序列表样式
  const ulElements = document.querySelectorAll('.ai-chat-page ul')
  ulElements.forEach((ul, index) => {
    ul.style.setProperty('padding-left', '1.5rem', 'important')
    ul.style.setProperty('margin', '0.5rem 0', 'important')
  })
}

// 组件卸载
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped>
.ai-chat-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  padding-top: 70px; /* 为导航栏留出空间 */
}


/* 聊天容器 */
.ai-chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  transition: all 0.3s ease;
}

.ai-chat-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: white;
  padding: 0;
}

.chat-wrapper {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 70px - 2rem);
  max-height: calc(100vh - 70px - 2rem);
}

/* 侧边栏 */
.chat-sidebar {
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  padding: 1.5rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.chat-sidebar.collapsed {
  width: 60px;
  padding: 1rem 0.5rem;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.sidebar-header h5 {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.chat-sidebar.collapsed .sidebar-header h5 {
  display: none;
}

.ai-assistants {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assistant-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.assistant-card:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.assistant-card.active {
  background: linear-gradient(135deg, #f6d55c 0%, #e8ca0f 100%);
  color: white;
  border-color: #f6d55c;
}

.assistant-icon {
  font-size: 1.5rem;
  color: #f6d55c;
  flex-shrink: 0;
}

.assistant-card.active .assistant-icon {
  color: white;
}

.assistant-info {
  flex: 1;
}

.assistant-info h6 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.assistant-info p {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.chat-sidebar.collapsed .assistant-info {
  display: none;
}

.assistant-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.assistant-status.online {
  background: #28a745;
}

.assistant-status.offline {
  background: #dc3545;
}

/* 主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  overflow: hidden;
}

/* 聊天消息 */
.chat-messages {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.welcome-content {
  max-width: 400px;
}

.welcome-icon {
  font-size: 4rem;
  color: #f6d55c;
  margin-bottom: 1rem;
}

.welcome-content h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.welcome-content p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.message-item {
  display: flex;
  gap: 1rem;
  max-width: 80%;
}

.message-item.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-item.ai-message {
  align-self: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.user-message .message-avatar {
  background: linear-gradient(135deg, #f6d55c 0%, #e8ca0f 100%);
  color: white;
}

.ai-message .message-avatar {
  background: #e9ecef;
  color: #6c757d;
}

.message-content {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.message-sender {
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
}

.message-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.message-text {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
}

.user-message .message-text {
  background: linear-gradient(135deg, #f6d55c 0%, #e8ca0f 100%);
  color: white;
}

.message-text code {
  background: rgba(0,0,0,0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.user-message .message-text code {
  background: rgba(255,255,255,0.2);
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 1rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 输入区域 */
.chat-input-area {
  border-top: 1px solid #e9ecef;
  padding: 1.5rem;
  background: #f8f9fa;
}

.input-wrapper {
  max-width: 100%;
}

.input-container {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 0.75rem;
  font-size: 1rem;
  line-height: 1.4;
  resize: none;
  min-height: 50px;
  max-height: 120px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #f6d55c;
  box-shadow: 0 0 0 3px rgba(246, 213, 92, 0.1);
}

.send-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(246, 213, 92, 0.3);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.85rem;
}

.input-tips {
  color: #6c757d;
  display: flex;
  align-items: center;
}

.input-status {
  display: flex;
  align-items: center;
}

/* 打字机效果 */
.typing-effect {
  animation: typing 0.1s ease-in-out;
}

@keyframes typing {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* AI聊天页面专用Markdown样式 - 使用最高优先级的选择器 */
.ai-chat-page .ai-chat-container .message-item.ai-message .message-text h1, 
.ai-chat-page .ai-chat-container .message-item.ai-message .message-text h2, 
.ai-chat-page .ai-chat-container .message-item.ai-message .message-text h3 {
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
}

.ai-chat-page .ai-chat-container .message-item.ai-message .message-text h1 {
  font-size: 1rem !important;
  color: #2c3e50 !important;
}

.ai-chat-page .ai-chat-container .message-item.ai-message .message-text h2 {
  font-size: 0.95rem !important;
  color: #34495e !important;
}

.ai-chat-page .ai-chat-container .message-item.ai-message .message-text h3 {
  font-size: 0.9rem !important;
  color: #7f8c8d !important;
}

/* 额外的强制样式 - 使用更通用的选择器 */
.ai-chat-page h1 {
  font-size: 1rem !important;
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
}

.ai-chat-page h2 {
  font-size: 0.95rem !important;
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
}

.ai-chat-page h3 {
  font-size: 0.9rem !important;
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
}

/* 最强制性的样式 - 直接针对所有h标签 */
.ai-chat-page h1,
.ai-chat-page h2,
.ai-chat-page h3 {
  font-size: 1rem !important;
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
}

.ai-chat-page h2 {
  font-size: 0.95rem !important;
}

.ai-chat-page h3 {
  font-size: 0.9rem !important;
}

/* 终极强制样式 - 覆盖全局CSS */
.ai-chat-page .message-text h1,
.ai-chat-page .message-text h2,
.ai-chat-page .message-text h3 {
  font-size: 1rem !important;
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
}

.ai-chat-page .message-text h2 {
  font-size: 0.95rem !important;
}

.ai-chat-page .message-text h3 {
  font-size: 0.9rem !important;
}

/* 最强制性的样式 - 使用属性选择器 */
.ai-chat-page [class*="message-text"] h1,
.ai-chat-page [class*="message-text"] h2,
.ai-chat-page [class*="message-text"] h3 {
  font-size: 1rem !important;
  margin: 0.3rem 0 !important;
  font-weight: bold !important;
  line-height: 1.3 !important;
  color: #2c3e50 !important;
}

.ai-chat-page [class*="message-text"] h2 {
  font-size: 0.95rem !important;
  color: #34495e !important;
}

.ai-chat-page [class*="message-text"] h3 {
  font-size: 0.9rem !important;
  color: #7f8c8d !important;
}

.message-text strong {
  font-weight: bold;
  color: #2c3e50;
}

.message-text em {
  font-style: italic;
  color: #7f8c8d;
}

.message-text code {
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #e74c3c;
}

.message-text li {
  margin: 0.25rem 0;
  padding-left: 1rem;
}

.message-text a {
  color: #3498db;
  text-decoration: none;
}

.message-text a:hover {
  text-decoration: underline;
}

/* 表格样式 */
.markdown-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.6rem 0;
  font-size: 0.75rem;
}

.markdown-table td {
  border: 1px solid #dee2e6;
  padding: 0.3rem;
  text-align: left;
  vertical-align: top;
  font-size: 0.75rem;
}

.markdown-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.markdown-table tr:first-child td {
  background-color: #e9ecef;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chat-wrapper {
    height: calc(100vh - 180px);
  }
  
  .chat-sidebar {
    width: 250px;
  }
}

@media (max-width: 992px) {
  .chat-wrapper {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 200px);
  }
  
  .chat-sidebar {
    width: 100%;
    order: 2;
  }
  
  .chat-main {
    order: 1;
    min-height: 500px;
  }
  
  .ai-assistants {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .assistant-card {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .message-item {
    max-width: 95%;
  }
  
  .input-container {
    gap: 0.5rem;
  }
  
  .send-btn {
    width: 45px;
    height: 45px;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
