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
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vue核心库 - 最高优先级
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
            // UI框架 - 高优先级
            if (id.includes('bootstrap')) {
              return 'bootstrap-vendor'
            }
            // 工具库 - 高优先级
            if (id.includes('axios') || id.includes('dompurify')) {
              return 'utils-vendor'
            }
            // 图标库 - 中优先级
            if (id.includes('fontawesome')) {
              return 'icons-vendor'
            }
            // 页面组件 - 按路由分割
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
          },
          // 优化文件名
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      cssCodeSplit: false, // 禁用CSS代码分割，避免样式问题
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: true
    }
  }
})