import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useChatSession } from '../hooks/useChatSession'
import ChatMessageList, { TypingDots } from './ChatMessageList'
import { getPlan } from '../services/planApi'
import type { PlanItem } from '../types/api'

const PURPOSE = 'timeline_planning'
const CONTEXT_PAGE = 'timeline'
const REVISE_MESSAGE = '지금까지 나눈 대화를 반영해서 새로운 시간표를 추천해줘.'

interface Props {
  planId: string
  initialMessage?: string
  onClose: () => void
  onNewPlan: (items: PlanItem[]) => void
}

export default function TimelineChatPanel({ planId, initialMessage, onClose, onNewPlan }: Props) {
  const { sessionId, messages, sending, errorMessage, sendMessage, applyProposalFor, rejectProposalFor } =
    useChatSession(PURPOSE, CONTEXT_PAGE)
  const [input, setInput] = useState('')
  const [revising, setRevising] = useState(false)
  const hasSentInitial = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionId && initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true
      void sendMessage(initialMessage)
    }
  }, [sessionId, initialMessage, sendMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input
    setInput('')
    await sendMessage(text)
  }

  async function handleRevise() {
    setRevising(true)
    try {
      const assistantMsg = await sendMessage(REVISE_MESSAGE)
      if (assistantMsg?.proposal) {
        await applyProposalFor(assistantMsg.id, assistantMsg.proposal.id)
        const fresh = await getPlan(planId)
        onNewPlan(fresh.items)
      }
    } finally {
      setRevising(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full bg-white flex flex-col shadow-xl">
        <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">챗봇과의 대화</h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-sm">
            닫기
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !initialMessage && (
            <p className="text-xs text-gray-400 text-center pt-8">
              시간표에 대해 궁금한 점이나 바꾸고 싶은 부분을 이야기해보세요.
            </p>
          )}
          <ChatMessageList messages={messages} onApply={applyProposalFor} onReject={rejectProposalFor} />
          {sending && <TypingDots />}
          {errorMessage && <p className="text-sm text-red-500 text-center">{errorMessage}</p>}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 p-4 space-y-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending || !sessionId}
              placeholder="메시지를 입력하세요"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={sending || !sessionId || !input.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              전송
            </button>
          </form>
          <button
            type="button"
            onClick={handleRevise}
            disabled={revising || sending || messages.length === 0}
            className="w-full rounded-lg border border-blue-600 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {revising ? '새로운 추천을 반영하는 중...' : '수정하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
