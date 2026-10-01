import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { estados_cita } from '../data/estados'
import { fmtCorto, moneda } from '../data/fechas'
import { Badge, Card, CardHeader, EstadoVacio, Metrica } from './ui'
import { ChevronRightIcon } from './icons'
import { PetImage } from './PetAvatar'
import type { Cita, EstadoCita } from '../data/types'
import type { DatosApi } from '../data/types'

export interface ItemMetrica {
  etiqueta: ReactNode
  valor: ReactNode
  detalle?: ReactNode
  icono?: ReactNode
  acento?: string
}

export function Metricas({
  items,
  columnas = 'sm:grid-cols-2 xl:grid-cols-4',
}: {
  items: ItemMetrica[]
  columnas?: string
}) {
  return (
    <div className={`grid gap-4 ${columnas}`}>
      {items.map((i) => (
        <Metrica key={String(i.etiqueta)} {...i} />
      ))}
    </div>
  )
}

/** Fila compacta de cita, reutilizada en tableros, agenda y recordatorios.
 *  `sinEnlace` la deja como texto plano: el propietario no abre la ficha interna. */
export function FilaCita({
  cita,
  datos,
  mostrarFecha = false,
  accion,
  acento = 'bg-slate-50',
  sinEnlace = false,
}: {
  cita: Cita
  datos: DatosApi
  mostrarFecha?: boolean
  accion?: ReactNode
  acento?: string
  sinEnlace?: boolean
}) {
  const mascota = datos.mascota(cita.mascotaId)
  const detalle = (
    <>
      <span className="block truncate text-sm font-semibold text-slate-800">
        {mascota?.nombre ?? 'Mascota sin registro'}
      </span>
      <span className="block truncate text-xs text-slate-500">{cita.motivo}</span>
    </>
  )

  return (
    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-slate-50">
      <span className="w-12 shrink-0 text-center">
        <span className="block text-sm font-bold leading-tight text-slate-700">{cita.hora}</span>
        {mostrarFecha && (
          <span className="block text-[10px] font-medium text-slate-400 uppercase">{fmtCorto(cita.fecha)}</span>
        )}
      </span>
      <PetImage
        especie={mascota?.especie}
        sexo={mascota?.sexo}
        nombre={mascota?.nombre}
        foto={mascota?.foto}
        className="h-9 w-9 text-[10px]"
        anillo={false}
      />
      {sinEnlace ? (
        <span className="min-w-0 flex-1">{detalle}</span>
      ) : (
        <Link to={`/mascotas/${cita.mascotaId}`} className="min-w-0 flex-1 hover:text-primary-600">
          {detalle}
        </Link>
      )}
      <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:flex ${acento}`} />
      {accion}
    </div>
  )
}

export function Estado({ estado }: { estado: EstadoCita }) {
  return <Badge className={estados_cita[estado] ?? 'bg-slate-100 text-slate-600'}>{estado}</Badge>
}

export interface DiaOcupacion {
  dia: string
  total: number
}

/** Barras de ocupación semanal. Solo la usa administración. */
export function OcupacionSemanal({ dias, clase = 'bg-primary-500' }: { dias: DiaOcupacion[]; clase?: string }) {
  const max = Math.max(1, ...dias.map((x) => x.total))
  return (
    <div className="flex items-end gap-2">
      {dias.map((x) => (
        <div key={x.dia} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">{x.total || '·'}</span>
          <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-slate-100">
            <div
              className={`w-full rounded-lg ${x.total ? clase : 'bg-transparent'}`}
              style={{ height: `${x.total ? Math.max(8, (x.total / max) * 100) : 0}%` }}
              title={`${x.total} citas`}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-400 capitalize">{x.dia}</span>
        </div>
      ))}
    </div>
  )
}

export interface FilaRanking {
  etiqueta: string
  valor: number
  extra?: ReactNode
}

/** Ranking con barras horizontales. */
export function Ranking({
  titulo,
  subtitulo,
  filas,
  clase = 'bg-primary-500',
  formato = 'texto',
  accion,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  filas: FilaRanking[]
  clase?: string
  formato?: 'texto' | 'moneda'
  accion?: ReactNode
}) {
  const max = Math.max(1, ...filas.map((f) => f.valor))
  const pintar = (v: number) => (formato === 'moneda' ? moneda(v) : v)
  return (
    <Card>
      <CardHeader title={titulo} subtitle={subtitulo} action={accion} />
      {filas.length === 0 ? (
        <EstadoVacio titulo="Sin datos suficientes" detalle="Aún no hay información para este ranking." />
      ) : (
        <ul className="space-y-3.5 p-5">
          {filas.map((f) => (
            <li key={f.etiqueta}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-700">{f.etiqueta}</span>
                <span className="shrink-0 text-sm font-semibold text-slate-800">
                  {pintar(f.valor)}
                  {f.extra ? <span className="ml-1 text-xs font-normal text-slate-400">{f.extra}</span> : null}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${clase}`} style={{ width: `${(f.valor / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export interface Alerta {
  id: string | number
  titulo: ReactNode
  detalle: ReactNode
  badge?: ReactNode
  link?: string
  textoLink?: ReactNode
  iconoLink?: ReactNode
}

/** Lista de alertas operativas con acción opcional. */
export function Alertas({
  titulo,
  subtitulo,
  alertas,
  peligro = false,
  accion,
  children,
}: {
  titulo: ReactNode
  subtitulo?: ReactNode
  alertas: Alerta[]
  peligro?: boolean
  accion?: ReactNode
  children?: ReactNode
}) {
  return (
    <Card>
      <CardHeader title={titulo} subtitle={subtitulo} action={accion} />
      {alertas.length === 0 ? (
        <EstadoVacio titulo="Todo en orden" detalle="No hay nada pendiente de revisar." />
      ) : (
        <ul className="space-y-2 p-4">
          {alertas.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border px-3.5 py-3 ${
                peligro ? 'border-rose-100 bg-rose-50' : 'border-amber-100 bg-amber-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.titulo}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{a.detalle}</p>
                </div>
                {a.badge && (
                  <Badge className={peligro ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                    {a.badge}
                  </Badge>
                )}
              </div>
              {a.link && (
                <Link
                  to={a.link}
                  className={`group mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold shadow-sm ring-1 transition ${
                    peligro
                      ? 'text-rose-600 ring-rose-200 hover:bg-rose-600 hover:text-white hover:ring-rose-600'
                      : 'text-slate-700 ring-slate-200 hover:bg-primary-600 hover:text-white hover:ring-primary-600'
                  }`}
                >
                  {a.iconoLink}
                  {a.textoLink ?? 'Ver detalle'}
                  {!a.iconoLink && (
                    <ChevronRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {children}
    </Card>
  )
}

/** Encabezado de bloque con acción, para listas internas. */
export function Bloque({
  titulo,
  descripcion,
  accion,
  children,
  className = '',
}: {
  titulo: ReactNode
  descripcion?: ReactNode
  accion?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader title={titulo} subtitle={descripcion} action={accion} />
      {children}
    </Card>
  )
}
