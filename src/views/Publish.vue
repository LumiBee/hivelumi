<template>
  <div class="publish-page">
    <!-- 合并的编辑区域 -->
    <div class="unified-editor-container">
      <!-- 标题部分 -->
      <div class="title-section">
        <i class="fas fa-edit title-icon"></i>
        <input
          type="text"
          v-model="articleForm.title"
          @input="handleTitleChange"
          class="header-title-input"
          placeholder="请输入文章标题..."
          maxlength="100"
        />
        <div class="title-actions">
          <!-- 自动保存状态提示 -->
          <div v-if="autoSaveStatus" class="auto-save-status me-3">
            <i 
              class="fas me-1" 
              :class="{
                'fa-spinner fa-spin': autoSaveStatus === '正在自动保存...',
                'fa-check-circle text-success': autoSaveStatus.includes('已自动保存'),
                'fa-exclamation-circle text-danger': autoSaveStatus === '自动保存失败'
              }"
            ></i>
            <span 
              :class="{
                'text-success': autoSaveStatus.includes('已自动保存'),
                'text-danger': autoSaveStatus === '自动保存失败',
                'text-warning': autoSaveStatus === '正在自动保存...'
              }"
            >
              {{ autoSaveStatus }}
            </span>
          </div>
          
          <button 
            @click="saveDraft" 
            class="btn btn-outline-secondary me-2"
            :disabled="isSaving"
          >
            <i class="fas fa-save me-1"></i>
            {{ isSaving ? '保存中...' : '保存草稿' }}
          </button>
          <button 
            @click="togglePublishModal" 
            class="btn btn-warning"
            :disabled="!canPublish"
          >
            <i class="fas fa-paper-plane me-1"></i>
            {{ isEditMode ? '更新文章' : '发布文章' }}
          </button>
        </div>
      </div>

      <!-- 通知区域 -->
      <div 
        v-if="notification.show" 
        class="alert alert-dismissible fade show"
        :class="`alert-${notification.type}`"
        role="alert"
      >
        <i 
          :class="notification.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"
          class="me-2"
        ></i>
        {{ notification.message }}
        <button 
          type="button" 
          class="btn-close" 
          @click="notification.show = false"
        ></button>
      </div>

      <!-- 文章内容标签和字数统计 -->
      <div class="editor-header mb-0">
        <div class="editor-header-content">
          <label for="articleContent" class="form-label">
            <i class="fas fa-edit me-2"></i>文章内容
          </label>
          <div class="editor-info">
            <span class="word-count">
              <i class="fas fa-info-circle me-1"></i>
              {{ wordCount }} 字
            </span>
          </div>
        </div>
      </div>
      
      <!-- Toast UI Markdown编辑器 -->
      <div class="content-editor-wrapper" ref="editorWrapper">
        <div id="toastUiEditor" ref="editorContainer"></div>
      </div>
    </div>

    <!-- 隐藏的图片上传输入框 -->
    <input
      ref="imageUploadInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="handleImageUpload"
    />

    <!-- 发布设置模态框 -->
    <div 
      v-if="showPublishModal" 
      class="modal fade show" 
      style="display: block; z-index: 1050; position: fixed; top: 0; left: 0; right: 0; bottom: 0;"
      tabindex="-1"
    >
      <div class="modal-dialog modal-xl" style="max-width: 85vw; width: 1000px;">
        <div class="modal-content publish-settings-modal">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-cog me-2"></i>发布设置
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showPublishModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div class="row g-4 align-items-start">
              <!-- 左侧设置 -->
              <div class="col-md-6 d-flex flex-column">
                <!-- 文章摘要 -->
                <div class="setting-card">
                  <div class="setting-header-with-buttons">
                    <h6 class="setting-title">
                      <i class="fas fa-align-left me-2"></i>文章摘要
                      <span class="text-danger ms-2" style="font-size: 0.9rem; font-weight: normal;">(必填)</span>
                    </h6>
                    <div class="ai-summary-buttons">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline-primary"
                        @click="generateAISummary"
                        :disabled="!articleForm.content || isGeneratingSummary"
                        title="使用AI自动生成摘要"
                      >
                        <i class="fas fa-magic me-1"></i>
                        {{ isGeneratingSummary ? '生成中...' : 'AI生成摘要' }}
                      </button>
                      <button 
                        v-if="articleForm.excerpt"
                        type="button" 
                        class="btn btn-sm btn-outline-secondary"
                        @click="clearExcerpt"
                        title="清空摘要"
                      >
                        <i class="fas fa-trash me-1"></i>
                        清空
                      </button>
                    </div>
                  </div>
                  <div class="form-group mb-0">
                    <textarea
                      v-model="articleForm.excerpt"
                      class="form-control excerpt-textarea"
                      rows="2"
                      placeholder="请输入文章摘要...（必填）或点击上方按钮使用AI生成"
                      maxlength="300"
                      :class="{ 'is-invalid': !articleForm.excerpt.trim() }"
                    ></textarea>
                    <div class="form-text">
                      <span :class="{ 'text-danger': articleForm.excerpt.length > 300 || !articleForm.excerpt.trim() }">
                        {{ articleForm.excerpt.length }}/300
                        <span v-if="!articleForm.excerpt.trim()" class="ms-2">摘要不能为空</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 封面图片 -->
                <div class="setting-card">
                  <h6 class="setting-title">
                    <i class="fas fa-image me-2"></i>封面图片
                  </h6>
                  <div class="cover-upload">
                    <div 
                      class="cover-preview"
                      :style="{ backgroundImage: `url(${coverPreview})` }"
                      @click="triggerCoverUpload"
                    >
                      <div v-if="!coverPreview" class="cover-placeholder">
                        <i class="fas fa-camera"></i>
                      </div>
                    </div>
                    <input
                      ref="coverInput"
                      type="file"
                      accept="image/*"
                      class="d-none"
                      @change="handleCoverUpload"
                    />
                    <div class="cover-actions mt-2">
                      <button 
                        v-if="coverPreview" 
                        @click="removeCover" 
                        class="btn btn-sm btn-outline-danger"
                      >
                        <i class="fas fa-trash me-1"></i>移除
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 标签 -->
                <div class="setting-card">
                  <h6 class="setting-title">
                    <i class="fas fa-tags me-2"></i>标签
                    <span class="text-muted ms-2" style="font-size: 0.9rem; font-weight: normal;">(可选)</span>
                  </h6>
                  <div class="tags-input">
                    <div class="tags-container">
                      <span 
                        v-for="tag in articleForm.tags" 
                        :key="tag"
                        class="tag-item"
                      >
                        {{ tag }}
                        <button 
                          @click="removeTag(tag)" 
                          class="tag-remove"
                          type="button"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </span>
                    </div>
                    <input
                      v-model="newTag"
                      @keyup.enter="addTag"
                      @blur="addTag"
                      class="form-control"
                      placeholder="输入标签后按回车...（可选）"
                    />
                  </div>
                </div>


              </div>

              <!-- 右侧设置 -->
              <div class="col-md-6 d-flex flex-column">
                <!-- 作品集 -->
                <div class="setting-card">
                  <h6 class="setting-title">
                    <i class="fas fa-briefcase me-2"></i>作品集
                    <span class="text-muted ms-2" style="font-size: 0.9rem; font-weight: normal;">(可选)</span>
                  </h6>
                  <div class="portfolio-input-group">
                    <!-- 选择现有作品集 -->
                    <div class="mb-3">
                      <label class="form-label small text-muted">选择现有作品集：</label>
                      <div class="custom-select" @click="togglePortfolioDropdown" ref="portfolioSelectContainer">
                        <div class="select-display">
                          <span class="select-text">{{ getPortfolioSelectText() }}</span>
                          <i class="fas fa-chevron-down select-arrow" :class="{ 'rotated': isPortfolioDropdownOpen }"></i>
                        </div>
                        <div class="select-dropdown" v-show="isPortfolioDropdownOpen">
                          <div 
                            class="select-option"
                            :class="{ 'selected': selectedPortfolioId === '' }"
                            @click.stop="selectPortfolio('')"
                          >
                            -- 选择现有作品集 --
                          </div>
                          <div 
                            v-for="portfolio in portfolios" 
                            :key="portfolio.id"
                            class="select-option"
                            :class="{ 'selected': selectedPortfolioId === portfolio.id }"
                            @click.stop="selectPortfolio(portfolio.id)"
                          >
                            {{ portfolio.title }}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 或者输入新作品集 -->
                    <div class="mb-3">
                      <label class="form-label small text-muted">或者输入新作品集名称：</label>
                      <div class="input-group">
                        <input
                          v-model="newPortfolioName"
                          type="text"
                          class="form-control"
                          placeholder="输入作品集名称..."
                          @keyup.enter="createNewPortfolio"
                          @blur="createNewPortfolio"
                        />
                        <button 
                          type="button" 
                          class="btn btn-outline-primary"
                          @click="createNewPortfolio"
                          :disabled="!newPortfolioName.trim() || isCreatingPortfolio"
                        >
                          <i class="fas" :class="isCreatingPortfolio ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
                        </button>
                      </div>
                    </div>
                    
                    <!-- 当前选中的作品集显示 -->
                    <div v-if="articleForm.portfolioId" class="selected-portfolio mt-2">
                      <div class="alert alert-info py-2">
                        <i class="fas fa-check-circle me-2"></i>
                        已选择作品集：<strong>{{ getSelectedPortfolioName() }}</strong>
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline-danger ms-2"
                          @click="clearPortfolio"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 发布确认 -->
                <div class="setting-card">
                  <h6 class="setting-title">
                    <i class="fas fa-check-circle me-2"></i>发布确认
                  </h6>
                  <div class="publish-confirmation">
                    <p class="text-muted mb-3">
                      请确认以下信息无误后点击发布：
                    </p>
                    <ul class="confirmation-list">
                      <li :class="getStatusClass('title')">
                        <i class="fas fa-check me-2"></i>
                        标题：{{ articleForm.title || '未填写' }}
                      </li>
                      <li :class="getStatusClass('content')">
                        <i class="fas fa-check me-2"></i>
                        内容：{{ articleForm.content ? `${wordCount} 字` : '未填写' }}
                      </li>
                      <li :class="getStatusClass('excerpt')">
                        <i class="fas fa-check me-2"></i>
                        摘要：{{ getStatusText('excerpt') }}
                      </li>
                      <li :class="getStatusClass('portfolio')">
                        <i class="fas fa-briefcase me-2"></i>
                        作品集：{{ getStatusText('portfolio') }}
                      </li>
                      <li :class="getStatusClass('tags')">
                        <i class="fas fa-tags me-2"></i>
                        标签：{{ getStatusText('tags') }}
                      </li>
                    </ul>
                    
                    <!-- 发布设置 -->
                    <div class="publish-settings mt-3 pt-3 border-top">
                      <div class="form-check">
                        <input
                          type="checkbox"
                          id="allowComments"
                          v-model="articleForm.allowComments"
                          class="form-check-input"
                        />
                        <label class="form-check-label" for="allowComments">
                          <i class="fas fa-comments me-2"></i>允许评论
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showPublishModal = false"
            >
              取消
            </button>
            <button 
              type="button" 
              class="btn btn-warning" 
              @click="confirmPublish"
              :disabled="!canActuallyPublish || isPublishing"
            >
              <i class="fas fa-paper-plane me-1"></i>
              {{ isPublishing ? '发布中...' : '确认发布' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPublishModal" class="modal-backdrop fade show" style="z-index: 1049;"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { articleAPI, portfolioAPI, aiAPI } from '@/api'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight'
import 'highlight.js/styles/github.css'

// Toast UI Editor 已通过import加载CSS

// 加载Font Awesome字体
const fontAwesome = document.createElement('link')
fontAwesome.rel = 'stylesheet'
fontAwesome.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css'
document.head.appendChild(fontAwesome)

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const articleForm = ref({
  title: '',
  excerpt: '',
  content: '',
  tags: [],
  portfolioId: '',
  allowComments: true
})

// 自动保存相关状态
const autoSaveTimeout = ref(null) // 自动保存的定时器
const lastSavedTime = ref(null)
const isAutoSaving = ref(false)
const currentDraftId = ref(null) // 当前草稿的ID
const hasUnsavedChanges = ref(false) // 是否有未保存的更改
const autoSaveDelay = 3000 // 用户停止输入3秒后自动保存
const autoSaveStatus = ref('') // 自动保存状态提示

const coverInput = ref(null)
const coverPreview = ref('')
const newTag = ref('')
const portfolios = ref([])
const selectedPortfolioId = ref('')
const newPortfolioName = ref('')
const isSaving = ref(false)
const isPublishing = ref(false)
const isGeneratingSummary = ref(false)
const isCreatingPortfolio = ref(false)
const isPortfolioDropdownOpen = ref(false)
const showPublishModal = ref(false)


// 调试模态框显示状态
const togglePublishModal = () => {
  showPublishModal.value = !showPublishModal.value
}
const wordCount = ref(0)
const notification = ref({ show: false, message: '', type: 'success' })
const portfolioSelectContainer = ref(null)

// 编辑器相关
const editorWrapper = ref(null)
const editorContainer = ref(null)
let editorInstance = null

// 编辑模式
const isEditMode = ref(false)
const editingArticleId = ref(null)

// 计算属性
const canPublish = computed(() => {
  return articleForm.value.title.trim() && 
         articleForm.value.content.trim()
})

// 检查是否可以真正发布（包含摘要验证）
const canActuallyPublish = computed(() => {
  return articleForm.value.title.trim() && 
         articleForm.value.content.trim() &&
         articleForm.value.excerpt.trim()
})

// 初始化Toast UI编辑器
const initEditor = () => {
  return new Promise((resolve, reject) => {
    try {
      const editorElement = document.getElementById('toastUiEditor')
      if (!editorElement) {
        console.error('Toast UI Editor容器元素不存在')
        reject(new Error('Toast UI Editor容器元素不存在'))
        return
      }
      
      if (editorInstance) {
        editorInstance.destroy()
      }
    
      // 动态计算编辑器高度
      const calculateEditorHeight = () => {
        const windowHeight = window.innerHeight
        const windowWidth = window.innerWidth
        
        // 根据窗口宽度调整最小高度
        let minHeight = 500
        if (windowWidth < 768) {
          minHeight = 400  // 移动端
        } else if (windowWidth < 1200) {
          minHeight = 450  // 平板
        } else {
          minHeight = 500  // 桌面端
        }
        
        const editorContainer = document.querySelector('.publish-page-wrapper')
        const rect = editorContainer ? editorContainer.getBoundingClientRect() : { top: 200 }
        const availableHeight = windowHeight - rect.top - 100
        
        return Math.max(minHeight, availableHeight)
      }
      
      // 配置代码高亮插件
      const editorPlugins = []
      if (codeSyntaxHighlight && typeof hljs !== 'undefined') {
        editorPlugins.push([codeSyntaxHighlight, { hljs }])
      }
      
      editorInstance = new Editor({
        el: editorElement,
        height: `${calculateEditorHeight()}px`,
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        initialValue: articleForm.value.content || '',
        placeholder: '请输入文章内容，支持Markdown语法...',
        usageStatistics: false,
        plugins: editorPlugins,
        theme: 'light',
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync']
        ],
        hooks: {
          addImageBlobHook: async (blob, callback) => {
            
            const formData = new FormData()
            formData.append('file', blob)
            
            try {
              const response = await fetch('/api/article/upload-image', {
                method: 'POST',
                headers: {
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
              })
              
              const result = await response.json()
              
              if (!response.ok) {
                throw new Error(result.error || '服务器返回了错误')
              }
              
              const imageUrl = result.url
              callback(imageUrl, 'image')
              
            } catch (error) {
              console.error('图片上传失败:', error)
              alert('图片上传失败: ' + error.message)
            }
          }
        }
      })
      
      // 监听内容变化
      editorInstance.on('change', () => {
        const content = editorInstance.getMarkdown()
        articleForm.value.content = content
        updateWordCount()
        
        if (content && content.trim().length > 0) {
          hasUnsavedChanges.value = true
          triggerSmartAutoSave()
        }
      })
      
      // 监听窗口大小变化
      const handleResize = () => {
        if (editorInstance) {
          const newHeight = calculateEditorHeight()
          editorInstance.setHeight(`${newHeight}px`)
        }
      }
      
      window.addEventListener('resize', handleResize)
      window.editorResizeHandler = handleResize
      
      // 动态应用字体样式和修复黑色区域
      setTimeout(() => {
        const editorElement = document.querySelector('.toastui-editor')
        if (editorElement) {
          // 强制修复黑色区域 - 使用更激进的方法
          editorElement.style.setProperty('background', 'white', 'important')
          editorElement.style.setProperty('background-color', 'white', 'important')
          editorElement.style.setProperty('color', '#333', 'important')
          
          // 查找并修复所有可能的黑色区域
          const allElements = editorElement.querySelectorAll('*')
          allElements.forEach(el => {
            // 强制设置背景色
            el.style.setProperty('background', 'white', 'important')
            el.style.setProperty('background-color', 'white', 'important')
            
            // 设置文字颜色（代码块除外）
            if (el.tagName !== 'CODE' && !el.classList.contains('hljs')) {
              el.style.setProperty('color', '#333', 'important')
            }
            
            // 特别处理可能的黑色边框
            if (el.style.borderColor === 'black' || el.style.border === 'black') {
              el.style.setProperty('border-color', '#ddd', 'important')
            }
            
            // 特别处理可能的黑色背景
            if (el.style.background === 'black' || el.style.backgroundColor === 'black' ||
                el.style.background === '#000' || el.style.backgroundColor === '#000') {
              el.style.setProperty('background', 'white', 'important')
              el.style.setProperty('background-color', 'white', 'important')
            }
          })
          
          // 特别修复可能的黑色小区域
          const possibleBlackElements = editorElement.querySelectorAll('div, span, input, textarea, button')
          possibleBlackElements.forEach(el => {
            if (el.style.background === 'black' || el.style.backgroundColor === 'black' ||
                el.style.background === '#000' || el.style.backgroundColor === '#000' ||
                el.style.background === 'rgb(0, 0, 0)' || el.style.backgroundColor === 'rgb(0, 0, 0)') {
              el.style.setProperty('background', 'white', 'important')
              el.style.setProperty('background-color', 'white', 'important')
            }
          })
          
          // 应用编辑器整体字体
          editorElement.style.setProperty('font-size', '18px', 'important')
          
          // 应用ProseMirror编辑器字体
          const proseMirror = editorElement.querySelector('.ProseMirror')
          if (proseMirror) {
            proseMirror.style.fontSize = '18px'
            proseMirror.style.lineHeight = '1.8'
            proseMirror.style.background = 'white'
            proseMirror.style.color = '#333'
          }
          
          // 应用预览内容字体
          const previewContents = editorElement.querySelector('.toastui-editor-contents')
          if (previewContents) {
            previewContents.style.fontSize = '18px'
            previewContents.style.lineHeight = '1.8'
            previewContents.style.background = 'white'
            previewContents.style.color = '#333'
          }
          
          // 应用段落样式
          const paragraphs = editorElement.querySelectorAll('p')
          paragraphs.forEach(p => {
            p.style.fontSize = '18px'
            p.style.lineHeight = '1.8'
            p.style.marginBottom = '1.2em'
            p.style.color = '#333'
          })
          
          // 应用标题样式
          const headings = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6')
          headings.forEach(h => {
            h.style.color = '#333'
            const tagName = h.tagName.toLowerCase()
            switch(tagName) {
              case 'h1':
                h.style.fontSize = '2.2em'
                h.style.fontWeight = '700'
                break
              case 'h2':
                h.style.fontSize = '1.8em'
                h.style.fontWeight = '600'
                break
              case 'h3':
                h.style.fontSize = '1.5em'
                h.style.fontWeight = '600'
                break
              case 'h4':
                h.style.fontSize = '1.3em'
                h.style.fontWeight = '600'
                break
              case 'h5':
                h.style.fontSize = '1.1em'
                h.style.fontWeight = '600'
                break
              case 'h6':
                h.style.fontSize = '1em'
                h.style.fontWeight = '600'
                break
            }
          })
        }
      }, 1000)
      
      resolve()
    
  } catch (error) {
      console.error('Toast UI Editor初始化失败:', error)
    reject(error)
  }
  })
}

// 清理Markdown内容
const cleanMarkdownContent = (content) => {
  if (!content) return content
  
  let cleanedContent = content
  
  // 1. 清理表格中的多余粗体标记
  cleanedContent = cleanedContent.replace(/\| \*\*(.*?)\*\* \|/g, '| $1 |')
  
  // 2. 清理段落开头的多余粗体标记（只处理段落开头的情况）
  cleanedContent = cleanedContent.replace(/^(\s*)\*\*([^*\n]+)\*\*(\s*)$/gm, '$1$2$3')
  
  // 3. 清理代码块第一行空行
  cleanedContent = cleanedContent.replace(/```(\w+)?\n\s*\n/g, '```$1\n')
  
  // 4. 清理多余的空行
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n')
  
  // 5. 清理重复的粗体标记
  cleanedContent = cleanedContent.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '**$1**')
  
  return cleanedContent
}

// 方法
const updateWordCount = () => {
  const content = articleForm.value.content || ''
  // 对于HTML内容，需要去除HTML标签来计算字数
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s/g, '')
  wordCount.value = plainText.length
}

// Vditor编辑器工具栏方法（Vditor内置工具栏，无需额外方法）
// 触发图片上传
const triggerImageUpload = () => {
  imageUploadInput.value.click()
}



// 图片上传逻辑
const imageUploadInput = ref(null)
const isImageUploading = ref(false)

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    isImageUploading.value = true
    const reader = new FileReader()
    reader.onload = (e) => {
      // 在Toast UI Editor中插入图片
      if (editorInstance) {
        try {
          // 使用Toast UI Editor的API插入图片
          const imageMarkdown = `![${file.name}](${e.target.result})`
          const currentValue = editorInstance.getMarkdown()
          const newValue = currentValue + '\n' + imageMarkdown + '\n'
          
          // 设置新内容
          editorInstance.setMarkdown(newValue)
          
          // 更新表单内容
          articleForm.value.content = newValue
          updateWordCount()
        } catch (error) {
          console.warn('在Toast UI Editor中插入图片失败:', error)
          // 备用方案：直接更新表单内容
          const imageMarkdown = `![${file.name}](${e.target.result})`
          articleForm.value.content += '\n' + imageMarkdown + '\n'
          updateWordCount()
        }
      } else {
        // 如果编辑器未初始化，直接更新表单内容
        const imageMarkdown = `![${file.name}](${e.target.result})`
        articleForm.value.content += '\n' + imageMarkdown + '\n'
        updateWordCount()
      }
      
      isImageUploading.value = false
      showNotification('图片已插入到文章中', 'success')
    }
    reader.onerror = () => {
      isImageUploading.value = false
      showNotification('图片上传失败，请重试', 'danger')
    }
    reader.readAsDataURL(file)
  }
}

const triggerCoverUpload = () => {
  coverInput.value.click()
}

const handleCoverUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      coverPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeCover = () => {
  coverPreview.value = ''
  if (coverInput.value) {
    coverInput.value.value = ''
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !articleForm.value.tags.includes(tag)) {
    articleForm.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (tag) => {
  const index = articleForm.value.tags.indexOf(tag)
  if (index > -1) {
    articleForm.value.tags.splice(index, 1)
  }
}

const getStatusClass = (field) => {
  if (field === 'excerpt') {
    const value = articleForm.value[field]
    // 摘要字段在发布设置中是必填的
    if (!value || value.trim() === '') return 'text-danger'
    if (value.length > 300) return 'text-warning'
    return 'text-success'
  }
  if (field === 'portfolio') {
    // 作品集字段是可选的，检查portfolioId
    const portfolioId = articleForm.value.portfolioId
    return portfolioId ? 'text-success' : 'text-muted'
  }
  if (field === 'tags') {
    // 标签字段是可选的，空值不显示错误
    return articleForm.value.tags.length > 0 ? 'text-success' : 'text-muted'
  }
  
  const value = articleForm.value[field]
  if (!value || value.trim() === '') return 'text-danger'
  if (field === 'title' && value.length > 100) return 'text-warning'
  return 'text-success'
}

const getStatusText = (field) => {
  if (field === 'excerpt') {
    const value = articleForm.value[field]
    // 摘要字段在发布设置中是必填的
    if (!value || value.trim() === '') return '未填写（必填）'
    if (value.length > 300) return '摘要过长'
    return '已填写'
  }
  if (field === 'portfolio') {
    // 作品集字段是可选的，检查portfolioId
    const portfolioId = articleForm.value.portfolioId
    if (!portfolioId) return '未选择（可选）'
    const portfolio = portfolios.value.find(p => p.id === portfolioId)
    return portfolio ? portfolio.title : '未知作品集'
  }
  if (field === 'tags') {
    // 标签字段是可选的
    if (articleForm.value.tags.length === 0) return '未添加（可选）'
    return articleForm.value.tags.join(', ')
  }
  
  const value = articleForm.value[field]
  if (!value || value.trim() === '') return '未填写'
  if (field === 'title' && value.length > 100) return '标题过长'
  return '已填写'
}

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 手动保存草稿
const saveDraft = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    isSaving.value = true
    
    // 准备草稿数据，确保字段名与后端DTO匹配
    const draftData = {
      id: currentDraftId.value, // 如果有草稿ID，则更新现有草稿
      title: articleForm.value.title || '无标题草稿',
      content: articleForm.value.content || '',
      excerpt: articleForm.value.excerpt || '',
      tags: Array.isArray(articleForm.value.tags) ? [...articleForm.value.tags] : [],
      portfolioId: articleForm.value.portfolioId || null,
      portfolioName: articleForm.value.portfolioId ? 
        portfolios.value.find(p => p.id === articleForm.value.portfolioId)?.title : null
    }
    
    
    try {
      // 尝试保存到服务器
      const response = await articleAPI.saveDraft(draftData)
      
      // 判断响应是否成功
      if (response && response.articleId) {
        // 始终使用返回的articleId更新当前草稿ID
        currentDraftId.value = response.articleId
        showNotification('草稿保存成功！', 'success')
        // 更新最后保存时间
        lastSavedTime.value = new Date()
        // 清除未保存更改标记
        hasUnsavedChanges.value = false
        // 更新自动保存状态显示
        updateAutoSaveStatus(`已保存 ${formatTime(lastSavedTime.value)}`)
      } else if (!response || response === '' || response === null || 
          (typeof response === 'object' && Object.keys(response).length === 0)) {
        showNotification('草稿保存成功！', 'success')
        // 更新最后保存时间
        lastSavedTime.value = new Date()
        // 清除未保存更改标记
        hasUnsavedChanges.value = false
        // 更新自动保存状态显示
        updateAutoSaveStatus(`已保存 ${formatTime(lastSavedTime.value)}`)
      } else {
        showNotification('保存失败，请重试', 'danger')
      }
    } catch (apiError) {
      let errorMessage = '保存失败'
      
      if (apiError.response) {
        const status = apiError.response.status
        
        if (status === 401) {
          errorMessage = '身份验证失败，请重新登录'
          showNotification(errorMessage, 'warning')
          // 提示用户重新登录
          setTimeout(() => {
            showNotification('请重新登录后再尝试保存', 'info')
          }, 3000)
          return
        } else if (status === 403) {
          errorMessage = '您没有权限执行此操作'
        } else if (status === 500) {
          errorMessage = '服务器错误，请稍后再试'
        } else {
          errorMessage += `: ${apiError.response.data?.message || apiError.response.statusText}`
        }
        
      } else if (apiError.request) {
        errorMessage = '网络请求失败'
      } else {
        errorMessage += `: ${apiError.message || '未知错误'}`
      }
      
      showNotification(errorMessage, 'danger')
    }
  } catch (error) {
    showNotification('保存失败：' + (error.message || '未知错误'), 'danger')
  } finally {
    isSaving.value = false
  }
}

// 智能自动保存触发器
const triggerSmartAutoSave = () => {
  // 清除之前的定时器
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  // 设置新的定时器，在用户停止输入后自动保存
  autoSaveTimeout.value = setTimeout(() => {
    if (hasUnsavedChanges.value) {
      autoSaveDraft()
    }
  }, autoSaveDelay)
}

// 监听标题输入变化
const handleTitleChange = () => {
  // 只有在有实际标题内容时才标记为未保存
  if (articleForm.value.title && articleForm.value.title.trim().length > 0) {
    hasUnsavedChanges.value = true
    triggerSmartAutoSave()
  }
}

// 格式化时间显示
const formatTime = (date) => {
  if (!date) return ''
  
  // 直接显示具体的时间，格式：HH:MM
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

// 更新自动保存状态显示
const updateAutoSaveStatus = (status) => {
  autoSaveStatus.value = status
  // 不再自动清除状态，让用户看到保存时间
}

// 自动保存草稿
const autoSaveDraft = async () => {
  // 如果没有未保存的更改，跳过自动保存
  if (!hasUnsavedChanges.value) {
    return
  }

  // 如果正在手动保存，则不自动保存
  if (isSaving.value) {
    return
  }

  // 检查是否有实际内容需要保存
  const hasTitle = articleForm.value.title && articleForm.value.title.trim().length > 0
  const hasContent = articleForm.value.content && articleForm.value.content.trim().length > 0
  
  // 如果标题和内容都为空，不进行自动保存
  if (!hasTitle && !hasContent) {
    hasUnsavedChanges.value = false // 清除未保存标记
    return
  }

  // 如果用户未登录，不进行自动保存
  if (!authStore.isAuthenticated) {
    return
  }
  
  // 注意：由于使用Session认证，不需要JWT token刷新机制

  try {
    isAutoSaving.value = true
    updateAutoSaveStatus('正在自动保存...')
    
    // 准备草稿数据
    const draftData = {
      id: currentDraftId.value, // 如果有草稿ID，则更新现有草稿
      title: articleForm.value.title || '无标题草稿',
      content: articleForm.value.content || '',
      excerpt: articleForm.value.excerpt || '',
      tags: Array.isArray(articleForm.value.tags) ? [...articleForm.value.tags] : [],
      portfolioId: articleForm.value.portfolioId || null,
      portfolioName: articleForm.value.portfolioId ? 
        portfolios.value.find(p => p.id === articleForm.value.portfolioId)?.title : null
    }
    
    
    // 尝试保存到服务器
    const response = await articleAPI.saveDraft(draftData)
    
    // 判断响应是否成功
    if (response && response.articleId) {
      // 始终使用返回的articleId更新当前草稿ID
      currentDraftId.value = response.articleId
      // 更新最后保存时间
      lastSavedTime.value = new Date()
      // 清除未保存更改标记
      hasUnsavedChanges.value = false
      // 更新状态提示
      updateAutoSaveStatus(`已自动保存 ${formatTime(lastSavedTime.value)}`)
    } else {
      updateAutoSaveStatus('自动保存失败')
    }
  } catch (error) {
    updateAutoSaveStatus('自动保存失败')
    
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
      }
    } else if (error.request) {
    }
  } finally {
    isAutoSaving.value = false
  }
}









const confirmPublish = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    
    // 检查发布条件
    
    isPublishing.value = true
    
    // 如果用户没有填写摘要，自动调用AI生成摘要
    let finalExcerpt = articleForm.value.excerpt
    if (!finalExcerpt || finalExcerpt.trim() === '') {
      try {
        showNotification('正在使用AI生成文章摘要...', 'info')
        
        // 使用aiAPI模块中的generateSummary方法
        const plainTextContent = articleForm.value.content.replace(/<\/?[^>]+(>|$)/g, "").trim()
        
        try {
          // 使用导入的aiAPI模块
          const result = await aiAPI.generateSummary(plainTextContent, 300)
          
          if (result && result.summary) {
            finalExcerpt = result.summary
            articleForm.value.excerpt = finalExcerpt
            showNotification('AI摘要生成成功！', 'success')
          } else {
            throw new Error('未能获取有效的摘要')
          }
        } catch (error) {
          // 如果AI生成失败，使用内容的前100个字符作为摘要
          finalExcerpt = plainTextContent.substring(0, 100).replace(/[#*`]/g, '') + '...'
          articleForm.value.excerpt = finalExcerpt
          showNotification('AI摘要生成失败，已使用文章开头作为摘要', 'warning')
        }
      } catch (aiError) {
        // AI生成失败时，使用内容的前100个字符作为摘要
        finalExcerpt = articleForm.value.content.substring(0, 100).replace(/[#*`]/g, '') + '...'
        articleForm.value.excerpt = finalExcerpt
      }
    }
    
    // 准备发布数据，确保字段名与后端DTO匹配
    const publishData = {
      title: articleForm.value.title,
      content: articleForm.value.content,
      excerpt: finalExcerpt,
      tagsName: articleForm.value.tags,  // 转换为后端期望的字段名
      portfolioName: articleForm.value.portfolioId ? 
        portfolios.value.find(p => p.id === articleForm.value.portfolioId)?.title : null,  // 转换为作品集名称
      coverImg: coverPreview.value
    }
    
    let response
    // 更健壮的编辑模式判断：检查是否有编辑文章ID或当前草稿ID
    const isEditing = isEditMode.value || editingArticleId.value || currentDraftId.value
    
    if (isEditing) {
      // 编辑模式：更新文章
      // 使用当前草稿ID或编辑文章ID作为文章ID
      const articleId = currentDraftId.value || editingArticleId.value
      if (!articleId) {
        showNotification('无法获取文章ID，请重试', 'danger')
        return
      }
      response = await articleAPI.updateArticle(articleId, publishData)
      if (response && response.articleId) {
        showNotification('文章更新成功！', 'success')
        showPublishModal.value = false
        // 更新成功，跳转到文章页面
        setTimeout(() => {
          router.push(`/article/${response.slug}`)
        }, 200)
      } else {
        showNotification('更新失败，请重试', 'danger')
      }
    } else {
      // 发布模式：发布新文章
      response = await articleAPI.publishArticle(publishData)
      
      if (response && response.articleId) {
        showNotification('文章发布成功！', 'success')
        showPublishModal.value = false
        
        // 发布成功，跳转到文章页面
        setTimeout(() => {
          router.push(`/article/${response.slug}`)
        }, 200)
      } else {
        showNotification('发布失败，请重试', 'danger')
      }
    }
  } catch (error) {
    showNotification('发布失败：' + (error.message || '未知错误'), 'danger')
  } finally {
    isPublishing.value = false
  }
}

// 作品集相关方法
const togglePortfolioDropdown = () => {
  isPortfolioDropdownOpen.value = !isPortfolioDropdownOpen.value
}

const selectPortfolio = (portfolioId) => {
  selectedPortfolioId.value = portfolioId
  if (portfolioId) {
    articleForm.value.portfolioId = portfolioId
    newPortfolioName.value = '' // 清空新作品集输入
  } else {
    articleForm.value.portfolioId = ''
  }
  isPortfolioDropdownOpen.value = false
}

const getPortfolioSelectText = () => {
  
  if (!selectedPortfolioId.value) {
    return '-- 选择现有作品集 --'
  }
  const portfolio = portfolios.value.find(p => p.id === selectedPortfolioId.value)
  return portfolio ? portfolio.title : '-- 选择现有作品集 --'
}

const createNewPortfolio = async () => {
  const portfolioName = newPortfolioName.value.trim()
  if (!portfolioName) return
  
  try {
    isCreatingPortfolio.value = true
    
    // 创建新作品集
    const newPortfolio = {
      title: portfolioName,
      description: `由文章《${articleForm.value.title || '未命名文章'}》创建的作品集`
    }
    
    const response = await portfolioAPI.createPortfolio(newPortfolio)
    
    if (response && response.id) {
      // 转换后端返回的Portfolio对象为前端期望的格式
      const portfolioForFrontend = {
        id: response.id,
        title: response.name, // 后端返回的是name，前端期望的是title
        description: response.description,
        userId: response.userId,
        slug: response.slug,
        coverImgUrl: response.coverImgUrl,
        gmtCreate: response.gmtModified, // 使用gmtModified作为gmtCreate
        gmtModified: response.gmtModified
      }
      
      // 添加到作品集列表
      portfolios.value.push(portfolioForFrontend)
      
      // 设置为当前选中的作品集
      selectedPortfolioId.value = response.id
      articleForm.value.portfolioId = response.id
      
      // 清空输入
      newPortfolioName.value = ''
      
      showNotification(`作品集"${portfolioName}"创建成功！`, 'success')
    } else {
      throw new Error(`创建作品集失败: ${response?.message || '响应格式不正确'}`)
    }
  } catch (error) {
    showNotification('创建作品集失败：' + (error.message || '未知错误'), 'danger')
  } finally {
    isCreatingPortfolio.value = false
  }
}

const getSelectedPortfolioName = () => {

  if (!articleForm.value.portfolioId) return ''
  
  const portfolio = portfolios.value.find(p => p.id === articleForm.value.portfolioId)
  return portfolio ? portfolio.title : '未知作品集'
}

const clearPortfolio = () => {
  articleForm.value.portfolioId = ''
  selectedPortfolioId.value = ''
  newPortfolioName.value = ''
}

const loadPortfolios = async () => {
  try {
    const response = await portfolioAPI.getAllPortfolios()    
    // 转换后端返回的PortfolioDetailsDTO为前端期望的格式
    portfolios.value = (response || []).map(portfolio => ({
      id: portfolio.id,
      title: portfolio.name, // 后端返回的是name，前端期望的是title
      description: portfolio.description,
      userId: portfolio.userId,
      slug: portfolio.slug,
      coverImgUrl: portfolio.coverImgUrl,
      gmtCreate: portfolio.gmtModified, // 使用gmtModified作为gmtCreate
      gmtModified: portfolio.gmtModified
    }))
    
  } catch (error) {
  }
}

// AI生成摘要方法
const generateAISummary = async () => {
  if (!articleForm.value.content || articleForm.value.content.trim() === '') {
    showNotification('请先输入文章内容', 'warning')
    return
  }

  try {
    isGeneratingSummary.value = true
    showNotification('正在使用AI生成摘要...', 'info')
        
    // 使用aiAPI模块中的generateSummary方法，而不是直接使用fetch
    const plainTextContent = articleForm.value.content.replace(/<\/?[^>]+(>|$)/g, "").trim()
    
    try {
      // 使用导入的aiAPI模块
      const result = await aiAPI.generateSummary(plainTextContent, 300)
      
      if (result && result.summary) {
        articleForm.value.excerpt = result.summary
        showNotification('AI摘要生成成功！', 'success')
      } else {
        throw new Error('未能获取有效的摘要')
      }
    } catch (error) {
      // 如果AI生成失败，使用内容的前100个字符作为摘要
      articleForm.value.excerpt = plainTextContent.substring(0, 100).replace(/[#*`]/g, '') + '...'
      showNotification('AI摘要生成失败，已使用文章开头作为摘要', 'warning')
    }
  } catch (error) {
    showNotification('AI生成摘要失败：' + (error.message || '未知错误'), 'danger')
  } finally {
    isGeneratingSummary.value = false
  }
}

// 清空摘要方法
const clearExcerpt = () => {
  articleForm.value.excerpt = ''
  showNotification('摘要已清空', 'info')
}

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  if (portfolioSelectContainer.value && !portfolioSelectContainer.value.contains(event.target)) {
    isPortfolioDropdownOpen.value = false
  }
}

// 获取路由信息
const route = useRoute()

// 处理路由变化的函数
const handleRouteChange = async () => {
  
  if (route && route.query && route.query.edit) {
    const editSlug = route.query.edit
    isEditMode.value = true
    // 等待Vditor初始化完成后再加载文章
    await nextTick()
    loadArticleForEdit(editSlug)
  }
  // 检查是否是草稿编辑模式
  else if (route && route.query && route.query.draft) {
    const draftId = route.query.draft
    // 等待Vditor初始化完成后再加载草稿
    await nextTick()
    loadDraftForEdit(draftId)
  }
  // 新文章模式
  else {
  }
}

// 监听路由变化
watch(() => route.query, handleRouteChange, { immediate: true })

// 组件挂载
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  // 等待DOM完全渲染后再初始化Vditor
  await nextTick()
  
  // 初始化Toast UI编辑器
  await initEditor()
  
  loadPortfolios()
  
  // 添加点击外部关闭下拉框的监听器
  document.addEventListener('click', handleClickOutside)
  
  // 确保字数统计从0开始
  updateWordCount()
})

// 加载文章用于编辑
const loadArticleForEdit = async (articleSlug) => {
  try {
    
    // 直接通过slug获取文章数据
    const article = await articleAPI.getArticleBySlug(articleSlug)
    
    // 检查数据结构，适配不同的响应格式
    const articleData = article?.data || article
    
    if (articleData && articleData.articleId) {
      // 填充表单数据
      articleForm.value = {
        title: articleData.title || '',
        excerpt: articleData.excerpt || '',
        content: articleData.content || '',
        tags: articleData.tags ? articleData.tags.map(tag => tag.name) : [],
        portfolioId: articleData.portfolioId || '',
        allowComments: articleData.allowComments !== false
      }
      
      
      // 设置封面图片
      if (articleData.coverImg) {
        coverPreview.value = articleData.coverImg
      }
      
      // 设置作品集
      if (articleData.portfolioId) {
        selectedPortfolioId.value = articleData.portfolioId
      }
      
      // 设置编辑器内容
      if (editorInstance && articleData.content) {
        try {
          editorInstance.setMarkdown(articleData.content)
        } catch (error) {
        }
      } else {
      }
      
      // 更新字数统计
      updateWordCount()

      // 设置编辑文章ID
      editingArticleId.value = articleData.articleId
      
      // 重要：设置编辑模式为true，确保后续发布时调用updateArticle
      isEditMode.value = true
      
      showNotification('文章加载成功，可以开始编辑', 'success')
    } else {
      showNotification('文章数据为空', 'danger')
    }
  } catch (error) {
    showNotification('加载文章失败：' + (error.message || '未知错误'), 'danger')
  }
}

// 加载草稿用于编辑
const loadDraftForEdit = async (draftId) => {
  try {
    const draft = await articleAPI.getDraftById(draftId)
    
    // 检查数据结构，适配不同的响应格式
    const draftData = draft?.data || draft
    
    if (draftData && draftData.articleId) {
      // 填充表单数据
      articleForm.value = {
        title: draftData.title || '',
        excerpt: draftData.excerpt || '',
        content: draftData.content || '',
        tags: draftData.tags ? draftData.tags : [],
        portfolioId: draftData.portfolioId || '',
        allowComments: true
      }
      
      
      // 设置编辑器内容
      if (editorInstance && draftData.content) {
        try {
          editorInstance.setMarkdown(draftData.content)
        } catch (error) {
        }
      } else {
      }
      
      // 更新字数统计
      updateWordCount()
      
      showNotification('草稿加载成功，可以继续编辑', 'success')
    } else {
      showNotification('草稿数据为空', 'danger')
    }
  } catch (error) {
    showNotification('加载草稿失败：' + (error.message || '未知错误'), 'danger')
  }
}

// 组件卸载时移除监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  
  // 清理定时器和事件监听器
  if (window.contentCheckIntervalRef) {
    clearInterval(window.contentCheckIntervalRef)
  }
  if (window.handleResizeRef) {
    window.removeEventListener('resize', window.handleResizeRef)
  }
  
  // 清除自动保存定时器
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
    autoSaveTimeout.value = null
  }
  
  // 销毁Toast UI编辑器
  if (editorInstance) {
    editorInstance.destroy()
    editorInstance = null
  }
})
</script>

<style scoped>
.publish-page {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  height: calc(100vh - 70px);
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 70px; /* 更新为正确的导航栏高度 */
  left: 0;
  right: 0;
  bottom: 0;
}



/* 合并的编辑器容器 */
.unified-editor-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 1rem auto;
  max-width: 1500px;
  width: 95%;
  border: 1px solid #e9ecef;
  padding: 1.5rem;
}

/* 标题部分样式 */
.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
  height: 60px; /* 固定高度，与计算函数保持一致 */
  box-sizing: border-box;
}

.title-icon {
  font-size: 1.25rem;
  color: #6c757d;
  margin-right: 0.5rem;
}

.title-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
  align-items: center;
}

.auto-save-status {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.auto-save-status .text-success {
  color: #28a745 !important;
}

.auto-save-status .text-danger {
  color: #dc3545 !important;
}

.auto-save-status .text-warning {
  color: #ffc107 !important;
}

/* 头部标题输入框样式 */
.header-title-input {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  padding: 0.5rem 0;
  margin: 0;
  flex: 1;
  min-width: 300px;
  outline: none;
  transition: all 0.2s ease;
  line-height: 1.3;
  letter-spacing: 0.3px;
}

.header-title-input:focus {
  border: none;
  outline: none;
  box-shadow: none;
  color: #34495e;
  transform: translateY(-2px);
}

.header-title-input:hover {
  color: #34495e;
  transform: translateY(-1px);
}

.header-title-input::placeholder {
  color: #bdc3c7;
  font-weight: 400;
  font-size: 1.2rem;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.header-title-input:focus::placeholder {
  opacity: 0.5;
  transform: translateX(5px);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.header-actions .btn {
  border-radius: 6px;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.header-actions .btn:hover {
  transform: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}

.header-actions .btn-outline-secondary {
  border: 1px solid #95a5a6;
  color: #7f8c8d;
  background: white;
}

.header-actions .btn-outline-secondary:hover {
  border-color: #f6d55c;
  background: #f6d55c;
  color: white;
}

.header-actions .btn-warning {
  background: #f39c12;
  border: none;
  color: white;
}

.header-actions .btn-warning:hover {
  background: #e67e22;
  transform: none;
}

/* 通知样式 */
.alert {
  border-radius: 6px;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 0 0 1rem 0;
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  min-height: 45px;
}

.alert-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border-left: 4px solid #28a745;
}

.alert-danger {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.alert-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  color: #856404;
  border-left: 4px solid #ffc107;
}







.editor-header {
  flex-shrink: 0;
  padding: 0.25rem 0;
  margin-bottom: 0.5rem;
  height: 40px; /* 固定高度，与计算函数保持一致 */
  box-sizing: border-box;
}

.editor-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  padding: 0.2rem 0 0.2rem 0.6rem;
  border-radius: 0;
  border: none;
}

.editor-header .form-label {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin: 0;
  display: flex;
  align-items: center;
}

.editor-header .form-label i {
  color: #6c757d;
  margin-right: 0.5rem;
}

.editor-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}



.word-count {
  font-size: 0.85rem;
  color: #6c757d;
  background: transparent;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  box-shadow: none;
  font-weight: 500;
}

.word-count i {
  color: #6c757d;
  margin-right: 0.25rem;
}



/* 编辑器整体容器效果 */
.content-editor-wrapper {
  position: relative;
  overflow: hidden;
  margin-top: 0;
  box-shadow: none;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: transparent;
}



/* Vditor编辑器样式 */
#vditor {
  height: auto;
  min-height: 500px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: height 0.3s ease;
}

#vditor .vditor-ir,
#vditor .vditor-sv,
#vditor .vditor-wysiwyg {
  overflow: hidden !important;
}

#vditor .vditor-ir__editor,
#vditor .vditor-sv__editor,
#vditor .vditor-wysiwyg__editor {
  overflow: hidden !important;
}

/* 确保Vditor编辑器在容器中正确显示 */
.content-editor-wrapper {
  border: none;
  box-shadow: none;
  background: transparent;
  width: 100%;
}

/* 修复Vditor工具栏显示问题 */
#vditor .vditor-toolbar {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  z-index: 10 !important;
}

#vditor .vditor-toolbar .vditor-toolbar__item {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
}

/* 编辑器内容完全左对齐 */
#vditor .vditor-ir {
  text-align: left !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  max-width: none !important;
  margin: 0 !important;
}

#vditor .vditor-sv {
  text-align: left !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  max-width: none !important;
  margin: 0 !important;
}

#vditor .vditor-wysiwyg {
  text-align: left !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  max-width: none !important;
  margin: 0 !important;
}

/* 设置文本框内容左对齐 */
#vditor [contenteditable="true"] {
  text-align: left !important;
}

/* 确保所有文本元素左对齐 */
#vditor .vditor-reset {
  text-align: left !important;
}

/* 文章段落左对齐 */
#vditor .vditor-reset p {
  text-align: left !important;
  margin-left: 0 !important;
}

/* 标题左对齐 */
#vditor .vditor-reset h1,
#vditor .vditor-reset h2,
#vditor .vditor-reset h3,
#vditor .vditor-reset h4,
#vditor .vditor-reset h5,
#vditor .vditor-reset h6 {
  text-align: left !important;
  margin-left: 0 !important;
}

/* 编辑器输入区域完全左对齐 */
#vditor .vditor-ir__editor,
#vditor .vditor-sv__editor,
#vditor .vditor-wysiwyg__editor {
  text-align: left !important;
  padding-left: 0 !important;
  margin-left: 0 !important;
}

/* 确保编辑器内容区域左对齐 */
#vditor .vditor-content {
  text-align: left !important;
}

/* 编辑器工具栏左对齐 */
#vditor .vditor-toolbar {
  justify-content: flex-start !important;
}

/* 强制所有编辑器内容左对齐 */
#vditor .vditor-ir,
#vditor .vditor-sv,
#vditor .vditor-wysiwyg {
  text-align: left !important;
}

/* 编辑器内部所有元素左对齐 */
#vditor .vditor-ir *,
#vditor .vditor-sv *,
#vditor .vditor-wysiwyg * {
  text-align: left !important;
}

/* 编辑器容器左对齐 */
#vditor .vditor {
  text-align: left !important;
}

/* 编辑器输入框左对齐 */
#vditor textarea,
#vditor [contenteditable="true"] {
  text-align: left !important;
  padding-left: 0 !important;
  margin-left: 0 !important;
}

/* 编辑器占位符左对齐 */
#vditor .vditor-ir__editor::placeholder,
#vditor .vditor-sv__editor::placeholder,
#vditor .vditor-wysiwyg__editor::placeholder {
  text-align: left !important;
}

/* 使用更强的选择器覆盖Vditor默认样式 */
#vditor .vditor-ir,
#vditor .vditor-sv,
#vditor .vditor-wysiwyg,
#vditor .vditor-content,
#vditor .vditor-reset,
#vditor [contenteditable="true"],
#vditor textarea,
#vditor .vditor-ir *,
#vditor .vditor-sv *,
#vditor .vditor-wysiwyg * {
  text-align: left !important;
  text-align-last: left !important;
  padding-left: 0 !important;
  margin-left: 0 !important;
}

/* 编辑器输入区域字体设置 */
#vditor .vditor-ir__editor,
#vditor .vditor-sv__editor,
#vditor .vditor-wysiwyg__editor {
  text-align: left !important;
  text-align-last: left !important;
  margin-left: 0 !important;
  font-size: 16px !important;
  line-height: 1.8 !important;
}

/* 强制覆盖Vditor的居中样式 */
#vditor .vditor-ir[style*="text-align: center"],
#vditor .vditor-sv[style*="text-align: center"],
#vditor .vditor-wysiwyg[style*="text-align: center"] {
  text-align: left !important;
}

/* 使用CSS变量强制设置 */
#vditor {
  --vditor-text-align: left !important;
}

/* 覆盖可能的flex居中 */
#vditor .vditor-ir,
#vditor .vditor-sv,
#vditor .vditor-wysiwyg {
  justify-content: flex-start !important;
  align-items: flex-start !important;
}

#vditor .vditor-toolbar .vditor-toolbar__item button {
  display: inline-flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 确保Vditor内容区域正确显示 */
#vditor .vditor-content {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 强制显示所有Vditor元素 */
#vditor * {
  visibility: visible !important;
}

#vditor .vditor-toolbar,
#vditor .vditor-toolbar * {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* 修复图标显示问题 */
#vditor .vditor-toolbar .vditor-toolbar__item button::before {
  font-family: 'Material Icons', 'FontAwesome', sans-serif !important;
  font-size: 16px !important;
  line-height: 1 !important;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

#vditor .vditor-toolbar .vditor-toolbar__item button svg {
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
  width: 16px !important;
  height: 16px !important;
}

/* 确保工具栏按钮内容可见 */
#vditor .vditor-toolbar .vditor-toolbar__item button {
  min-width: 32px !important;
  min-height: 32px !important;
  padding: 8px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}



.hidden {
  display: none !important;
}





/* 模态框样式 */
.setting-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.setting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
}

.setting-title {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.setting-title i {
  color: #f6d55c;
  margin-right: 0.75rem;
}

/* AI摘要生成按钮样式 */
.ai-summary-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.ai-summary-buttons .btn {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.ai-summary-buttons .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.cover-upload {
  text-align: center;
}

.cover-preview {
  width: 100%;
  height: 160px;
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.cover-preview:hover {
  border-color: #f6d55c;
  background-color: #f8f9fa;
  box-shadow: 0 4px 16px rgba(246, 213, 92, 0.15);
}

.cover-preview:hover .cover-placeholder {
  color: #495057;
}

.cover-preview:hover .cover-placeholder i {
  color: #f3a712;
  transform: scale(1.05);
}

.cover-placeholder {
  color: #6c757d;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.cover-placeholder i {
  font-size: 3rem;
  color: #f6d55c;
  transition: all 0.3s ease;
}

.tags-input {
  position: relative;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  min-height: 45px;
}

.tag-item {
  background: linear-gradient(135deg, #f6d55c, #f3a712);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(246, 213, 92, 0.3);
  transition: all 0.3s ease;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(246, 213, 92, 0.4);
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.tag-remove:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

/* 作品集输入组件样式 - 重写 */
.portfolio-input-group {
  width: 100%;
}

.portfolio-input-group .mb-3 {
  margin-bottom: 1rem;
}

.portfolio-input-group .form-group {
  margin-bottom: 0;
  border: none;
  background: none;
  padding: 0;
}

.portfolio-input-group .form-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.portfolio-input-group .form-control {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.portfolio-input-group .form-control:focus {
  border-color: #f6d55c;
  box-shadow: 0 0 0 0.2rem rgba(246, 213, 92, 0.25);
  outline: 0;
}

.portfolio-input-group .input-group {
  display: flex;
  width: 100%;
}

.portfolio-input-group .input-group .form-control {
  border-radius: 0.375rem 0 0 0.375rem;
  border-right: 0;
}

.portfolio-input-group .input-group .btn {
  border-radius: 0 0.375rem 0.375rem 0;
  border-left: 1px solid #dee2e6;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.selected-portfolio .alert {
  border-radius: 8px;
  border: 1px solid #bee5eb;
  background: linear-gradient(135deg, #d1ecf1 0%, #cce7f0 100%);
  color: #0c5460;
  margin: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.selected-portfolio .btn-outline-danger {
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

/* 作品集选择框样式 - 重写 */
.custom-select {
  position: relative;
  width: 100%;
  cursor: pointer;
  user-select: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
}

.select-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #fff;
  color: #495057;
  font-size: 0.875rem;
  line-height: 1.5;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  min-height: 38px;
}

.custom-select:hover .select-display {
  border-color: #f6d55c;
}

.custom-select:focus-within .select-display {
  border-color: #f6d55c;
  box-shadow: 0 0 0 0.2rem rgba(246, 213, 92, 0.25);
  outline: 0;
}

.select-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  margin-left: 0.5rem;
  transition: transform 0.15s ease-in-out;
  color: #6c757d;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.select-arrow.rotated {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  z-index: 1050;
  max-height: 200px;
  overflow-y: auto;
}

.select-option {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.select-option:last-child {
  border-bottom: none;
}

.select-option:hover {
  background-color: #f8f9fa;
}

.select-option.selected {
  background-color: #f6d55c;
  color: #212529;
  font-weight: 500;
}

.select-option.selected:hover {
  background-color: #f3a712;
}

.publish-confirmation {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.confirmation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.confirmation-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.confirmation-list li:last-child {
  border-bottom: none;
}

.confirmation-list li:hover {
  background: #f8f9fa;
  padding-left: 0.5rem;
  border-radius: 8px;
}

/* 发布设置样式 */
.publish-settings {
  border-top: 1px solid #e9ecef;
}

.publish-settings .form-check {
  margin-bottom: 0;
}

.publish-settings .form-check-label {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.publish-settings .form-check-label i {
  color: #6c757d;
}

.text-success {
  color: #28a745 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-danger {
  color: #dc3545 !important;
}

/* 摘要输入框样式优化 */
.publish-page .excerpt-textarea,
.publish-page textarea.excerpt-textarea,
.publish-page .form-control.excerpt-textarea {
  min-height: 100px !important;
  max-height: 150px !important;
  resize: vertical !important;
  padding: 0.75rem !important;
  line-height: 1.5 !important;
  font-size: 0.95rem !important;
  height: auto !important;
  border-radius: 8px !important;
  border: 2px solid #dee2e6 !important;
  transition: all 0.3s ease !important;
}

.publish-page .excerpt-textarea:focus,
.publish-page textarea.excerpt-textarea:focus,
.publish-page .form-control.excerpt-textarea:focus {
  min-height: 100px !important;
  max-height: 180px !important;
  height: auto !important;
  border-color: #f6d55c !important;
  box-shadow: 0 0 0 0.2rem rgba(246, 213, 92, 0.25) !important;
}

/* 发布设置模态框样式优化 */
.publish-settings-modal {
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  border-radius: 16px;
}

.publish-settings-modal .modal-content {
  background: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  min-height: 600px;
}

.publish-settings-modal .modal-header {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-bottom: 1px solid #e9ecef;
  border-radius: 16px 16px 0 0;
}

.publish-settings-modal .modal-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.4;
}

.publish-settings-modal .modal-title i {
  color: #f6d55c;
}

.publish-settings-modal .modal-body {
  max-height: calc(90vh - 180px);
  overflow-y: auto;
  padding: 2rem;
  min-height: 450px;
}

.publish-settings-modal .row {
  margin-left: -1rem;
  margin-right: -1rem;
  height: 100%;
}

.publish-settings-modal .col-md-6 {
  padding-left: 1rem;
  padding-right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.publish-settings-modal .modal-footer {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 16px 16px;
}

/* 设置卡片样式优化 */
.publish-settings-modal .setting-card {
  margin-bottom: 0;
  flex: 1;
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.publish-settings-modal .setting-card:last-child {
  flex: 1.2;
  min-height: 220px;
}

/* 摘要标题和按钮的布局 */
.setting-header-with-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.setting-header-with-buttons .setting-title {
  margin: 0;
  flex: 1;
  min-width: 200px;
}

.setting-header-with-buttons .ai-summary-buttons {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.setting-header-with-buttons .ai-summary-buttons .btn {
  white-space: nowrap;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .publish-header {
    margin-left: 1rem;
    margin-right: 1rem;
    padding: 1rem 1.5rem;
  }
  
  .publish-content {
    margin-left: 1rem;
    margin-right: 1rem;
  }
  
  .header-title-input {
    min-width: 400px;
  }
}

@media (max-width: 992px) {
  .publish-header {
    flex-direction: column;
    text-align: center;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    padding: 1rem;
  }
  
  .publish-content {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .edit-section {
    height: 100%;
    padding: 1rem;
  }
  
  .header-title-input {
    min-width: 100%;
    font-size: 1.3rem;
    text-align: center;
  }
  
  .title-section {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .publish-page {
    padding: 0.5rem 0;
  }
  
  .publish-header {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .header-title-input {
    font-size: 1.2rem;
  }
  
  .header-actions {
    justify-content: center;
    width: 100%;
  }
  
  .edit-section {
    padding: 0.75rem;
  }
  
  .editor-header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .editor-toolbar {
    justify-content: center;
  }
  
  .editor-toolbar .btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
  
  /* 移动端作品集输入优化 */
  .portfolio-input-group {
    padding: 0;
  }
  
  .portfolio-input-group .input-group {
    flex-direction: column;
  }
  
  .portfolio-input-group .input-group .form-control {
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    border-right: 1px solid #dee2e6;
  }
  
  .portfolio-input-group .input-group .btn {
    border-radius: 0.375rem;
    border-left: 1px solid #dee2e6;
  }
  
  /* 移动端下拉框优化 */
  .custom-select {
    width: 100%;
  }
  
  .select-dropdown {
    max-height: 150px;
  }
  
  /* 移动端模态框优化 */
  .publish-settings-modal .modal-dialog {
    max-width: 98vw;
    width: 98vw;
    margin: 1rem auto 0.5rem auto;
  }
  
  .publish-settings-modal .modal-body {
    max-height: calc(90vh - 100px);
    padding: 1.5rem;
  }
  
  .publish-settings-modal .modal-header,
  .publish-settings-modal .modal-footer {
    padding: 1.5rem;
  }
  
  .publish-settings-modal .modal-title {
    font-size: 1.3rem;
  }
  
  .publish-settings-modal .setting-card {
    padding: 1.5rem;
    min-height: 150px;
  }
}

/* 确保模态框正确显示 */
.modal.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-backdrop.show {
  opacity: 0.5;
  z-index: 1049;
}

/* 强制模态框显示 */
.modal.show .publish-settings-modal {
  display: block;
  visibility: visible;
  opacity: 1;
}

/* 确保模态框内容可见 */
.modal-dialog {
  margin: 6rem auto 2rem auto;
  position: relative;
  z-index: 1051;
}

/* Toast UI Editor 样式修复 - 去除黑色区域 */
:deep(.toastui-editor) {
  border: 1px solid #e9ecef !important;
  border-radius: 0.375rem !important;
  background: white !important;
  background-color: white !important;
}

/* 修复编辑器内部所有可能的黑色区域 */
:deep(.toastui-editor *),
:deep(.toastui-editor *:before),
:deep(.toastui-editor *:after) {
  background: white !important;
  background-color: white !important;
}

/* 特别修复编辑器容器 */
:deep(.toastui-editor .toastui-editor-md-container) {
  background: white !important;
  background-color: white !important;
}

:deep(.toastui-editor .toastui-editor-md-container .toastui-editor) {
  background: white !important;
  background-color: white !important;
}

/* 修复编辑器内容区域 */
:deep(.toastui-editor .toastui-editor-contents) {
  background: white !important;
  background-color: white !important;
  color: #333 !important;
}

:deep(.toastui-editor .toastui-editor-contents *:not(code):not(.hljs)) {
  background: white !important;
  background-color: white !important;
  color: #333 !important;
}

/* 修复ProseMirror编辑器 */
:deep(.toastui-editor .ProseMirror) {
  background: white !important;
  background-color: white !important;
  color: #333 !important;
}

:deep(.toastui-editor .ProseMirror *) {
  background: white !important;
  background-color: white !important;
  color: #333 !important;
}

/* 修复工具栏可能的黑色区域 */
:deep(.toastui-editor .toastui-editor-toolbar) {
  background: white !important;
  background-color: white !important;
  border-bottom: 1px solid #e9ecef !important;
}

:deep(.toastui-editor .toastui-editor-toolbar *) {
  background: white !important;
  background-color: white !important;
}

/* 修复编辑器模式切换按钮 */
:deep(.toastui-editor .toastui-editor-mode-switch) {
  background: white !important;
  background-color: white !important;
}

:deep(.toastui-editor .toastui-editor-mode-switch *) {
  background: white !important;
  background-color: white !important;
}

/* 强制覆盖所有可能的黑色边框 */
:deep(.toastui-editor *[style*="background: black"]) {
  background: white !important;
  background-color: white !important;
}

:deep(.toastui-editor *[style*="background-color: black"]) {
  background: white !important;
  background-color: white !important;
}

:deep(.toastui-editor *[style*="background: #000"]) {
  background: white !important;
  background-color: white !important;
}

:deep(.toastui-editor *[style*="background-color: #000"]) {
  background: white !important;
  background-color: white !important;
}

/* 响应式模态框优化 */
@media (max-width: 1200px) {
  .publish-settings-modal .modal-dialog {
    max-width: 95vw;
    width: 95vw;
    margin: 2rem auto 1rem auto;
  }
  
  .publish-settings-modal .modal-body {
    max-height: calc(90vh - 160px);
    padding: 2rem;
  }
  
  .publish-settings-modal .modal-header {
    padding: 1.5rem 2rem;
  }
  
  .publish-settings-modal .modal-footer {
    padding: 1.5rem 2rem;
  }
}

/* 自定义滚动条样式 */
.wysiwyg-editor::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 8px;
}

.wysiwyg-editor::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.wysiwyg-editor::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.wysiwyg-editor::-webkit-scrollbar-thumb:hover,
.preview-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保预览内容区域在Firefox和其他浏览器中也能正确滚动 */
.preview-content {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}



/* 自定义滚动条样式 */
.content-editor::-webkit-scrollbar {
  width: 8px;
}

.content-editor::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.content-editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.content-editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保预览内容区域在Firefox和其他浏览器中也能正确滚动 */
.content-editor {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}
</style>
