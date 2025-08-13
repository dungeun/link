#!/bin/bash
# Coolify 서버에서 실행할 언어팩 백업 스크립트

echo "PostgreSQL 컨테이너 찾는 중..."
CONTAINER_ID=$(docker ps --format "table {{.ID}}\t{{.Names}}" | grep mco08g444s00gkkw0wso40sk | awk '{print $1}')

if [ -z "$CONTAINER_ID" ]; then
    echo "PostgreSQL 컨테이너를 찾을 수 없습니다."
    echo "실행 중인 컨테이너 목록:"
    docker ps
    exit 1
fi

echo "PostgreSQL 컨테이너 ID: $CONTAINER_ID"

echo "언어팩 데이터 추출 중..."
docker exec -i $CONTAINER_ID psql -U postgres -d postgres << 'EOSQL'
COPY (
  SELECT json_agg(
    json_build_object(
      'key', key,
      'ko', ko,
      'en', en,
      'jp', ja,
      'category', category,
      'description', description,
      'isEditable', "isEditable"
    )
  )
  FROM language_packs
  ORDER BY category, key
) TO '/tmp/language_packs_backup.json';
EOSQL

echo "컨테이너에서 호스트로 파일 복사 중..."
docker cp $CONTAINER_ID:/tmp/language_packs_backup.json /tmp/

echo "백업 완료! 파일 위치: /tmp/language_packs_backup.json"
echo "파일 내용 미리보기:"
head -20 /tmp/language_packs_backup.json