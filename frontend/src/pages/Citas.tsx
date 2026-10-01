import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useDatos } from '../data/store'
import { useToast } from '../components/Toast'
import { aISO, diaDeSemana, fmtCorto, hoy, moneda, nombreMes, partes, sumarDias } from '../data/fechas'
import { estados_cita } from '../data/estados'
import { useDebounce } from '../hooks'
import { Badge, BotonIcono, Button, Card, EstadoVacio, PageHeader, Select } from '../components/ui'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from '../components/icons'
import type { IconProps } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import { ModalCita } from '../components/ModalCita'
import type { Cita, EstadoCita, NuevaCita } from '../data/types'

const dias_semana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

type FiltroEstado = 'Todas' | EstadoCita
const estados: FiltroEstado[] = ['Todas', ...(Object.keys(estados_cita) as EstadoCita[])]

type Vista = 'agenda' | 'calendario'
const vistas: { clave: Vista; label: string; icon: (p: IconProps) => ReactNode }[] = [
  { clave: 'agenda', label: 'Lista', icon: CalendarIcon },
  { clave: 'calendario', label: 'Calendario', icon: CalendarIcon },
]

type Rango = 'hoy' | 'semana' | 'mes' | 'todo'
const rangos: { clave: Rango; label: string }[] = [
  { clave: 'hoy', label: 'Hoy' },
  { clave: 'semana', label: 'Semana' },
  { clave: 'mes', label: 'Mes' },
  { clave: 'todo', label: 'Todas' },
]

export default function Citas() {
  const datos = useDatos()
  const { user } = useAuth()
  const { toast } = useToast()

  const [vista, setVista] = useState<Vista>('agenda')
  const [mes, setMes] = useState(() => {
    const p = partes(hoy)
    return { anio: p.anio, mes: p.mes }
  })
  const [estado, setEstado] = useState<FiltroEstado>('Todas')
  const [vetId, setVetId] = useState('')
  const [rango, setRango] = useState<Rango>('todo')
  const [texto, setTexto] = useState('')
  const [modal, setModal] = useState<Partial<Cita> | null>(null)
  const consulta = useDebounce(texto, 200)

  const veterinarios = datos.usuarios.filter((u) => u.rol === 'vet' && u.estado === 'Activo')
  const puedeGestionarAgenda = user?.rol === 'admin' || user?.rol === 'recepcionista' || user?.rol === 'asistente'
  const puedeLlamarASala = user?.rol === 'asistente' || puedeGestionarAgenda

  const rangoFechas = useMemo(() => {
    if (rango === 'hoy') return { desde: hoy, hasta: hoy }
    if (rango === 'semana') return { desde: sumarDias(hoy, -3), hasta: sumarDias(hoy, 3) }
    if (rango === 'mes') return { desde: `${hoy.slice(0, 7)}-01`, hasta: `${hoy.slice(0, 7)}-31` }
    return { desde: '0000-01-01', hasta: '9999-12-31' }
  }, [rango])

  const filtradas = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.citas
      .filter((c) => user?.rol !== 'vet' || c.vetId === user.id)
      .filter((c) => c.fecha >= rangoFechas.desde && c.fecha <= rangoFechas.hasta)
      .filter((c) => (estado === 'Todas' ? true : c.estado === estado))
      .filter((c) => (vetId ? c.vetId === Number(vetId) : true))
      .filter((c) => (t ? `${c.motivo} ${datos.nombreMascota(c.mascotaId)}`.toLowerCase().includes(t) : true))
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
  }, [datos, rangoFechas, estado, vetId, consulta])

  const porDia = useMemo(() => {
    const mapa = new Map<string, Cita[]>()
    filtradas.forEach((c) => {
      const lista = mapa.get(c.fecha)
      if (lista) lista.push(c)
      else mapa.set(c.fecha, [c])
    })
    return mapa
  }, [filtradas])

  /* Rejilla del mes: la semana empieza en lunes */
  const celdas = useMemo(() => {
    const primero = aISO(mes.anio, mes.mes, 1)
    const dow = diaDeSemana(mes.anio, mes.mes, 1)
    const desplazamiento = (dow + 6) % 7
    const inicio = sumarDias(primero, -desplazamiento)
    return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i))
  }, [mes])

  function moverMes(delta: number) {
    setMes((m) => {
      let nuevo = m.mes + delta
      let anio = m.anio
      if (nuevo < 1) {
        nuevo = 12
        anio -= 1
      }
      if (nuevo > 12) {
        nuevo = 1
        anio += 1
      }
      return { anio, mes: nuevo }
    })
  }

  function guardar(v: NuevaCita) {
    const id = modal?.id
    if (id == null) {
      datos.crearCita({ ...v, estado: 'Confirmada' })
      toast({
        titulo: 'Cita agendada',
        detalle: `${datos.nombreMascota(v.mascotaId)} · ${fmtCorto(v.fecha)} ${v.hora}`,
        tipo: 'exito',
      })
    } else {
      datos.actualizarCita(id, v)
      toast({ titulo: 'Cita actualizada', tipo: 'exito' })
    }
  }

  function cambiarEstado(cita: Cita, nuevo: EstadoCita) {
    datos.cambiarEstadoCita(cita.id, nuevo)
    toast({
      titulo: `Cita ${nuevo.toLowerCase()}`,
      detalle: datos.nombreMascota(cita.mascotaId),
      tipo: 'info',
    })
  }

  const facturado = filtradas
    .filter((c) => c.estado === 'Atendida')
    .reduce((s, c) => s + (datos.servicio(c.servicioId)?.precio ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de citas"
        subtitle="Calendario y lista de atenciones programadas"
        action={puedeGestionarAgenda ? (
          <Button onClick={() => setModal({})}>
            <PlusIcon className="h-4 w-4" /> Nueva cita
          </Button>
        ) : null}
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {vistas.map((v) => (
            <button
              key={v.clave}
              type="button"
              onClick={() => setVista(v.clave)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                vista === v.clave ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <v.icon className="h-4 w-4" /> {v.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {rangos.map((r) => (
            <button
              key={r.clave}
              type="button"
              onClick={() => setRango(r.clave)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                rango === r.clave ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="w-35">
          <Select value={estado} onChange={(e) => setEstado(e.target.value as FiltroEstado)}>
            {estados.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </Select>
        </div>
        {user?.rol !== 'vet' && <div className="w-48">
          <Select value={vetId} onChange={(e) => setVetId(e.target.value)}>
            <option value="">Todos los veterinarios</option>
            {veterinarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
        </div>}
        <div className="relative ml-auto w-full sm:w-56">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar paciente o motivo…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{filtradas.length}</span> citas en el filtro · facturado{' '}
        <span className="font-semibold text-emerald-600">{moneda(facturado)}</span>
      </p>

      {vista === 'calendario' ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-bold text-slate-900 capitalize">
              {nombreMes(mes.mes)} {mes.anio}
            </h2>
            <div className="flex items-center gap-1.5">
              <BotonIcono label="Mes anterior" onClick={() => moverMes(-1)}>
                <ChevronLeftIcon className="h-4 w-4" />
              </BotonIcono>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const p = partes(hoy)
                  setMes({ anio: p.anio, mes: p.mes })
                }}
              >
                Hoy
              </Button>
              <BotonIcono label="Mes siguiente" onClick={() => moverMes(1)}>
                <ChevronRightIcon className="h-4 w-4" />
              </BotonIcono>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {dias_semana.map((x) => (
              <div
                key={x}
                className="px-2 py-2 text-center text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
              >
                {x}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {celdas.map((fecha) => {
              const delMes = partes(fecha).mes === mes.mes
              const items = porDia.get(fecha) ?? []
              return (
                <div
                  key={fecha}
                  className={`min-h-24 border-r border-b border-slate-100 p-1.5 ${
                    fecha === hoy ? 'bg-primary-50/60' : delMes ? '' : 'bg-slate-50/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => puedeGestionarAgenda && setModal({ fecha, hora: '09:00' })}
                    disabled={!puedeGestionarAgenda}
                    className={`mb-1 block w-full rounded px-1.5 py-0.5 text-left text-[11px] font-semibold ${
                      fecha === hoy
                        ? 'bg-primary-600 text-white'
                        : delMes
                          ? 'text-slate-600 hover:bg-slate-100'
                          : 'text-slate-300'
                    }`}
                  >
                    {partes(fecha).dia}
                  </button>
                  <ul className="space-y-0.5">
                    {items.slice(0, 3).map((c) => {
                      const m = datos.mascota(c.mascotaId)
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => puedeGestionarAgenda && setModal(c)}
                            title={`${c.hora} ${m?.nombre} — ${c.motivo}`}
                            className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium ${
                              estados_cita[c.estado]
                            } ${c.estado === 'Cancelada' ? 'opacity-60 line-through' : ''}`}
                          >
                            {c.hora} {m?.nombre}
                          </button>
                        </li>
                      )
                    })}
                    {items.length > 3 && (
                      <li className="px-1.5 text-[10px] font-semibold text-slate-400">+{items.length - 3}</li>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        </Card>
      ) : filtradas.length === 0 ? (
        <EstadoVacio
          icono={<CalendarIcon className="h-6 w-6" />}
          titulo="Sin citas en este filtro"
          detalle="Ajuste el rango, el estado o registre una nueva cita."
          accion={puedeGestionarAgenda ? (
            <Button size="sm" onClick={() => setModal({})}>
              <PlusIcon className="h-4 w-4" /> Nueva cita
            </Button>
          ) : undefined}
        />
      ) : (
        <ul className="space-y-4">
          {[...porDia.entries()].map(([fecha, items]) => (
            <li key={fecha}>
              <Card className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
                  <span className={`text-sm font-bold ${fecha === hoy ? 'text-primary-700' : 'text-slate-700'}`}>
                    {fmtCorto(fecha)}
                  </span>
                  {fecha === hoy && <Badge className="bg-primary-100 text-primary-700">Hoy</Badge>}
                  <span className="ml-auto text-xs text-slate-400">
                    {items.length} {items.length === 1 ? 'cita' : 'citas'} ·{' '}
                    {moneda(items.reduce((s, c) => s + (datos.servicio(c.servicioId)?.precio ?? 0), 0))}
                  </span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {items.map((c) => {
                    const m = datos.mascota(c.mascotaId)
                    const s = datos.servicio(c.servicioId)
                    const pago = datos.pagoDe(c.id)
                    const esMia = user != null && c.vetId === user.id
                    return (
                      <li
                        key={c.id}
                        className={`flex flex-wrap items-center gap-3 px-5 py-3 ${esMia ? 'bg-primary-50/30' : ''}`}
                      >
                        <span className="w-14 shrink-0 text-sm font-bold text-slate-700">{c.hora}</span>
                        <PetImage
                          especie={m?.especie}
                          sexo={m?.sexo}
                          nombre={m?.nombre}
                          foto={m?.foto}
                          className="h-10 w-10 text-xs"
                          anillo={false}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {m?.nombre}{' '}
                            <span className="font-normal text-slate-400">
                              · {datos.nombrePropietario(m?.propietarioId)}
                            </span>
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {s?.concepto} · {datos.nombreVet(c.vetId)} · {c.motivo}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-slate-700">
                          {s ? moneda(s.precio) : '—'}
                        </span>
                        <Badge className={estados_cita[c.estado]}>{c.estado}</Badge>
                        {c.estado === 'Atendida' && (
                          <Badge className={pago ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                            {pago ? 'Pagado' : 'Sin cobrar'}
                          </Badge>
                        )}
                        <span className="ml-auto flex shrink-0 items-center gap-1">
                          {puedeGestionarAgenda && c.estado === 'Pendiente' && (
                            <Button size="sm" variant="secondary" onClick={() => cambiarEstado(c, 'Confirmada')}>
                              Confirmar
                            </Button>
                          )}
                          {puedeLlamarASala && c.estado === 'Confirmada' && (
                            <Button size="sm" variant="secondary" onClick={() => cambiarEstado(c, 'En sala')}>
                              A sala
                            </Button>
                          )}
                          {puedeGestionarAgenda && <BotonIcono label="Editar" onClick={() => setModal(c)}>
                            <PencilIcon className="h-4 w-4" />
                          </BotonIcono>}
                          {puedeGestionarAgenda && c.estado !== 'Atendida' && (
                            <BotonIcono
                              label="Cancelar cita"
                              className="hover:text-rose-600"
                              onClick={() => cambiarEstado(c, 'Cancelada')}
                            >
                              <CloseIcon className="h-4 w-4" />
                            </BotonIcono>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        {puedeGestionarAgenda ? 'Use la vista de calendario para agendar con un clic sobre el día.' : 'Consulta de agenda asignada.'}
      </p>

      {puedeGestionarAgenda && <ModalCita
        abierto={Boolean(modal)}
        cita={modal?.id != null ? (modal as Cita) : null}
        inicial={modal?.id != null ? undefined : (modal ?? undefined)}
        alCerrar={() => setModal(null)}
        onGuardar={guardar}
      />}
    </div>
  )
}
