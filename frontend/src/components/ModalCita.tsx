import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useDatos } from '../data/store'
import { hoy, moneda } from '../data/fechas'
import { estados_cita } from '../data/estados'
import { Aviso, Badge, Button, FilaCampos, Input, Modal, Select, Textarea } from './ui'
import { PetImage } from './PetAvatar'
import type { Cita, EstadoCita, NuevaCita } from '../data/types'

/** Horarios disponibles de la agenda. Los comparte el modal de solicitud. */
export const horas = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:45',
  '12:30', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00',
]

const estados = Object.keys(estados_cita) as EstadoCita[]

export type EventoCampo = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>

interface FormCita {
  fecha: string
  hora: string
  estado: string
  servicioId: string
  mascotaId: string
  vetId: string
  motivo: string
}

type InicialCita = Partial<Record<keyof FormCita, string | number>>

function aTexto(entrada: InicialCita | undefined): Partial<FormCita> {
  if (!entrada) return {}
  return Object.fromEntries(Object.entries(entrada).map(([k, v]) => [k, String(v)])) as Partial<FormCita>
}

export function ModalCita({
  abierto,
  alCerrar,
  cita,
  inicial,
  onGuardar,
}: {
  abierto: boolean
  alCerrar: () => void
  cita?: Cita | null
  inicial?: InicialCita
  onGuardar: (cita: NuevaCita) => void
}) {
  const datos = useDatos()
  const edicion = cita?.id != null
  const [v, setV] = useState<FormCita>({
    fecha: hoy,
    hora: '09:00',
    estado: 'Pendiente',
    servicioId: String(datos.tarifario[0]?.id ?? ''),
    mascotaId: String(datos.mascotas[0]?.id ?? ''),
    vetId: '2',
    motivo: '',
  })
  const [tocado, setTocado] = useState(false)

  const apertura = abierto ? (cita?.id ?? 'nueva') : null
  const [cargado, setCargado] = useState<number | 'nueva' | null>(null)
  if (apertura !== cargado) {
    setCargado(apertura)
    if (apertura !== null) {
      setTocado(false)
      setV(
        cita?.id != null
          ? {
              fecha: cita.fecha,
              hora: cita.hora,
              estado: cita.estado,
              servicioId: String(cita.servicioId),
              mascotaId: String(cita.mascotaId),
              vetId: String(cita.vetId),
              motivo: cita.motivo,
            }
          : {
              fecha: hoy,
              hora: '09:00',
              estado: 'Pendiente',
              servicioId: String(datos.tarifario.find((s) => s.activo)?.id ?? datos.tarifario[0]?.id ?? ''),
              mascotaId: String(datos.mascotas[0]?.id ?? ''),
              vetId: '2',
              motivo: '',
              ...aTexto(inicial),
            },
      )
    }
  }

  const cambiar =
    (campo: keyof FormCita) =>
    (e: EventoCampo) =>
      setV((x) => ({ ...x, [campo]: e.target.value }))

  const servicio = datos.servicio(Number(v.servicioId))
  const mascota = datos.mascota(Number(v.mascotaId))

  const choque = useMemo(() => {
    if (!v.fecha || !v.hora) return null
    return (
      datos.citas.find(
        (c) =>
          c.id !== cita?.id &&
          c.fecha === v.fecha &&
          c.hora === v.hora &&
          c.vetId === Number(v.vetId) &&
          c.estado !== 'Cancelada',
      ) ?? null
    )
  }, [v.fecha, v.hora, v.vetId, datos.citas, cita])

  const errores: Record<string, string> = {}
  if (!v.mascotaId) errores.mascotaId = 'Seleccione una mascota.'
  if (!v.motivo.trim()) errores.motivo = 'Indique el motivo de la cita.'
  if (choque) errores.hora = 'Ese horario ya está ocupado para este veterinario.'

  function enviar() {
    setTocado(true)
    if (Object.keys(errores).length) return
    onGuardar({
      fecha: v.fecha,
      hora: v.hora,
      estado: v.estado as EstadoCita,
      mascotaId: Number(v.mascotaId),
      servicioId: Number(v.servicioId),
      vetId: Number(v.vetId),
      motivo: v.motivo.trim(),
    })
    alCerrar()
  }

  const veterinarios = datos.usuarios.filter((u) => u.rol === 'vet' && u.estado === 'Activo')

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      ancho="max-w-2xl"
      titulo={edicion ? 'Editar cita' : 'Agendar nueva cita'}
      descripcion={
        edicion
          ? `Cita de ${datos.nombreMascota(cita.mascotaId)}`
          : 'La cita se registra directamente en el calendario.'
      }
      pie={
        <>
          <Button variant="secondary" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button onClick={enviar}>{edicion ? 'Guardar cambios' : 'Agendar cita'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FilaCampos columnas={2}>
          <Select
            label="Mascota"
            value={v.mascotaId}
            onChange={cambiar('mascotaId')}
            error={tocado ? errores.mascotaId : undefined}
          >
            {datos.mascotas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} — {datos.nombrePropietario(m.propietarioId)}
              </option>
            ))}
          </Select>
          <Select
            label="Servicio"
            value={v.servicioId}
            onChange={cambiar('servicioId')}
            ayuda={servicio ? `${servicio.duracion} min · ${moneda(servicio.precio)}` : undefined}
          >
            {datos.tarifario
              .filter((s) => s.activo)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.concepto} — {moneda(s.precio)}
                </option>
              ))}
          </Select>
          <Input
            label="Fecha"
            type="date"
            value={v.fecha}
            onChange={cambiar('fecha')}
            min={hoy}
            error={tocado ? errores.hora : undefined}
          />
          <Select label="Hora" value={v.hora} onChange={cambiar('hora')} error={tocado ? errores.hora : undefined}>
            {horas.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </Select>
          <Select label="Veterinario" value={v.vetId} onChange={cambiar('vetId')}>
            {veterinarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
          {edicion && (
            <Select label="Estado" value={v.estado} onChange={cambiar('estado')}>
              {estados.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </Select>
          )}
        </FilaCampos>

        <Textarea
          label="Motivo de la consulta"
          requerido
          rows={2}
          value={v.motivo}
          onChange={cambiar('motivo')}
          error={tocado ? errores.motivo : undefined}
          placeholder="Ej. Control de vacuna antirrábica y peso"
        />

        {choque && (
          <Aviso tono="aviso" titulo="Horario ocupado">
            {datos.nombreVet(choque.vetId)} ya tiene una cita con {datos.nombreMascota(choque.mascotaId)} a esa hora.
            Elija otro horario o cambie de veterinario.
          </Aviso>
        )}

        {mascota && servicio && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <span className="flex items-center gap-3">
              <PetImage
                especie={mascota.especie}
                sexo={mascota.sexo}
                nombre={mascota.nombre}
                foto={mascota.foto}
                className="h-10 w-10 text-xs"
                anillo={false}
              />
              <span className="text-sm text-slate-600">
                {datos.nombrePropietario(mascota.propietarioId)} · {servicio.concepto}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Badge className={estados_cita[v.estado]}>{v.estado}</Badge>
              <span className="text-sm font-bold text-slate-800">{moneda(servicio.precio)}</span>
            </span>
          </div>
        )}
      </div>
    </Modal>
  )
}
