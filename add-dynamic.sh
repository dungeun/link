#!/bin/bash

# API 라우트 파일들 찾기
files=$(find src/app/api -name "route.ts" -type f)

for file in $files; do
  # 이미 dynamic export가 있는지 확인
  if ! grep -q "export const dynamic" "$file"; then
    # import 문 다음 줄에 dynamic export 추가
    sed -i.bak "/^import.*from/a\\
\\
// Dynamic route configuration\\
export const dynamic = 'force-dynamic'" "$file"
    echo "Updated: $file"
  else
    echo "Skipped (already has dynamic): $file"
  fi
done

# 백업 파일 삭제
find src/app/api -name "*.bak" -type f -delete
