import { api } from '../lib/apiClient'
import type { Todo, TodoScope, TodoStatus } from '../types/api'

export function generateTodos(planId: string, scopes: TodoScope[]): Promise<{ generatedCount: number; todos: Todo[] }> {
  return api.post(`/todos/generate`, { planId, scopes })
}

export function getMyTodos(scope?: TodoScope): Promise<{ todos: Todo[] }> {
  const query = scope ? `?scope=${scope}` : ''
  return api.get(`/todos/me${query}`)
}

export function completeTodo(todoId: string): Promise<void> {
  return api.post(`/todos/${todoId}/complete`)
}

export function updateTodoStatus(todoId: string, status: TodoStatus): Promise<void> {
  return api.patch(`/todos/${todoId}`, { status })
}
