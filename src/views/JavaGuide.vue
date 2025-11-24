<template>
  <div class="java-guide-page">
    <!-- 页面头部 -->
    <div class="guide-header">
      <div class="container-fluid">
        <div class="header-content">
          <div class="header-title">
            <i class="fas fa-code"></i>
            <h1>Java 学习指导</h1>
            <p class="header-subtitle">专业的Java开发学习路径和实时指导</p>
          </div>
          <div class="header-actions">
            <button 
              @click="startNewSession" 
              class="btn btn-outline-primary"
              :disabled="isLoading"
            >
              <i class="fas fa-plus me-1"></i>
              新对话
            </button>
            <button 
              @click="toggleFullscreen" 
              class="btn btn-outline-secondary"
            >
              <i class="fas fa-expand me-1"></i>
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="guide-container" :class="{ 'fullscreen': isFullscreen }">
      <div class="container-fluid">
        <div class="guide-wrapper">
          <!-- 左侧：学习路径和工具 -->
          <div class="guide-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
            <div class="sidebar-header">
              <h5>学习工具</h5>
              <button 
                @click="toggleSidebar" 
                class="btn btn-sm btn-outline-secondary"
              >
                <i class="fas" :class="sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
              </button>
            </div>
            
            <!-- 学习路径 -->
            <div class="learning-paths">
              <h6>学习路径</h6>
              <div class="path-list">
                <div 
                  v-for="path in learningPaths" 
                  :key="path.id"
                  class="path-item"
                  :class="{ 'active': selectedPath === path.id }"
                  @click="selectPath(path.id)"
                >
                  <div class="path-icon">
                    <i :class="path.icon"></i>
                  </div>
                  <div class="path-info">
                    <h6>{{ path.name }}</h6>
                    <p>{{ path.description }}</p>
                    <div class="path-progress">
                      <div class="progress-bar">
                        <div 
                          class="progress-fill" 
                          :style="{ width: path.progress + '%' }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ path.progress }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 快速操作 -->
            <div class="quick-actions">
              <h6>快速操作</h6>
              <div class="action-buttons">
                <button 
                  v-for="action in quickActions" 
                  :key="action.text"
                  @click="sendQuickMessage(action.text)"
                  class="btn btn-outline-primary btn-sm"
                  :disabled="isLoading"
                >
                  <i :class="action.icon"></i>
                  {{ action.text }}
                </button>
              </div>
            </div>

            <!-- 代码示例 -->
            <div class="code-examples">
              <h6>代码示例</h6>
              <div class="example-list">
                <div 
                  v-for="example in codeExamples" 
                  :key="example.id"
                  class="example-item"
                  @click="loadExample(example)"
                >
                  <div class="example-title">{{ example.title }}</div>
                  <div class="example-description">{{ example.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：聊天区域 -->
          <div class="guide-main">
            <!-- 聊天消息列表 -->
            <div class="chat-messages" ref="messagesContainer">
              <div v-if="messages.length === 0" class="welcome-message">
                <div class="welcome-content">
                  <i class="fas fa-code welcome-icon"></i>
                  <h3>欢迎使用Java学习指导</h3>
                  <p>选择学习路径或直接提问，开始您的Java学习之旅</p>
                  <div class="feature-highlights">
                    <div class="feature-item">
                      <i class="fas fa-route"></i>
                      <span>个性化学习路径</span>
                    </div>
                    <div class="feature-item">
                      <i class="fas fa-code"></i>
                      <span>实时代码指导</span>
                    </div>
                    <div class="feature-item">
                      <i class="fas fa-question-circle"></i>
                      <span>问题解答</span>
                    </div>
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
                  <i v-else class="fas fa-code"></i>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">
                      {{ message.role === 'user' ? '您' : 'Java指导助手' }}
                    </span>
                    <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div class="message-text" v-html="formatMessage(message.content)"></div>
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
                    placeholder="输入您的Java相关问题..."
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
                      <div v-if="isLoading" class="spinner-inline"></div>
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
                      <div class="spinner-inline me-1"></div>
                      AI正在思考中...
                    </span>
                    <span v-else class="text-success">
                      <i class="fas fa-circle me-1"></i>
                      Java指导助手 在线
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

const authStore = useAuthStore()
const router = useRouter()

// 响应式数据
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const isFullscreen = ref(false)
const sidebarCollapsed = ref(false)
const selectedPath = ref('beginner')
const messagesContainer = ref(null)
const messageInput = ref(null)

// 学习路径配置
const learningPaths = ref([
  {
    id: 'beginner',
    name: 'Java基础',
    description: '从零开始学习Java',
    icon: 'fas fa-play-circle',
    progress: 0
  },
  {
    id: 'oop',
    name: '面向对象',
    description: '深入理解OOP概念',
    icon: 'fas fa-cube',
    progress: 0
  },
  {
    id: 'collections',
    name: '集合框架',
    description: '掌握Java集合',
    icon: 'fas fa-layer-group',
    progress: 0
  },
  {
    id: 'io',
    name: 'IO流',
    description: '文件操作和IO',
    icon: 'fas fa-file-alt',
    progress: 0
  },
  {
    id: 'multithreading',
    name: '多线程',
    description: '并发编程',
    icon: 'fas fa-tasks',
    progress: 0
  },
  {
    id: 'spring',
    name: 'Spring框架',
    description: '企业级开发',
    icon: 'fas fa-leaf',
    progress: 0
  }
])

// 快速操作
const quickActions = ref([
  { text: '解释这段代码', icon: 'fas fa-code' },
  { text: 'Java基础语法', icon: 'fas fa-book' },
  { text: '面向对象概念', icon: 'fas fa-cube' },
  { text: '异常处理', icon: 'fas fa-exclamation-triangle' },
  { text: '集合框架', icon: 'fas fa-layer-group' },
  { text: '多线程编程', icon: 'fas fa-tasks' }
])

// 代码示例
const codeExamples = ref([
  {
    id: 1,
    title: 'Hello World',
    description: '第一个Java程序',
    code: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
  },
  {
    id: 2,
    title: '类和对象',
    description: '面向对象基础',
    code: 'public class Person {\n    private String name;\n    private int age;\n    \n    public Person(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n    \n    public void introduce() {\n        System.out.println("我是" + name + "，今年" + age + "岁");\n    }\n}'
  },
  {
    id: 3,
    title: '异常处理',
    description: 'try-catch语句',
    code: 'try {\n    int result = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.println("除零错误: " + e.getMessage());\n} finally {\n    System.out.println("程序执行完毕");\n}'
  }
])

// 方法
const selectPath = (pathId) => {
  selectedPath.value = pathId
  const path = learningPaths.value.find(p => p.id === pathId)
  if (path) {
    sendMessage(`我想学习${path.name}，请为我制定学习计划`)
  }
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

const startNewSession = () => {
  if (confirm('确定要开始新的学习会话吗？当前对话将被清空。')) {
    messages.value = []
    inputMessage.value = ''
  }
}

const sendQuickMessage = (text) => {
  inputMessage.value = text
  sendMessage()
}

const loadExample = (example) => {
  const message = `请解释这段代码：\n\`\`\`java\n${example.code}\n\`\`\``
  inputMessage.value = message
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
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
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
    
    // 调用Java指导API
    await callJavaGuiderAPI(currentInput)
    
  } catch (error) {
    console.error('Java指导对话失败:', error)
    // 移除思考中的消息，添加错误消息
    messages.value.pop()
    messages.value.push({
      role: 'assistant',
      content: '抱歉，Java指导助手暂时无法响应，请稍后再试。',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const callJavaGuiderAPI = async (message) => {
  const conversationId = `java_guide_${Date.now()}`
  const response = await aiAPI.javaGuiderSSE(message, conversationId)
  
  if (!response.ok) {
    throw new Error('API调用失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let aiResponse = ''

  // 移除思考中的消息
  messages.value.pop()

  // 添加AI响应消息
  const aiMessage = {
    role: 'assistant',
    content: '',
    timestamp: new Date()
  }
  messages.value.push(aiMessage)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data && data !== '[DONE]') {
            aiResponse += data
            // 更新最后一条消息的内容
            messages.value[messages.value.length - 1].content = aiResponse
            await scrollToBottom()
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

const formatMessage = (content) => {
  if (!content) return ''
  
  // 增强的Markdown渲染，特别针对代码
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    .replace(/```java\n([\s\S]*?)\n```/g, '<pre class="code-block"><code class="language-java">$1</code></pre>')
    .replace(/```\n([\s\S]*?)\n```/g, '<pre class="code-block"><code>$1</code></pre>')
    .replace(/\n/g, '<br>')
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
})

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
.java-guide-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.guide-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: sticky;
  top: 70px;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title i {
  font-size: 2rem;
  color: #f6d55c;
}

.header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
}

.header-subtitle {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* 主要内容区域 */
.guide-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem 0;
  transition: all 0.3s ease;
}

.guide-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: white;
  padding: 0;
}

.guide-wrapper {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 200px);
  max-height: 800px;
}

/* 侧边栏 */
.guide-sidebar {
  width: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  padding: 1.5rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
  overflow-y: auto;
}

.guide-sidebar.collapsed {
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

.guide-sidebar.collapsed .sidebar-header h5 {
  display: none;
}

/* 学习路径 */
.learning-paths {
  margin-bottom: 2rem;
}

.learning-paths h6 {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.path-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.path-item:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.path-item.active {
  background: linear-gradient(135deg, #f6d55c 0%, #e8ca0f 100%);
  color: white;
  border-color: #f6d55c;
}

.path-icon {
  font-size: 1.5rem;
  color: #f6d55c;
  flex-shrink: 0;
}

.path-item.active .path-icon {
  color: white;
}

.path-info {
  flex: 1;
}

.path-info h6 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.path-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

.path-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.path-item.active .progress-bar {
  background: rgba(255,255,255,0.3);
}

.progress-fill {
  height: 100%;
  background: #f6d55c;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.path-item.active .progress-fill {
  background: white;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 500;
}

.guide-sidebar.collapsed .path-info {
  display: none;
}

/* 快速操作 */
.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h6 {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-buttons .btn {
  justify-content: flex-start;
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}

.guide-sidebar.collapsed .action-buttons {
  display: none;
}

/* 代码示例 */
.code-examples h6 {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.example-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.example-item:hover {
  background: #f8f9fa;
  border-color: #f6d55c;
  transform: translateY(-1px);
}

.example-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.example-description {
  font-size: 0.8rem;
  color: #6c757d;
}

.guide-sidebar.collapsed .example-list {
  display: none;
}

/* 主聊天区域 */
.guide-main {
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
  max-width: 500px;
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

.feature-highlights {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
}

.feature-item i {
  font-size: 1.5rem;
  color: #f6d55c;
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

/* 代码样式 */
.inline-code {
  background: rgba(0,0,0,0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.user-message .inline-code {
  background: rgba(255,255,255,0.2);
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.user-message .code-block {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
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
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.5;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .guide-wrapper {
    height: calc(100vh - 180px);
  }
  
  .guide-sidebar {
    width: 300px;
  }
}

@media (max-width: 992px) {
  .guide-wrapper {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 200px);
  }
  
  .guide-sidebar {
    width: 100%;
    order: 2;
    max-height: 300px;
  }
  
  .guide-main {
    order: 1;
    min-height: 500px;
  }
  
  .path-list {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .path-item {
    min-width: 200px;
  }
  
  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .example-list {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .example-item {
    min-width: 150px;
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
  
  .feature-highlights {
    gap: 1rem;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar,
.guide-sidebar::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.guide-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb,
.guide-sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.guide-sidebar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
