import { useMemo } from 'react'
import { useDatos } from '../../data/store'
import { usePortal } from '../../components/layout/PortalLayout'
import { fmtCorto } from '../../data/fechas'
import { Badge, PageHeader } from '../../components/ui'
import { Bloque } from '../../components/Tablero'
import { estados_consulta } from '../../data/estados'

/** Concise owner-scoped consultation history. Details remain intentionally read-only. */
export default function PortalHistorial() {
  const datos = useDatos()
  const { mascotas } = usePortal()
  const ids = useMemo(() => new Set(mascotas.map((mascota) => mascota.id)), [mascotas])
  const consultas = useMemo(
    () => datos.consultas.filter((consulta) => ids.has(consulta.mascotaId)).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [datos.consultas, ids],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Historial" subtitle="Atenciones registradas para sus mascotas" />
      <Bloque titulo="Consultas" descripcion={consultas.length ? `${consultas.length} atención${consultas.length === 1 ? '' : 'es'}` : undefined}>
        {consultas.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">Todavía no hay atenciones registradas.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {consultas.map((consulta) => (
              <li key={consulta.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-28 text-xs text-slate-500">{fmtCorto(consulta.fecha)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{datos.nombreMascota(consulta.mascotaId)} · {consulta.tipo}</p>
                  <p className="mt-1 text-sm text-slate-600">{consulta.diagnostico}</p>
                  {consulta.tratamiento && <p className="mt-1 text-xs text-slate-500">Tratamiento: {consulta.tratamiento}</p>}
                  {consulta.archivos.length > 0 && <p className="mt-1 text-xs text-slate-500">{consulta.archivos.length} adjunto(s)</p>}
                </div>
                <Badge className={estados_consulta[consulta.estado]}>{consulta.estado}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Bloque>
    </div>
  )
}
