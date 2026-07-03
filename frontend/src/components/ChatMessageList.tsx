import type { DisplayMessage } from '../hooks/useChatSession'

interface Props {
  messages: DisplayMessage[]
  onApply: (messageId: string, proposalId: string) => void
  onReject: (messageId: string, proposalId: string) => void
}

export function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2.5">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" />
        </span>
      </div>
    </div>
  )
}

export default function ChatMessageList({ messages, onApply, onReject }: Props) {
  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className="space-y-2">
          <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line transition-shadow hover:shadow-sm ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>

          {m.proposal && (
            <div className="ml-1 rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 space-y-2">
              <p className="font-medium">AI 제안: {m.proposal.summary}</p>
              {m.proposal.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApply(m.id, m.proposal!.id)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-white transition-colors hover:bg-blue-700"
                  >
                    반영하기
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(m.id, m.proposal!.id)}
                    className="rounded-md border border-blue-200 px-3 py-1.5 text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    거절
                  </button>
                </div>
              ) : (
                <p className="text-blue-400">{m.proposal.status === 'applied' ? '반영됨' : '거절됨'}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
