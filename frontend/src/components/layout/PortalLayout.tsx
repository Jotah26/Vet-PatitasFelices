import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useDatos } from '../../data/store'
import { seccionesPortal } from '../../data/nav'
import { fmtCorto, fmtLargo, hoy, iniciales } from '../../data/fechas'
import { BotonIcono, Button } from '../ui'
import { ModalSolicitud } from '../ModalSolicitud'
import { ModalMascotaPortal } from '../ModalMascotaPortal'
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
} from '../icons'
import logo from '../../../assets/img/logo.png'
import type { Mascota, Recordatorio, Usuario } from '../../data/types'

interface PortalApi {
  mascotas: Mascota[]
  pedirCita: () => void
  agregarMascota: () => void
}

const Contexto = createContext<PortalApi | null>(null)

export function usePortal(): PortalApi {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('usePortal debe usarse dentro de PortalLayout')
  return ctx
}

/* ============================ Marca ============================ */

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="Logo de Patitas Felices"
        className="shrink-0 object-contain"
        style={{ height: compacta ? 34 : 40, width: compacta ? 34 : 40 }}
      />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-bold text-slate-900">Patitas Felices</p>
        <p className="truncate text-[11px] text-slate-500">Portal del propietario</p>
      </div>
    </div>
  )
}

/* ========================= Menú lateral ========================= */

function MenuLateral({ alNavegar }: { alNavegar?: () => void }) {
  const secciones = seccionesPortal()

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {secciones.map((s) => (
        <div key={s.id}>
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.titulo}</p>
          <ul className="space-y-0.5">
            {s.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/portal'}
                  onClick={alNavegar}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icono className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function TarjetaSesion({ user, alSalir }: { user: Usuario; alSalir: () => void }) {
  return (
    <div className="border-t border-slate-100 p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
          {iniciales(user.nombre)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-800">{user.nombre}</p>
          <p className="truncate text-xs font-medium text-primary-700">Propietario</p>
        </div>
        <BotonIcono label="Cerrar sesión" size="sm" className="text-slate-400 hover:text-rose-600" onClick={alSalir}>
          <LogoutIcon className="h-4 w-4" />
        </BotonIcono>
      </div>
    </div>
  )
}

/* ======================= Notificaciones ======================== */

interface ItemNoti {
  id: string
  titulo: string
  detalle: string
  tono: string
  a: string
}

function construirItemsNotis(
  solicitudes: number,
  recordatorios: Recordatorio[],
  nombreDe: (mascotaId: number) => string,
): ItemNoti[] {
  return [
    ...(solicitudes > 0
      ? [
          {
            id: 'sol',
            titulo: `${solicitudes} solicitud${solicitudes === 1 ? '' : 'es'} por confirmar`,
            detalle: 'Recepción todavía no responde',
            tono: 'bg-amber-500',
            a: '/portal',
          },
        ]
      : []),
    ...recordatorios.slice(0, 4).map((r) => ({
      id: r.clave,
      titulo: `${nombreDe(r.mascotaId)} · ${r.titulo}`,
      detalle: r.detalle,
      tono: r.dias < 0 ? 'bg-rose-500' : r.dias === 0 ? 'bg-amber-500' : 'bg-primary-500',
      a: r.clase === 'vacuna' ? '/portal/vacunas' : '/portal/citas',
    })),
  ]
}

function PanelNotificaciones({
  abiertas,
  alCerrar,
  items,
}: {
  abiertas: boolean
  alCerrar: () => void
  items: ItemNoti[]
}) {
  const navegar = useNavigate()
  useEffect(() => {
    if (!abiertas) return
    const alClic = (e: MouseEvent) => {
      const destino = e.target
      if (!(destino instanceof Element) || !destino.closest('[data-panel]')) alCerrar()
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [abiertas, alCerrar])

  if (!abiertas) return null

  return (
    <div
      data-panel
      className="anim-modal absolute right-0 z-40 mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">Avisos del portal</p>
          <p className="text-[11px] text-slate-400">
            {items.length === 0
              ? 'Sin pendientes ahora mismo'
              : `${items.length} aviso${items.length === 1 ? '' : 's'} por revisar`}
          </p>
        </div>
        {items.length > 0 && (
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 tabular-nums">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckIcon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-slate-700">Todo al día</p>
          <p className="text-xs text-slate-400">No hay solicitudes ni recordatorios pendientes.</p>
        </div>
      ) : (
        <ul className="max-h-80 divide-y divide-slate-50 overflow-y-auto">
          {items.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  navegar(i.a)
                  alCerrar()
                }}
                className="group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i.tono}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800 group-hover:text-primary-700">
                    {i.titulo}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{i.detalle}</span>
                </span>
                <ChevronDownIcon className="mt-1 h-4 w-4 shrink-0 -rotate-90 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <button
          type="button"
          onClick={() => {
            navegar('/portal/citas')
            alCerrar()
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-primary-700 transition hover:text-primary-800"
        >
          Ver mis citas
          <ChevronDownIcon className="h-3.5 w-3.5 -rotate-90" />
        </button>
      </div>
    </div>
  )
}

/* ============================ Layout ============================ */

export function PortalLayout() {
  const { user, logout } = useAuth()
  const datos = useDatos()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [cajon, setCajon] = useState(false)
  const [notis, setNotis] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const [pidiendo, setPidiendo] = useState(false)
  const [nuevaMascota, setNuevaMascota] = useState(false)
  const pedirCita = useCallback(() => setPidiendo(true), [])
  const agregarMascota = useCallback(() => setNuevaMascota(true), [])

  const [ruta, setRuta] = useState(ubicacion.pathname)

  if (ruta !== ubicacion.pathname) {
    setRuta(ubicacion.pathname)
    setCajon(false)
    setNotis(false)
    setMenuUsuario(false)
  }

  const propietarioId = user?.propietarioId
  const mascotas = useMemo(
    () => (propietarioId ? datos.mascotasDe(propietarioId) : []),
    [datos, propietarioId],
  )
  const ids = useMemo(() => mascotas.map((m) => m.id), [mascotas])

  const solicitudes = useMemo(
    () => datos.solicitudes.filter((s) => ids.includes(s.mascotaId) && s.estado === 'Pendiente').length,
    [datos.solicitudes, ids],
  )

  const recordatorios = useMemo(
    () => datos.recordatorios.filter((r) => ids.includes(r.mascotaId) && !r.enviado),
    [datos.recordatorios, ids],
  )

  const itemsNotis = useMemo(
    () => construirItemsNotis(solicitudes, recordatorios, (mascotaId) => datos.nombreMascota(mascotaId)),
    [datos, solicitudes, recordatorios],
  )

  useEffect(() => {
    document.title = 'Patitas Felices · Portal del propietario'
  }, [])

  function salir() {
    logout()
    navegar('/login')
  }

  const valor = useMemo<PortalApi>(() => ({ mascotas, pedirCita, agregarMascota }), [mascotas, pedirCita, agregarMascota])

  if (!user) return null

  return (
    <Contexto.Provider value={valor}>
      <div className="flex h-dvh overflow-hidden bg-slate-100">
        {/* Barra lateral fija (escritorio) */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-100 px-5 py-4">
            <Marca />
          </div>
          <MenuLateral />
          <TarjetaSesion user={user} alSalir={salir} />
        </aside>

        {/* Cajón lateral (móvil) */}
        {cajon && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setCajon(false)} />
            <div className="anim-cajon absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <Marca compacta />
                <BotonIcono label="Cerrar menú" size="sm" onClick={() => setCajon(false)}>
                  <CloseIcon className="h-4 w-4" />
                </BotonIcono>
              </div>
              <MenuLateral alNavegar={() => setCajon(false)} />
              <TarjetaSesion user={user} alSalir={salir} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
            <BotonIcono label="Abrir menú" className="lg:hidden" onClick={() => setCajon(true)}>
              <MenuIcon className="h-5 w-5" />
            </BotonIcono>

            <div className="lg:hidden">
              <Marca compacta />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* En móvil las acciones viven en el encabezado de cada página. */}
              <Button size="sm" variant="secondary" onClick={agregarMascota} className="hidden sm:inline-flex">
                <PlusIcon className="h-4 w-4" /> Mascota
              </Button>
              <Button size="sm" onClick={pedirCita} className="hidden md:inline-flex">
                <CalendarIcon className="h-4 w-4" /> Nueva cita
              </Button>

              <div className="relative flex items-center gap-1">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-slate-700">{fmtCorto(hoy)}</p>
                  <p className="text-[11px] text-slate-400">Portal</p>
                </div>

                <div className="relative" data-panel>
                  <button
                    type="button"
                    onClick={() => setNotis((v) => !v)}
                    title="Avisos"
                    aria-label={itemsNotis.length > 0 ? `Avisos, ${itemsNotis.length} sin revisar` : 'Avisos'}
                    aria-expanded={notis}
                    className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                      notis ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="relative inline-flex">
                      <BellIcon className="h-5 w-5" />
                      {itemsNotis.length > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white tabular-nums">
                          {itemsNotis.length > 99 ? '99+' : itemsNotis.length}
                        </span>
                      )}
                    </span>
                  </button>

                  <PanelNotificaciones abiertas={notis} alCerrar={() => setNotis(false)} items={itemsNotis} />
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuUsuario((v) => !v)}
                    className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {iniciales(user.nombre)}
                    </span>
                    <ChevronDownIcon className="hidden h-4 w-4 text-slate-400 sm:block" />
                  </button>

                  {menuUsuario && (
                    <div
                      data-panel
                      className="anim-modal absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">{user.nombre}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                        <span className="mt-2 inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                          Propietario
                        </span>
                      </div>
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-[11px] text-slate-400">{fmtLargo(hoy)}</p>
                        <p className="mt-1 text-xs text-slate-500">Consulta el estado de sus mascotas</p>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={salir}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <LogoutIcon className="h-4 w-4" /> Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="anim-entrada mx-auto max-w-7xl p-4 lg:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <ModalSolicitud abierto={pidiendo} alCerrar={() => setPidiendo(false)} />
      {nuevaMascota && <ModalMascotaPortal alCerrar={() => setNuevaMascota(false)} />}
    </Contexto.Provider>
  )
}
