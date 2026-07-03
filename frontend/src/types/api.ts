export type Gender = 'male' | 'female' | 'prefer_not_to_say'

export interface Profile {
  nickname: string
  birthYear: number
  school?: string
  department?: string
  gpa?: number
  gender: Gender
  mbti?: string
  completedSemesters: number
  expectedGraduation: string
}

export interface SurveyQuestion {
  id: string
  text: string
  type: 'likert_5'
  minLabel: string
  maxLabel: string
}

export interface SurveyCurrent {
  surveyId: string
  type: string
  questions: SurveyQuestion[]
}

export interface SurveyAnswer {
  questionId: string
  value: number
}

export interface SurveyResult {
  hollandScores: Record<string, number>
  topTypes: string[]
  summary: string
}

export type ChatPurpose = 'onboarding' | 'activity_planning' | 'timeline_planning' | 'todo_planning'

export interface ChatSession {
  sessionId: string
}

export interface AssistantMessage {
  role: 'assistant'
  content: string
}

export interface ProposalItem {
  type: string
  payload: Record<string, unknown>
}

export type ProposalStatus = 'pending' | 'applied' | 'rejected' | 'expired'

export interface Proposal {
  id: string
  status: ProposalStatus
  summary: string
  items: ProposalItem[]
}

export interface ChatMessageResponse {
  assistantMessage: AssistantMessage
  proposal?: Proposal
}

export interface ChatSummary {
  summary: string
  insights: {
    goals: string[]
    concerns: string[]
    preferredActivities: string[]
    constraints: string[]
  }
}

export type ActivityCategory = 'career_required' | 'career_elective' | 'life_required' | 'life_elective'
export type Priority = 'low' | 'medium' | 'high'
export type Difficulty = 'low' | 'medium' | 'high'
export type ActivityCandidateStatus = 'candidate' | 'selected' | 'excluded'

export interface ActivityCandidate {
  id: string
  title: string
  category: ActivityCategory
  description: string
  reason: string
  priority: Priority
  difficulty: Difficulty
  estimatedDuration: string
  recommendedTiming: string[]
  status: ActivityCandidateStatus
}

export type PeriodKey = '3-1' | 'summer' | '3-2' | 'winter' | '4-1' | 'final_summer' | '4-2'
export type PlanType = 'ai_draft' | 'user_plan' | 'final'
export type PlanStatus = 'draft' | 'active' | 'archived'

export interface Plan {
  id: string
  type: PlanType
  title: string
  status: PlanStatus
}

export interface PlanItem {
  id: string
  periodKey: PeriodKey
  periodLabel: string
  title: string
  description: string
  category: ActivityCategory
  sourceActivityId?: string
  orderIndex: number
}

export interface PlanWithItems {
  plan: Plan
  items: PlanItem[]
}

export interface NewPlanItemPayload {
  periodKey: PeriodKey
  periodLabel: string
  title: string
  description: string
  category: ActivityCategory
  sourceActivityId?: string
  orderIndex: number
}

export type TodoScope = 'today' | 'month' | 'semester'
export type TodoStatus = 'todo' | 'in_progress' | 'done' | 'deferred'

export interface Todo {
  id: string
  title: string
  description: string
  scope: TodoScope
  status: TodoStatus
  priority: Priority
  dueDate: string
  relatedPlanItemId?: string
}
