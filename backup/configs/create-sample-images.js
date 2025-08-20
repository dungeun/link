const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function createSampleImages() {
  const outputDir = path.join(__dirname, 'public', 'images', 'campaigns');
  
  // 디렉토리 확인
  try {
    await fs.access(outputDir);
  } catch {
    await fs.mkdir(outputDir, { recursive: true });
  }

  const images = [
    { name: 'moos-airfryer-01.png', text: 'MOOS\n에어프라이어\n제품 이미지 1', color: '#4A90E2' },
    { name: 'moos-airfryer-02.png', text: 'MOOS\n에어프라이어\n제품 이미지 2', color: '#7B68EE' },
    { name: 'moos-airfryer-03.png', text: 'MOOS\n에어프라이어\n제품 이미지 3', color: '#50C878' },
    { name: 'moos-detail-01.png', text: 'MOOS\n상세 설명\n이미지 1', color: '#FF6B6B' },
    { name: 'moos-detail-02.png', text: 'MOOS\n상세 설명\n이미지 2', color: '#FFA500' },
    { name: 'moos-header.png', text: 'MOOS\n헤더 이미지', color: '#20B2AA' },
    { name: 'moos-thumb.png', text: 'MOOS\n썸네일', color: '#DA70D6' },
    { name: 'moos-main.png', text: 'MOOS\n메인 이미지', color: '#FF1493' }
  ];

  for (const img of images) {
    const width = img.name.includes('thumb') ? 300 : 800;
    const height = img.name.includes('thumb') ? 300 : 600;
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${img.color}"/>
        <text x="${width/2}" y="${height/2}" 
              font-family="Arial, sans-serif" 
              font-size="${img.name.includes('thumb') ? '24' : '48'}" 
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">
          ${img.text.split('\n').map((line, i) => 
            `<tspan x="${width/2}" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`
          ).join('')}
        </text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(outputDir, img.name));
    
    console.log(`✅ Created: ${img.name}`);
  }
  
  console.log('\n🎉 모든 샘플 이미지 생성 완료!');
}

createSampleImages().catch(console.error);