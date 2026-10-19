const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const accessToken = () => localStorage.getItem('pf_access_token') ?? undefined

export type BackendUser = {
  id: number
  email: string
  name: string
  role: 'ADMINISTRATOR' | 'VETERINARIAN' | 'RECEPTIONIST' | 'ASSISTANT' | 'OWNER'
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'message' in body ? String(body.message) : 'No se pudo conectar con el backend.'
    throw new Error(message)
  }
  return body as T
}

export type LoginResponse = { accessToken: string; user: BackendUser }
export type SessionResponse = BackendUser
