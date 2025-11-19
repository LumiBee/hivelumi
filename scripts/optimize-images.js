import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Improved Path Resolution ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '../public/img');
const targetDir = path.resolve(__dirname, '../public/img/optimized');

const MAX_WIDTH = 1200; // 最大宽度
const WEBP_QUALITY = 80; // WebP 质量

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
    
    // Explicitly skip the entire 'optimized' directory
    if (path.resolve(sourcePath) === path.resolve(targetDir)) {
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
  
  // Clean the target directory before optimization
  console.log(`Cleaning directory: ${targetDir}`);
  fs.emptyDirSync(targetDir);
  
  // Ensure target directory exists after cleaning
  fs.ensureDirSync(targetDir);

  // Process images
  await optimizeDirectory(sourceDir, targetDir);

  console.log('Image optimization complete.');
})();