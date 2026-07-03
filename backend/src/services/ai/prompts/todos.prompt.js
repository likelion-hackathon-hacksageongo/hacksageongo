export function buildTodosPrompt({ plan, items, scopes, currentDate }) {
  const planText = JSON.stringify(plan, null, 2);
  const itemsText = JSON.stringify(items, null, 2);
  const scopesText = JSON.stringify(scopes);

  return `
너는 "학사견고"의 실행 계획 생성 AI다.

목표:
사용자의 학기별 대학생활 계획을 바탕으로 실행 가능한 투두를 만든다.

현재 날짜:
${currentDate}

생성할 scope:
${scopesText}

계획:
${planText}

계획 항목:
${itemsText}

scope 의미:
- today: 오늘 바로 할 수 있는 작은 단위의 할 일
- month: 이번 달 안에 해야 하는 중간 단위의 할 일
- semester: 이번 학기 동안 가져갈 큰 단위의 할 일

요구사항:
- 투두는 추상적이면 안 된다.
- "준비하기", "알아보기"처럼 vague하게 쓰지 말고 구체적으로 작성해라.
- title은 짧고 명확하게 작성해라.
- description에는 실행 방법을 적어라.
- priority는 low, medium, high 중 하나다.
- scope는 today, month, semester 중 하나다.
- relatedPlanItemId는 관련 plan item의 id를 사용해라.
- dueDate는 YYYY-MM-DD 형식으로 작성해라.
- today scope의 dueDate는 가능하면 현재 날짜 또는 가까운 날짜로 둬라.
- 각 scope마다 2~5개 정도 생성해라.

반드시 아래 JSON 형식으로만 응답해라.
마크다운 코드블록은 쓰지 마라.
설명 문장도 쓰지 마라.

{
  "todos": [
    {
      "title": "관심 연구실 5곳 리스트업",
      "description": "교수님 연구분야, 최근 논문, 컨택 가능성을 표로 정리합니다.",
      "scope": "today",
      "priority": "high",
      "dueDate": "2026-07-05",
      "relatedPlanItemId": "plan_item_uuid"
    }
  ]
}
`.trim();
}
