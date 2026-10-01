import { esc, imprimir } from './descarga'
import { fmtCorto, hoy, moneda } from '../data/fechas'
import logoUrl from '../../assets/img/logo.png'
import type { Consulta, DatosApi, Mascota, Pago, RecetaImprimible } from '../data/types'

/* Documentos imprimibles: HTML en cadena, ventana aparte.
   Todos pasan por `documento()`, así comparten membrete, logo, tipografía y
   reglas de impresión. Solo cambia el cuerpo de cada hoja. */

const clinica = {
  nombre: 'Clínica Veterinaria Patitas Felices',
  direccion: 'Av. La Marina 1214, San Miguel · Lima',
  contacto: 'Tel. (01) 555-0142 · RUC 20512345678',
}

/* ========================== Hoja de estilos ========================== */

const css = `
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;padding:24px 0;background:#eef2f7;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#0f172a}
.hoja{width:210mm;max-width:100%;margin:0 auto;padding:14mm 15mm;background:#fff;border-radius:14px;box-shadow:0 18px 40px -24px rgba(15,23,42,.35)}
.cabeza{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:14px;border-bottom:2px solid #059669}
.marca{display:flex;gap:12px;align-items:center}
.logo{width:54px;height:54px;object-fit:contain}
.clinica{margin:0;font-size:15px;font-weight:700;letter-spacing:-.01em}
.dato{margin:2px 0 0;font-size:11px;color:#64748b}
.sello{text-align:right;flex-shrink:0}
.codigo{display:inline-block;padding:4px 11px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:11px;font-weight:700;letter-spacing:.04em}
.emitida{margin:6px 0 0;font-size:10px;color:#94a3b8}
.titulo{margin:20px 0 4px;font-size:19px;font-weight:700;letter-spacing:-.02em}
.subtitulo{margin:0;font-size:12px;color:#64748b}
h2.seccion{margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#059669}
.ficha{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e2e8f0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
.ficha>div{padding:8px 11px;background:#fff}
.ficha dt{margin:0;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8}
.ficha dd{margin:2px 0 0;font-size:12.5px;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{padding:8px 10px;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;text-align:left}
td{padding:9px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top}
tbody tr:nth-child(even){background:#f8fafc}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.caja{padding:11px 13px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:12.5px;line-height:1.6}
.caja p{margin:0 0 6px}.caja p:last-child{margin:0}
.totales{display:flex;justify-content:flex-end;margin-top:14px}
.total{min-width:210px;padding:12px 16px;border-radius:10px;background:#ecfdf5;color:#065f46}
.total span{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.75}
.total strong{display:block;margin-top:2px;font-size:20px;font-variant-numeric:tabular-nums}
.firmas{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;margin-top:34px}
.firma{text-align:center}
.firma span{display:block;padding-top:7px;border-top:1px solid #cbd5e1;font-size:11px;color:#64748b}
.firma strong{display:block;font-size:12px;color:#0f172a}
.pie{margin-top:22px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:10px;line-height:1.6;color:#94a3b8}
.vacio{padding:18px;text-align:center;font-size:12px;color:#94a3b8}
@page{size:A4;margin:12mm}
@media print{
  body{padding:0;background:#fff}
  .hoja{width:auto;max-width:none;margin:0;padding:0;border-radius:0;box-shadow:none}
  thead{display:table-header-group}
  tr,.ficha,.firmas,.total{page-break-inside:avoid}
}`

/* ============================== Membrete ============================== */

/** Cabecera común: logo, datos de la clínica y el sello del documento. */
function membrete(codigo: string, emitida: string) {
  return `
  <header class="cabeza">
    <div class="marca">
      <img class="logo" src="${esc(logoUrl)}" alt="Clínica Patitas Felices">
      <div>
        <p class="clinica">${clinica.nombre}</p>
        <p class="dato">${clinica.direccion}</p>
        <p class="dato">${clinica.contacto}</p>
      </div>
    </div>
    <div class="sello">
      <span class="codigo">${esc(codigo)}</span>
      <p class="emitida">Emitida el ${esc(emitida)}</p>
    </div>
  </header>`
}

/** Bloque de datos en dos o tres columnas. */
function ficha(celdas: [string, string][]) {
  return `<dl class="ficha">${celdas
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join('')}</dl>`
}

/** Firmas del profesional y del propietario. */
function firmas(izquierda: string, derecha: string) {
  return `
  <div class="firmas">
    <div class="firma"><strong>${esc(izquierda)}</strong><span>Firma y sello</span></div>
    <div class="firma"><strong>${esc(derecha)}</strong><span>Conformidad</span></div>
  </div>`
}

/** Envuelve el cuerpo de cualquier hoja con el documento completo. */
function documento(opts: {
  codigo: string
  emitida: string
  titulo: string
  subtitulo?: string
  cuerpo: string
  pie?: string
}): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(opts.titulo)}</title>
<style>${css}</style></head><body><div class="hoja">
${membrete(opts.codigo, opts.emitida)}
<h1 class="titulo">${esc(opts.titulo)}</h1>
${opts.subtitulo ? `<p class="subtitulo">${esc(opts.subtitulo)}</p>` : ''}
${opts.cuerpo}
${opts.pie ? `<div class="pie">${opts.pie}</div>` : ''}
</div></body></html>`
}

/* ======================= Receta médica veterinaria ======================= */

/** Documento HTML de una receta médica veterinaria. */
export function htmlReceta(receta: RecetaImprimible): string {
  const filas = receta.items
    .map(
      (i) =>
        `<tr><td><strong>${esc(i.medicamento)}</strong></td><td>${esc(i.dosis)}</td><td class="num">${esc(
          i.dias,
        )}</td></tr>`,
    )
    .join('')

  return documento({
    codigo: receta.codigo,
    emitida: receta.fecha,
    titulo: 'Receta médica veterinaria',
    subtitulo: `Prescripción para ${receta.mascota}`,
    cuerpo: `
<h2 class="seccion">Paciente</h2>
${ficha([
  ['Mascota', receta.mascota],
  ['Propietario', receta.propietario],
  ['Veterinario', receta.vet],
  ['Raza', receta.raza || '—'],
  ['Peso', receta.peso || '—'],
  ['Fecha', receta.fecha],
])}
<h2 class="seccion">Prescripción</h2>
${
  receta.items.length
    ? `<table><thead><tr><th>Medicamento</th><th>Dosis</th><th class="num">Días</th></tr></thead><tbody>${filas}</tbody></table>`
    : '<p class="vacio">Sin medicamentos indicados.</p>'
}
${firmas(receta.vet, receta.propietario)}
<p class="pie">No suspender los antibióticos antes de completar los días indicados. Ante reacción adversa, comuníquese con la clínica al (01) 555-0142. Documento válido con la firma y sello del veterinario responsable.</p>`,
  })
}

/** Imprime una receta en una pestaña aparte. */
export function imprimirReceta(receta: RecetaImprimible): boolean {
  return imprimir(htmlReceta(receta))
}

/* ========================= Caja: reporte de cobros ========================= */

interface PropsRecibo {
  datos: DatosApi
  pagos: Pago[]
  titulo: string
  rango: string
}

/** Un pago cuelga de su cita, no de la mascota: así se conoce el paciente. */
export function pacienteDe(datos: DatosApi, p: Pago): number | null {
  return p.citaId != null ? (datos.cita(p.citaId)?.mascotaId ?? null) : null
}

/** Tabla de cobros del periodo, lista para imprimir. */
export function reciboHTML({ datos, pagos, titulo, rango }: PropsRecibo): string {
  const total = pagos.reduce((s, p) => s + Number(p.monto), 0)
  const promedio = pagos.length ? total / pagos.length : 0

  const metodos = [...new Set(pagos.map((p) => p.metodo))].map((metodo) => ({
    metodo,
    total: pagos.filter((p) => p.metodo === metodo).reduce((s, p) => s + Number(p.monto), 0),
  }))
  const principal = metodos.sort((a, b) => b.total - a.total)[0]

  const filas = pagos
    .map(
      (p) => `<tr>
        <td>${esc(fmtCorto(p.fecha))} · ${esc(p.hora)}</td>
        <td>${esc(datos.nombreMascota(pacienteDe(datos, p)))}</td>
        <td>${esc(p.metodo)}</td>
        <td>${p.referencia ? esc(p.referencia) : '—'}</td>
        <td class="num">${esc(moneda(p.monto))}</td>
      </tr>`,
    )
    .join('')

  return documento({
    codigo: `REP-${String(pagos.length).padStart(3, '0')}`,
    emitida: fmtCorto(hoy),
    titulo,
    subtitulo: `${rango} · ${pagos.length} cobro${pagos.length === 1 ? '' : 's'}`,
    cuerpo: `
<h2 class="seccion">Resumen del periodo</h2>
${ficha([
  ['Total cobrado', moneda(total)],
  ['Cobros', String(pagos.length)],
  ['Ticket promedio', moneda(promedio)],
  ['Método principal', principal ? `${principal.metodo} · ${moneda(principal.total)}` : '—'],
  ['Periodo', rango],
  ['Emitido por', 'Caja · Patitas Felices'],
])}
<h2 class="seccion">Detalle de cobros</h2>
${
  filas
    ? `<table><thead><tr><th>Fecha y hora</th><th>Paciente</th><th>Método</th><th>Referencia</th><th class="num">Monto</th></tr></thead><tbody>${filas}</tbody></table>
    <div class="totales"><div class="total"><span>Total del periodo</span><strong>${esc(moneda(total))}</strong></div></div>`
    : '<p class="vacio">Sin cobros en el periodo.</p>'
}
${firmas('Responsable de caja', 'Visto bueno')}
<p class="pie">Documento generado desde el sistema de Patitas Felices. Los importes están expresados en soles (S/).</p>`,
  })
}

/* ==================== Historial: hoja de consulta ==================== */

/** Historia clínica de una consulta, lista para imprimir. */
export function hojaConsulta(datos: DatosApi, c: Consulta): string {
  const m = datos.mascota(c.mascotaId)
  const duenio = datos.duenioDe(c.mascotaId)

  return documento({
    codigo: `HC-${String(c.id).padStart(3, '0')}`,
    emitida: c.fecha,
    titulo: 'Historia clínica de la atención',
    subtitulo: `${m?.nombre ?? 'Paciente'} · ${c.tipo} del ${fmtCorto(c.fecha)}`,
    cuerpo: `
<h2 class="seccion">Paciente</h2>
${ficha([
      ['Mascota', m?.nombre ?? '—'],
      ['Especie', m?.especie ?? '—'],
      ['Raza', m?.raza || '—'],
      ['Sexo y edad', [m?.sexo, m?.edad].filter(Boolean).join(' · ') || '—'],
      ['Peso', m?.peso || '—'],
      ['Propietario', duenio?.nombre ?? '—'],
      ['Teléfono', duenio?.telefono || '—'],
      ['Veterinario', datos.nombreVet(c.vetId)],
      ['Estado', c.estado],
    ])}
<h2 class="seccion">Evolución clínica</h2>
<div class="caja">
  <p><strong>Diagnóstico:</strong> ${esc(c.diagnostico)}</p>
  <p><strong>Tratamiento:</strong> ${esc(c.tratamiento)}</p>
  <p><strong>Recomendaciones:</strong> ${esc(c.recomendaciones || '—')}</p>
</div>
${
  c.archivos.length
    ? `<h2 class="seccion">Adjuntos</h2><div class="caja">${c.archivos.map((a) => `<p>${esc(a)}</p>`).join('')}</div>`
    : ''
}
${firmas(datos.nombreVet(c.vetId), duenio?.nombre ?? 'Propietario')}
<p class="pie">Documento generado desde el sistema de Patitas Felices.</p>`,
  })
}

/* ===================== Ficha clínica del paciente ===================== */

/** Ficha resumida de una mascota, lista para imprimir. */
export function htmlFicha(datos: DatosApi, m: Mascota): string {
  const duenio = datos.propietario(m.propietarioId)
  const consultas = datos.consultasDe(m.id)
  const vacunas = datos.vacunasDe(m.id)

  const filasConsultas = consultas
    .map(
      (c) => `<tr>
        <td>${esc(fmtCorto(c.fecha))}</td>
        <td>${esc(c.tipo)}</td>
        <td>${esc(c.diagnostico)}</td>
        <td>${esc(datos.nombreVet(c.vetId))}</td>
      </tr>`,
    )
    .join('')

  const filasVacunas = vacunas
    .map(
      (v) => `<tr>
        <td>${esc(v.nombre)}</td>
        <td>${esc(fmtCorto(v.fecha))}</td>
        <td>${esc(fmtCorto(v.proxima))}</td>
        <td>${esc(datos.nombreVet(v.aplicadaPorId))}</td>
      </tr>`,
    )
    .join('')

  return documento({
    codigo: `FIC-${String(m.id).padStart(3, '0')}`,
    emitida: fmtCorto(hoy),
    titulo: 'Ficha clínica del paciente',
    subtitulo: `${m.nombre} · ${m.especie}${m.raza ? ` · ${m.raza}` : ''}`,
    cuerpo: `
<h2 class="seccion">Datos del paciente</h2>
${ficha([
      ['Mascota', m.nombre],
      ['Especie', m.especie],
      ['Raza', m.raza || '—'],
      ['Sexo', m.sexo],
      ['Edad', m.edad || '—'],
      ['Peso', m.peso || '—'],
      ['Color', m.color || '—'],
      ['Esterilizado', m.esterilizado ? 'Sí' : 'No'],
      ['Propietario', duenio?.nombre ?? '—'],
    ])}
${m.antecedentes ? `<h2 class="seccion">Antecedentes</h2><div class="caja"><p>${esc(m.antecedentes)}</p></div>` : ''}
<h2 class="seccion">Consultas (${consultas.length})</h2>
${
  filasConsultas
    ? `<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Diagnóstico</th><th>Veterinario</th></tr></thead><tbody>${filasConsultas}</tbody></table>`
    : '<p class="vacio">Sin atenciones registradas.</p>'
}
<h2 class="seccion">Vacunas (${vacunas.length})</h2>
${
  filasVacunas
    ? `<table><thead><tr><th>Vacuna</th><th>Aplicada</th><th>Próxima</th><th>Aplicada por</th></tr></thead><tbody>${filasVacunas}</tbody></table>`
    : '<p class="vacio">Sin vacunas registradas.</p>'
}
${firmas('Veterinario responsable', duenio?.nombre ?? 'Propietario')}
<p class="pie">Documento generado desde el sistema de Patitas Felices.</p>`,
  })
}
