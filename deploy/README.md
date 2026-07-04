# 배포 (AWS)

**서비스 주소:** https://d3hd2i8v19m54p.cloudfront.net

## 구성
```
브라우저 → CloudFront (E3DHE7QQ2WM636, HTTPS)
             ├─ /*      → S3 버킷 (정적 프론트)
             └─ /api/*  → EC2 54.180.64.190 (nginx :80 → Node :3000, pm2)
```
- 프론트/백엔드가 같은 도메인 → CORS 불필요
- `403/404 → /index.html` 오류 응답으로 SPA 라우팅(새로고침) 대응

## 리소스
| 항목 | 값 |
|------|-----|
| S3 버킷 | `likelion-hackathon-478715310167-ap-northeast-2-an` |
| CloudFront 배포 ID | `E3DHE7QQ2WM636` |
| EC2 | `ubuntu@54.180.64.190` (t3.micro, Ubuntu 26.04) |
| SSH 키 | `~/Downloads/likelion-hackathon-backend.pem` |
| 리전 | `ap-northeast-2` (서울) |

## 배포 명령
```bash
./deploy/deploy-frontend.sh        # 프론트: 빌드 → S3 → 캐시 무효화
./deploy/deploy-backend.sh         # 백엔드: 코드 전송 → npm ci → pm2 restart
UPDATE_ENV=1 ./deploy/deploy-backend.sh   # 백엔드 + 로컬 .env 를 서버로도 복사
```
키/호스트를 바꾸려면 환경변수로 오버라이드:
```bash
SSH_KEY=/path/to/key.pem EC2_HOST=ubuntu@1.2.3.4 ./deploy/deploy-backend.sh
```

## 서버 운영 (SSH 접속 후)
```bash
ssh -i ~/Downloads/likelion-hackathon-backend.pem ubuntu@54.180.64.190
pm2 status          # 프로세스 상태
pm2 logs backend    # 로그 확인
pm2 restart backend # 재시작
```

## ⚠️ 알아둘 점
- **Supabase 미설정**: 현재 `.env` 의 `SUPABASE_URL`/`SECRET_KEY` 가 비어 있어 인메모리 폴백으로
  동작한다. `pm2 restart` 시 데이터가 사라진다. 영구 저장하려면 EC2 의 `~/app/backend/.env` 에
  Supabase 값을 넣고 `pm2 restart backend` 하거나, 로컬 `.env` 채운 뒤 `UPDATE_ENV=1` 로 배포.
- `.env` 는 git 및 배포 전송에서 제외된다(서버 값 유지).
