import { api } from '../lib/apiClient'
import type { SurveyAnswer, SurveyCurrent, SurveyResult } from '../types/api'

export function getCurrentSurvey(): Promise<SurveyCurrent> {
  return api.get<SurveyCurrent>('/surveys/current')
}

export function submitSurveyResponses(surveyId: string, answers: SurveyAnswer[]): Promise<SurveyResult> {
  return api.post<SurveyResult>('/surveys/responses', { surveyId, answers })
}

export function getMySurveyResult(): Promise<SurveyResult> {
  return api.get<SurveyResult>('/surveys/result/me')
}
