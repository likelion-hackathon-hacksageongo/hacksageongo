#!/usr/bin/env bash
#
# 백엔드 배포: 코드 전송(node_modules/.env 제외) → 의존성 설치 → pm2 재시작
#
# 사용법: ./deploy/deploy-backend.sh
#
# 주의: EC2의 .env 는 이 스크립트로 덮어쓰지 않는다(서버에 있는 값 유지).
#       .env 를 갱신하려면 아래 UPDATE_ENV=1 로 실행:
#         UPDATE_ENV=1 ./deploy/deploy-backend.sh
#       (그 경우 로컬 backend/.env 를 서버로 복사한다)
#
set -euo pipefail

# --- 설정 ---
KEY="${SSH_KEY:-$HOME/Downloads/likelion-hackathon-backend.pem}"
HOST="${EC2_HOST:-ubuntu@54.180.64.190}"
REMOTE_DIR="~/app/backend"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT/backend"

echo "==> [1/3] 코드 전송 ($BACKEND_DIR → $HOST:$REMOTE_DIR)"
ssh -i "$KEY" "$HOST" "mkdir -p $REMOTE_DIR"
tar --exclude='node_modules' --exclude='.env' -czf - -C "$BACKEND_DIR" . \
  | ssh -i "$KEY" "$HOST" "tar -xzf - -C $REMOTE_DIR"

if [ "${UPDATE_ENV:-0}" = "1" ]; then
  echo "==> (옵션) 로컬 backend/.env 를 서버로 복사"
  scp -i "$KEY" "$BACKEND_DIR/.env" "$HOST:$REMOTE_DIR/.env"
fi

echo "==> [2/3] 의존성 설치 (npm ci --omit=dev)"
ssh -i "$KEY" "$HOST" "cd $REMOTE_DIR && npm ci --omit=dev"

echo "==> [3/3] pm2 재시작"
ssh -i "$KEY" "$HOST" "pm2 restart backend --update-env && pm2 save"

echo ""
echo "헬스체크:"
curl -s -w "\n-> HTTP %{http_code}\n" https://d3hd2i8v19m54p.cloudfront.net/api/health || true
