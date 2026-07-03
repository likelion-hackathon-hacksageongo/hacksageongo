const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
const GUEST_ID_KEY = 'guest_id'

export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}

export function resetGuestId(): void {
  localStorage.removeItem(GUEST_ID_KEY)
}

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiFailure {
  success: false
  error: { code: string; message: string }
}

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Id': getGuestId(),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'API 서버에 연결할 수 없어요.')
  }

  // 백엔드가 아직 없으면 이 경로가 Vite dev 서버로 가서 index.html(SPA fallback)이 돌아올 수 있음
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError('INVALID_RESPONSE', `API 서버 응답이 올바르지 않아요. (status ${res.status})`)
  }

  const json = (await res.json()) as ApiSuccess<T> | ApiFailure

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message)
  }
  return json.data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
