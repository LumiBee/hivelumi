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
        }
      }
    },
    preview: {
      port: 4173,
      open: true,
      proxy: {
        // Preview模式也使用代理，避免CORS问题
        '/api': {
          target: mode === 'development' ? 'http://localhost:8090' : 'https://api.hivelumi.com',
          changeOrigin: true,
          secure: mode !== 'development',
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
          passes: 2,
          dead_code: true,
          unused: true
        },
        mangle: {
          toplevel: true
        }
      },
      // 确保正确的MIME类型
      assetsInlineLimit: 4096,
      // 修复MIME类型问题
      target: 'es2015',
      modulePreload: {
        polyfill: false
      },
      // 确保正确的MIME类型设置
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vue核心库 - 最高优先级，单独打包
            if (id.includes('vue') && !id.includes('node_modules')) {
              return 'vue-core'
            }
            if (id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
            // 大型UI库 - 单独打包
            if (id.includes('bootstrap')) {
              return 'bootstrap-vendor'
            }
            // 编辑器相关 - 按需加载
            if (id.includes('@tiptap') || id.includes('@toast-ui')) {
              return 'editor-vendor'
            }
            // 工具库 - 高优先级
            if (id.includes('axios') || id.includes('dompurify') || id.includes('marked')) {
              return 'utils-vendor'
            }
            // 图标库 - 中优先级
            if (id.includes('fontawesome') || id.includes('@fortawesome')) {
              return 'icons-vendor'
            }
            // 动画库 - 按需加载
            if (id.includes('aos') || id.includes('swiper')) {
              return 'animation-vendor'
            }
            // 页面组件 - 按路由分割（已在路由中懒加载）
            if (id.includes('/views/')) {
              const viewName = id.split('/views/')[1].split('.')[0]
              return `page-${viewName}`
            }
            // 工具函数 - 按功能分割
            if (id.includes('/utils/')) {
              return 'utils'
            }
            // 组件 - 按类型分割
            if (id.includes('/components/')) {
              return 'components'
            }
            // 第三方库 - 按大小和重要性分组
            if (id.includes('node_modules')) {
              // 大型库单独打包
              if (id.includes('highlight.js') || id.includes('lowlight')) {
                return 'syntax-vendor'
              }
              // 其他第三方库
              return 'vendor'
            }
          },
          // 优化文件名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      cssCodeSplit: true, // 启用CSS代码分割，按需加载样式
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: true
    }
  }
})