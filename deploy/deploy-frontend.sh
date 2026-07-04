#!/usr/bin/env bash
#
# 프론트엔드 배포: 빌드 → S3 업로드 → CloudFront 캐시 무효화
#
# 사용법: ./deploy/deploy-frontend.sh
#
set -euo pipefail

# --- 설정 ---
BUCKET="likelion-hackathon-478715310167-ap-northeast-2-an"
DISTRIBUTION_ID="E3DHE7QQ2WM636"
# 스크립트 위치 기준으로 프로젝트 루트/frontend 경로 계산
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT/frontend"

echo "==> [1/3] 프론트 빌드 ($FRONTEND_DIR)"
cd "$FRONTEND_DIR"
npm run build

echo "==> [2/3] S3 업로드 (s3://$BUCKET)"
aws s3 sync dist/ "s3://$BUCKET" --delete

echo "==> [3/3] CloudFront 캐시 무효화"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.{Id:Id, Status:Status}" --output table

echo ""
echo "완료. https://d3hd2i8v19m54p.cloudfront.net (전파에 1~2분 소요될 수 있음)"
