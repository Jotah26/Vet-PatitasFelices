import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircleIcon, CloseIcon, InfoIcon, WarningIcon } from './icons'
import type { ToastApi, ToastOpts, TipoToast } from '../data/types'

const Contexto = createContext<ToastApi | null>(null)

const estilos: Record<TipoToast, { borde: string; texto: string; icono: ReactNode }> = {
  exito: { borde: 'border-emerald-200', texto: 'text-emerald-700', icono: <CheckCircleIcon className="h-5 w-5" /> },
  error: { borde: 'border-rose-200', texto: 'text-rose-600', icono: <WarningIcon className="h-5 w-5" /> },
  aviso: { borde: 'border-amber-200', texto: 'text-amber-600', icono: <WarningIcon className="h-5 w-5" /> },
  info: { borde: 'border-slate-200', texto: 'text-slate-600', icono: <InfoIcon className="h-5 w-5" /> },
}

interface Aviso {
  id: string
  tipo: TipoToast
  titulo: string
  detalle?: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const quitar = useCallback((id: string) => setAvisos((lista) => lista.filter((a) => a.id !== id)), [])

  const toast = useCallback(
    ({ tipo = 'exito', titulo, detalle, ms = 4000 }: ToastOpts) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setAvisos((lista) => [...lista.slice(-3), { id, tipo, titulo, detalle }])
      setTimeout(() => quitar(id), ms)
      return id
    },
    [quitar],
  )

  const valor = useMemo<ToastApi>(() => ({ toast, quitar }), [toast, quitar])

  return (
    <Contexto.Provider value={valor}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 bottom-4 z-60 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
          {avisos.map((a) => {
            const e = estilos[a.tipo]
            return (
              <div
                key={a.id}
                role="status"
                className={`anim-toast pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg ${e.borde}`}
              >
                <span className={`mt-0.5 shrink-0 ${e.texto}`}>{e.icono}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{a.titulo}</p>
                  {a.detalle && <p className="mt-0.5 text-xs text-slate-500">{a.detalle}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => quitar(a.id)}
                  className="shrink-0 rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
                  aria-label="Descartar aviso"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </Contexto.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
