import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useDatos } from '../data/store'
import { useAuth } from '../auth/AuthContext'
import { useDebounce } from '../hooks'
import { normalizar } from '../utils/texto'
import { fmtCorto } from '../data/fechas'
import { puede } from '../data/roles'
import { PetImage } from '../components/PetAvatar'
import { PawIcon, IdCardIcon, CalendarIcon, FileIcon, SearchIcon } from '../components/icons'
import { Badge } from '../components/ui'
import type { Especie, Estado, RolClave } from '../data/types'

const max = 6

type ClaseIcono = 'mascota' | 'dueño' | 'cita' | 'historial'

interface Resultado {
  id: string
  grupo: string
  icono: ClaseIcono
  especie?: Especie
  titulo: string
  detalle: string
  a: string
  etiqueta?: string
}

function resultados(estado: Estado, claveRol: RolClave | undefined, consulta: string): Resultado[] {
  if (!consulta.trim()) return []
  const q = normalizar(consulta)
  const salida: Resultado[] = []

  for (const m of estado.mascotas) {
    if (salida.length >= max * 2) break
    if (normalizar(`${m.nombre} ${m.raza} ${m.especie}`).includes(q)) {
      salida.push({
        id: `m-${m.id}`,
        grupo: 'Mascotas',
        icono: 'mascota',
        especie: m.especie,
        titulo: m.nombre,
        detalle: `${m.especie} · ${estado.propietarios.find((p) => p.id === m.propietarioId)?.nombre ?? '—'}`,
        a: `/mascotas/${m.id}`,
      })
    }
  }

  if (claveRol && puede(claveRol, 'pacientes')) {
    for (const p of estado.propietarios) {
      if (normalizar(`${p.nombre} ${p.dni} ${p.telefono}`).includes(q)) {
        salida.push({
          id: `p-${p.id}`,
          grupo: 'Propietarios',
          icono: 'dueño',
          titulo: p.nombre,
          detalle: `DNI ${p.dni} · ${p.telefono}`,
          a: '/propietarios',
        })
      }
    }
  }

  if (claveRol && puede(claveRol, 'citas')) {
    for (const c of estado.citas) {
      const m = estado.mascotas.find((x) => x.id === c.mascotaId)
      if (normalizar(`${m?.nombre ?? ''} ${c.motivo} ${c.fecha} ${c.hora}`).includes(q)) {
        salida.push({
          id: `c-${c.id}`,
          grupo: 'Citas',
          icono: 'cita',
          titulo: `${m?.nombre ?? 'Cita'} · ${fmtCorto(c.fecha)} ${c.hora}`,
          detalle: c.motivo,
          a: '/citas',
          etiqueta: c.estado,
        })
      }
    }
  }

  if (claveRol && puede(claveRol, 'historial')) {
    for (const c of estado.consultas) {
      if (normalizar(`${c.diagnostico} ${c.tratamiento}`).includes(q)) {
        const m = estado.mascotas.find((x) => x.id === c.mascotaId)
        salida.push({
          id: `h-${c.id}`,
          grupo: 'Historial',
          icono: 'historial',
          titulo: c.diagnostico,
          detalle: `${m?.nombre ?? '—'} · ${fmtCorto(c.fecha)}`,
          a: '/historial',
        })
      }
    }
  }

  return salida.slice(0, max)
}

const iconos: Record<ClaseIcono, React.ReactNode> = {
  mascota: <PawIcon className="h-4 w-4" />,
  'dueño': <IdCardIcon className="h-4 w-4" />,
  cita: <CalendarIcon className="h-4 w-4" />,
  historial: <FileIcon className="h-4 w-4" />,
}

export function BuscadorGlobal() {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [indice, setIndice] = useState(0)
  const busqueda = useDebounce(texto, 160)
  const estado = useDatos()
  const { user } = useAuth()
  const navegar = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const caja = useRef<HTMLDivElement>(null)

  const lista = useMemo(() => resultados(estado, user?.rol, busqueda), [busqueda, estado, user?.rol])

  function cambiarTexto(valor: string) {
    setTexto(valor)
    setIndice(0)
  }

  useEffect(() => {
    const alTeclearGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setAbierto(true)
        setTimeout(() => input.current?.focus(), 30)
      }
      if (e.key === 'Escape') {
        setAbierto(false)
        input.current?.blur()
      }
    }
    window.addEventListener('keydown', alTeclearGlobal)
    return () => window.removeEventListener('keydown', alTeclearGlobal)
  }, [])

  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as globalThis.Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', alClic)
    return () => document.removeEventListener('mousedown', alClic)
  }, [])

  function elegir(r: Resultado | undefined) {
    if (!r) return
    setAbierto(false)
    cambiarTexto('')
    input.current?.blur()
    navegar(r.a)
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!lista.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndice((i) => (i + 1) % lista.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndice((i) => (i - 1 + lista.length) % lista.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      elegir(lista[indice])
    }
  }

  const hayLista = abierto && busqueda.trim().length > 0

  return (
    <div ref={caja} className="relative w-full max-w-sm">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={input}
        type="text"
        value={texto}
        onChange={(e) => {
          cambiarTexto(e.target.value)
          setAbierto(true)
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alTeclear}
        placeholder="Buscar paciente, diagnóstico, cita…"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-16 pl-9 text-sm outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400 sm:block">
        Ctrl K
      </kbd>

      {hayLista &&
        createPortal(
          <div className="anim-modal fixed inset-x-0 top-16 z-50 mx-auto w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {lista.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Sin resultados para «{busqueda}»</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {lista.map((r, i) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setIndice(i)}
                      onClick={() => elegir(r)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                        i === indice ? 'bg-primary-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        {r.icono === 'mascota' ? (
                          <PetImage especie={r.especie} nombre={r.titulo} className="h-8 w-8 text-[10px]" anillo={false} />
                        ) : (
                          iconos[r.icono]
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{r.titulo}</span>
                        <span className="block truncate text-xs text-slate-500">{r.detalle}</span>
                      </span>
                      {r.etiqueta && <Badge>{r.etiqueta}</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400">
              {lista.length} resultado{lista.length === 1 ? '' : 's'} · ↑ ↓ para navegar · Enter para abrir
            </p>
          </div>,
          document.body,
        )}
    </div>
  )
}
