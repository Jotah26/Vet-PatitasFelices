/* Utilidades de fecha. Van como texto ISO 'YYYY-MM-DD' u hora 'HH:MM', nunca como Date. */

export const hoy = (() => {
  const f = new Date()
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
})()

const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const meses_largo = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const dias_corto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export interface Partes {
  anio: number
  mes: number
  dia: number
}

export function partes(iso: string): Partes {
  const [anio, mes, dia] = String(iso ?? '').split('-').map(Number)
  return { anio, mes, dia }
}

export function aISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export function sumarDias(iso: string, dias: number): string {
  const p = partes(iso)
  const f = new Date(p.anio, p.mes - 1, p.dia + dias)
  return aISO(f.getFullYear(), f.getMonth() + 1, f.getDate())
}

export function diaDeSemana(anio: number, mes: number, dia: number): number {
  return new Date(anio, mes - 1, dia).getDay()
}

/** Hora local en HH:MM, para lo que se registra en el momento (cobros). */
export function horaActual(): string {
  const f = new Date()
  return `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`
}

/** Fecha ISO a `offset` días desde hoy. */
export function d(offset = 0): string {
  return sumarDias(hoy, offset)
}

/** Días entre hoy e `iso`. Negativo si la fecha ya pasó. */
export function diffDias(iso: string): number {
  const p = partes(iso)
  const h = partes(hoy)
  return Math.round((Date.UTC(p.anio, p.mes - 1, p.dia) - Date.UTC(h.anio, h.mes - 1, h.dia)) / 86400000)
}

export function esHoy(iso: string): boolean {
  return iso === hoy
}

/* ---------- Formato ---------- */

export function fmtCorto(iso: string): string {
  if (!iso) return '—'
  const p = partes(iso)
  return `${p.dia} ${meses[p.mes - 1]} ${p.anio}`
}

export function fmtDia(iso: string): string {
  return String(partes(iso).dia).padStart(2, '0')
}

export function fmtMes(iso: string): string {
  return meses[partes(iso).mes - 1]
}

export function nombreMes(mes: number): string {
  return meses_largo[mes - 1]
}

export function diaSemana(iso: string): string {
  const p = partes(iso)
  return dias_corto[diaDeSemana(p.anio, p.mes, p.dia)]
}

export function fmtLargo(iso: string): string {
  if (!iso) return '—'
  const p = partes(iso)
  return `${dias[diaDeSemana(p.anio, p.mes, p.dia)]} ${p.dia} de ${meses_largo[p.mes - 1]} de ${p.anio}`
}

export function relativo(iso: string): string {
  const n = diffDias(iso)
  if (n > 0) return `Faltan ${n} ${n === 1 ? 'día' : 'días'}`
  if (n < 0) return `Venció ${Math.abs(n)} ${Math.abs(n) === 1 ? 'día' : 'días'} atrás`
  return 'Hoy'
}

/* ---------- Texto ---------- */

export function moneda(valor: number | string | null | undefined): string {
  return `S/ ${Number(valor ?? 0).toFixed(2)}`
}

export function iniciales(nombre: string | null | undefined): string {
  return String(nombre ?? '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function pesoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
