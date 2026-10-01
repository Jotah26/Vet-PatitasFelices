import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../data/store'
import { useToast } from '../../components/Toast'
import { fmtCorto, hoy, moneda, relativo } from '../../data/fechas'
import { Button, PageHeader, Select } from '../../components/ui'
import { CalendarIcon, InboxIcon, MoneyIcon, PawIcon } from '../../components/icons'
import { Bloque, Estado, FilaCita, Metricas } from '../../components/Tablero'
import type { Solicitud } from '../../data/types'

export default function VistaRecepcion() {
  const datos = useDatos()
  const { toast } = useToast()
  const [vetId, setVetId] = useState('')

  const { pendientes, hoy: citasHoy, porCobrar, pacientesMes, vets } = useMemo(() => {
    const lista = datos.solicitudes
      .filter((s) => s.estado === 'Pendiente')
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))

    return {
      pendientes: lista,
      hoy: datos.citasDeHoy(),
      porCobrar: datos.porCobrar(),
      pacientesMes: datos.citas.filter((c) => c.fecha.startsWith(hoy.slice(0, 7))).length,
      vets: datos.usuarios.filter((u) => u.rol === 'vet' && u.estado === 'Activo'),
    }
  }, [datos])

  function aceptar(s: Solicitud) {
    datos.aceptarSolicitud(s.id, vetId ? Number(vetId) : 2)
    toast({
      titulo: 'Solicitud confirmada',
      detalle: `${datos.nombreMascota(s.mascotaId)} quedó agendado para el ${fmtCorto(s.fecha)} a las ${s.hora}.`,
      tipo: 'exito',
    })
  }

  function rechazar(s: Solicitud) {
    datos.rechazarSolicitud(s.id, 'Sin disponibilidad en el horario solicitado')
    toast({
      titulo: 'Solicitud rechazada',
      detalle: 'El propietario puede ver el motivo en su portal.',
      tipo: 'info',
    })
  }

  const agenda = vetId ? citasHoy.filter((c) => c.vetId === Number(vetId)) : citasHoy

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recepción y agenda"
        subtitle="Solicitudes por confirmar, movimiento del día y cobros pendientes"
        action={
          <div className="flex gap-2">
            <Link to="/solicitudes">
              <Button variant="secondary" size="sm">
                <InboxIcon className="h-4 w-4" /> Solicitudes
              </Button>
            </Link>
            <Link to="/caja">
              <Button size="sm">
                <MoneyIcon className="h-4 w-4" /> Ir a caja
              </Button>
            </Link>
          </div>
        }
      />

      <Metricas
        items={[
          {
            icono: <InboxIcon className="h-5 w-5" />,
            etiqueta: 'Solicitudes por confirmar',
            valor: pendientes.length,
            detalle: pendientes.length ? 'Esperan respuesta' : 'Bandeja al día',
            acento: pendientes.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <CalendarIcon className="h-5 w-5" />,
            etiqueta: 'Citas de hoy',
            valor: citasHoy.length,
            detalle: `${citasHoy.filter((c) => c.estado === 'Pendiente').length} sin confirmar`,
            acento: 'bg-sky-100 text-sky-700',
          },
          {
            icono: <MoneyIcon className="h-5 w-5" />,
            etiqueta: 'Por cobrar',
            valor: moneda(porCobrar.reduce((suma, c) => suma + (datos.servicio(c.servicioId)?.precio ?? 0), 0)),
            detalle: `${porCobrar.length} atenciones sin pago`,
            acento: porCobrar.length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <PawIcon className="h-5 w-5" />,
            etiqueta: 'Atenciones del mes',
            valor: pacientesMes,
            detalle: `${datos.mascotas.length} pacientes activos`,
            acento: 'bg-amber-100 text-amber-700',
          },
        ]}
      />

      <Bloque
        titulo="Solicitudes por confirmar"
        descripcion="Los propietarios esperan confirmación de estos horarios"
        accion={
          <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {pendientes.length} en bandeja
          </span>
        }
      >
        {pendientes.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">No hay solicitudes esperando respuesta.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pendientes.map((s) => {
              const m = datos.mascota(s.mascotaId)
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {m?.nombre} · {datos.nombrePropietario(m?.propietarioId)}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {fmtCorto(s.fecha)} a las {s.hora} ({relativo(s.fecha)}) ·{' '}
                      {s.servicioId ? datos.nombreServicio(s.servicioId) : 'Sin servicio'} — {s.motivo}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => rechazar(s)}>
                      Rechazar
                    </Button>
                    <Button size="sm" onClick={() => aceptar(s)}>
                      Confirmar
                    </Button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Bloque>

      <div className="grid gap-6 xl:grid-cols-2">
        <Bloque
          titulo="Agenda del día"
          descripcion="Todas las citas de hoy"
          accion={
            <div className="w-40">
              <Select value={vetId} onChange={(e) => setVetId(e.target.value)}>
                <option value="">Todos los veterinarios</option>
                {vets.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </Select>
            </div>
          }
        >
          {agenda.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">No hay citas para hoy.</p>
          ) : (
            <div className="space-y-1 p-3">
              {agenda.map((c) => (
                <FilaCita
                  key={c.id}
                  cita={c}
                  datos={datos}
                  accion={
                    c.estado === 'Pendiente' ? (
                      <Button size="sm" variant="secondary" onClick={() => datos.cambiarEstadoCita(c.id, 'Confirmada')}>
                        Confirmar
                      </Button>
                    ) : (
                      <Estado estado={c.estado} />
                    )
                  }
                />
              ))}
            </div>
          )}
        </Bloque>

        <Bloque
          titulo="Cobros pendientes"
          descripcion="Atenciones cerradas sin registrar pago"
          accion={
            <Link to="/caja" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Abrir caja
            </Link>
          }
        >
          {porCobrar.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">Todo lo atendido está cobrado.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {porCobrar.map((c) => {
                const servicio = datos.servicio(c.servicioId)
                return (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {datos.nombreMascota(c.mascotaId)}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {fmtCorto(c.fecha)} · {servicio?.concepto ?? 'Servicio'} · {datos.nombreVet(c.vetId)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-slate-800">
                      {servicio ? moneda(servicio.precio) : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Bloque>
      </div>

      <Bloque titulo="Cobros del mes" descripcion="Métodos de pago registrados">
        {datos.pagos.filter((p) => p.fecha.startsWith(hoy.slice(0, 7))).length === 0 ? (
          <p className="px-5 pb-5 text-sm text-slate-500">Aún no hay cobros este mes.</p>
        ) : (
          <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
            {[...new Set(datos.pagos.map((p) => p.metodo))].map((metodo) => {
              const lista = datos.pagos.filter((p) => p.metodo === metodo)
              return (
                <div key={metodo} className="bg-white px-5 py-4">
                  <p className="text-xs font-medium text-slate-400">{metodo}</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {moneda(lista.reduce((s, p) => s + Number(p.monto), 0))}
                  </p>
                  <p className="text-xs text-slate-400">{lista.length} transacciones</p>
                </div>
              )
            })}
          </div>
        )}
      </Bloque>
    </div>
  )
}
