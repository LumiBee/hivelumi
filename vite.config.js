import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

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
            if (id.includes('node_modules')) {
              if (id.includes('highlight.js')) {
                return 'highlightjs';
              }
              // Group other large libraries or frameworks as needed
              if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
                return 'vue-framework';
              }
              // Default vendor chunk for other node_modules
              return 'vendor';
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