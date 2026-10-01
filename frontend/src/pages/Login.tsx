import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useDatos } from '../data/store'
import { claves_rol, rol } from '../data/roles'
import { Button, Input } from '../components/ui'
import {
  PawIcon,
  ShieldIcon,
  StethoscopeIcon,
  UserIcon,
  CalendarIcon,
} from '../components/icons'
import type { IconProps } from '../components/icons'
import type { RolClave } from '../data/types'
import logo from '../../assets/img/logo.png'
import foto from '../../assets/img/mas1.webp'

const icono: Record<RolClave, (p: IconProps) => ReactNode> = {
  admin: ShieldIcon,
  vet: StethoscopeIcon,
  recepcionista: CalendarIcon,
  asistente: UserIcon,
  propietario: PawIcon,
}

export default function Login() {
  const { login, user } = useAuth()
  const { cuentasDemo, usuarios } = useDatos()
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  const cuentas = useMemo(
    () =>
      claves_rol.flatMap((clave) => {
        const userId = Object.entries(cuentasDemo ?? {}).find(
          ([, id]) => usuarios.find((u) => u.id === id)?.rol === clave,
        )?.[1]
        if (userId == null) return []
        const correo = Object.entries(cuentasDemo).find(([, id]) => id === userId)?.[0]
        if (!correo) return []
        return [{ clave, correo, ...rol(clave), Icono: icono[clave] }]
      }),
    [cuentasDemo, usuarios],
  )

  if (user) return <Navigate to={rol(user.rol).home} replace />

  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = login(email, contrasena)
    if (!r.ok) setError(r.error)
  }

  function entrarComo(correo: string) {
    setEmail(correo)
    setContrasena('1234')
    setError('')
    const r = login(correo, '1234')
    if (!r.ok) setError(r.error)
  }

  const cifras: [string, string][] = [
    ['7', 'días a la semana'],
    ['3', 'veterinarios'],
  ]

  return (
    <div className="flex min-h-screen bg-slate-50 lg:h-screen lg:overflow-hidden">
      <aside className="relative hidden w-[46%] flex-col overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-700 to-sky-800 p-8 text-white lg:flex xl:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <img
            src={logo}
            alt="Logo de Patitas Felices"
            className="h-25 w-25 rounded-full bg-white/15 p-0.5 object-contain"
          />
          <div>
            <p className="text-3xl leading-tight font-bold">Patitas Felices</p>
            <p className="text-1xl text-emerald-100">Clínica veterinaria</p>
          </div>
        </div>

        <div className="relative my-auto flex items-end justify-between gap-6 pt-6">
          <div className="max-w-md">
            <h1 className="text-m leading-snug font-bold xl:text-4xl">
              Cuidado cercano, con la historia completa de cada paciente.
            </h1>
            <p className="mt-4 max-w-sm text-m leading-relaxed text-emerald-50/90">
              Agenda, fichas clínicas, vacunas, recetas y recordatorios en un solo lugar.
            </p>
            <dl className="mt-6 flex gap-8 border-t border-white/20 pt-4">
              {cifras.map(([valor, texto]) => (
                <div key={texto}>
                  <dt className="text-2xl font-bold">{valor}</dt>
                  <dd className="text-[11px] text-emerald-100">{texto}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative shrink-0">
            <span aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-white/10 blur-2xl" />
            <figure className="relative w-[min(16rem,36vh)] overflow-hidden rounded-3xl bg-white/10 shadow-2xl ring-1 ring-white/25 xl:w-[min(18rem,40vh)]">
              <img
                src={foto}
                alt="Un gato y un perro juntos"
                className="block w-full"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/75 via-slate-900/45 to-transparent px-4 pt-12 pb-3 text-xs font-medium text-white">
                Mascotas felices, familias tranquilas.
              </figcaption>
            </figure>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-8 lg:py-6">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-center gap-3 lg:hidden">
            <img src={logo} alt="Logo de Patitas Felices" className="h-16 w-16 rounded-2xl object-contain" />
            <div>
              <p className="text-xl font-bold text-slate-900">Patitas Felices</p>
              <p className="text-sm text-slate-500">Clínica veterinaria</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">Use su correo institucional para entrar.</p>

            <form onSubmit={enviar} className="mt-4 space-y-4">
              <Input
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="nombre@patitasfelices.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                requerido
              />
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                placeholder="••••"
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value)
                  setError('')
                }}
                requerido
              />

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700"
                >
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>

            <div className="mt-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Accesos de demostración
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {cuentas.map(({ clave, correo, label, resumen, color, Icono }, i) => (
                  <button
                    key={clave}
                    type="button"
                    onClick={() => entrarComo(correo)}
                    title={`${correo} · ${resumen}`}
                    className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm ${
                      i === cuentas.length - 1 && cuentas.length % 2 === 1 ? 'col-span-2' : ''
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}
                      aria-hidden="true"
                    >
                      <Icono className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800">{label}</span>
                      <span className="block truncate text-[10px] text-slate-400">{correo}</span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                Todas usan la contraseña <span className="font-semibold text-slate-600">1234</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
