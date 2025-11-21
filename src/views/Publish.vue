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

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const articleForm = ref({
  title: '',
  excerpt: '',
  content: '',
  tags: [],
  portfolioId: '',
  allowComments: true,
  coverImg: null
})

const showPublishModal = ref(false)
const wordCount = ref(0)
const newTag = ref('')
const selectedPortfolioId = ref('')
const portfolios = ref([])
const newPortfolioName = ref('')
const isPortfolioDropdownOpen = ref(false)
const portfolioSelectContainer = ref(null)
const isCreatingPortfolio = ref(false)
const isPublishing = ref(false)
const coverPreview = ref(null)
const coverInput = ref(null)
const isEditMode = ref(false)
const editingArticleId = ref(null)
const isSaving = ref(false)
const autoSaveStatus = ref('')
const autoSaveTimeout = ref(null)
const isGeneratingSummary = ref(false)
const notification = ref({ show: false, message: '', type: 'success' })
const editorWrapper = ref(null)
const editorContainer = ref(null)
let editorInstance = null;
const imageUploadInput = ref(null);

const canPublish = computed(() => {
  return articleForm.value.title.trim() !== '' && articleForm.value.content.trim() !== '';
})

const canActuallyPublish = computed(() => {
  return articleForm.value.title.trim() !== '' &&
         articleForm.value.content.trim() !== '' &&
         articleForm.value.excerpt.trim() !== '';
})

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type };
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

const handleTitleChange = () => {
  // Trigger auto-save or other logic when title changes
};

const updateWordCount = () => {
  if (editorInstance) {
    const markdown = editorInstance.getMarkdown();
    const text = markdown.replace(/<\/?[^>]+(>|$)/g, ""); // strip html tags
    const matches = text.match(/[\u4e00-\u9fa5]|\b\w+\b/g); // count chinese characters and english words
    wordCount.value = matches ? matches.length : 0;
  }
};

const initEditor = async () => {
  if (editorContainer.value) {
    editorInstance = new Editor({
      el: editorContainer.value,
      height: '500px',
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      events: {
        change: () => {
          articleForm.value.content = editorInstance.getMarkdown();
          updateWordCount();
        }
      }
    });
  }
};

const saveDraft = async () => {
  isSaving.value = true;
  autoSaveStatus.value = '正在自动保存...';
  try {
    const draftData = {
      ...articleForm.value,
      tags: articleForm.value.tags,
      portfolioName: getSelectedPortfolioName()
    };
    if (editingArticleId.value) {
        draftData.id = editingArticleId.value;
    }
    const response = await articleAPI.saveDraft(draftData);
    if(response && response.articleId) {
        editingArticleId.value = response.articleId;
    }
    autoSaveStatus.value = `已自动保存 ${new Date().toLocaleTimeString()}`;
    showNotification('草稿保存成功', 'success');
  } catch (error) {
    autoSaveStatus.value = '自动保存失败';
    showNotification('草稿保存失败', 'danger');
  } finally {
    isSaving.value = false;
  }
};

const togglePublishModal = () => {
  showPublishModal.value = !showPublishModal.value;
};

const confirmPublish = async () => {
  isPublishing.value = true;
  try {
    const articleData = {
      ...articleForm.value
    };
    if (isEditMode.value) {
      await articleAPI.updateArticle(editingArticleId.value, articleData);
      showNotification('文章更新成功', 'success');
    } else {
      await articleAPI.publishArticle(articleData);
      showNotification('文章发布成功', 'success');
    }
    router.push('/'); // Redirect to home or article page
  } catch (error) {
    showNotification('发布失败', 'danger');
  } finally {
    isPublishing.value = false;
  }
};

const handleImageUpload = (e) => {
    // Logic to upload image and insert into editor
};

const generateAISummary = async () => {
    isGeneratingSummary.value = true;
    try {
        const response = await aiAPI.generateSummary(articleForm.value.content);
        articleForm.value.excerpt = response.summary;
    } catch (error) {
        showNotification('AI摘要生成失败', 'danger');
    } finally {
        isGeneratingSummary.value = false;
    }
};

const clearExcerpt = () => {
    articleForm.value.excerpt = '';
};

const triggerCoverUpload = () => {
    coverInput.value.click();
};

const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            coverPreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
        articleForm.value.coverImg = file;
    }
};

const removeCover = () => {
    coverPreview.value = null;
    articleForm.value.coverImg = null;
    coverInput.value.value = '';
};

const addTag = () => {
    const tag = newTag.value.trim();
    if (tag && !articleForm.value.tags.includes(tag)) {
        articleForm.value.tags.push(tag);
    }
    newTag.value = '';
};

const removeTag = (tag) => {
    articleForm.value.tags = articleForm.value.tags.filter(t => t !== tag);
};

const loadPortfolios = async () => {
    try {
        const response = await portfolioAPI.getUserPortfolios(authStore.user.id);
        portfolios.value = response;
    } catch (error) {
        // handle error
    }
};

const togglePortfolioDropdown = () => {
    isPortfolioDropdownOpen.value = !isPortfolioDropdownOpen.value;
};

const getPortfolioSelectText = () => {
    if (selectedPortfolioId.value) {
        const portfolio = portfolios.value.find(p => p.id === selectedPortfolioId.value);
        return portfolio ? portfolio.title : '-- 选择现有作品集 --';
    }
    return '-- 选择现有作品集 --';
};

const selectPortfolio = (id) => {
    selectedPortfolioId.value = id;
    articleForm.value.portfolioId = id;
    isPortfolioDropdownOpen.value = false;
};

const createNewPortfolio = async () => {
    const name = newPortfolioName.value.trim();
    if (name) {
        isCreatingPortfolio.value = true;
        try {
            const newPortfolio = await portfolioAPI.createPortfolio({ name });
            portfolios.value.push(newPortfolio);
            selectPortfolio(newPortfolio.id);
            newPortfolioName.value = '';
        } catch (error) {
            // handle error
        } finally {
            isCreatingPortfolio.value = false;
        }
    }
};

const getSelectedPortfolioName = () => {
    if (articleForm.value.portfolioId) {
        const portfolio = portfolios.value.find(p => p.id === articleForm.value.portfolioId);
        return portfolio ? portfolio.title : '';
    }
    return newPortfolioName.value || '';
};

const clearPortfolio = () => {
    selectedPortfolioId.value = '';
    articleForm.value.portfolioId = '';
    newPortfolioName.value = '';
};

const getStatusClass = (field) => {
    // logic to return success/warning/danger class
    return 'text-success';
};

const getStatusText = (field) => {
    switch(field) {
        case 'excerpt':
            return articleForm.value.excerpt.trim() ? '已填写' : '未填写';
        case 'portfolio':
            return getSelectedPortfolioName() ? getSelectedPortfolioName() : '未选择';
        case 'tags':
            return articleForm.value.tags.length > 0 ? articleForm.value.tags.join(', ') : '未添加';
        default:
            return '';
    }
};

const handleClickOutside = (event) => {
  if (portfolioSelectContainer.value && !portfolioSelectContainer.value.contains(event.target)) {
    isPortfolioDropdownOpen.value = false;
  }
};

watch(() => route.query, (query) => {
    if (query.edit) {
        loadArticleForEdit(query.edit);
    } else if (query.draft) {
        loadDraftForEdit(query.draft);
    }
}, { immediate: true });

// 组件挂载
onMounted(async () => {
  import('highlight.js/styles/github.css');
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