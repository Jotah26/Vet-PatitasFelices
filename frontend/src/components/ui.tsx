import { useEffect, useId, useRef } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, CloseIcon, InfoIcon, WarningIcon } from './icons'

export type VarianteBoton = 'primary' | 'secondary' | 'ghost' | 'peligro' | 'exito' | 'aviso' | 'blanco'
export type TamanoBoton = 'sm' | 'md' | 'lg'
export type TonoAviso = 'info' | 'exito' | 'aviso' | 'error'

const variantes: Record<VarianteBoton, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-300',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
  peligro: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300',
  exito: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300',
  aviso: 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-300',
  blanco: 'bg-white text-emerald-700 shadow-sm hover:bg-emerald-50 focus-visible:ring-emerald-300',
}

const tamanos: Record<TamanoBoton, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
}

const control =
  'w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:ring-2 disabled:bg-slate-50'

const foco =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function borde(error?: ReactNode) {
  return error
    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
    : 'border-slate-300 focus:border-primary-500 focus:ring-primary-100'
}

/* ============================ Superficies ============================ */

export function Badge({
  children,
  className = 'bg-slate-100 text-slate-600',
  mono = false,
}: {
  children: ReactNode
  className?: string
  mono?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${mono ? 'font-mono' : ''} ${className}`}
    >
      {children}
    </span>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className = '',
}: {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </header>
  )
}

/* ============================== Botones ============================== */

type BotonComun = {
  variant?: VarianteBoton
  size?: TamanoBoton
  className?: string
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: BotonComun & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${variantes[variant]} ${tamanos[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function BotonIcono({
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...props
}: BotonComun & { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const caja = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl transition outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${variantes[variant]} ${caja} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/* ============================= Métricas ============================= */

export function Metrica({
  icono,
  etiqueta,
  valor,
  detalle,
  acento = 'bg-primary-100 text-primary-700',
  className = '',
}: {
  icono?: ReactNode
  etiqueta: ReactNode
  valor: ReactNode
  detalle?: ReactNode
  acento?: string
  className?: string
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start gap-4">
        {icono && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${acento}`}>{icono}</span>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{etiqueta}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{valor}</p>
          {detalle && <p className="mt-0.5 truncate text-xs text-slate-500">{detalle}</p>}
        </div>
      </div>
    </Card>
  )
}

export function EstadoVacio({
  icono,
  titulo,
  detalle,
  accion,
  className = '',
}: {
  icono?: ReactNode
  titulo: ReactNode
  detalle?: ReactNode
  accion?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 px-6 py-12 text-center ${className}`}>
      {icono && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
          {icono}
        </span>
      )}
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      {detalle && <p className="max-w-sm text-xs text-slate-400">{detalle}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}

/* ============================= Formulario ============================ */

type EstadoControl = { id?: string; ayuda?: ReactNode; error?: ReactNode }

function useControl(estado: EstadoControl) {
  const id = useId()
  return {
    id: estado.id ?? id,
    describedBy: estado.ayuda || estado.error ? `${estado.id ?? id}-ayuda` : undefined,
  }
}

export function Campo({
  label,
  ayuda,
  error,
  requerido,
  htmlFor,
  className = '',
  children,
}: {
  label?: ReactNode
  ayuda?: ReactNode
  error?: ReactNode
  requerido?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  const idAyuda = htmlFor ? `${htmlFor}-ayuda` : undefined
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-slate-600">
          {label}
          {requerido && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {ayuda && !error && (
        <p id={idAyuda} className="mt-1 text-[11px] text-slate-400">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idAyuda} className="mt-1 text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

type ControlComun = {
  label?: ReactNode
  ayuda?: ReactNode
  error?: ReactNode
  requerido?: boolean
  /** Clase del contenedor. */
  contenedor?: string
  className?: string
}

export function Input({
  label,
  ayuda,
  error,
  requerido,
  contenedor,
  className = '',
  ...props
}: ControlComun & InputHTMLAttributes<HTMLInputElement>) {
  const { id, describedBy } = useControl({ id: props.id, ayuda, error })
  return (
    <Campo label={label} ayuda={ayuda} error={error} requerido={requerido} htmlFor={id} className={contenedor ?? className}>
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className={`${control} ${borde(error)}`}
        {...props}
      />
    </Campo>
  )
}

export function Select({
  label,
  ayuda,
  error,
  requerido,
  contenedor,
  className = '',
  children,
  ...props
}: ControlComun & SelectHTMLAttributes<HTMLSelectElement>) {
  const { id, describedBy } = useControl({ id: props.id, ayuda, error })
  return (
    <Campo label={label} ayuda={ayuda} error={error} requerido={requerido} htmlFor={id} className={contenedor ?? className}>
      <select
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className={`${control} ${borde(error)} cursor-pointer`}
        {...props}
      >
        {children}
      </select>
    </Campo>
  )
}

export function Textarea({
  label,
  ayuda,
  error,
  requerido,
  contenedor,
  className = '',
  ...props
}: ControlComun & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { id, describedBy } = useControl({ id: props.id, ayuda, error })
  return (
    <Campo label={label} ayuda={ayuda} error={error} requerido={requerido} htmlFor={id} className={contenedor ?? className}>
      <textarea
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        className={`${control} ${borde(error)} resize-none`}
        {...props}
      />
    </Campo>
  )
}

export function Formulario({
  onSubmit,
  children,
  className = '',
}: {
  onSubmit: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className={`space-y-4 ${className}`}
    >
      {children}
    </form>
  )
}

export function FilaCampos({
  children,
  columnas = 2,
  className = '',
}: {
  children: ReactNode
  columnas?: 1 | 2 | 3 | 4
  className?: string
}) {
  const grid: Record<1 | 2 | 3 | 4, string> = {
    1: '',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }
  return <div className={`grid gap-4 ${grid[columnas]} ${className}`}>{children}</div>
}

/* ============================== Modal =============================== */

export function Modal({
  abierto,
  alCerrar,
  titulo,
  descripcion,
  ancho = 'max-w-lg',
  pie,
  children,
}: {
  abierto: boolean
  alCerrar: () => void
  titulo: ReactNode
  descripcion?: ReactNode
  ancho?: string
  pie?: ReactNode
  children: ReactNode
}) {
  const refCaja = useRef<HTMLDivElement>(null)
  const refAntes = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    refAntes.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar()
      if (e.key !== 'Tab') return
      const focos = refCaja.current?.querySelectorAll<HTMLElement>(foco)
      if (!focos?.length) return
      const primero = focos[0]
      const ultimo = focos[focos.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      refCaja.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus()
    }, 40)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
      clearTimeout(t)
      refAntes.current?.focus?.()
    }
  }, [abierto, alCerrar])

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={alCerrar} />
      <div
        ref={refCaja}
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === 'string' ? titulo : undefined}
        className={`anim-modal relative flex max-h-[92vh] w-full ${ancho} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>}
          </div>
          <BotonIcono label="Cerrar" size="sm" onClick={alCerrar}>
            <CloseIcon className="h-4 w-4" />
          </BotonIcono>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {pie && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">{pie}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Confirmacion({
  abierto,
  alCerrar,
  alConfirmar,
  titulo,
  mensaje,
  confirmar = 'Eliminar',
  tono = 'peligro',
  onAceptar,
}: {
  abierto: boolean
  alCerrar: () => void
  alConfirmar?: () => void
  titulo: ReactNode
  mensaje: ReactNode
  confirmar?: ReactNode
  tono?: VarianteBoton
  onAceptar?: () => void
}) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={titulo}
      ancho="max-w-md"
      pie={
        <>
          <Button variant="secondary" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button
            variant={tono}
            onClick={() => {
              onAceptar?.()
              alConfirmar?.()
            }}
          >
            {confirmar}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{mensaje}</p>
    </Modal>
  )
}

/* ============================== Avisos ============================== */

export function Aviso({
  tono = 'info',
  titulo,
  children,
  icono,
  className = '',
}: {
  tono?: TonoAviso
  titulo?: ReactNode
  children?: ReactNode
  icono?: ReactNode
  className?: string
}) {
  const estilos: Record<TonoAviso, string> = {
    info: 'border-slate-200 bg-slate-50 text-slate-600',
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  const Icono = tono === 'exito' ? CheckIcon : tono === 'info' ? InfoIcon : WarningIcon
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${estilos[tono]} ${className}`}>
      <span className="mt-0.5 shrink-0">{icono ?? <Icono className="h-4 w-4" />}</span>
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? 'mt-0.5 text-xs opacity-90' : ''}>{children}</div>}
      </div>
    </div>
  )
}
