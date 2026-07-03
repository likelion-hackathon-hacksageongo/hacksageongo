import { api } from '../lib/apiClient'
import type { ChatMessageResponse, ChatPurpose, ChatSession, ChatSummary } from '../types/api'

export function createChatSession(purpose: ChatPurpose): Promise<ChatSession> {
  return api.post<ChatSession>('/chat/sessions', { purpose })
}

export function sendChatMessage(
  sessionId: string,
  message: string,
  contextPage: string,
): Promise<ChatMessageResponse> {
  return api.post<ChatMessageResponse>(`/chat/sessions/${sessionId}/messages`, { message, contextPage })
}

export function summarizeChat(sessionId: string): Promise<ChatSummary> {
  return api.post<ChatSummary>(`/chat/sessions/${sessionId}/summarize`)
}

export function applyProposal(proposalId: string): Promise<void> {
  return api.post(`/ai-proposals/${proposalId}/apply`)
}

export function rejectProposal(proposalId: string): Promise<void> {
  return api.post(`/ai-proposals/${proposalId}/reject`)
}
