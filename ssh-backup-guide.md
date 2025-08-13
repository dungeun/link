# SSH로 언어팩 데이터 백업하기

## 1단계: SSH 접속
```bash
ssh root@coolify.one-q.xyz
```

## 2단계: PostgreSQL 컨테이너 찾기
```bash
docker ps | grep postgres
# 또는
docker ps | grep mco08g444s00gkkw0wso40sk
```

## 3단계: PostgreSQL에 접속해서 언어팩 데이터 추출
```bash
# PostgreSQL 컨테이너 내부로 접속
docker exec -it <POSTGRES_CONTAINER_ID> psql -U postgres -d postgres

# 또는 직접 명령어 실행
docker exec -it <POSTGRES_CONTAINER_ID> psql -U postgres -d postgres -c "
SELECT 
  key, ko, en, ja, category, description, 
  CASE WHEN \"isEditable\" THEN 'true' ELSE 'false' END as is_editable
FROM language_packs 
ORDER BY category, key;
" > /tmp/language_packs_backup.csv
```

## 4단계: JSON 형태로 데이터 추출
```bash
# JSON 형태로 추출하는 스크립트 생성
cat << 'EOF' > /tmp/backup_language_packs.sql
COPY (
  SELECT json_agg(
    json_build_object(
      'key', key,
      'ko', ko,
      'en', en,
      'jp', ja,  -- ja를 jp로 변경
      'category', category,
      'description', description,
      'isEditable', "isEditable"
    )
  )
  FROM language_packs
  ORDER BY category, key
) TO '/tmp/language_packs.json';
EOF

# 스크립트 실행
docker exec -i <POSTGRES_CONTAINER_ID> psql -U postgres -d postgres < /tmp/backup_language_packs.sql
```

## 5단계: 파일을 로컬로 복사
```bash
# 컨테이너에서 호스트로 복사
docker cp <POSTGRES_CONTAINER_ID>:/tmp/language_packs.json /tmp/

# SSH로 로컬로 다운로드 (로컬 터미널에서 실행)
scp root@coolify.one-q.xyz:/tmp/language_packs.json ./language_packs_backup.json
```