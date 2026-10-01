import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useDatos } from '../../data/store'
import { estados_vacuna } from '../../data/estados'
import { diffDias, fmtCorto, relativo } from '../../data/fechas'
import { Badge, Button, EstadoVacio, PageHeader } from '../../components/ui'
import { CalendarIcon, PawIcon, StethoscopeIcon, SyringeIcon } from '../../components/icons'
import { Bloque, Estado, FilaCita, Metricas } from '../../components/Tablero'


export default function VistaVeterinario() {
  const datos = useDatos()
  const { user } = useAuth()
  const vetId = user?.id

  const { misCitas, enSala, seguimientos, vacunas, ultimoSeguimiento } = useMemo(() => {
    const hoy = datos.citasDeHoy()
    const sala = hoy.filter((c) => c.estado === 'En sala')

    const consultasSeguimiento = datos.consultas
      .filter((c) => c.estado === 'En seguimiento')
      .sort((a, b) => b.fecha.localeCompare(a.fecha))

    const enFoco = new Set(consultasSeguimiento.map((c) => c.mascotaId))
    const controles = datos.citas
      .filter((c) => enFoco.has(c.mascotaId) && c.estado !== 'Atendida' && c.estado !== 'Cancelada')
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))

    const proximas = datos.vacunas
      .filter((v) => diffDias(v.proxima) <= 45)
      .sort((a, b) => a.proxima.localeCompare(b.proxima))
      .slice(0, 8)

    return {
      misCitas: vetId == null ? [] : hoy.filter((c) => c.vetId === vetId),
      enSala: sala,
      seguimientos: controles,
      vacunas: proximas,
      ultimoSeguimiento: consultasSeguimiento[0] ?? null,
    }
  }, [datos, vetId])

  const porAtender = misCitas.filter((c) => c.estado !== 'Atendida' && c.estado !== 'Cancelada')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi jornada clínica"
        subtitle="Agenda personal, pacientes en sala y controles pendientes"
        action={
          <Link to="/atencion">
            <Button size="sm">
              <StethoscopeIcon className="h-4 w-4" /> Registrar atención
            </Button>
          </Link>
        }
      />

      <Metricas
        items={[
          {
            icono: <CalendarIcon className="h-5 w-5" />,
            etiqueta: 'Mis citas de hoy',
            valor: misCitas.length,
            detalle: `${porAtender.length} por atender`,
            acento: 'bg-sky-100 text-sky-700',
          },
          {
            icono: <StethoscopeIcon className="h-5 w-5" />,
            etiqueta: 'En sala',
            valor: enSala.length,
            detalle: enSala.length ? 'Esperando consulta ahora' : 'Sala despejada',
            acento: enSala.length ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <PawIcon className="h-5 w-5" />,
            etiqueta: 'En seguimiento',
            valor: seguimientos.length,
            detalle: 'Pacientes con control pendiente',
            acento: 'bg-primary-100 text-primary-700',
          },
          {
            icono: <SyringeIcon className="h-5 w-5" />,
            etiqueta: 'Vacunas por aplicar',
            valor: vacunas.length,
            detalle: 'Próximos 45 días',
            acento: 'bg-rose-100 text-rose-700',
          },
        ]}
      />

      {enSala.length > 0 && (
        <Bloque
          titulo="Ahora mismo en sala"
          descripcion="Atenciones en curso, priorice estas"
          className="ring-1 ring-amber-200"
        >
          <div className="space-y-1 p-3">
            {enSala.map((c) => (
              <FilaCita
                key={c.id}
                cita={c}
                datos={datos}
                acento="bg-amber-50"
                accion={
                  <Link to="/atencion" className="shrink-0">
                    <Button size="sm" variant="secondary">
                      Atender
                    </Button>
                  </Link>
                }
              />
            ))}
          </div>
        </Bloque>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Bloque
          titulo="Mi agenda de hoy"
          descripcion={`${user?.nombre ?? ''} · orden por hora`}
          accion={
            <Link to="/citas" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Agenda completa
            </Link>
          }
        >
          {misCitas.length === 0 ? (
            <EstadoVacio
              titulo="Sin citas asignadas hoy"
              detalle="No tiene pacientes agendados para la fecha de hoy."
            />
          ) : (
            <div className="space-y-1 p-3">
              {misCitas.map((c) => (
                <FilaCita key={c.id} cita={c} datos={datos} accion={<Estado estado={c.estado} />} />
              ))}
            </div>
          )}
        </Bloque>

        <Bloque
          titulo="Controles de seguimiento"
          descripcion="Citas de pacientes con un caso abierto"
          accion={
            <Link to="/historial" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Ver historiales
            </Link>
          }
        >
          {seguimientos.length === 0 ? (
            <EstadoVacio titulo="Sin controles abiertos" detalle="Todos los casos están cerrados." />
          ) : (
            <div className="space-y-1 p-3">
              {seguimientos.map((c) => (
                <FilaCita
                  key={c.id}
                  cita={c}
                  datos={datos}
                  mostrarFecha
                  acento="bg-primary-50"
                  accion={<Estado estado={c.estado} />}
                />
              ))}
            </div>
          )}
        </Bloque>
      </div>

      <Bloque
        titulo="Calendario de vacunas"
        descripcion="Aplicaciones próximas o vencidas"
        accion={
          <Link to="/vacunas" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Gestionar vacunas
          </Link>
        }
      >
        {vacunas.length === 0 ? (
          <EstadoVacio titulo="Al día con las vacunas" detalle="No hay dosis pendientes en el corto plazo." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {vacunas.map((v) => {
              const m = datos.mascota(v.mascotaId)
              const estado = estados_vacuna[datos.estadoVacuna(v.proxima)]
              return (
                <li key={`${v.mascotaId}-${v.nombre}-${v.proxima}`}>
                  <Link
                    to={`/mascotas/${v.mascotaId}`}
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {m?.nombre} · {v.nombre}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {m ? `${m.especie}${m.raza ? ` · ${m.raza}` : ''}` : 'Paciente'} · próxima{' '}
                        {fmtCorto(v.proxima)} ({relativo(v.proxima)})
                      </span>
                    </span>
                    <Badge className={estado.color}>{estado.label}</Badge>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Bloque>

      {ultimoSeguimiento && (
        <p className="text-xs text-slate-400">
          Caso abierto más reciente: {datos.nombreMascota(ultimoSeguimiento.mascotaId)} — {ultimoSeguimiento.diagnostico} (
          {fmtCorto(ultimoSeguimiento.fecha)}).
        </p>
      )}
    </div>
  )
}