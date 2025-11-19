import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Improved Path Resolution ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, '../public/img');
const targetDir = path.resolve(__dirname, '../public/img/optimized');

// --- Advanced Configuration ---
const SIZES = [480, 800, 1200]; // Responsive sizes
const WEBP_QUALITY_SMALL = 85;
const WEBP_QUALITY_LARGE = 75;
const AVIF_QUALITY_SMALL = 70;
const AVIF_QUALITY_LARGE = 60;
const LARGE_FILE_THRESHOLD_KB = 500; // Files above this size get higher compression

const processImage = async (filePath, targetFolder, originalFileName) => {
  try {
    const stats = await fs.stat(filePath);
    const fileSizeInKB = stats.size / 1024;
    const isLargeFile = fileSizeInKB > LARGE_FILE_THRESHOLD_KB;

    const image = sharp(filePath);
    const metadata = await image.metadata();
    const baseFileName = path.basename(originalFileName, path.extname(originalFileName));

    // Generate multiple sizes for responsive images
    for (const size of SIZES) {
      if (metadata.width > size) {
        const webpPath = path.join(targetFolder, `${baseFileName}-${size}w.webp`);
        const avifPath = path.join(targetFolder, `${baseFileName}-${size}w.avif`);
        
        // WEBP Generation
        await image.resize({ width: size })
                   .webp({ quality: isLargeFile ? WEBP_QUALITY_LARGE : WEBP_QUALITY_SMALL })
                   .toFile(webpPath);
        console.log(`Generated WebP: ${path.basename(webpPath)}`);

        // AVIF Generation
        await image.resize({ width: size })
                   .avif({ quality: isLargeFile ? AVIF_QUALITY_LARGE : AVIF_QUALITY_SMALL })
                   .toFile(avifPath);
        console.log(`Generated AVIF: ${path.basename(avifPath)}`);
      }
    }

    // Also create a default-sized WebP and AVIF from the original
    const defaultWebpPath = path.join(targetFolder, `${baseFileName}.webp`);
    await sharp(filePath).webp({ quality: isLargeFile ? WEBP_QUALITY_LARGE : WEBP_QUALITY_SMALL }).toFile(defaultWebpPath);
    console.log(`Generated WebP: ${path.basename(defaultWebpPath)}`);

    const defaultAvifPath = path.join(targetFolder, `${baseFileName}.avif`);
    await sharp(filePath).avif({ quality: isLargeFile ? AVIF_QUALITY_LARGE : AVIF_QUALITY_SMALL }).toFile(defaultAvifPath);
    console.log(`Generated AVIF: ${path.basename(defaultAvifPath)}`);

  } catch (error) {
    console.error(`Error processing image ${filePath}:`, error);
  }
};

const optimizeDirectory = async (source, target) => {
  const files = await fs.readdir(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    
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
        await processImage(sourcePath, target, file);
      }
    }
  }
};

(async () => {
  console.log('Starting advanced image optimization...');
  
  console.log(`Cleaning directory: ${targetDir}`);
  fs.emptyDirSync(targetDir);
  
  fs.ensureDirSync(targetDir);

  await optimizeDirectory(sourceDir, targetDir);

  console.log('Image optimization complete.');
})();