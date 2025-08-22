#!/usr/bin/env node

/**
 * 기존 캠페인 이미지를 WebP로 변환하는 스크립트
 * Sharp 라이브러리를 사용하여 서버사이드에서 처리
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '../public/images/campaigns');
const OUTPUT_DIR = path.join(__dirname, '../public/images/campaigns-webp');
const MAX_HEIGHT = 4000; // 분할 기준 높이

/**
 * 이미지를 WebP로 변환하고 필요시 분할
 */
async function convertAndSplitImage(inputPath, outputDir, fileName) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const baseName = path.basename(fileName, path.extname(fileName));
    
    // 이미지가 MAX_HEIGHT보다 높은 경우 분할
    if (metadata.height > MAX_HEIGHT) {
      const numChunks = Math.ceil(metadata.height / MAX_HEIGHT);
      console.log(`  📄 Splitting ${fileName} into ${numChunks} parts`);
      
      for (let i = 0; i < numChunks; i++) {
        const top = i * MAX_HEIGHT;
        const height = Math.min(MAX_HEIGHT, metadata.height - top);
        
        const outputPath = path.join(outputDir, `${baseName}_part${i + 1}.webp`);
        
        await sharp(inputPath)
          .extract({
            left: 0,
            top: top,
            width: metadata.width,
            height: height
          })
          .webp({ quality: 85 })
          .toFile(outputPath);
        
        const outputSize = (await fs.stat(outputPath)).size;
        console.log(`    ✅ Created ${baseName}_part${i + 1}.webp (${(outputSize / 1024).toFixed(0)}KB)`);
      }
    } else {
      // 단일 WebP 변환
      const outputPath = path.join(outputDir, `${baseName}.webp`);
      
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      const inputSize = (await fs.stat(inputPath)).size;
      const outputSize = (await fs.stat(outputPath)).size;
      const reduction = ((1 - outputSize / inputSize) * 100).toFixed(1);
      
      console.log(`  ✅ ${fileName} → ${baseName}.webp (${reduction}% smaller)`);
    }
  } catch (error) {
    console.error(`  ❌ Error converting ${fileName}:`, error.message);
  }
}

/**
 * 디렉토리의 모든 이미지 처리
 */
async function processDirectory(dir, outputDir) {
  try {
    const files = await fs.readdir(dir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|bmp)$/i.test(file)
    );
    
    console.log(`Found ${imageFiles.length} images to convert`);
    
    // 출력 디렉토리 생성
    await fs.mkdir(outputDir, { recursive: true });
    
    // 각 이미지 처리
    for (const file of imageFiles) {
      const inputPath = path.join(dir, file);
      const stats = await fs.stat(inputPath);
      
      if (stats.isFile()) {
        console.log(`\n📸 Processing: ${file} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        await convertAndSplitImage(inputPath, outputDir, file);
      }
    }
  } catch (error) {
    console.error('Error processing directory:', error);
  }
}

/**
 * 변환 통계 출력
 */
async function printStatistics(originalDir, webpDir) {
  try {
    const getDirectorySize = async (dir) => {
      const files = await fs.readdir(dir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    };
    
    const originalSize = await getDirectorySize(originalDir);
    const webpSize = await getDirectorySize(webpDir);
    const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Conversion Statistics:');
    console.log('='.repeat(50));
    console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`WebP size: ${(webpSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Size reduction: ${reduction}%`);
    console.log(`Saved: ${((originalSize - webpSize) / 1024 / 1024).toFixed(2)}MB`);
    
  } catch (error) {
    console.error('Error calculating statistics:', error);
  }
}

/**
 * Sharp 설치 확인
 */
async function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch (error) {
    console.log('⚠️  Sharp is not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    return true;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 Starting WebP conversion...\n');
  
  // Sharp 설치 확인
  if (!await checkDependencies()) {
    console.error('Failed to install dependencies');
    return;
  }
  
  // 디렉토리 확인
  try {
    await fs.access(IMAGES_DIR);
  } catch (error) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
    return;
  }
  
  // 이미지 변환 실행
  await processDirectory(IMAGES_DIR, OUTPUT_DIR);
  
  // 통계 출력
  await printStatistics(IMAGES_DIR, OUTPUT_DIR);
  
  console.log('\n✨ Conversion complete!');
  console.log(`📁 WebP images saved to: ${OUTPUT_DIR}`);
  
  // Next.js 설정 업데이트 안내
  console.log('\n📝 Next steps:');
  console.log('1. Update your code to use WebP images from campaigns-webp/');
  console.log('2. Consider using <Image> component with automatic WebP support');
  console.log('3. Update next.config.js to serve WebP with fallback');
}

// 스크립트 실행
main().catch(console.error);