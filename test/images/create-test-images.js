#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// SVG 이미지 생성 함수
function createSVGImage(width, height, text, bgColor = '#e2e8f0') {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bgColor}"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="#333" text-anchor="middle" dy=".3em">
      ${text}
    </text>
  </svg>`;
}

// JPEG 호환 가능한 PNG 이미지 생성 (간단한 버전)
function createTestPNG(width, height, text) {
  // 실제 PNG 생성은 복잡하므로, 테스트를 위해 간단한 파일만 생성
  // 실제 이미지가 필요한 경우 sharp나 canvas 라이브러리 사용 권장
  const buffer = Buffer.from(`Test PNG: ${text} (${width}x${height})`);
  return buffer;
}

// 테스트 이미지 생성
const testImages = [
  { name: 'header.svg', width: 1920, height: 600, text: '캠페인 헤더 이미지' },
  { name: 'thumbnail.svg', width: 600, height: 400, text: '캠페인 썸네일' },
  { name: 'product1.svg', width: 800, height: 800, text: '제품 이미지 1' },
  { name: 'product2.svg', width: 800, height: 800, text: '제품 이미지 2' },
  { name: 'product3.svg', width: 800, height: 800, text: '제품 이미지 3' },
];

// 이미지 생성 및 저장
testImages.forEach(img => {
  const svg = createSVGImage(img.width, img.height, img.text);
  const filePath = path.join(__dirname, img.name);
  
  fs.writeFileSync(filePath, svg);
  console.log(`✅ 생성됨: ${filePath}`);
});

// JPEG 테스트를 위한 샘플 파일 생성
const jpegPlaceholder = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
]);

fs.writeFileSync(path.join(__dirname, 'test.jpg'), jpegPlaceholder);
console.log(`✅ 생성됨: ${path.join(__dirname, 'test.jpg')}`);

console.log('\n모든 테스트 이미지가 생성되었습니다!');