# crawler

공모전 / 대외활동 / 인턴 / 채용 공고를 모아 정규화된 형태로 저장하고, 백엔드가 언어에 상관없이
가져다 쓸 수 있도록 HTTP API로도 제공하는 독립 모듈. 백엔드 레포/스택이 아직 정해지지 않은 상태라
`crawler/` 하위에 별도 프로젝트로 분리해두었다.

## 시작 전 확인한 것 (리스크 정찰)

- `https://linkareer.com/robots.txt`: `User-agent: *` 에 `Allow: /`, 차단 경로는 `/stem/learn/*`
  하위 로그인 전용 기능뿐. 이번에 쓰는 `/list/activity`, `/list/contest`, `/list/intern` 목록
  페이지는 막혀있지 않음. Bingbot에는 `Crawl-delay: 1` 명시 — 이를 기준으로 여유있게
  `REQUEST_DELAY_MS=1200` 기본값을 둠.
- 링커리어는 공개 GraphQL API 문서가 없고 이용약관상 통상 크롤링을 금지하는 상용 사이트다.
  본문 전체를 복제/재게시하지 않고 제목·기관·마감일·원문 링크만 저장해 링커리어로 트래픽을
  링크백하는 방식으로 리스크를 최소화했다 (저작권/DB권 이슈 방어).
  **그래도 잔여 리스크는 있으니, 실 서비스로 확장 시 링커리어에 제휴/API 문의를 권장.**
- 채용(정규직) 카테고리는 링커리어에 없고, 워크넷(work24) 공식 오픈 API로 대체했다 — 이쪽은
  고용노동부가 제공하는 합법·무료 API라 리스크가 없다.
- 서비스가 "졸업까지 목표 달성"을 돕는 폭넓은 성격이라, 취업/공모전 외에 자기계발(자격증)과
  운동 카테고리를 추가했다. 둘 다 공식 오픈API만 사용:
  - **자격시험**: Q-net(한국산업인력공단) 국가자격시험 시행일정 API.
  - **운동**: 서울 열린데이터광장 공공서비스예약(체육시설) API — 서울대 학부생 대상 서비스라
    기본값을 관악구로 필터링(`SEOUL_SPORTS_DISTRICTS`로 조정 가능).

## 왜 GraphQL 재현이 아니라 SSR JSON 파싱인가

DevTools로 GraphQL 요청을 재현하는 대신, 링커리어의 Next.js SSR 페이지에 이미 박혀있는
`__NEXT_DATA__` 스크립트(Apollo Client 캐시 그대로)를 파싱한다. 실제로 `/list/activity` 등을
직접 요청해 확인한 결과:

- `pageProps.__APOLLO_STATE__.ROOT_QUERY` 안에
  `activities({"filterBy":{"activityTypeID":"1",...},"pagination":{"page":1,"pageSize":20}})`
  키에 `totalCount`와 `nodes`(레퍼런스 목록)가 그대로 들어있음.
- `activityTypeID`: `1`=대외활동, `3`=공모전, `5`=인턴 (경로: `/list/activity`, `/list/contest`,
  `/list/intern`).
- 각 `Activity:{id}` 객체에 `title`, `organizationName`, `recruitCloseAt`(ms epoch),
  `viewCount`, `thumbnailImage`(→`ActivityFile.url`) 가 정규화되어 있음.

이 방식은 GraphQL 쿼리 문서·인증 헤더·CSRF 토큰을 추정할 필요가 없고, UI가 리뉴얼되어도
Next.js 데이터 계약이 크게 안 바뀌는 한 안정적이다. `src/sources/linkareer.ts` 참고.

## 구조

```
src/
  sources/linkareer.ts   # SSR JSON 파싱 (대외활동/공모전/인턴)
  sources/worknet.ts     # work24 오픈 API (채용) — WORKNET_AUTH_KEY 필요
  sources/qnet.ts        # Q-net 오픈 API (자격시험) — QNET_SERVICE_KEY 필요
  sources/seoulSports.ts # 서울 열린데이터광장 오픈 API (운동, 관악구 필터) — SEOUL_OPENAPI_KEY 필요
  store/                 # 저장 어댑터 (json 기본 / supabase)
  crawl.ts               # 전체 소스 크롤 → store 적재 (CLI: npm run crawl)
  server.ts              # GET /api/listings?category=&keyword= (CLI: npm run serve)
```

## 사용법

```bash
cp .env.example .env
npm install
npm run crawl   # data/listings.json 생성
npm run serve   # http://localhost:4000/api/listings
```

## 백엔드 연동 방법 (요약)

1. 이 크롤러를 서버로 띄운다: `npm run serve` (기본 포트 4000, `.env`의 `PORT`로 변경 가능).
2. 백엔드에서 아래처럼 호출해서 받은 JSON을 그대로 저장/사용하면 된다.

```bash
curl "http://localhost:4000/api/listings?category=인턴&keyword=백엔드"
```

응답 형태:

```json
{
  "count": 1,
  "listings": [
    {
      "source": "linkareer",
      "sourceId": "333057",
      "category": "인턴",
      "title": "[전환형 인턴] 화상영어 링글 브랜드 & 캠페인 마케팅",
      "organization": "(주)링글잉글리시에듀케이션서비스",
      "url": "https://linkareer.com/activity/333057",
      "deadline": "2026-10-01T14:59:59.999Z",
      "thumbnailUrl": "https://media-cdn.linkareer.com/...",
      "viewCount": 162,
      "crawledAt": "2026-07-03T19:31:24.708Z"
    }
  ]
}
```

- `category`는 `공모전 | 대외활동 | 인턴 | 채용 | 자격시험 | 운동` 중 하나. 쿼리 파라미터로 필터링.
- `keyword`는 `title`/`organization`에 대한 부분일치 검색.
- 백엔드 DB에 저장할 때는 `source + sourceId` 조합을 유니크 키(PK)로 잡고 upsert하면 재크롤링해도 중복이 안 생긴다.
- 매번 실시간 요청 시 크롤링하지 말고, 크롤러는 하루 1~2회(cron, [스케줄링](#스케줄링-cron) 참고)만 갱신 → 백엔드는 그 결과를 이 API로 가져다 캐시/DB에 반영하는 방식으로 쓴다.

## 백엔드에 데이터 주입하는 3가지 방법

1. **HTTP로 당겨가기 (권장, 스택 무관)**: `npm run serve` 로 크롤러를 띄워두고, 백엔드가
   `GET /api/listings?category=인턴&keyword=백엔드` 로 필요할 때 가져간다.
2. **JSON 파일 직접 읽기**: `data/listings.json` 을 배포 파이프라인에서 공유 볼륨/스토리지로
   옮겨 백엔드가 읽게 한다.
3. **Supabase 전환**: 팀원이 Supabase 프로젝트(URL/service role key)를 넘겨주면
   `.env`에 `STORAGE_BACKEND=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`만 채우면
   된다. 필요한 테이블 스키마는 `src/store/supabaseStore.ts` 상단 주석 참고. 코드 변경 없음.

## 채용(워크넷) API 설정

1. https://www.work24.go.kr 가입 → 오픈 API 인증키(authKey) 발급.
2. `.env`의 `WORKNET_AUTH_KEY`에 채움.
3. `src/sources/worknet.ts`의 엔드포인트/파라미터는 비로그인 상태에서 확인 가능한 공개 자료
   기준으로 작성한 best-effort 버전이다. **authKey 발급 후 실제 응답(XML)을 한번 찍어보고
   필드명이 다르면 `parseWorknetXml`만 맞춰 조정하면 된다** (나머지 파이프라인은 안 바뀜).

## 자격시험(Q-net) API 설정

1. https://www.data.go.kr/data/15074408/openapi.do 에서 활용신청 → 서비스키 발급(승인까지
   몇 시간 걸릴 수 있음).
2. `.env`의 `QNET_SERVICE_KEY`에 채움.
3. `apis.data.go.kr` 계열 API는 응답 스키마가 기관마다 `response.body.items.item[]` 형태로
   조금씩 다르게 오는 경우가 많아, `src/sources/qnet.ts`의 `normalizeResponse`가 몇 가지
   흔한 형태를 관대하게 처리하도록 해두었다. 실제 키로 호출해보고 다르면 그 함수만 조정.

## 운동(서울 체육시설) API 설정

1. https://data.seoul.go.kr/dataList/OA-2266/S/1/datasetView.do 에서 인증키 발급(즉시 발급).
   `sample` 키로 최대 5건까지는 발급 없이 바로 테스트 가능 — 실제로 이 키로 스키마를
   검증했다.
2. `.env`의 `SEOUL_OPENAPI_KEY`에 채움. `SEOUL_SPORTS_DISTRICTS`로 대상 자치구를 조정
   (기본값 `관악구`; 서울대입구역 인접까지 넓히려면 `관악구,동작구` 처럼 콤마로 추가).
3. `src/sources/seoulSports.ts`는 응답 필드(`SVCID`, `SVCNM`, `AREANM`, `RCPTENDDT` 등)를
   실제 API 호출로 확인하고 작성해 별도 조정 없이 바로 동작한다.

## 스케줄링 (cron)

유저 요청마다 크롤링하지 말 것 — rate limit/차단 위험 + 느림. 하루 1~2회만 배치로 돌리고
결과를 캐싱해서 서빙한다.

- 로컬/서버에 OS cron으로 `npm run crawl` 를 하루 1~2회 실행하도록 등록하거나,
- 백엔드가 정해지면 그 스케줄러(예: NestJS `@Cron`, Spring `@Scheduled`)에서
  `npm run crawl` 을 서브프로세스로 부르거나, 위 HTTP API를 대신 이 모듈 자체에
  `node-cron`을 추가해 상시 서버로 돌려도 된다 (현재는 최소 구성만 두고 확장 지점으로 남김).

## 안전장치

- 요청 간 `REQUEST_DELAY_MS`(기본 1200ms) 지연.
- 5xx/네트워크 오류에 지수 백오프 재시도(`utils/http.ts`), 4xx는 즉시 실패 처리.
- 페이지 구조가 바뀌어 `__NEXT_DATA__`를 못 찾으면 조용히 죽지 않고 에러를 던지고 로그를 남긴다.
- `LINKAREER_MAX_PAGES`로 카테고리당 최대 페이지 수를 제한할 수 있다(기본 5 — 실습/개발 중
  과도한 요청 방지, 운영 전환 시 늘리거나 비워서 전체 수집).
