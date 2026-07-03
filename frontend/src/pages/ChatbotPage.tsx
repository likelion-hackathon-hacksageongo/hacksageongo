import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatSession } from '../hooks/useChatSession'
import ChatMessageList, { TypingDots } from '../components/ChatMessageList'

const PURPOSE = 'onboarding'
const CONTEXT_PAGE = 'onboarding'

export default function ChatbotPage() {
  const navigate = useNavigate()
  const {
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
  } = useChatSession(PURPOSE, CONTEXT_PAGE)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, summarizing])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between max-w-md w-full mx-auto">
        <h1 className="text-sm font-semibold text-gray-900">챗봇과의 대화</h1>
        {!summary && messages.length > 0 && (
          <button
            type="button"
            onClick={summarize}
            disabled={summarizing}
            className="text-xs text-blue-600 underline transition-colors hover:text-blue-700 disabled:opacity-40"
          >
            {summarizing ? '정리하는 중...' : '대화 마무리하기'}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-md w-full mx-auto">
        <ChatMessageList messages={messages} onApply={applyProposalFor} onReject={rejectProposalFor} />
        {sending && <TypingDots />}

        {summary && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
            <p className="font-medium text-gray-900">대화 요약</p>
            <p className="text-gray-600">{summary.summary}</p>
            <button
              type="button"
              onClick={() => navigate('/activities')}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              다음
            </button>
          </div>
        )}

        {errorMessage && <p className="text-sm text-red-500 text-center">{errorMessage}</p>}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 bg-white px-4 py-3 flex gap-2 max-w-md w-full mx-auto"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || !sessionId || !!summary}
          placeholder={summary ? '대화가 끝났어요' : '답변을 입력하세요'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={sending || !sessionId || !input.trim() || !!summary}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
        >
          전송
        </button>
      </form>
    </div>
  )
}
