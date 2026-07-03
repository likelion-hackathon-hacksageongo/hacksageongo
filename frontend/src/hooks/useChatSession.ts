import { useEffect, useState } from 'react'
import { applyProposal, createChatSession, rejectProposal, sendChatMessage, summarizeChat } from '../services/chatApi'
import type { ChatPurpose, ChatSummary, Proposal } from '../types/api'

export interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  proposal?: Proposal
}

export function useChatSession(purpose: ChatPurpose, contextPage: string) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [sending, setSending] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<ChatSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    createChatSession(purpose)
      .then((session) => {
        if (!cancelled) setSessionId(session.sessionId)
      })
      .catch(() => {
        if (!cancelled) setErrorMessage('대화를 시작하지 못했어요.')
      })
    return () => {
      cancelled = true
    }
  }, [purpose])

  function updateProposalStatus(messageId: string, status: Proposal['status']) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId && m.proposal ? { ...m, proposal: { ...m.proposal, status } } : m)),
    )
  }

  async function sendMessage(text: string): Promise<DisplayMessage | undefined> {
    const trimmed = text.trim()
    if (!trimmed || sending || !sessionId) return undefined

    const userMessage: DisplayMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setSending(true)
    setErrorMessage('')
    try {
      const { assistantMessage, proposal } = await sendChatMessage(sessionId, trimmed, contextPage)
      const newMessage: DisplayMessage = { id: crypto.randomUUID(), role: 'assistant', content: assistantMessage.content, proposal }
      setMessages((prev) => [...prev, newMessage])
      return newMessage
    } catch {
      setErrorMessage('메시지 전송에 실패했어요.')
      return undefined
    } finally {
      setSending(false)
    }
  }

  async function applyProposalFor(messageId: string, proposalId: string) {
    try {
      await applyProposal(proposalId)
      updateProposalStatus(messageId, 'applied')
    } catch {
      setErrorMessage('제안을 반영하지 못했어요.')
    }
  }

  async function rejectProposalFor(messageId: string, proposalId: string) {
    try {
      await rejectProposal(proposalId)
      updateProposalStatus(messageId, 'rejected')
    } catch {
      setErrorMessage('제안을 거절하지 못했어요.')
    }
  }

  async function summarize() {
    if (!sessionId || summarizing) return
    setSummarizing(true)
    setErrorMessage('')
    try {
      const result = await summarizeChat(sessionId)
      setSummary(result)
    } catch {
      setErrorMessage('대화 요약에 실패했어요.')
    } finally {
      setSummarizing(false)
    }
  }

  return {
    sessionId,
    messages,
    sending,
    summarizing,
    summary,
    errorMessage,
    sendMessage,
    applyProposalFor,
    rejectProposalFor,
    summarize,
  }
}
