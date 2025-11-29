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
          <button
            @click="saveDraft"
            class="btn btn-outline-secondary me-2"
            :disabled="isSaving"
          >
            <i class="fas fa-save me-1"></i>
            {{ isSaving ? '保存中...' : '保存草稿' }}
          </button>
          <span v-if="autoSaveStatus" class="auto-save-status-inline ms-2 text-muted small">
            <div v-if="autoSaveStatus === '正在自动保存...'" class="spinner-inline me-1"></div>
            <i v-else
              class="fas me-1"
              :class="{
                'fa-check-circle text-success': autoSaveStatus.includes('已自动保存'),
                'fa-exclamation-circle text-danger': autoSaveStatus === '自动保存失败'
              }"
            ></i>
            {{ autoSaveStatus }}
          </span>
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

      <!-- Vditor 编辑器容器 -->
      <div class="content-editor-wrapper">
        <div id="vditor" ref="editorContainer" style="height: 100%;"></div>
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
                          <div v-if="isCreatingPortfolio" class="spinner-inline"></div>
                          <i v-else class="fas fa-plus"></i>
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
import { articleAPI } from '@/api/article'
import { portfolioAPI } from '@/api/portfolio'
import { aiAPI } from '@/api/ai'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

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
  triggerAutoSave();
};

const updateWordCount = () => {
  if (editorInstance) {
    const text = editorInstance.getValue().replace(/<\/?[^>]+(>|$)/g, "");
    const matches = text.match(/[\u4e00-\u9fa5]|\b\w+\b/g);
    wordCount.value = matches ? matches.length : 0;
  }
};

const triggerAutoSave = () => {
  if (!isEditMode.value && !editingArticleId.value && !articleForm.value.title.trim() && !articleForm.value.content.trim()) {
    autoSaveStatus.value = ''; // 没有内容时，清空状态
    return;
  }
  if (autoSaveTimeout.value) clearTimeout(autoSaveTimeout.value);
  isSaving.value = true; // 触发保存按钮的禁用状态
  autoSaveStatus.value = `有未保存的更改...`; // 轻微提示有更改
  autoSaveTimeout.value = setTimeout(() => {
    saveDraft();
  }, 3000);
};

const initEditor = async () => {
  if (editorContainer.value && !editorInstance) {
    editorInstance = new Vditor(editorContainer.value, {
      cache: {
        id: editingArticleId.value || 'new-article',
      },
      height: '100%',
      mode: 'ir',
      placeholder: '在这里开始你的创作...',
      after: () => {
        if (articleForm.value.content) {
          editorInstance.setValue(articleForm.value.content);
        }
        updateWordCount();
      },
      input: (value) => {
        articleForm.value.content = value;
        updateWordCount();
        triggerAutoSave();
      },
    });
  }
};

const saveDraft = async () => {
  // 只有当isSaving为true时才显示加载状态，防止非自动保存调用也显示
  if (isSaving.value) autoSaveStatus.value = '正在自动保存...';
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
    router.push('/');
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
        const response = await portfolioAPI.getAllPortfolios();
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



onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  await nextTick()
  await initEditor()
  loadPortfolios()
  document.addEventListener('click', handleClickOutside)
})

const loadArticleForEdit = async (articleSlug) => {
  try {
    autoSaveStatus.value = ''; // 清除自动保存状态
    const article = await articleAPI.getArticleBySlug(articleSlug)
    const articleData = article?.data || article
    if (articleData && articleData.articleId) {
      articleForm.value = {
        title: articleData.title || '',
        excerpt: articleData.excerpt || '',
        content: articleData.content || '',
        tags: articleData.tags ? articleData.tags.map(tag => tag.name) : [],
        portfolioId: articleData.portfolioId || '',
        allowComments: articleData.allowComments !== false
      }
      if (articleData.coverImg) {
        coverPreview.value = articleData.coverImg
      }
      if (articleData.portfolioId) {
        selectedPortfolioId.value = articleData.portfolioId
      }
      editingArticleId.value = articleData.articleId
      isEditMode.value = true
      
      // 如果编辑器已初始化，手动设置内容
      if (editorInstance) {
        editorInstance.setValue(articleForm.value.content);
        updateWordCount();
      }

      showNotification('文章加载成功，可以开始编辑', 'success')
    } else {
      showNotification('文章数据为空', 'danger')
    }
  } catch (error) {
    showNotification('加载文章失败：' + (error.message || '未知错误'), 'danger')
  }
}

const loadDraftForEdit = async (draftId) => {
  try {
    autoSaveStatus.value = ''; // 清除自动保存状态
    const draft = await articleAPI.getDraftById(draftId)
    const draftData = draft?.data || draft
    if (draftData && draftData.articleId) {
      articleForm.value = {
        title: draftData.title || '',
        excerpt: draftData.excerpt || '',
        content: draftData.content || '',
        tags: draftData.tags ? draftData.tags : [],
        portfolioId: draftData.portfolioId || '',
        allowComments: true
      }
      editingArticleId.value = draftData.articleId;
      
      // 如果编辑器已初始化，手动设置内容
      if (editorInstance) {
        editorInstance.setValue(articleForm.value.content);
        updateWordCount();
      }

      showNotification('草稿加载成功，可以继续编辑', 'success')
    } else {
      showNotification('草稿数据为空', 'danger')
    }
  } catch (error) {
    showNotification('加载草稿失败：' + (error.message || '未知错误'), 'danger')
  }
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (editorInstance) {
    editorInstance.destroy()
    editorInstance = null
  }
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value);
    autoSaveTimeout.value = null;
  }
  autoSaveStatus.value = ''; // 清除自动保存状态
})
watch(() => route.query, (query) => {
    if (query.edit) {
        loadArticleForEdit(query.edit);
    } else if (query.draft) {
        loadDraftForEdit(query.draft);
    }
}, { immediate: true });

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
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
}

.unified-editor-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 1rem auto;
  max-width: 1500px;
  width: 95%;
  border: 1px solid #e9ecef;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: calc(100% - 2rem);
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
  height: 60px;
  box-sizing: border-box;
  flex-shrink: 0;
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

.auto-save-status-inline {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  white-space: nowrap;
  color: #6c757d; /* 默认颜色，可根据状态动态调整 */
}

.auto-save-status-inline .text-success {
  color: #28a745 !important;
}

.auto-save-status-inline .text-danger {
  color: #dc3545 !important;
}

.auto-save-status-inline .fa-spinner {
  color: #ffc107; /* 正在保存时的颜色 */
}

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
}

.alert {
  border-radius: 6px;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 1rem 0 1rem 0;
  flex-shrink: 0;
  padding: 0.75rem 1.25rem;
}

.editor-header {
  flex-shrink: 0;
  padding: 0.25rem 0;
  margin-bottom: 0.5rem;
  height: 40px;
  box-sizing: border-box;
}

.editor-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-count {
  font-size: 0.85rem;
  color: #6c757d;
}

.content-editor-wrapper {
  position: relative;
  overflow: hidden;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.setting-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #dee2e6;
}

.setting-title {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
}

.cover-preview {
  width: 100%;
  height: 160px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder i {
  font-size: 2.5rem;
  color: #adb5bd;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag-item {
  background: #e9ecef;
  color: #495057;
  padding: 0.3rem 0.75rem;
  border-radius: 15px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tag-remove {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
}

.modal.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  margin: 6rem auto 2rem auto;
}

/* Custom Spinner Styles */
.spinner-inline {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 193, 7, 0.2);
  border-radius: 50%;
  border-top-color: #ffc107;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>