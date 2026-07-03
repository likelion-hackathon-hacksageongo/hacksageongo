export const SURVEY_ID = "career_readiness_v1";

export const SURVEY_TITLE = "학사견고 진로 준비 성향 설문";

export const SURVEY_TYPE = "likert_5";

export const SURVEY_QUESTIONS = [
  {
    id: "vacation_pressure",
    number: 1,
    text: "방학이 다가오면 뭔가 해야 한다는 압박감을 느낀다.",
    type: "likert_5",
    minLabel: "전혀 아니다",
    maxLabel: "매우 그렇다",
    axis: "activation_pressure",
  },
  {
    id: "application_speed",
    number: 2,
    text: "흥미로운 모집글을 보면 실제 지원이나 신청까지 빠르게 옮기는 편이다.",
    type: "likert_5",
    minLabel: "일단 저장만 해둔다",
    maxLabel: "바로 지원하거나 신청한다",
    axis: "execution_speed",
  },
  {
    id: "review_checking",
    number: 3,
    text: "활동을 시작하기 전에 후기나 정보를 많이 찾아보는 편이다.",
    type: "likert_5",
    minLabel: "거의 찾아보지 않는다",
    maxLabel: "충분히 찾아본 뒤 결정한다",
    axis: "information_checking",
  },
  {
    id: "readiness_barrier",
    number: 4,
    text: "아직 준비가 안 됐다는 생각 때문에 기회를 넘긴 적이 많다.",
    type: "likert_5",
    minLabel: "전혀 아니다",
    maxLabel: "매우 그렇다",
    axis: "readiness_barrier",
  },
  {
    id: "exploration_drive",
    number: 5,
    text: "당장 스펙이 되지 않아도 재밌어 보이면 한 번 해보고 싶다.",
    type: "likert_5",
    minLabel: "전혀 아니다",
    maxLabel: "매우 그렇다",
    axis: "exploration_drive",
  },
  {
    id: "learning_orientation",
    number: 6,
    text: "관심 있는 일이 생기면 관련 강의, 영상, 후기부터 찾아보는 편이다.",
    type: "likert_5",
    minLabel: "전혀 아니다",
    maxLabel: "매우 그렇다",
    axis: "learning_orientation",
  },
  {
    id: "intern_preference",
    number: 7,
    text: "둘 중 더 끌리는 인턴을 고른다면, 돈이나 인지도보다 배움과 성장 경험이 큰 쪽에 끌린다.",
    type: "likert_5",
    minLabel: "돈/인지도가 더 중요하다",
    maxLabel: "배움/성장이 더 중요하다",
    axis: "growth_vs_money",
  },
  {
    id: "recovery_need",
    number: 8,
    text: "바쁘게 사는 것도 좋지만, 나를 회복시키는 시간이 꼭 필요하다고 느낀다.",
    type: "likert_5",
    minLabel: "전혀 아니다",
    maxLabel: "매우 그렇다",
    axis: "recovery_need",
  },
  {
    id: "social_energy",
    number: 9,
    text: "모르는 사람이 많은 자리에 가면 에너지가 떨어지기보다 은근 기대된다.",
    type: "likert_5",
    minLabel: "에너지가 떨어진다",
    maxLabel: "기대되고 에너지가 난다",
    axis: "social_energy",
  },
  {
    id: "health_rhythm",
    number: 10,
    text: "바쁜 시기에도 운동이나 가벼운 산책처럼 몸을 움직이려고 한다.",
    type: "likert_5",
    minLabel: "전혀 아니다",
    maxLabel: "매우 그렇다",
    axis: "health_rhythm",
  },
  {
    id: "external_validation",
    number: 11,
    text: "활동을 고를 때, 남들이 보기에도 괜찮은 활동인지 신경 쓰이는 편이다.",
    type: "likert_5",
    minLabel: "거의 신경 쓰지 않는다",
    maxLabel: "많이 신경 쓴다",
    axis: "external_validation",
  },
];

export const SURVEY_QUESTION_IDS = SURVEY_QUESTIONS.map(
  (question) => question.id,
);

export const SURVEY_SCORE_AXES = [
  "activation_pressure",
  "execution_speed",
  "information_checking",
  "readiness_barrier",
  "exploration_drive",
  "learning_orientation",
  "growth_vs_money",
  "recovery_need",
  "social_energy",
  "health_rhythm",
  "external_validation",
];

export function getSurveyQuestionById(questionId) {
  return SURVEY_QUESTIONS.find((question) => question.id === questionId);
}

export function getLikertLabel(value) {
  const labels = {
    1: "1점",
    2: "2점",
    3: "3점",
    4: "4점",
    5: "5점",
  };

  return labels[value] ?? `${value}점`;
}
