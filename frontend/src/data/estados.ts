import type { EstadoConsulta, EstadoReceta } from './types'

/* Colores de badge por estado. Todos igual: fondo claro y texto del mismo tono. */

export const estados_receta: Record<EstadoReceta, string> = {
  Emitida: 'bg-amber-100 text-amber-700',
  Dispensada: 'bg-emerald-100 text-emerald-700',
}

export const estados_consulta: Record<EstadoConsulta, string> = {
  Completada: 'bg-emerald-100 text-emerald-700',
  'En seguimiento': 'bg-amber-100 text-amber-700',
}

export const estados_cita: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Confirmada: 'bg-primary-100 text-primary-700',
  'En sala': 'bg-sky-100 text-sky-700',
  Atendida: 'bg-emerald-100 text-emerald-700',
  Cancelada: 'bg-slate-100 text-slate-600',
}

export const estados_solicitud: Record<string, string> = {
  Pendiente: 'bg-amber-100 text-amber-700',
  Aceptada: 'bg-emerald-100 text-emerald-700',
  Rechazada: 'bg-rose-100 text-rose-700',
}

export const estados_vacuna: Record<string, { label: string; color: string }> = {
  alDia: { label: 'Al día', color: 'bg-emerald-100 text-emerald-700' },
  proxima: { label: 'Próxima', color: 'bg-amber-100 text-amber-700' },
  vencida: { label: 'Vencida', color: 'bg-rose-100 text-rose-700' },
  hoy: { label: 'Vence hoy', color: 'bg-orange-100 text-orange-700' },
}
