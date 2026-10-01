import { useMemo } from 'react'
import { useDatos } from '../../data/store'
import { usePortal } from '../../components/layout/PortalLayout'
import { fmtCorto, hoy, moneda } from '../../data/fechas'
import { Button, PageHeader } from '../../components/ui'
import { Bloque, Estado, Metricas } from '../../components/Tablero'
import { CalendarIcon, CheckCircleIcon, ClockIcon, CloseIcon, PlusIcon } from '../../components/icons'
import type { Cita, DatosApi } from '../../data/types'

/** Agenda del dueño: próximas citas y visitas anteriores. */
export default function PortalCitas() {
  const datos = useDatos()
  const { mascotas, pedirCita } = usePortal()
  const ids = useMemo(() => mascotas.map((m) => m.id), [mascotas])

  const citas = useMemo(
    () =>
      datos.citas
        .filter((c) => ids.includes(c.mascotaId))
        .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)),
    [datos.citas, ids],
  )

  const futuras = citas.filter((c) => c.fecha >= hoy && c.estado !== 'Cancelada')
  const pasado = citas.filter((c) => c.fecha < hoy || c.estado === 'Cancelada')
  const canceladas = citas.filter((c) => c.estado === 'Cancelada').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis citas"
        subtitle="Historial completo de visitas a la clínica"
        action={
          <Button size="sm" onClick={pedirCita}>
            <PlusIcon className="h-4 w-4" /> Nueva cita
          </Button>
        }
      />

      <Metricas
        items={[
          {
            icono: <CalendarIcon className="h-5 w-5" />,
            etiqueta: 'Próximas',
            valor: futuras.length,
            detalle: futuras.length ? 'Visitas ya agendadas' : 'Sin citas en agenda',
            acento: 'bg-primary-100 text-primary-700',
          },
          {
            icono: <CheckCircleIcon className="h-5 w-5" />,
            etiqueta: 'Realizadas',
            valor: pasado.length - canceladas,
            detalle: 'Atenciones completadas',
            acento: 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <CloseIcon className="h-5 w-5" />,
            etiqueta: 'Canceladas',
            valor: canceladas,
            detalle: canceladas ? 'No se realizaron' : 'Ninguna anulada',
            acento: canceladas ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <ClockIcon className="h-5 w-5" />,
            etiqueta: 'Total registrado',
            valor: citas.length,
            detalle: `${mascotas.length} mascota${mascotas.length === 1 ? '' : 's'}`,
            acento: 'bg-amber-100 text-amber-700',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <ListaCitas titulo="Próximas" lista={futuras} datos={datos} vacio="No tiene citas programadas." />
        <ListaCitas
          titulo="Visitas anteriores"
          lista={pasado.slice(0, 12)}
          datos={datos}
          vacio="Todavía no hay visitas registradas."
        />
      </div>
    </div>
  )
}

function ListaCitas({
  titulo,
  lista,
  datos,
  vacio,
}: {
  titulo: string
  lista: Cita[]
  datos: DatosApi
  vacio: string
}) {
  return (
    <Bloque
      titulo={titulo}
      descripcion={lista.length ? `${lista.length} cita${lista.length === 1 ? '' : 's'}` : undefined}
    >
      {lista.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-slate-500">{vacio} Las citas que solicite aparecerán en esta lista.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {lista.map((c) => {
            const s = datos.servicio(c.servicioId)
            return (
              <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 py-1.5">
                  <span className="text-sm leading-tight font-semibold text-slate-800 tabular-nums">
                    {fmtCorto(c.fecha)}
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">{c.hora}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {datos.nombreMascota(c.mascotaId)}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {s?.concepto} · {c.motivo}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums">
                  {s ? moneda(s.precio) : '—'}
                </span>
                <Estado estado={c.estado} />
              </li>
            )
          })}
        </ul>
      )}
    </Bloque>
  )
}
