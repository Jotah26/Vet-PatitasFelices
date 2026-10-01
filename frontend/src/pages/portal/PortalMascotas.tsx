import { useMemo } from 'react'
import { useDatos } from '../../data/store'
import { usePortal } from '../../components/layout/PortalLayout'
import { diffDias, fmtCorto, hoy } from '../../data/fechas'
import { Button, PageHeader } from '../../components/ui'
import { Bloque, Metricas } from '../../components/Tablero'
import { CalendarIcon, HeartIcon, PawIcon, PlusIcon, SyringeIcon } from '../../components/icons'
import { PetImage } from '../../components/PetAvatar'

/** Fichas resumidas de las mascotas del dueño. */
export default function PortalMascotas() {
  const datos = useDatos()
  const { mascotas, agregarMascota } = usePortal()
  const ids = useMemo(() => mascotas.map((m) => m.id), [mascotas])
  const lista = useMemo(() => datos.mascotas.filter((m) => ids.includes(m.id)), [datos, ids])

  const resumen = useMemo(() => {
    const proximasCitas = datos.citas.filter(
      (c) => ids.includes(c.mascotaId) && c.fecha >= hoy && c.estado !== 'Cancelada',
    ).length
    const atencionadas = datos.citas.filter((c) => ids.includes(c.mascotaId) && c.estado === 'Atendida').length
    const vacunasProximas = datos.vacunas.filter((v) => ids.includes(v.mascotaId) && diffDias(v.proxima) <= 30).length
    return { proximasCitas, atencionadas, vacunasProximas }
  }, [datos.citas, datos.vacunas, ids])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis mascotas"
        subtitle="Ficha y datos de cada paciente"
        action={
          <Button size="sm" onClick={agregarMascota}>
            <PlusIcon className="h-4 w-4" /> Añadir mascota
          </Button>
        }
      />

      <Metricas
        items={[
          {
            icono: <PawIcon className="h-5 w-5" />,
            etiqueta: 'Registradas',
            valor: lista.length,
            detalle: lista.length ? 'Pacientes de su ficha' : 'Sin mascotas todavía',
            acento: 'bg-primary-100 text-primary-700',
          },
          {
            icono: <CalendarIcon className="h-5 w-5" />,
            etiqueta: 'Citas por venir',
            valor: resumen.proximasCitas,
            detalle: resumen.proximasCitas ? 'Visitas ya agendadas' : 'Sin visitas en agenda',
            acento: 'bg-amber-100 text-amber-700',
          },
          {
            icono: <SyringeIcon className="h-5 w-5" />,
            etiqueta: 'Vacunas a 30 días',
            valor: resumen.vacunasProximas,
            detalle: resumen.vacunasProximas ? 'Dosis por aplicar' : 'Todo al día',
            acento: 'bg-sky-100 text-sky-700',
          },
          {
            icono: <HeartIcon className="h-5 w-5" />,
            etiqueta: 'Atenciones',
            valor: resumen.atencionadas,
            detalle: 'Visitas completadas',
            acento: 'bg-rose-100 text-rose-700',
          },
        ]}
      />

      {lista.length === 0 ? (
        <Bloque titulo="Fichas">
          <div className="p-5">
            <p className="text-sm text-slate-500">
              Todavía no tiene mascotas registradas. Regístre a su primera mascota para poder solicitar citas.
            </p>
            <Button size="sm" className="mt-4" onClick={agregarMascota}>
              <PlusIcon className="h-4 w-4" /> Añadir mascota
            </Button>
          </div>
        </Bloque>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((m) => {
            const ultima = datos.consultasDe(m.id)[0]
            const proximaVacuna = datos.vacunasDe(m.id)[0]
            const ficha: [string, string][] = [
              ['Especie', m.especie],
              ['Raza', m.raza || '—'],
              ['Sexo', m.sexo || '—'],
              ['Edad', m.edad || '—'],
              ['Peso', m.peso || '—'],
              ['Última visita', ultima ? fmtCorto(ultima.fecha) : '—'],
            ]
            return (
              <Bloque key={m.id} titulo={m.nombre} descripcion={`${m.especie} · ${m.edad}`}>
                <div className="flex flex-col items-center gap-3 p-5">
                  <PetImage especie={m.especie} sexo={m.sexo} nombre={m.nombre} foto={m.foto} className="h-16 w-16 text-base" />
                  <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-2.5 border-t border-slate-100 pt-4">
                    {ficha.map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{k}</dt>
                        <dd className="truncate text-xs font-medium text-slate-700">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {proximaVacuna && (
                    <p className="w-full rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Próxima vacuna: <span className="font-semibold text-slate-800">{fmtCorto(proximaVacuna.proxima)}</span>
                    </p>
                  )}
                </div>
              </Bloque>
            )
          })}
        </div>
      )}
    </div>
  )
}
