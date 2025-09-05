import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { splitVendorChunkPlugin } from 'vite'

export default defineConfig(({ mode }) => {
  // 根据环境变量获取后端地址
  const getBackendUrl = () => {
    // 优先使用环境变量中的API地址
    const envApiUrl = process.env.VITE_API_URL
    if (envApiUrl) {
      // 如果环境变量包含完整URL，提取基础URL
      if (envApiUrl.includes('/api')) {
        return envApiUrl.replace('/api', '')
      }
      return envApiUrl
    }
    
    // 开发环境默认使用localhost
    if (mode === 'development') {
      return 'http://localhost:8090'
    }
    
    // 生产环境默认（需要用户配置）
    return 'https://api.hivelumi.com'
  }

  const backendUrl = getBackendUrl()
  const isHttps = backendUrl.startsWith('https://')

  return {
    plugins: [
      vue(),
      splitVendorChunkPlugin()
    ],
    appType: 'spa', // 指定为SPA应用，自动处理路由
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      open: true, // 自动打开浏览器
      // 处理SPA路由，所有未匹配的路由都返回index.html
      fs: {
        allow: ['..']
      },
      proxy: {
        // API接口代理
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        // 认证相关代理
        '/login': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        '/signup': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        '/logout': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        // OAuth2代理
        '/oauth2': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        '/login-process': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        // 文件上传代理
        '/uploads': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('uploads proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending uploads Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received uploads Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        // 内容页面代理（用于SSR内容获取）
        '/api/article': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        },
        '/search': {
          target: backendUrl,
          changeOrigin: true,
          secure: isHttps,
        }
      }
      },
    build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭sourcemap
    minify: 'terser', // 使用terser进行更彻底的压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // 移除特定函数调用
        passes: 2, // 多次压缩优化
        unsafe: true, // 启用不安全的优化
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true
      },
      mangle: {
        toplevel: true, // 混淆顶级作用域
        properties: {
          regex: /^_/ // 混淆以下划线开头的属性
        }
      }
    },
    rollupOptions: {
      output: {
        // 更智能的代码分割
        manualChunks: (id) => {
          // Vue核心库
          if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vue-vendor'
          }
          // UI框架
          if (id.includes('bootstrap')) {
            return 'bootstrap-vendor'
          }
          // 工具库
          if (id.includes('axios') || id.includes('dompurify')) {
            return 'utils-vendor'
          }
          // 图标库
          if (id.includes('fontawesome')) {
            return 'icons-vendor'
          }
          // 其他第三方库
          if (id.includes('node_modules') && !id.includes('vue') && !id.includes('bootstrap') && !id.includes('axios') && !id.includes('fontawesome')) {
            return 'other-vendor'
          }
        },
        // 文件名优化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 禁用CSS代码分割，确保样式正确加载
    cssCodeSplit: false,
    // 设置块大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用压缩
    reportCompressedSize: true
  },
    // 预构建优化
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios', 'bootstrap', 'bootstrap-vue-next'],
      exclude: ['@fortawesome/fontawesome-free'] // 排除大体积的图标库
    },
    // 环境变量配置
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    }
  }
})
