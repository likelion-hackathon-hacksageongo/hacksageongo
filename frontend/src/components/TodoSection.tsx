import ProgressBar from './ProgressBar'
import type { Todo } from '../types/api'

interface Props {
  title: string
  todos: Todo[]
  selectedGroupKey: string | null
  groupKeyForTodo: (todo: Todo) => string | undefined
  onToggle: (todo: Todo) => void
}

export default function TodoSection({ title, todos, selectedGroupKey, groupKeyForTodo, onToggle }: Props) {
  const doneCount = todos.filter((t) => t.status === 'done').length

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">
          {doneCount} / {todos.length} 완료
        </span>
      </div>
      <ProgressBar value={doneCount} total={todos.length} />

      {todos.length === 0 ? (
        <p className="text-xs text-gray-300 pt-1">할 일이 없어요</p>
      ) : (
        <ul className="space-y-1 pt-1">
          {todos.map((todo) => {
            const highlighted = selectedGroupKey !== null && groupKeyForTodo(todo) === selectedGroupKey
            const done = todo.status === 'done'
            return (
              <li key={todo.id}>
                <label
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200 cursor-pointer ${
                    highlighted ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggle(todo)}
                    className={`h-4 w-4 rounded transition-transform active:scale-90 ${
                      highlighted ? 'accent-blue-600' : 'accent-gray-900'
                    }`}
                  />
                  <span
                    className={`transition-colors duration-200 ${
                      done ? 'text-gray-300 line-through' : highlighted ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {todo.title}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
