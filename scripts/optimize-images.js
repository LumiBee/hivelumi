import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';

const sourceDir = path.resolve(process.cwd(), '../public/img');
const targetDir = path.resolve(process.cwd(), '../public/img/optimized');
const demoSourceDir = path.resolve(sourceDir, 'demo');
const demoTargetDir = path.resolve(targetDir, 'demo');

const MAX_WIDTH = 1200; // 最大宽度
const WEBP_QUALITY = 80; // WebP 质量

// 确保目标目录存在
fs.ensureDirSync(targetDir);
fs.ensureDirSync(demoTargetDir);

const processImage = async (filePath, targetPath) => {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let buffer;
    if (metadata.width > MAX_WIDTH) {
      buffer = await image.resize({ width: MAX_WIDTH }).webp({ quality: WEBP_QUALITY }).toBuffer();
    } else {
      buffer = await image.webp({ quality: WEBP_QUALITY }).toBuffer();
    }

    fs.writeFileSync(targetPath, buffer);
    console.log(`Optimized and converted to WebP: ${path.basename(targetPath)}`);
  } catch (error) {
    console.error(`Error processing image ${filePath}:`, error);
  }
};

const optimizeDirectory = async (source, target) => {
  const files = await fs.readdir(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    
    // Skip the target directory to prevent infinite recursion
    if (sourcePath === targetDir) {
      continue;
    }

    const stats = await fs.stat(sourcePath);

    if (stats.isDirectory()) {
      const newTarget = path.join(target, file);
      fs.ensureDirSync(newTarget);
      await optimizeDirectory(sourcePath, newTarget);
    } else {
      const extension = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(extension)) {
        const targetFileName = `${path.basename(file, extension)}.webp`;
        const targetPath = path.join(target, targetFileName);
        await processImage(sourcePath, targetPath);
      }
    }
  }
};

(async () => {
  console.log('Starting image optimization...');
  
  // 处理根图片目录
  await optimizeDirectory(sourceDir, targetDir);

  console.log('Image optimization complete.');
})();