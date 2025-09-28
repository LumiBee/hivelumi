#!/usr/bin/env node

/**
 * 图片优化脚本
 * 用于压缩和转换图片格式，提升网站性能
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查是否安装了必要的工具
function checkDependencies() {
  try {
    execSync('which magick', { stdio: 'ignore' });
    console.log('✅ ImageMagick 已安装');
  } catch (error) {
    console.log('❌ 请先安装 ImageMagick: brew install imagemagick');
    process.exit(1);
  }
}

// 优化单张图片
function optimizeImage(inputPath, outputDir, options = {}) {
  const {
    maxWidth = 1200,
    quality = 85,
    formats = ['webp', 'avif'],
    lazyLoad = true
  } = options;

  const fileName = path.basename(inputPath, path.extname(inputPath));
  const inputDir = path.dirname(inputPath);
  
  console.log(`🔄 正在优化: ${inputPath}`);

  // 获取原始文件大小
  const originalSize = fs.statSync(inputPath).size;
  console.log(`📊 原始大小: ${(originalSize / 1024).toFixed(2)} KB`);

  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 优化JPEG版本
  const jpegOutput = path.join(outputDir, `${fileName}.jpg`);
  try {
    execSync(`magick "${inputPath}" -resize ${maxWidth}x> -quality ${quality} -strip "${jpegOutput}"`, { stdio: 'pipe' });
    const jpegSize = fs.statSync(jpegOutput).size;
    console.log(`✅ JPEG优化完成: ${(jpegSize / 1024).toFixed(2)} KB (压缩率: ${((1 - jpegSize / originalSize) * 100).toFixed(1)}%)`);
  } catch (error) {
    console.log(`❌ JPEG优化失败: ${error.message}`);
  }

  // 生成WebP版本
  if (formats.includes('webp')) {
    const webpOutput = path.join(outputDir, `${fileName}.webp`);
    try {
      execSync(`magick "${inputPath}" -resize ${maxWidth}x> -quality ${quality} -strip "${webpOutput}"`, { stdio: 'pipe' });
      const webpSize = fs.statSync(webpOutput).size;
      console.log(`✅ WebP生成完成: ${(webpSize / 1024).toFixed(2)} KB (压缩率: ${((1 - webpSize / originalSize) * 100).toFixed(1)}%)`);
    } catch (error) {
      console.log(`❌ WebP生成失败: ${error.message}`);
    }
  }

  // 生成AVIF版本
  if (formats.includes('avif')) {
    const avifOutput = path.join(outputDir, `${fileName}.avif`);
    try {
      execSync(`magick "${inputPath}" -resize ${maxWidth}x> -quality ${quality} -strip "${avifOutput}"`, { stdio: 'pipe' });
      const avifSize = fs.statSync(avifOutput).size;
      console.log(`✅ AVIF生成完成: ${(avifSize / 1024).toFixed(2)} KB (压缩率: ${((1 - avifSize / originalSize) * 100).toFixed(1)}%)`);
    } catch (error) {
      console.log(`❌ AVIF生成失败: ${error.message}`);
    }
  }
}

// 生成响应式图片HTML
function generateResponsiveImageHTML(fileName, alt = '') {
  return `
<picture>
  <source srcset="/img/optimized/${fileName}.avif" type="image/avif">
  <source srcset="/img/optimized/${fileName}.webp" type="image/webp">
  <img src="/img/optimized/${fileName}.jpg" alt="${alt}" loading="lazy" decoding="async">
</picture>`;
}

// 主函数
function main() {
  console.log('🚀 开始图片优化...\n');
  
  checkDependencies();

  const publicDir = path.join(__dirname, '..', 'public');
  const imgDir = path.join(publicDir, 'img');
  const optimizedDir = path.join(imgDir, 'optimized');

  // 需要优化的图片列表
  const imagesToOptimize = [
    {
      input: path.join(imgDir, 'default.jpg'),
      options: { maxWidth: 800, quality: 80, lazyLoad: true }
    },
    {
      input: path.join(imgDir, 'demo', '1.jpg'),
      options: { maxWidth: 1200, quality: 85, lazyLoad: false }
    },
    {
      input: path.join(imgDir, 'logo.png'),
      options: { maxWidth: 200, quality: 90, formats: ['webp'], lazyLoad: false }
    }
  ];

  // 创建优化后的图片
  imagesToOptimize.forEach(({ input, options }) => {
    if (fs.existsSync(input)) {
      optimizeImage(input, optimizedDir, options);
      console.log(''); // 空行分隔
    } else {
      console.log(`⚠️  文件不存在: ${input}`);
    }
  });

  // 生成优化后的图片使用示例
  const exampleHTML = `
<!-- 优化后的图片使用示例 -->
${generateResponsiveImageHTML('default', '默认图片')}
${generateResponsiveImageHTML('1', '示例图片')}
${generateResponsiveImageHTML('logo', 'Logo')}
`;

  fs.writeFileSync(path.join(optimizedDir, 'usage-example.html'), exampleHTML);
  console.log('📝 使用示例已生成: /img/optimized/usage-example.html');
  console.log('\n✅ 图片优化完成！');
}

// 检查是否是直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { optimizeImage, generateResponsiveImageHTML };
