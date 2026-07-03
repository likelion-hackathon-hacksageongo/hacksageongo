import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TimetableBoard from '../components/TimetableBoard'
import TimelineChatPanel from '../components/TimelineChatPanel'
import { createColorAssigner } from '../lib/activityColors'
import { blocksToItemPayloads, buildComparisonMessage, cloneBlocks, itemsToBlocks, type PlanBlock } from '../lib/planBlocks'
import { addPlanItem, deletePlanItem, forkPlan, getActivePlan, getPlan } from '../services/planApi'
import type { PlanItem } from '../types/api'

interface LocationState {
  planId?: string
  items?: PlanItem[]
}

export default function TimelinePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const colorAssignerRef = useRef(createColorAssigner())

  const [planId, setPlanId] = useState<string | null>(null)
  const [aiBlocks, setAiBlocks] = useState<PlanBlock[]>([])
  const [userBlocks, setUserBlocks] = useState<PlanBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [pendingInitialMessage, setPendingInitialMessage] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    async function load() {
      const state = (location.state as LocationState | null) ?? null
      try {
        let currentPlanId = state?.planId
        let items = state?.items

        if (!items) {
          if (currentPlanId) {
            const res = await getPlan(currentPlanId)
            items = res.items
          } else {
            const res = await getActivePlan()
            currentPlanId = res.plan.id
            items = res.items
          }
        }

        if (!currentPlanId) throw new Error('no plan id')

        setPlanId(currentPlanId)
        const blocks = itemsToBlocks(items, colorAssignerRef.current)
        setAiBlocks(blocks)
        setUserBlocks(cloneBlocks(blocks))
      } catch {
        setErrorMessage('표시할 시간표를 불러오지 못했어요. 활동 조합 페이지에서 먼저 확정해주세요.')
      } finally {
        setLoading(false)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFinishEditing() {
    setPendingInitialMessage(buildComparisonMessage(aiBlocks, userBlocks))
    setChatOpen(true)
  }

  function openChatManually() {
    setPendingInitialMessage(null)
    setChatOpen(true)
  }

  function handleNewPlan(items: PlanItem[]) {
    const blocks = itemsToBlocks(items, colorAssignerRef.current)
    setAiBlocks(blocks)
    setUserBlocks(cloneBlocks(blocks))
  }

  async function handleFinalConfirm() {
    if (!planId || confirming) return
    setConfirming(true)
    setErrorMessage('')
    try {
      const forked = await forkPlan(planId, 'user_plan', '최종 로드맵')
      await Promise.all(forked.items.map((item) => deletePlanItem(item.id)))
      const payloads = blocksToItemPayloads(userBlocks)
      await Promise.all(payloads.map((payload) => addPlanItem(forked.plan.id, payload)))
      navigate('/todos', { state: { planId: forked.plan.id } })
    } catch {
      setErrorMessage('시간표 확정에 실패했어요.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (errorMessage && !planId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-red-500">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="h-1/2 border-b border-gray-200 bg-white">
        <TimetableBoard title="AI 추천 시간표" blocks={aiBlocks} editable={false} />
      </div>

      <div className="h-1/2 bg-white relative flex flex-col">
        <div className="flex items-center justify-between px-4 pt-2">
          <div />
          <div className="flex gap-2 pb-1">
            {errorMessage && <p className="text-xs text-red-500 self-center mr-2">{errorMessage}</p>}
            <button
              type="button"
              onClick={handleFinishEditing}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              수정 완료
            </button>
            <button
              type="button"
              onClick={handleFinalConfirm}
              disabled={confirming}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              {confirming ? '확정하는 중...' : '시간표 확정'}
            </button>
          </div>
        </div>
        <TimetableBoard
          title="내가 수정한 시간표"
          blocks={userBlocks}
          editable
          onChange={(updater) => setUserBlocks(updater)}
        />
      </div>

      <button
        type="button"
        onClick={openChatManually}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white shadow-lg"
        aria-label="챗봇 열기"
      >
        💬
      </button>

      {chatOpen && planId && (
        <TimelineChatPanel
          planId={planId}
          initialMessage={pendingInitialMessage ?? undefined}
          onClose={() => setChatOpen(false)}
          onNewPlan={handleNewPlan}
        />
      )}
    </div>
  )
}
