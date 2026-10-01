import { useMemo, useState } from 'react'
import { useDatos } from '../data/store'
import { useToast } from '../components/Toast'
import { estados_solicitud } from '../data/estados'
import { fmtCorto, relativo } from '../data/fechas'
import { useDebounce } from '../hooks'
import { Badge, BotonIcono, Button, Card, EstadoVacio, Modal, PageHeader, Select, Textarea } from '../components/ui'
import { CheckIcon, CloseIcon, InboxIcon, SearchIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import type { EstadoSolicitud, Solicitud } from '../data/types'

type Filtro = 'todas' | EstadoSolicitud

const filtros: { clave: Filtro; label: string }[] = [
  { clave: 'Pendiente', label: 'Por confirmar' },
  { clave: 'Aceptada', label: 'Confirmadas' },
  { clave: 'Rechazada', label: 'Rechazadas' },
  { clave: 'todas', label: 'Todas' },
]

export default function Solicitudes() {
  const datos = useDatos()
  const { toast } = useToast()
  const [filtro, setFiltro] = useState<Filtro>('Pendiente')
  const [texto, setTexto] = useState('')
  const [vetId, setVetId] = useState('')
  const [rechazando, setRechazando] = useState<Solicitud | null>(null)
  const [motivo, setMotivo] = useState('')
  const consulta = useDebounce(texto, 200)

  const veterinarios = datos.usuarios.filter((u) => u.rol === 'vet' && u.estado === 'Activo')

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.solicitudes
      .filter((s) => (filtro === 'todas' ? true : s.estado === filtro))
      .filter((s) => {
        if (!t) return true
        const m = datos.mascota(s.mascotaId)
        const p = datos.propietario(s.propietarioId)
        return [m?.nombre, p?.nombre, s.motivo]
          .filter((x): x is string => Boolean(x))
          .some((x) => x.toLowerCase().includes(t))
      })
      .sort((a, b) =>
        filtro === 'Pendiente'
          ? (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
          : b.creada.localeCompare(a.creada),
      )
  }, [datos, filtro, consulta])

  const conteo = useMemo(
    () => ({
      Pendiente: datos.solicitudes.filter((s) => s.estado === 'Pendiente').length,
      Aceptada: datos.solicitudes.filter((s) => s.estado === 'Aceptada').length,
      Rechazada: datos.solicitudes.filter((s) => s.estado === 'Rechazada').length,
    }),
    [datos.solicitudes],
  )

  const vetElegido = Number(vetId) || veterinarios[0]?.id

  function aceptar(s: Solicitud, vet: number | undefined) {
    if (!vet) return
    datos.aceptarSolicitud(s.id, vet)
    toast({
      titulo: 'Cita confirmada',
      detalle: `${datos.nombreMascota(s.mascotaId)} quedó agendado el ${fmtCorto(s.fecha)} a las ${s.hora}.`,
      tipo: 'exito',
    })
  }

  function confirmarRechazo() {
    if (!rechazando || !motivo.trim()) return
    datos.rechazarSolicitud(rechazando.id, motivo.trim())
    toast({
      titulo: 'Solicitud rechazada',
      detalle: 'El propietario ya puede leer el motivo en su portal.',
      tipo: 'info',
    })
    setRechazando(null)
    setMotivo('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes de cita"
        action={
          <span className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700">
            {conteo.Pendiente} por confirmar
          </span>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {filtros.map((f) => (
            <button
              key={f.clave}
              type="button"
              onClick={() => setFiltro(f.clave)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filtro === f.clave ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
              {f.clave !== 'todas' && conteo[f.clave] ? (
                <span className="ml-1.5 opacity-70">{conteo[f.clave]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por mascota o motivo…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<InboxIcon className="h-6 w-6" />}
          titulo="No hay solicitudes en esta vista"
          detalle="Cambie el filtro o espere a que un propietario solicite una cita desde su portal."
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {lista.map((s) => {
            const m = datos.mascota(s.mascotaId)
            const p = datos.propietario(s.propietarioId)
            const servicio = datos.servicio(s.servicioId)
            const esPendiente = s.estado === 'Pendiente'
            return (
              <li key={s.id}>
                <Card className="flex h-full flex-col p-4">
                  <div className="flex items-start gap-3">
                    <PetImage especie={m?.especie} sexo={m?.sexo} nombre={m?.nombre} foto={m?.foto} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{m?.nombre ?? 'Mascota'}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p?.nombre} · {m?.especie}
                        {m?.raza ? ` · ${m.raza}` : ''}
                      </p>
                    </div>
                    <Badge className={estados_solicitud[s.estado]}>{s.estado}</Badge>
                  </div>

                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-600">
                    {s.motivo}
                  </p>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-slate-400">Fecha pedida</dt>
                      <dd className="mt-0.5 font-semibold text-slate-700">
                        {fmtCorto(s.fecha)} <span className="font-normal text-slate-400">({relativo(s.fecha)})</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Hora</dt>
                      <dd className="mt-0.5 font-semibold text-slate-700">{s.hora}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Servicio</dt>
                      <dd className="mt-0.5 truncate font-semibold text-slate-700">{servicio?.concepto ?? 'A definir'}</dd>
                    </div>
                  </dl>

                  {s.estado === 'Rechazada' && s.motivoRechazo && (
                    <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <span className="font-semibold">Motivo del rechazo:</span> {s.motivoRechazo}
                    </p>
                  )}

                  {esPendiente && (
                    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                      <div className="w-44">
                        <Select value={vetId} onChange={(e) => setVetId(e.target.value)}>
                          {veterinarios.length === 0 && <option value="">Sin veterinarios activos</option>}
                          {veterinarios.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nombre}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <BotonIcono
                        label="Rechazar"
                        onClick={() => {
                          setRechazando(s)
                          setMotivo('')
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </BotonIcono>
                      <Button
                        size="sm"
                        className="ml-auto"
                        disabled={!vetElegido}
                        onClick={() => aceptar(s, vetElegido)}
                      >
                        <CheckIcon className="h-4 w-4" /> Confirmar cita
                      </Button>
                    </div>
                  )}

                  {s.estado === 'Aceptada' && s.resuelta && (
                    <p className="mt-3 text-xs text-slate-400">
                      Confirmada el {fmtCorto(s.resuelta)} · cita #{s.citaId ?? '—'}
                    </p>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        abierto={Boolean(rechazando)}
        alCerrar={() => {
          setRechazando(null)
          setMotivo('')
        }}
        titulo="Rechazar solicitud"
        descripcion="El propietario verá este motivo en su portal."
        pie={
          <>
            <Button variant="secondary" onClick={() => setRechazando(null)}>
              Volver
            </Button>
            <Button variant="peligro" onClick={confirmarRechazo} disabled={!motivo.trim()}>
              Rechazar
            </Button>
          </>
        }
      >
        <Textarea
          label="Motivo del rechazo"
          requerido
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej. Ese horario ya está completo; le proponemos el jueves a las 10:00."
        />
      </Modal>
    </div>
  )
}
