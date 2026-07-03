import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACTIVITY_CATEGORIES, getCategoryMeta } from '../data/activityCategories'
import { generateActivityCandidates, getMyActivityCandidates } from '../services/activityApi'
import { generatePlan } from '../services/planApi'
import ActivityChatPanel from '../components/ActivityChatPanel'
import type { ActivityCandidate } from '../types/api'

function ComboBox({
  title,
  items,
  emptyText,
  onRemove,
  onConfirm,
  confirming,
}: {
  title: string
  items: ActivityCandidate[]
  emptyText: string
  onRemove?: (id: string) => void
  onConfirm: () => void
  confirming: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col transition-shadow hover:shadow-md">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 flex-1">{emptyText}</p>
      ) : (
        <ul className="space-y-2 flex-1">
          {items.map((item) => {
            const meta = getCategoryMeta(item.category)
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                  <span className="truncate text-gray-700">{item.title}</span>
                </span>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-gray-300 transition-colors hover:text-red-400"
                    aria-label={`${item.title} 제거`}
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={onConfirm}
        disabled={items.length === 0 || confirming}
        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
      >
        {confirming ? '시간표 생성 중...' : '이 조합으로 확정'}
      </button>
    </div>
  )
}

export default function ActivitiesPage() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState<ActivityCandidate[]>([])
  const [aiCombo, setAiCombo] = useState<ActivityCandidate[]>([])
  const [myComboIds, setMyComboIds] = useState<Set<string>>(new Set())
  const [revisedCombo, setRevisedCombo] = useState<ActivityCandidate[] | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmingComboKey, setConfirmingComboKey] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        let list = (await getMyActivityCandidates('candidate')).candidates
        if (list.length === 0) {
          list = (await generateActivityCandidates()).candidates
        }
        setCandidates(list)
        setAiCombo(list)
      } catch {
        setErrorMessage('활동 후보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  function toggleMyCombo(id: string) {
    setMyComboIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleRevise() {
    const fresh = (await getMyActivityCandidates()).candidates
    const originalIds = new Set(candidates.map((c) => c.id))
    const revised = fresh.filter(
      (c) => c.status !== 'excluded' && (myComboIds.has(c.id) || !originalIds.has(c.id)),
    )
    setCandidates(fresh)
    setRevisedCombo(revised)
  }

  const myComboItems = candidates.filter((c) => myComboIds.has(c.id))

  async function handleConfirmCombo(key: string, items: ActivityCandidate[]) {
    if (items.length === 0 || confirmingComboKey) return
    setConfirmingComboKey(key)
    setErrorMessage('')
    try {
      const { plan, items: planItems } = await generatePlan(items.map((i) => i.id))
      navigate('/timeline', { state: { planId: plan.id, items: planItems } })
    } catch {
      setErrorMessage('시간표 생성에 실패했어요.')
    } finally {
      setConfirmingComboKey(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white p-4 space-y-6 overflow-y-auto">
        {ACTIVITY_CATEGORIES.map((cat) => {
          const items = candidates.filter((c) => c.category === cat.value)
          return (
            <div key={cat.value}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                <h3 className="text-xs font-semibold text-gray-500">{cat.label}</h3>
              </div>
              <div className="space-y-1.5">
                {items.length === 0 && <p className="text-xs text-gray-300">없음</p>}
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMyCombo(item.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-all hover:shadow-sm ${
                      myComboIds.has(item.id)
                        ? `${cat.badge} ring-1 ring-inset ${cat.ring}`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">활동 조합 비교</h1>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            챗봇과 상담하기
          </button>
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComboBox
            title="AI 추천 조합"
            items={aiCombo}
            emptyText="추천된 활동이 없어요"
            confirming={confirmingComboKey === 'ai'}
            onConfirm={() => handleConfirmCombo('ai', aiCombo)}
          />
          <ComboBox
            title="내가 정리한 조합"
            items={myComboItems}
            onRemove={toggleMyCombo}
            emptyText="왼쪽 목록에서 항목을 클릭해 추가하세요"
            confirming={confirmingComboKey === 'mine'}
            onConfirm={() => handleConfirmCombo('mine', myComboItems)}
          />
          <ComboBox
            title="수정된 조합"
            items={revisedCombo ?? []}
            emptyText="챗봇과 대화 후 '수정하기'를 누르면 여기에 표시돼요"
            confirming={confirmingComboKey === 'revised'}
            onConfirm={() => handleConfirmCombo('revised', revisedCombo ?? [])}
          />
        </div>
      </main>

      {chatOpen && <ActivityChatPanel onClose={() => setChatOpen(false)} onRevise={handleRevise} />}
    </div>
  )
}
