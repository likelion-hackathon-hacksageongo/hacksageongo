import { api } from '../lib/apiClient'
import type { ActivityCandidate, ActivityCandidateStatus } from '../types/api'

interface CandidatesResponse {
  candidates: ActivityCandidate[]
}

export function generateActivityCandidates(): Promise<CandidatesResponse> {
  return api.post<CandidatesResponse>('/activity-candidates/generate')
}

export function getMyActivityCandidates(status?: ActivityCandidateStatus): Promise<CandidatesResponse> {
  const query = status ? `?status=${status}` : ''
  return api.get<CandidatesResponse>(`/activity-candidates/me${query}`)
}

export function selectActivityCandidate(candidateId: string): Promise<void> {
  return api.post(`/activity-candidates/${candidateId}/select`)
}

export function excludeActivityCandidate(candidateId: string): Promise<void> {
  return api.post(`/activity-candidates/${candidateId}/exclude`)
}
