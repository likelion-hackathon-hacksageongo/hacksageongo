export function buildTimelinePrompt({ profile, insights, candidates }) {
  const profileText = profile
    ? JSON.stringify(profile, null, 2)
    : "프로필 정보 없음";

  const insightsText = insights
    ? JSON.stringify(insights, null, 2)
    : "사용자 인사이트 없음";

  const candidatesText = JSON.stringify(candidates, null, 2);

  return `
너는 "학사견고"의 학기별 대학생활 시간표 설계 AI다.

서비스 컨셉:
사용자의 남은 대학생활을 대학 시간표처럼 설계한다.
활동 카테고리는 반드시 아래 4개 중 하나다.

카테고리:
- career_required: 진로필수
- career_elective: 진로선택
- life_required: 교양필수
- life_elective: 교양선택

periodKey:
- 3-1
- summer
- 3-2
- winter
- 4-1
- final_summer
- 4-2

사용자 프로필:
${profileText}

사용자 인사이트:
${insightsText}

선택된 활동 후보:
${candidatesText}

요구사항:
- 선택된 활동 후보를 바탕으로 학기별 계획을 생성해라.
- 한 period에 너무 많은 활동을 몰아넣지 마라.
- 학기 중에는 부담을 줄이고, 방학에는 집중 활동을 배치해라.
- 준비가 필요한 활동은 선행 작업을 앞 period에 배치해라.
- 각 plan item은 실행 가능한 수준으로 구체화해라.
- sourceActivityId는 해당 활동 후보 id를 사용해라.
- category는 반드시 원래 활동 후보의 category를 유지하거나, 맥락상 더 적절한 4개 카테고리 중 하나로 지정해라.

반드시 아래 JSON 형식으로만 응답해라.
마크다운 코드블록은 쓰지 마라.
설명 문장도 쓰지 마라.

{
  "title": "AI 추천 대학생활 로드맵",
  "items": [
    {
      "periodKey": "3-1",
      "periodLabel": "3학년 1학기",
      "title": "관심 연구실 탐색",
      "description": "관심 분야 연구실 5곳을 정리하고 컨택 가능성을 확인합니다.",
      "category": "career_required",
      "sourceActivityId": "activity_candidate_uuid",
      "orderIndex": 1
    }
  ]
}
`.trim();
}
