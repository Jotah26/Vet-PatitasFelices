const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const accessToken = () => localStorage.getItem('pf_access_token') ?? undefined

export type BackendUser = {
  id: number
  email: string
  name: string
  role: 'ADMINISTRATOR' | 'VETERINARIAN' | 'RECEPTIONIST' | 'ASSISTANT' | 'OWNER'
  ownerId?: number
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
export type BackendOwner = {
  id: number
  name: string
  documentNumber: string
  phone: string
  email: string
  address: string
}

export type BackendPet = {
  id: number
  name: string
  species: string
  breed: string
  sex: string
  age: string
  color: string
  weight: string
  isNeutered: boolean
  ownerId: number
  medicalBackground: string
  photoDataUrl?: string
}

export type BackendService = {
  id: number
  concept: string
  description: string
  price: number
  durationMinutes: number
  active: boolean
}

export type BackendAppointmentRequest = {
  id: number
  ownerId: number
  petId: number
  scheduledAt: string
  reason: string
  resolutionState: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  rejectionReason: string | null
  resolvedAppointmentId: number | null
  resolvedAt: string | null
  createdAt: string
}

export type BackendAppointment = {
  id: number
  scheduledAt: string
  petId: number
  veterinarianId?: number | null
  veterinarian?: { id: number; name?: string } | null
  serviceId?: number | null
  service?: { id: number } | null
  reason: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_ROOM' | 'ATTENDED' | 'CANCELLED'
}

export type RegisterOwnerRequest = {
  name: string
  email: string
  password: string
  documentNumber: string
  phone: string
  address: string
}
