import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiRequest, type BackendUser, type LoginResponse, type RegisterOwnerRequest, type SessionResponse, type SetupAdministratorRequest } from '../api/client'
import { rol } from '../data/roles'
import type { AuthApi, ResultadoLogin } from '../data/types'

const clave_sesion = 'pf_access_token'
const roleMap: Record<BackendUser['role'], 'admin' | 'vet' | 'recepcionista' | 'asistente' | 'propietario'> = {
  ADMINISTRATOR: 'admin',
  VETERINARIAN: 'vet',
  RECEPTIONIST: 'recepcionista',
  ASSISTANT: 'asistente',
  OWNER: 'propietario',
}

function mapUser(user: BackendUser) {
  return { id: user.id, nombre: user.name, email: user.email, rol: roleMap[user.role], estado: 'Activo' as const, ...(user.ownerId ? { propietarioId: user.ownerId } : {}) }
}

const Contexto = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ReturnType<typeof mapUser> | null>(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(clave_sesion)))

  useEffect(() => {
    const token = localStorage.getItem(clave_sesion)
    if (!token) return
    apiRequest<SessionResponse>('/auth/me', {}, token)
      .then((session) => setUser(mapUser(session)))
      .catch(() => localStorage.removeItem(clave_sesion))
      .finally(() => setLoading(false))
  }, [])

  const perfil = useMemo(() => (user ? rol(user.rol) : null), [user])

  const login = useCallback(async (email: string, contrasena: string): Promise<ResultadoLogin> => {
    const correo = String(email ?? '').trim().toLowerCase()
    const clave = String(contrasena ?? '')
    if (!correo) return { ok: false, error: 'Ingrese su correo electrónico.' }
    if (!clave) return { ok: false, error: 'Ingrese su contraseña.' }
    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: correo, password: clave }),
      })
      const candidato = mapUser(response.user)
      localStorage.setItem(clave_sesion, response.accessToken)
      setUser(candidato)
      return { ok: true, usuario: candidato }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'No se pudo iniciar sesión.' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(clave_sesion)
  }, [])

  const register = useCallback(async (data: RegisterOwnerRequest): Promise<ResultadoLogin> => {
    try {
      const response = await apiRequest<LoginResponse>('/auth/register-owner', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      const candidato = mapUser(response.user)
      localStorage.setItem(clave_sesion, response.accessToken)
      setUser(candidato)
      return { ok: true, usuario: candidato }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'No se pudo crear la cuenta.' }
    }
  }, [])

  const setupAdministrator = useCallback(async (data: SetupAdministratorRequest): Promise<ResultadoLogin> => {
    if (!data.name.trim()) return { ok: false, error: 'Ingrese su nombre completo.' }
    if (!data.email.trim()) return { ok: false, error: 'Ingrese su correo electrónico.' }
    if (data.password.length < 12) return { ok: false, error: 'La contraseña debe tener al menos 12 caracteres.' }
    try {
      const response = await apiRequest<LoginResponse>('/setup/administrator', { method: 'POST', body: JSON.stringify(data) })
      const candidato = mapUser(response.user)
      localStorage.setItem(clave_sesion, response.accessToken)
      setUser(candidato)
      return { ok: true, usuario: candidato }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'No se pudo completar la configuración inicial.' }
    }
  }, [])

  const valor = useMemo<AuthApi>(
    () => ({ user, perfil, login, register, setupAdministrator, logout, esPropietario: user?.rol === 'propietario' }),
    [user, perfil, login, register, setupAdministrator, logout],
  )

  if (loading) return null
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): AuthApi {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
