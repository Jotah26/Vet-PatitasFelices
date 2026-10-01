import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useDatos } from '../data/store'
import { rol } from '../data/roles'
import type { AuthApi, ResultadoLogin } from '../data/types'

const clave_sesion = 'pf_sesion'

const Contexto = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { usuarios, cuentasDemo } = useDatos()
  const [id, setId] = useState<number | null>(() => {
    const guardado = Number(localStorage.getItem(clave_sesion))
    return Number.isFinite(guardado) && guardado > 0 ? guardado : null
  })

  const user = useMemo(() => usuarios.find((u) => u.id === id) ?? null, [usuarios, id])
  const perfil = useMemo(() => (user ? rol(user.rol) : null), [user])

  const login = useCallback(
    (email: string, contrasena: string): ResultadoLogin => {
      const correo = String(email ?? '').trim().toLowerCase()
      const clave = String(contrasena ?? '')
      if (!correo) return { ok: false, error: 'Ingrese su correo electrónico.' }
      if (!clave) return { ok: false, error: 'Ingrese su contraseña.' }

      const directo = usuarios.find((u) => u.email.toLowerCase() === correo)
      const porDemo = cuentasDemo[correo]
      const candidato = directo ?? (porDemo ? usuarios.find((u) => u.id === porDemo) : null)

      if (!candidato) return { ok: false, error: 'No encontramos una cuenta con ese correo.' }
      if (candidato.estado === 'Inactivo') {
        return { ok: false, error: 'Esta cuenta está desactivada. Comuníquese con el administrador.' }
      }
      if (clave !== '1234') return { ok: false, error: 'Contraseña incorrecta.' }

      setId(candidato.id)
      localStorage.setItem(clave_sesion, String(candidato.id))
      return { ok: true, usuario: candidato }
    },
    [usuarios, cuentasDemo],
  )

  const logout = useCallback(() => {
    setId(null)
    localStorage.removeItem(clave_sesion)
  }, [])

  const valor = useMemo<AuthApi>(
    () => ({ user, perfil, login, logout, esPropietario: user?.rol === 'propietario' }),
    [user, perfil, login, logout],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): AuthApi {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
