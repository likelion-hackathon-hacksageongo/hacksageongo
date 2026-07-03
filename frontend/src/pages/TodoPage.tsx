import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import TimetableBoard from '../components/TimetableBoard'
import TodoSection from '../components/TodoSection'
import ProgressBar from '../components/ProgressBar'
import { createColorAssigner } from '../lib/activityColors'
import { buildPlanItemGroupMap, itemsToBlocks, type PlanBlock } from '../lib/planBlocks'
import { getActivePlan, getPlan } from '../services/planApi'
import { completeTodo, generateTodos, getMyTodos, updateTodoStatus } from '../services/todoApi'
import type { Todo } from '../types/api'

interface LocationState {
  planId?: string
}

export default function TodoPage() {
  const location = useLocation()
  const colorAssignerRef = useRef(createColorAssigner())

  const [blocks, setBlocks] = useState<PlanBlock[]>([])
  const [planItemGroupMap, setPlanItemGroupMap] = useState<Map<string, string>>(new Map())
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const state = (location.state as LocationState | null) ?? null
        let planId = state?.planId
        let items

        if (planId) {
          items = (await getPlan(planId)).items
        } else {
          const res = await getActivePlan()
          planId = res.plan.id
          items = res.items
        }

        setBlocks(itemsToBlocks(items, colorAssignerRef.current))
        setPlanItemGroupMap(buildPlanItemGroupMap(items))

        let [today, month, semester] = await Promise.all([
          getMyTodos('today'),
          getMyTodos('month'),
          getMyTodos('semester'),
        ])
        let all = [...today.todos, ...month.todos, ...semester.todos]

        if (all.length === 0) {
          await generateTodos(planId, ['today', 'month', 'semester'])
          ;[today, month, semester] = await Promise.all([
            getMyTodos('today'),
            getMyTodos('month'),
            getMyTodos('semester'),
          ])
          all = [...today.todos, ...month.todos, ...semester.todos]
        }

        setTodos(all)
      } catch {
        setErrorMessage('시간표 또는 Todo를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function groupKeyForTodo(todo: Todo): string | undefined {
    return todo.relatedPlanItemId ? planItemGroupMap.get(todo.relatedPlanItemId) : undefined
  }

  async function handleToggle(todo: Todo) {
    const nextStatus = todo.status === 'done' ? 'todo' : 'done'
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: nextStatus } : t)))
    try {
      if (nextStatus === 'done') await completeTodo(todo.id)
      else await updateTodoStatus(todo.id, 'todo')
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, status: todo.status } : t)))
    }
  }

  function handleSelectBlock(groupKey: string) {
    setSelectedGroupKey((prev) => (prev === groupKey ? null : groupKey))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  const todayTodos = todos.filter((t) => t.scope === 'today')
  const monthTodos = todos.filter((t) => t.scope === 'month')
  const semesterTodos = todos.filter((t) => t.scope === 'semester')
  const doneCount = todos.filter((t) => t.status === 'done').length

  const selectedBlock = selectedGroupKey ? blocks.find((b) => b.groupKey === selectedGroupKey) : null
  const activityTodos = selectedGroupKey ? todos.filter((t) => groupKeyForTodo(t) === selectedGroupKey) : []
  const activityDone = activityTodos.filter((t) => t.status === 'done').length

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div style={{ height: '35%' }} className="border-b border-gray-200 bg-white">
        <TimetableBoard
          title="확정된 로드맵"
          blocks={blocks}
          editable={false}
          selectedGroupKey={selectedGroupKey}
          onSelectBlock={handleSelectBlock}
        />
      </div>

      <div style={{ height: '65%' }} className="overflow-y-auto p-6 space-y-5">
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">전체 진행률</h2>
            <span className="text-sm font-semibold text-gray-900">
              {todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100)}%
            </span>
          </div>
          <ProgressBar value={doneCount} total={todos.length} />
        </div>

        {selectedBlock && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-blue-800">{selectedBlock.title} 진행률</h2>
              <span className="text-sm font-semibold text-blue-800">
                {activityTodos.length === 0 ? 0 : Math.round((activityDone / activityTodos.length) * 100)}%
              </span>
            </div>
            <ProgressBar value={activityDone} total={activityTodos.length} colorClass="bg-blue-600" />
            <p className="text-xs text-blue-700">
              {activityDone} / {activityTodos.length} 완료
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TodoSection
            title="오늘 할 일"
            todos={todayTodos}
            selectedGroupKey={selectedGroupKey}
            groupKeyForTodo={groupKeyForTodo}
            onToggle={handleToggle}
          />
          <TodoSection
            title="이번 달에 할 일"
            todos={monthTodos}
            selectedGroupKey={selectedGroupKey}
            groupKeyForTodo={groupKeyForTodo}
            onToggle={handleToggle}
          />
          <TodoSection
            title="이번 학기에 할 일"
            todos={semesterTodos}
            selectedGroupKey={selectedGroupKey}
            groupKeyForTodo={groupKeyForTodo}
            onToggle={handleToggle}
          />
        </div>
      </div>
    </div>
  )
}
