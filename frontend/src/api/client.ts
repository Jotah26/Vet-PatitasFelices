const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
export const accessToken = () => localStorage.getItem('pf_access_token') ?? undefined

export type BackendUser = {
  id: number
  email: string
  name: string
  role: 'ADMINISTRATOR' | 'VETERINARIAN' | 'RECEPTIONIST' | 'ASSISTANT' | 'OWNER'
  ownerId?: number
}

export type BackendManagedUser = {
  id: number
  email: string
  name: string
  role: Exclude<BackendUser['role'], 'OWNER'>
  status: 'ACTIVE' | 'INACTIVE'
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

export type BackendMedication = {
  id: number
  name: string
  category: 'ANTIALLERGIC' | 'ANTIBIOTIC' | 'ANTIPARASITIC' | 'FLEA' | 'SUPPLY' | 'VACCINE'
  presentation: string
  stock: number
  minStock: number
  price: number
  activeIngredient: string | null
  batch: string | null
  expiresAt: string | null
}

export type BackendVaccine = {
  id: number
  petId: number
  name: string
  administeredAt: string
  nextDueAt: string | null
  administeredById: number | null
  batch: string | null
}

export type BackendReminder = {
  class: 'vaccine' | 'appointment'
  petId: number
  petName?: string
  title: string
  date: string
  days: number
}

export function getReminders(petId?: number): Promise<BackendReminder[]> {
  const query = petId === undefined ? '' : `?petId=${encodeURIComponent(petId)}`
  return apiRequest<BackendReminder[]>(`/reminders${query}`, {}, accessToken())
}

export type BackendConsultation = {
  id: number
  petId: number
  veterinarianId: number
  occurredAt: string
  type: 'GENERAL_CONSULTATION' | 'VACCINATION' | 'FOLLOW_UP' | 'SURGERY' | 'EMERGENCY' | 'DEWORMING'
  diagnosis: string
  treatment: string
  recommendations: string
  status: 'COMPLETED' | 'IN_FOLLOWUP'
  attachments?: BackendAttachment[]
}

export type BackendAttachment = {
  id: number
  consultationId: number
  fileName: string
  mimeType: string
  uploadedById: number | null
  createdAt: string
  updatedAt: string
}

export type BackendPrescription = {
  id: number
  petId: number
  veterinarianId: number
  consultationId: number | null
  issuedAt: string
  instructions: string | null
  status: 'ISSUED' | 'DISPENSED'
  items?: { medication: string; dose: string; days: number }[] | null
  pet?: { id: number; name: string; breed: string; weight: string; owner?: { name: string } | null } | null
  veterinarian?: { id: number; name: string } | null
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

export type BackendPayment = {
  id: number
  appointmentId: number | null
  paidAt: string
  method: 'YAPE' | 'CASH' | 'CARD' | 'TRANSFER'
  amount: number
  reference: string | null
  status: 'ACTIVE' | 'VOIDED'
}

export type RegisterOwnerRequest = {
  name: string
  email: string
  password: string
  documentNumber: string
  phone: string
  address: string
}
