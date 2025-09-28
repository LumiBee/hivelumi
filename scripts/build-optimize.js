#!/usr/bin/env node

/**
 * 构建优化脚本
 * 用于分析和优化构建产物
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 分析构建产物
function analyzeBuild() {
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log('❌ 构建目录不存在，请先运行 npm run build');
    return;
  }

  console.log('📊 分析构建产物...\n');

  // 分析JS文件
  const jsDir = path.join(distDir, 'assets', 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
    console.log('📦 JavaScript 文件:');
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${file}: ${sizeKB} KB`);
    });
    console.log('');
  }

  // 分析CSS文件
  const cssDir = path.join(distDir, 'assets', 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    console.log('🎨 CSS 文件:');
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${file}: ${sizeKB} KB`);
    });
    console.log('');
  }

  // 分析图片文件
  const imgDir = path.join(distDir, 'img');
  if (fs.existsSync(imgDir)) {
    const imgFiles = fs.readdirSync(imgDir, { recursive: true })
      .filter(file => /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(file));
    
    if (imgFiles.length > 0) {
      console.log('🖼️  图片文件:');
      imgFiles.forEach(file => {
        const filePath = path.join(imgDir, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  ${file}: ${sizeKB} KB`);
      });
      console.log('');
    }
  }

  // 计算总大小
  const totalSize = calculateTotalSize(distDir);
  console.log(`📈 总构建大小: ${(totalSize / 1024).toFixed(2)} KB`);
}

// 计算目录总大小
function calculateTotalSize(dir) {
  let totalSize = 0;
  
  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        traverse(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }
  
  traverse(dir);
  return totalSize;
}

// 生成构建报告
function generateBuildReport() {
  const distDir = path.join(__dirname, '..', 'dist');
  const reportPath = path.join(distDir, 'build-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    files: [],
    totalSize: 0,
    recommendations: []
  };

  // 收集文件信息
  function collectFiles(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        collectFiles(filePath, path.join(relativePath, file));
      } else {
        const fileInfo = {
          path: path.join(relativePath, file),
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100,
          extension: path.extname(file),
          lastModified: stats.mtime.toISOString()
        };
        
        report.files.push(fileInfo);
        report.totalSize += stats.size;
      }
    });
  }

  if (fs.existsSync(distDir)) {
    collectFiles(distDir);
  }

  // 生成建议
  generateRecommendations(report);

  // 写入报告
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 构建报告已生成: ${reportPath}`);
}

// 生成优化建议
function generateRecommendations(report) {
  const recommendations = [];

  // 检查大文件
  const largeFiles = report.files.filter(file => file.sizeKB > 100);
  if (largeFiles.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `发现 ${largeFiles.length} 个大文件 (>100KB)，建议优化`,
      files: largeFiles.map(f => f.path)
    });
  }

  // 检查图片文件
  const imageFiles = report.files.filter(file => 
    /\.(jpg|jpeg|png|gif)$/i.test(file.extension)
  );
  if (imageFiles.length > 0) {
    const totalImageSize = imageFiles.reduce((sum, file) => sum + file.sizeKB, 0);
    if (totalImageSize > 500) {
      recommendations.push({
        type: 'info',
        message: `图片总大小 ${totalImageSize.toFixed(2)}KB，建议转换为WebP格式`
      });
    }
  }

  // 检查JS文件
  const jsFiles = report.files.filter(file => file.extension === '.js');
  if (jsFiles.length > 10) {
    recommendations.push({
      type: 'info',
      message: `发现 ${jsFiles.length} 个JS文件，建议检查代码分割配置`
    });
  }

  report.recommendations = recommendations;
}

// 优化构建
function optimizeBuild() {
  console.log('🚀 开始构建优化...\n');

  // 清理旧的构建产物
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    console.log('🧹 清理旧的构建产物...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  // 运行构建
  console.log('🔨 运行构建...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ 构建完成\n');
  } catch (error) {
    console.log('❌ 构建失败:', error.message);
    return;
  }

  // 分析构建产物
  analyzeBuild();

  // 生成构建报告
  generateBuildReport();

  console.log('\n🎉 构建优化完成！');
}

// 主函数
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'analyze':
      analyzeBuild();
      break;
    case 'report':
      generateBuildReport();
      break;
    case 'optimize':
    default:
      optimizeBuild();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeBuild, generateBuildReport, optimizeBuild };
