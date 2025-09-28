# Vercel 部署配置指南

## 环境变量配置

在 Vercel 部署时，需要在项目设置中配置以下环境变量：

### 必需的环境变量

1. **VITE_API_URL**
   - 描述：后端API服务器地址
   - 示例值：`https://your-aliyun-server.com/api`
   - 说明：替换为你的阿里云服务器实际地址

### 可选的环境变量

2. **VITE_APP_TITLE**
   - 描述：应用标题
   - 默认值：`Hive Blog Platform`
   - 示例值：`我的博客平台`

3. **VITE_APP_VERSION**
   - 描述：应用版本
   - 默认值：`1.0.0`

4. **VITE_APP_ENV**
   - 描述：应用环境
   - 生产环境值：`production`

5. **VITE_APP_DEBUG**
   - 描述：调试模式
   - 生产环境值：`false`

## 在 Vercel 中配置环境变量

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 进入 "Settings" 标签页
4. 点击 "Environment Variables" 部分
5. 添加上述环境变量
6. 确保为 "Production" 环境设置正确的值

## 阿里云服务器配置示例

### 1. 使用公网IP地址
如果你的阿里云服务器公网IP是 `123.456.789.123:8090`，则配置：

```
VITE_API_URL=https://123.456.789.123:8090/api
```

### 2. 使用域名（推荐）
如果你有域名，例如 `api.yourdomain.com`，则配置：

```
VITE_API_URL=https://api.yourdomain.com/api
```

### 3. 使用子域名
```
VITE_API_URL=https://backend.yourdomain.com/api
VITE_API_URL=https://api.yourdomain.com/api
```

### 4. 使用主域名
```
VITE_API_URL=https://yourdomain.com:8090/api
```

## 部署步骤

1. 确保代码已推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 点击 "Deploy" 开始部署

## 注意事项

- 确保阿里云服务器的防火墙已开放相应端口
- 如果使用HTTPS，确保SSL证书配置正确
- 后端需要配置CORS以允许前端域名访问
