import { useMemo } from 'react'
import { useDatos } from '../../data/store'
import { usePortal } from '../../components/layout/PortalLayout'
import { diffDias, fmtCorto, relativo } from '../../data/fechas'
import { estados_vacuna } from '../../data/estados'
import { Badge, PageHeader } from '../../components/ui'
import { Alertas, Bloque, Metricas } from '../../components/Tablero'
import { CheckCircleIcon, ClockIcon, SyringeIcon, WarningIcon } from '../../components/icons'
import { PetImage } from '../../components/PetAvatar'
import type { Vacuna } from '../../data/types'

/** Calendario de vacunas de las mascotas del dueño. */
export default function PortalVacunas() {
  const datos = useDatos()
  const { mascotas } = usePortal()
  const ids = useMemo(() => mascotas.map((m) => m.id), [mascotas])

  const resumen = useMemo(() => {
    const filas = datos.vacunas.filter((v) => ids.includes(v.mascotaId))
    const ordenadas = [...filas].sort((a, b) => a.proxima.localeCompare(b.proxima))
    return {
      total: ordenadas.length,
      vencidas: ordenadas.filter((v) => diffDias(v.proxima) < 0),
      proximas: ordenadas.filter((v) => {
        const n = diffDias(v.proxima)
        return n >= 0 && n <= 30
      }),
      alDia: ordenadas.filter((v) => diffDias(v.proxima) > 30),
    }
  }, [datos.vacunas, ids])

  const grouped = useMemo(() => {
    const mapa = new Map<number, Vacuna[]>()
    for (const v of datos.vacunas) {
      if (!ids.includes(v.mascotaId)) continue
      const fila = mapa.get(v.mascotaId)
      if (fila) fila.push(v)
      else mapa.set(v.mascotaId, [v])
    }
    return [...mapa.entries()].flatMap(([mascotaId, filas]) => {
      const mascota = datos.mascota(mascotaId)
      if (!mascota) return []
      return [{ mascota, filas: [...filas].sort((a, b) => a.proxima.localeCompare(b.proxima)) }]
    })
  }, [datos, ids])

  const avisos = [...resumen.vencidas, ...resumen.proximas]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vacunas"
        subtitle="Aplicaciones realizadas y próxima dosis de cada paciente"
      />

      <Metricas
        items={[
          {
            icono: <SyringeIcon className="h-5 w-5" />,
            etiqueta: 'Aplicaciones',
            valor: resumen.total,
            detalle: `${mascotas.length} mascota${mascotas.length === 1 ? '' : 's'} en ficha`,
            acento: 'bg-sky-100 text-sky-700',
          },
          {
            icono: <WarningIcon className="h-5 w-5" />,
            etiqueta: 'Vencidas',
            valor: resumen.vencidas.length,
            detalle: resumen.vencidas.length ? 'Requieren reagendar' : 'Ninguna vencida',
            acento: resumen.vencidas.length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <ClockIcon className="h-5 w-5" />,
            etiqueta: 'En 30 días',
            valor: resumen.proximas.length,
            detalle: resumen.proximas.length ? 'Dosis por aplicar' : 'Sin dosis próximas',
            acento: resumen.proximas.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <CheckCircleIcon className="h-5 w-5" />,
            etiqueta: 'Al día',
            valor: resumen.alDia.length,
            detalle: 'Próxima dosis a más de un mes',
            acento: 'bg-emerald-100 text-emerald-700',
          },
        ]}
      />

      {avisos.length > 0 && (
        <Alertas
          titulo="Dosis por atender"
          subtitulo="Vacunas vencidas o próximas a vencer"
          peligro={resumen.vencidas.length > 0}
          alertas={avisos.slice(0, 4).map((v) => ({
            id: v.id,
            titulo: `${v.nombre} · ${datos.nombreMascota(v.mascotaId)}`,
            detalle: `La dosis corresponde al ${fmtCorto(v.proxima)} · ${relativo(v.proxima).toLowerCase()}`,
            badge: estados_vacuna[datos.estadoVacuna(v.proxima)].label,
            link: '/portal/citas',
            textoLink: 'Solicitar cita',
          }))}
        />
      )}

      {grouped.length === 0 ? (
        <Bloque titulo="Calendario por mascota">
          <p className="px-5 pb-5 text-sm text-slate-500">Aún no hay aplicaciones en el historial.</p>
        </Bloque>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {grouped.map(({ mascota, filas }) => (
            <Bloque
              key={mascota.id}
              titulo={mascota.nombre}
              descripcion={`${mascota.especie}${mascota.raza ? ` · ${mascota.raza}` : ''} · ${mascota.edad}`}
              accion={
                <PetImage
                  especie={mascota.especie}
                  sexo={mascota.sexo}
                  nombre={mascota.nombre}
                  foto={mascota.foto}
                  className="h-8 w-8 text-[10px]"
                  anillo={false}
                />
              }
            >
              <ul className="divide-y divide-slate-100">
                {filas.map((v) => {
                  const tono = estados_vacuna[datos.estadoVacuna(v.proxima)]
                  return (
                    <li key={`${v.nombre}-${v.proxima}`} className="flex items-center gap-3.5 px-5 py-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <SyringeIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">{v.nombre}</p>
                        <p className="truncate text-xs text-slate-500">
                          Aplicada el {fmtCorto(v.fecha)} · próxima {fmtCorto(v.proxima)} ({relativo(v.proxima)})
                        </p>
                      </div>
                      <Badge className={tono.color}>{tono.label}</Badge>
                    </li>
                  )
                })}
              </ul>
            </Bloque>
          ))}
        </div>
      )}
    </div>
  )
}
