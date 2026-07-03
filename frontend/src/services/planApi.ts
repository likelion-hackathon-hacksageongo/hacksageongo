import { api } from '../lib/apiClient'
import type { NewPlanItemPayload, PlanItem, PlanType, PlanWithItems } from '../types/api'

export function generatePlan(candidateIds: string[]): Promise<PlanWithItems> {
  return api.post<PlanWithItems>('/plans/generate', { candidateIds, planType: 'ai_draft' })
}

export function getPlan(planId: string): Promise<PlanWithItems> {
  return api.get<PlanWithItems>(`/plans/${planId}`)
}

export function getActivePlan(): Promise<PlanWithItems> {
  return api.get<PlanWithItems>('/plans/me/active')
}

export function getMyPlans(type?: PlanType): Promise<{ plans: PlanWithItems['plan'][] }> {
  const query = type ? `?type=${type}` : ''
  return api.get<{ plans: PlanWithItems['plan'][] }>(`/plans/me${query}`)
}

export function forkPlan(planId: string, targetType: PlanType, title: string): Promise<PlanWithItems> {
  return api.post<PlanWithItems>(`/plans/${planId}/fork`, { targetType, title })
}

export function addPlanItem(planId: string, payload: NewPlanItemPayload): Promise<PlanItem> {
  return api.post<PlanItem>(`/plans/${planId}/items`, payload)
}

export function updatePlanItem(itemId: string, patch: Partial<NewPlanItemPayload>): Promise<PlanItem> {
  return api.patch<PlanItem>(`/plan-items/${itemId}`, patch)
}

export function deletePlanItem(itemId: string): Promise<void> {
  return api.delete(`/plan-items/${itemId}`)
}
