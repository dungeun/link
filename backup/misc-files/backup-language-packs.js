const { Client } = require('pg');
const fs = require('fs');

// 이전 데이터베이스 연결 설정 - Coolify 내부 URL 사용
const oldDbClient = new Client({
  connectionString: 'postgres://postgres:7MBfWpMyKVevUr6qmbK06WvrA6ENlqWvQ5QYP1q1d4hBngbdL7DQI8RHU5ePa0ua@mco08g444s00gkkw0wso40sk:5432/postgres',
  // 네트워킹 이슈로 인해 대안 방법 사용
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function backupLanguagePacks() {
  try {
    console.log('이전 데이터베이스에 연결 중...');
    await oldDbClient.connect();
    
    // 언어팩 데이터 조회 (ja 필드 포함)
    const result = await oldDbClient.query(`
      SELECT id, key, ko, en, ja, category, description, "isEditable", "createdAt", "updatedAt" 
      FROM language_packs 
      ORDER BY category, key;
    `);
    
    console.log(`${result.rows.length}개의 언어팩 데이터를 발견했습니다.`);
    
    if (result.rows.length > 0) {
      // 백업 데이터를 JSON 파일로 저장
      const backupData = result.rows.map(row => ({
        ...row,
        // ja를 jp로 변경하여 저장
        jp: row.ja,
        ja: undefined  // ja 필드 제거
      }));
      
      // ja 필드 제거
      backupData.forEach(item => delete item.ja);
      
      fs.writeFileSync('language-packs-backup.json', JSON.stringify(backupData, null, 2));
      console.log('언어팩 데이터가 language-packs-backup.json에 저장되었습니다.');
      
      // 샘플 데이터 출력
      console.log('\n샘플 데이터:');
      console.log(JSON.stringify(result.rows.slice(0, 3), null, 2));
    } else {
      console.log('언어팩 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('백업 중 오류 발생:', error);
  } finally {
    await oldDbClient.end();
    console.log('데이터베이스 연결 종료');
  }
}

backupLanguagePacks();