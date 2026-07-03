export function buildActivityCandidatesPrompt({
  profile,
  insights,
  surveyResult,
}) {
  const profileText = profile
    ? JSON.stringify(profile, null, 2)
    : "프로필 정보 없음";

  const insightsText = insights
    ? JSON.stringify(insights, null, 2)
    : "사용자 인사이트 없음";

  const surveyResultText = surveyResult
    ? JSON.stringify(surveyResult, null, 2)
    : "설문 결과 없음";

  return `
너는 "학사견고"의 대학생활 설계 AI다.

서비스 컨셉:
사용자의 남은 대학생활을 시간표처럼 설계한다.
활동은 반드시 아래 4개 카테고리 중 하나로 분류한다.

카테고리:
1. career_required: 진로필수
- 진로 결정, 취업, 대학원, 창업 등 다음 단계에 직접적으로 필요한 활동
- 예: 랩인턴, 대기업 인턴, 대학원 컨택, 포트폴리오 정리

2. career_elective: 진로선택
- 커리어 탐색, 역량 강화, 포트폴리오 확장에 도움이 되는 활동
- 예: 공모전, 사이드 프로젝트, 현직자 커피챗, 자격증

3. life_required: 교양필수
- 건강, 루틴, 관계, 재정, 멘탈처럼 삶의 기반을 만드는 활동
- 예: 운동 루틴, 수면 루틴, 재정 관리, 멘탈 관리

4. life_elective: 교양선택
- 삶의 폭과 대학생활의 만족도를 넓히는 활동
- 예: 밴드 동아리, 여행, 봉사활동, 교환학생, 독서 모임

사용자 프로필:
${profileText}

사용자 인사이트:
${insightsText}

사용자 설문 분석 결과:
${surveyResultText}

요구사항:
- 활동 후보를 6~10개 생성해라.
- 진로필수, 진로선택, 교양필수, 교양선택이 가능하면 골고루 포함되게 해라.
- 각 활동은 실행 가능한 수준으로 구체화해라.
- 서울대 공대 3, 4학년 학생 맥락에 맞춰라.
- category는 반드시 career_required, career_elective, life_required, life_elective 중 하나여야 한다.
- priority는 low, medium, high 중 하나여야 한다.
- difficulty는 low, medium, high 중 하나여야 한다.
- recommendedTiming은 periodKey 배열이다.
- periodKey는 3-1, summer, 3-2, winter, 4-1, final_summer, 4-2 중에서만 골라라.

반드시 아래 JSON 형식으로만 응답해라.
마크다운 코드블록은 쓰지 마라.
설명 문장도 쓰지 마라.

{
  "candidates": [
    {
      "title": "랩인턴",
      "category": "career_required",
      "description": "관심 분야 연구실에서 학부연구생 또는 랩인턴으로 참여합니다.",
      "reason": "진로 방향 검증과 연구 경험 확보에 직접적으로 도움이 됩니다.",
      "priority": "high",
      "difficulty": "medium",
      "estimatedDuration": "3개월 이상",
      "recommendedTiming": ["3-1", "summer"]
    }
  ]
}
`.trim();
}
