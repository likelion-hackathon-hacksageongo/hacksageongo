# 학사견고 API 명세서 v0.2

## 1. 기본 정책

### Base URL

```http
/api
```

### 인증 방식

해커톤 MVP에서는 로그인/로그아웃을 구현하지 않는다.
프론트는 최초 접속 시 `guest_id`를 생성해 `localStorage`에 저장하고, 모든 사용자별 요청에 아래 헤더를 포함한다.

```http
X-Guest-Id: <guest_id>
Content-Type: application/json
```

### 공통 응답 형식

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

# 2. 사용자 프로필 API

## 2.1 프로필 생성

```http
POST /profiles
```

### Request Body

```json
{
  "nickname": "견고한학생",
  "birthYear": 2002,
  "school": "서울대학교",
  "department": "컴퓨터공학부",
  "gpa": 3.72,
  "gender": "male",
  "mbti": "INTJ",
  "completedSemesters": 6,
  "expectedGraduation": "2027-02"
}
```

### 필드

| 필드                 | 타입   | 필수 | 설명                                  |
| -------------------- | ------ | ---: | ------------------------------------- |
| `nickname`           | string |    O | 닉네임                                |
| `birthYear`          | number |    O | 생년                                  |
| `school`             | string |    X | 학교                                  |
| `department`         | string |    X | 학과                                  |
| `gpa`                | number |    X | 학점                                  |
| `gender`             | string |    O | `male`, `female`, `prefer_not_to_say` |
| `mbti`               | string |    X | MBTI. 모르면 `unknown`                |
| `completedSemesters` | number |    O | 현재까지 등록 학기                    |
| `expectedGraduation` | string |    O | 예상 졸업 시점, `YYYY-MM`             |

---

## 2.2 내 프로필 조회

```http
GET /profiles/me
```

---

## 2.3 내 프로필 수정

```http
PATCH /profiles/me
```

### Request Body

수정할 필드만 보낸다.

```json
{
  "gpa": 3.85,
  "mbti": "ENTP",
  "expectedGraduation": "2027-08"
}
```

---

# 3. 성향 설문 API

## 3.1 설문 문항 조회

```http
GET /surveys/current
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "surveyId": "survey_v1",
    "type": "likert_5",
    "questions": [
      {
        "id": "q1",
        "text": "나는 혼자 깊게 분석하는 활동이 좋다.",
        "type": "likert_5",
        "minLabel": "전혀 아니다",
        "maxLabel": "매우 그렇다"
      }
    ]
  }
}
```

---

## 3.2 설문 응답 제출 및 홀랜드 점수 계산

```http
POST /surveys/responses
```

### Request Body

```json
{
  "surveyId": "survey_v1",
  "answers": [
    {
      "questionId": "q1",
      "value": 5
    }
  ]
}
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "hollandScores": {
      "realistic": 12,
      "investigative": 24,
      "artistic": 18,
      "social": 16,
      "enterprising": 20,
      "conventional": 10
    },
    "topTypes": ["investigative", "enterprising", "artistic"],
    "summary": "탐구형과 진취형 성향이 높습니다."
  }
}
```

---

## 3.3 내 성향 결과 조회

```http
GET /surveys/result/me
```

---

# 4. 챗봇 API

챗봇은 사용자의 목표, 걱정, 과거 경험, 후회, 앞으로 하고 싶은 일을 유도한다.

AI가 만든 변경사항은 바로 반영하지 않고 `proposal`로 저장한다.
사용자가 “AI 채팅 내용 반영하기” 버튼을 눌렀을 때만 실제 데이터에 반영한다.

---

## 4.1 챗 세션 생성

```http
POST /chat/sessions
```

### Request Body

```json
{
  "purpose": "onboarding"
}
```

### `purpose`

| 값                  | 설명             |
| ------------------- | ---------------- |
| `onboarding`        | 사용자 이해      |
| `activity_planning` | 활동 후보 추천   |
| `timeline_planning` | 학기별 계획 수정 |
| `todo_planning`     | 투두 관리        |

---

## 4.2 챗 메시지 전송

```http
POST /chat/sessions/{sessionId}/messages
```

### Request Body

```json
{
  "message": "졸업 전에 해외 경험을 해보고 싶은데 학점이 낮아서 걱정돼요.",
  "contextPage": "onboarding"
}
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "assistantMessage": {
      "role": "assistant",
      "content": "해외 경험에 대한 욕구가 분명하지만 학점 때문에 걱정하고 있군요."
    },
    "proposal": {
      "id": "proposal_uuid",
      "status": "pending",
      "summary": "해외 경험 관련 활동 후보를 추가 제안합니다.",
      "items": [
        {
          "type": "add_activity_candidate",
          "payload": {
            "title": "해외 인턴",
            "category": "career_elective",
            "priority": "high"
          }
        }
      ]
    }
  }
}
```

---

## 4.3 챗 메시지 목록 조회

```http
GET /chat/sessions/{sessionId}/messages
```

---

## 4.4 챗 요약 및 인사이트 추출

```http
POST /chat/sessions/{sessionId}/summarize
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "summary": "사용자는 졸업 전 해외 경험과 실무 경험을 원하며, 낮은 학점을 걱정하고 있습니다.",
    "insights": {
      "goals": ["졸업 전 해외 경험 만들기"],
      "concerns": ["학점이 낮아 지원 가능성이 낮을까 걱정함"],
      "preferredActivities": ["해외 경험", "실무 프로젝트"],
      "constraints": ["학기 중에는 학점 관리가 필요함"]
    }
  }
}
```

---

# 5. 활동 후보 API

활동 후보는 사용자 프로필, MBTI, 홀랜드 점수, 챗봇 요약을 바탕으로 생성한다.

## 5.1 활동 후보 생성

```http
POST /activity-candidates/generate
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "candidate_uuid_1",
        "title": "랩인턴",
        "category": "career_required",
        "description": "관심 분야 연구실에서 학부연구생 또는 랩인턴으로 참여합니다.",
        "reason": "진로 방향 검증과 연구 경험 확보에 직접적으로 도움이 됩니다.",
        "priority": "high",
        "difficulty": "medium",
        "estimatedDuration": "3개월 이상",
        "recommendedTiming": ["3-1", "summer"],
        "status": "candidate"
      },
      {
        "id": "candidate_uuid_2",
        "title": "운동 루틴 만들기",
        "category": "life_required",
        "description": "주 2~3회 운동 루틴을 만들어 체력과 생활 리듬을 관리합니다.",
        "reason": "남은 학기 동안 학업과 진로 준비를 병행하기 위한 삶의 기반입니다.",
        "priority": "medium",
        "difficulty": "low",
        "estimatedDuration": "한 학기 이상",
        "recommendedTiming": ["3-1"],
        "status": "candidate"
      }
    ]
  }
}
```

---

## 5.2 내 활동 후보 조회

```http
GET /activity-candidates/me
```

### Query

```http
GET /activity-candidates/me?status=candidate
```

---

## 5.3 활동 후보 직접 추가

```http
POST /activity-candidates
```

### Request Body

```json
{
  "title": "밴드 동아리",
  "category": "life_elective",
  "description": "졸업 전 취미와 인간관계를 함께 만들 수 있는 활동입니다.",
  "reason": "대학생활의 만족도와 경험의 폭을 넓힐 수 있습니다.",
  "priority": "medium",
  "difficulty": "low",
  "estimatedDuration": "한 학기 이상",
  "recommendedTiming": ["3-1"]
}
```

---

## 5.4 활동 후보 수정

```http
PATCH /activity-candidates/{candidateId}
```

---

## 5.5 활동 후보 선택

```http
POST /activity-candidates/{candidateId}/select
```

---

## 5.6 활동 후보 제외

```http
POST /activity-candidates/{candidateId}/exclude
```

---

# 6. 학기별 계획 API

## 6.1 AI 시간표 생성

선택된 활동 후보를 바탕으로 남은 학기별 계획을 생성한다.

```http
POST /plans/generate
```

### Request Body

```json
{
  "candidateIds": ["candidate_uuid_1", "candidate_uuid_2"],
  "planType": "ai_draft"
}
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "plan_uuid",
      "type": "ai_draft",
      "title": "AI 추천 대학생활 로드맵",
      "status": "draft"
    },
    "items": [
      {
        "id": "plan_item_uuid_1",
        "periodKey": "3-1",
        "periodLabel": "3학년 1학기",
        "title": "관심 연구실 탐색",
        "description": "관심 분야 연구실 5곳을 정리하고 컨택 가능성을 확인합니다.",
        "category": "career_required",
        "sourceActivityId": "candidate_uuid_1",
        "orderIndex": 1
      },
      {
        "id": "plan_item_uuid_2",
        "periodKey": "summer",
        "periodLabel": "여름방학",
        "title": "운동 루틴 유지",
        "description": "주 2회 운동 루틴을 유지하며 방학 중 생활 리듬을 관리합니다.",
        "category": "life_required",
        "sourceActivityId": "candidate_uuid_2",
        "orderIndex": 1
      }
    ]
  }
}
```

---

## 6.2 내 계획 목록 조회

```http
GET /plans/me
```

### Query

```http
GET /plans/me?type=ai_draft
GET /plans/me?type=user_plan
```

---

## 6.3 계획 상세 조회

```http
GET /plans/{planId}
```

---

## 6.4 AI 시간표 가져오기

상단 AI 시간표를 하단 사용자 수정 가능 시간표로 복사한다.

```http
POST /plans/{planId}/fork
```

### Request Body

```json
{
  "targetType": "user_plan",
  "title": "내가 선택한 대학생활 로드맵"
}
```

---

## 6.5 계획 항목 추가

```http
POST /plans/{planId}/items
```

### Request Body

```json
{
  "periodKey": "3-2",
  "periodLabel": "3학년 2학기",
  "title": "대기업 인턴 지원",
  "description": "하반기 채용연계형 인턴 공고를 확인하고 지원합니다.",
  "category": "career_required",
  "orderIndex": 2
}
```

---

## 6.6 계획 항목 수정

```http
PATCH /plan-items/{itemId}
```

---

## 6.7 계획 항목 삭제

```http
DELETE /plan-items/{itemId}
```

---

## 6.8 현재 활성 계획 조회

투두 페이지 상단에서 최종 선택한 시간표를 보여줄 때 사용한다.

```http
GET /plans/me/active
```

---

# 7. AI 제안 API

## 7.1 내 AI 제안 목록 조회

```http
GET /ai-proposals/me
```

### Query

```http
GET /ai-proposals/me?status=pending
GET /ai-proposals/me?contextPage=timeline
```

---

## 7.2 AI 제안 반영

```http
POST /ai-proposals/{proposalId}/apply
```

---

## 7.3 AI 제안 거절

```http
POST /ai-proposals/{proposalId}/reject
```

---

# 8. 투두 API

## 8.1 최종 계획 기반 투두 생성

```http
POST /todos/generate
```

### Request Body

```json
{
  "planId": "user_plan_uuid",
  "scopes": ["today", "month", "semester"]
}
```

### Response 예시

```json
{
  "success": true,
  "data": {
    "generatedCount": 2,
    "todos": [
      {
        "id": "todo_uuid_1",
        "title": "관심 연구실 5곳 리스트업",
        "description": "교수님 연구분야, 최근 논문, 컨택 가능성을 정리합니다.",
        "scope": "today",
        "status": "todo",
        "priority": "high",
        "dueDate": "2026-07-05",
        "relatedPlanItemId": "plan_item_uuid_1"
      }
    ]
  }
}
```

---

## 8.2 내 투두 조회

```http
GET /todos/me
```

### Query

```http
GET /todos/me?scope=today
GET /todos/me?scope=month
GET /todos/me?scope=semester
GET /todos/me?status=todo
```

---

## 8.3 투두 직접 추가

```http
POST /todos
```

### Request Body

```json
{
  "title": "교환학생 지원 요건 확인",
  "description": "지원 학점, 어학 성적, 마감일을 확인합니다.",
  "scope": "month",
  "priority": "medium",
  "dueDate": "2026-07-20",
  "relatedPlanItemId": "plan_item_uuid"
}
```

---

## 8.4 투두 수정

```http
PATCH /todos/{todoId}
```

---

## 8.5 투두 완료 처리

```http
POST /todos/{todoId}/complete
```

---

## 8.6 투두 미루기

```http
POST /todos/{todoId}/defer
```

### Request Body

```json
{
  "newDueDate": "2026-07-10",
  "reason": "시험 준비로 인해 연기"
}
```

---

## 8.7 투두 삭제

```http
DELETE /todos/{todoId}
```

---

# 9. 데모 초기화 API

선택 구현이다.
프론트에서 `localStorage`의 `guest_id`를 새로 생성하는 것만으로도 충분하다.

```http
DELETE /demo/me
```

---

# 10. 주요 Enum

## 10.1 `activityCategory`

학사견고는 활동을 대학 시간표처럼 분류한다.

| 값                | 라벨     | 의미                                                                |
| ----------------- | -------- | ------------------------------------------------------------------- |
| `career_required` | 진로필수 | 진로 결정, 취업, 대학원, 창업 등 다음 단계에 직접적으로 필요한 활동 |
| `career_elective` | 진로선택 | 커리어 탐색, 역량 강화, 포트폴리오 확장에 도움이 되는 활동          |
| `life_required`   | 교양필수 | 건강, 루틴, 관계, 재정, 멘탈처럼 삶의 기반을 만드는 활동            |
| `life_elective`   | 교양선택 | 삶의 폭과 대학생활의 만족도를 넓히는 활동                           |

### 예시

| 카테고리          | 예시                                              |
| ----------------- | ------------------------------------------------- |
| `career_required` | 랩인턴, 대기업 인턴, 대학원 컨택, 포트폴리오 정리 |
| `career_elective` | 공모전, 사이드 프로젝트, 현직자 커피챗, 자격증    |
| `life_required`   | 운동 루틴, 수면 루틴, 재정 관리, 멘탈 관리        |
| `life_elective`   | 밴드 동아리, 여행, 봉사활동, 교환학생, 독서 모임  |

---

## 10.2 `gender`

| 값                  | 의미             |
| ------------------- | ---------------- |
| `male`              | 남               |
| `female`            | 여               |
| `prefer_not_to_say` | 알리고 싶지 않음 |

---

## 10.3 `mbti`

허용값:

```text
INTJ, INTP, ENTJ, ENTP,
INFJ, INFP, ENFJ, ENFP,
ISTJ, ISFJ, ESTJ, ESFJ,
ISTP, ISFP, ESTP, ESFP,
unknown
```

---

## 10.4 `priority`

```text
low, medium, high
```

---

## 10.5 `difficulty`

```text
low, medium, high
```

---

## 10.6 `activityCandidateStatus`

```text
candidate, selected, excluded
```

---

## 10.7 `planType`

```text
ai_draft, user_plan, final
```

---

## 10.8 `planStatus`

```text
draft, active, archived
```

---

## 10.9 `periodKey`

```text
3-1, summer, 3-2, winter, 4-1, final_summer, 4-2
```

---

## 10.10 `todoScope`

```text
today, month, semester
```

---

## 10.11 `todoStatus`

```text
todo, in_progress, done, deferred
```

---

## 10.12 `proposalStatus`

```text
pending, applied, rejected, expired
```

---

## 10.13 `proposalItemType`

```text
add_activity_candidate
update_activity_candidate
exclude_activity_candidate
add_plan_item
update_plan_item
delete_plan_item
add_todo
update_todo
delete_todo
```

---

# 11. 화면별 API 흐름

## 11.1 첫 페이지

```text
1. 프론트에서 guest_id 생성
2. GET /profiles/me
3. 프로필 없으면 POST /profiles
```

---

## 11.2 성향 설문

```text
1. GET /surveys/current
2. POST /surveys/responses
3. GET /surveys/result/me
```

---

## 11.3 챗봇 온보딩

```text
1. POST /chat/sessions
2. POST /chat/sessions/{sessionId}/messages
3. POST /chat/sessions/{sessionId}/summarize
```

---

## 11.4 활동 후보 페이지

```text
1. POST /activity-candidates/generate
2. GET /activity-candidates/me
3. POST /activity-candidates/{candidateId}/select
4. POST /activity-candidates/{candidateId}/exclude
5. PATCH /activity-candidates/{candidateId}
```

---

## 11.5 시간표 페이지

```text
1. POST /plans/generate
2. GET /plans/{planId}
3. POST /plans/{planId}/fork
4. POST /plans/{planId}/items
5. PATCH /plan-items/{itemId}
6. DELETE /plan-items/{itemId}
```

---

## 11.6 AI 채팅 내용 반영

```text
1. 챗봇 응답에서 proposal 수신
2. 프론트에서 proposal 미리보기 표시
3. 사용자가 반영 버튼 클릭
4. POST /ai-proposals/{proposalId}/apply
5. 관련 데이터 재조회
```

---

## 11.7 투두 페이지

```text
1. GET /plans/me/active
2. POST /todos/generate
3. GET /todos/me?scope=today
4. GET /todos/me?scope=month
5. GET /todos/me?scope=semester
6. PATCH /todos/{todoId}
7. POST /todos/{todoId}/complete
```

---

# 12. MVP 핵심 원칙

```text
AI는 사용자 데이터를 직접 수정하지 않는다.
AI는 proposal을 만든다.
사용자가 버튼을 눌러야 proposal이 실제 데이터에 반영된다.
```
