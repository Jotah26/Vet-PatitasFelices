import { useMemo } from 'react'
import { useDatos } from '../../data/store'
import { usePortal } from '../../components/layout/PortalLayout'
import { fmtCorto } from '../../data/fechas'
import { estados_receta } from '../../data/estados'
import { Badge, Button, PageHeader } from '../../components/ui'
import { Bloque, Metricas } from '../../components/Tablero'
import { CheckCircleIcon, ClockIcon, DownloadIcon, PrescriptionIcon } from '../../components/icons'
import { imprimirReceta } from '../../utils/impresion'

/** Recetas emitidas para las mascotas del dueño. */
export default function PortalRecetas() {
  const datos = useDatos()
  const { mascotas } = usePortal()
  const ids = useMemo(() => mascotas.map((m) => m.id), [mascotas])

  const recetas = useMemo(
    () =>
      datos.recetas
        .filter((r) => ids.includes(r.mascotaId))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [datos.recetas, ids],
  )

  const emitidas = recetas.filter((r) => r.estado === 'Emitida')
  const tiempoTotal = recetas.reduce((s, r) => s + (r.items ?? []).reduce((x, it) => x + it.dias, 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Recetas" subtitle="Tratamientos indicados por el veterinario" />

      <Metricas
        items={[
          {
            icono: <PrescriptionIcon className="h-5 w-5" />,
            etiqueta: 'Recetas',
            valor: recetas.length,
            detalle: `${mascotas.length} mascota${mascotas.length === 1 ? '' : 's'} en ficha`,
            acento: 'bg-amber-100 text-amber-700',
          },
          {
            icono: <ClockIcon className="h-5 w-5" />,
            etiqueta: 'Pendientes de entrega',
            valor: emitidas.length,
            detalle: emitidas.length ? 'Recógalas en recepción' : 'Todo entregado',
            acento: emitidas.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <CheckCircleIcon className="h-5 w-5" />,
            etiqueta: 'Dispensadas',
            valor: recetas.length - emitidas.length,
            detalle: 'Tratamientos ya entregados',
            acento: 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <PrescriptionIcon className="h-5 w-5" />,
            etiqueta: 'Días de tratamiento',
            valor: recetas.length ? tiempoTotal : 0,
            detalle: 'Suma de los días indicados',
            acento: 'bg-primary-100 text-primary-700',
          },
        ]}
      />

      {recetas.length === 0 ? (
        <Bloque titulo="Tratamientos">
          <p className="px-5 pb-5 text-sm text-slate-500">No hay tratamientos indicados por ahora.</p>
        </Bloque>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {recetas.map((r) => (
            <Bloque
              key={r.id}
              titulo={datos.nombreMascota(r.mascotaId)}
              descripcion={`${fmtCorto(r.fecha)} · ${datos.nombreVet(r.vetId)}`}
              accion={<Badge className={estados_receta[r.estado]}>{r.estado}</Badge>}
            >
              <div className="flex flex-col p-5">
                <ul className="flex-1 space-y-2">
                  {(r.items ?? []).map((it, i) => (
                    <li key={i} className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                      <span className="font-semibold text-slate-800">{it.medicamento}</span>
                      <span className="block text-xs text-slate-500">
                        {it.dosis} · por {it.dias} días
                      </span>
                    </li>
                  ))}
                </ul>

                {r.indicaciones && <p className="mt-4 text-xs leading-relaxed text-slate-500">{r.indicaciones}</p>}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    {r.estado === 'Emitida' ? 'Recoja en recepción' : 'Tratamiento en curso'}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => imprimirReceta(datos.recetaImprimible(r))}
                  >
                    <DownloadIcon className="h-4 w-4" /> Descargar receta
                  </Button>
                </div>
              </div>
            </Bloque>
          ))}
        </div>
      )}
    </div>
  )
}
