import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useDatos } from '../../data/store'
import { usePortal } from '../../components/layout/PortalLayout'
import { diffDias, diaSemana, esHoy, fmtCorto, fmtDia, fmtMes, hoy, moneda, relativo } from '../../data/fechas'
import { Badge, Button, PageHeader } from '../../components/ui'
import { Alertas, Bloque, FilaCita, Metricas } from '../../components/Tablero'
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  MoneyIcon,
  PlusIcon,
  SyringeIcon,
} from '../../components/icons'
import { PetImage } from '../../components/PetAvatar'

/** Inicio del portal: próximas citas, solicitudes, vacunas y pagos pendientes. */
export default function PortalInicio() {
  const { user } = useAuth()
  const datos = useDatos()
  const { mascotas, pedirCita } = usePortal()
  const ids = useMemo(() => mascotas.map((m) => m.id), [mascotas])

  const resumen = useMemo(() => {
    const citas = datos.citas.filter((c) => ids.includes(c.mascotaId))
    const solicitudes = datos.solicitudes.filter((s) => ids.includes(s.mascotaId))
    const vacunas = datos.vacunas.filter((v) => ids.includes(v.mascotaId))

    const proximas = citas
      .filter((c) => c.fecha >= hoy && c.estado !== 'Cancelada')
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))

    const sortedVacunas = [...vacunas].sort((a, b) => a.proxima.localeCompare(b.proxima))
    const vencenPronto = sortedVacunas.filter((v) => diffDias(v.proxima) <= 30)

    return {
      proximas,
      proxima: proximas[0],
      pendientes: solicitudes.filter((s) => s.estado === 'Pendiente'),
      rechazadas: solicitudes.filter((s) => s.estado === 'Rechazada' && diffDias(s.resuelta ?? s.creada) > -15),
      atencionadas: citas.filter((c) => c.estado === 'Atendida' && c.fecha <= hoy).length,
      vencenPronto,
      vencidas: vencenPronto.filter((v) => diffDias(v.proxima) < 0).length,
      proximaVacuna: vencenPronto[0],
      proximoPago: citas
        .filter((c) => c.estado === 'Atendida' && !datos.pagoDe(c.id))
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0],
    }
  }, [datos, ids])

  const proxima = resumen.proxima

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${(user?.nombre ?? '').split(' ')[0]}`}
        subtitle="Estado de las citas, vacunas y tratamientos de sus mascotas"
        action={
          <Button size="sm" onClick={pedirCita}>
            <PlusIcon className="h-4 w-4" /> Solicitar cita
          </Button>
        }
      />

      <Metricas
        items={[
          {
            icono: <CalendarIcon className="h-5 w-5" />,
            etiqueta: 'Próxima cita',
            valor: proxima ? fmtCorto(proxima.fecha) : '—',
            detalle: proxima ? `${proxima.hora} · ${datos.nombreMascota(proxima.mascotaId)}` : 'Sin cita programada',
            acento: 'bg-primary-100 text-primary-700',
          },
          {
            icono: <ClockIcon className="h-5 w-5" />,
            etiqueta: 'Solicitudes',
            valor: resumen.pendientes.length,
            detalle: resumen.pendientes.length ? 'Esperando confirmación' : 'Todo confirmado',
            acento: resumen.pendientes.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <SyringeIcon className="h-5 w-5" />,
            etiqueta: 'Próxima vacuna',
            valor: resumen.proximaVacuna ? fmtCorto(resumen.proximaVacuna.proxima) : '—',
            detalle: resumen.proximaVacuna
              ? `${resumen.proximaVacuna.nombre} · ${relativo(resumen.proximaVacuna.proxima).toLowerCase()}`
              : 'Todo al día',
            acento: resumen.proximaVacuna
              ? resumen.vencidas > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <HeartIcon className="h-5 w-5" />,
            etiqueta: 'Atenciones',
            valor: resumen.atencionadas,
            detalle: `${mascotas.length} mascota${mascotas.length === 1 ? '' : 's'} en su ficha`,
            acento: 'bg-rose-100 text-rose-700',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Bloque
          titulo="Su próxima cita"
          descripcion={proxima ? `${diaSemana(proxima.fecha)} ${fmtDia(proxima.fecha)} de ${fmtMes(proxima.fecha)}` : undefined}
          accion={
            <Link to="/portal/citas" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Ver agenda
            </Link>
          }
        >
          {proxima ? (
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <PetImage
                  especie={datos.mascota(proxima.mascotaId)?.especie}
                  sexo={datos.mascota(proxima.mascotaId)?.sexo}
                  nombre={datos.nombreMascota(proxima.mascotaId)}
                  foto={datos.mascota(proxima.mascotaId)?.foto}
                  className="h-11 w-11 text-xs"
                  anillo={false}
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">
                    {datos.nombreMascota(proxima.mascotaId)}
                  </p>
                  <p className="truncate text-xs text-slate-500">{datos.nombreServicio(proxima.servicioId)}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 tabular-nums">
                  {proxima.hora}
                </span>
              </div>

              <p className="text-sm text-slate-600">{proxima.motivo}</p>

              <p className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                {esHoy(proxima.fecha)
                  ? 'Su cita es hoy. Llegue 10 minutos antes.'
                  : `Atiende ${datos.nombreVet(proxima.vetId)}. Llegue 10 minutos antes de la hora.`}
              </p>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm text-slate-500">
                No tiene citas programadas. Puede solicitar una y recepción le confirmará el horario.
              </p>
              <Button size="sm" className="mt-4" onClick={pedirCita}>
                <PlusIcon className="h-4 w-4" /> Solicitar cita
              </Button>
            </div>
          )}
        </Bloque>

        <Alertas
          titulo="Pendientes"
          subtitulo="Solicitudes, vacunas y cobros que requieren su atención"
          peligro={resumen.vencidas > 0}
          alertas={[
            ...resumen.pendientes.map((s) => ({
              id: `sol${s.id}`,
              titulo: `Cita de ${datos.nombreMascota(s.mascotaId)} · ${fmtCorto(s.fecha)} ${s.hora}`,
              detalle: s.motivo,
              badge: 'Esperando',
              link: '/portal',
            })),
            ...resumen.rechazadas.map((s) => ({
              id: `rech${s.id}`,
              titulo: `Cita de ${datos.nombreMascota(s.mascotaId)} rechazada`,
              detalle: s.motivoRechazo ?? 'Recepción no pudo confirmar ese horario.',
              badge: 'Rechazada',
              link: '/portal/citas',
            })),
            ...resumen.vencenPronto.slice(0, 2).map((v) => ({
              id: `vac${v.id}`,
              titulo: `${v.nombre} de ${datos.nombreMascota(v.mascotaId)}`,
              detalle: `Próxima dosis el ${fmtCorto(v.proxima)} · ${relativo(v.proxima).toLowerCase()}`,
              badge: diffDias(v.proxima) < 0 ? 'Vencida' : 'Próxima',
              link: '/portal/vacunas',
            })),
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Bloque
          titulo="Próximas citas"
          descripcion="Agenda de sus mascotas"
          accion={
            <Link to="/portal/citas" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Ver todas
            </Link>
          }
        >
          {resumen.proximas.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">No hay citas programadas.</p>
          ) : (
            <div className="space-y-1 p-3">
              {resumen.proximas.slice(0, 5).map((c) => (
                <FilaCita
                  key={c.id}
                  cita={c}
                  datos={datos}
                  mostrarFecha
                  sinEnlace
                  acento={c.fecha === hoy ? 'bg-primary-50' : 'bg-slate-50'}
                  accion={
                    <Badge className={c.fecha === hoy ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}>
                      {c.fecha === hoy ? 'Hoy' : relativo(c.fecha).replace('Faltan ', 'En ')}
                    </Badge>
                  }
                />
              ))}
            </div>
          )}
        </Bloque>

        <Bloque
          titulo="Mis mascotas"
          descripcion="Ficha y próxima dosis de cada paciente"
          accion={
            <Link to="/portal/mascotas" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Ver fichas
            </Link>
          }
        >
          {mascotas.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">
              Aún no tiene mascotas registradas. Regístrelas para poder solicitar citas.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {mascotas.map((m) => {
                const proximaVacuna = datos.vacunasDe(m.id)[0]
                return (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <PetImage
                      especie={m.especie}
                      sexo={m.sexo}
                      nombre={m.nombre}
                      foto={m.foto}
                      className="h-9 w-9 text-[10px]"
                      anillo={false}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{m.nombre}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {m.especie}
                        {m.raza ? ` · ${m.raza}` : ''} · {m.edad}
                      </span>
                    </span>
                    {proximaVacuna ? (
                      <span className="shrink-0 text-right">
                        <span className="block text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                          Próxima vacuna
                        </span>
                        <span className="block text-xs font-semibold text-slate-700">
                          {fmtCorto(proximaVacuna.proxima)}
                        </span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-slate-400">Sin vacunas</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Bloque>
      </div>

      {resumen.proximoPago && (
        <Bloque titulo="Pendiente de pago" descripcion="Puede regularlo en recepción al recoger a su mascota">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <MoneyIcon className="h-5 w-5" />
              </span>
              <p className="text-sm text-slate-600">
                La atención de{' '}
                <span className="font-semibold text-slate-800">{datos.nombreMascota(resumen.proximoPago.mascotaId)}</span> del{' '}
                {fmtCorto(resumen.proximoPago.fecha)} aún no tiene pago registrado.
              </p>
            </div>
            <p className="shrink-0 text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {moneda(datos.servicio(resumen.proximoPago.servicioId)?.precio ?? 0)}
            </p>
          </div>
        </Bloque>
      )}
    </div>
  )
}
