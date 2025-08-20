import { list } from '@vercel/blob';

async function listBlobStorageFiles() {
  try {
    console.log('🔍 Vercel Blob Storage 파일 목록 조회 중...\n');
    
    // Blob Storage의 모든 파일 리스트 가져오기
    const { blobs } = await list({
      token: "vercel_blob_rw_I3OTDOKFZvApv5dF_EIJqUWcncdb0ADYIyF9GdakWxrKOoz"
    });
    
    console.log(`📊 총 ${blobs.length}개의 파일이 Blob Storage에 있습니다.\n`);
    
    // 폴더별로 그룹화
    const filesByFolder: Record<string, any[]> = {};
    
    blobs.forEach(blob => {
      const pathParts = blob.pathname.split('/');
      const folder = pathParts.length > 1 ? pathParts[0] : 'root';
      
      if (!filesByFolder[folder]) {
        filesByFolder[folder] = [];
      }
      
      filesByFolder[folder].push({
        pathname: blob.pathname,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: blob.contentType
      });
    });
    
    // 폴더별 출력
    Object.keys(filesByFolder).sort().forEach(folder => {
      const files = filesByFolder[folder];
      console.log(`\n📁 ${folder}/ (${files.length}개 파일)`);
      console.log('─'.repeat(80));
      
      files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .forEach((file, index) => {
          console.log(`${index + 1}. ${file.pathname}`);
          console.log(`   URL: ${file.url}`);
          console.log(`   크기: ${(file.size / 1024).toFixed(2)} KB`);
          console.log(`   타입: ${file.contentType}`);
          console.log(`   업로드: ${new Date(file.uploadedAt).toLocaleString('ko-KR')}`);
          console.log('');
        });
    });
    
    // 최근 업로드된 파일 Top 10
    console.log('\n📅 최근 업로드된 파일 (Top 10)');
    console.log('─'.repeat(80));
    
    blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 10)
      .forEach((blob, index) => {
        console.log(`${index + 1}. ${blob.pathname}`);
        console.log(`   URL: ${blob.url}`);
        console.log(`   업로드: ${new Date(blob.uploadedAt).toLocaleString('ko-KR')}`);
        console.log('');
      });
    
    // campaign 폴더의 이미지만 따로 출력
    if (filesByFolder['campaign']) {
      console.log('\n🎯 Campaign 폴더 이미지 URL 목록 (DB 업데이트용)');
      console.log('─'.repeat(80));
      
      filesByFolder['campaign'].forEach((file, index) => {
        console.log(`${index + 1}. ${file.pathname}`);
        console.log(`   ${file.url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Blob Storage 조회 실패:', error);
    console.error('환경변수 BLOB_READ_WRITE_TOKEN이 설정되어 있는지 확인하세요.');
  }
}

listBlobStorageFiles();