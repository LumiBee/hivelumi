# Hive Frontend

Vue.js前端应用，用于Hive博客平台。

## 技术栈

- Vue 3
- Vite
- Bootstrap 5
- Pinia
- Vue Router
- Axios

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并配置：

```bash
# 后端API地址
VITE_API_URL=https://your-backend-domain.com/api

# 应用信息
VITE_APP_TITLE=Hive Blog Platform
VITE_APP_VERSION=1.0.0
```

## 部署

本项目配置了Vercel部署，支持：

- 自动构建和部署
- 环境变量配置
- SPA路由支持
- 静态资源优化

## 项目结构

```
src/
├── api/           # API接口
├── assets/        # 静态资源
├── components/    # Vue组件
├── router/        # 路由配置
├── store/         # 状态管理
├── utils/         # 工具函数
└── views/         # 页面组件
```
