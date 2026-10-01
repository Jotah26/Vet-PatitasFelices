import { useState } from 'react'
import { useDatos } from '../data/store'
import { useAuth } from '../auth/AuthContext'
import { useToast } from './Toast'
import { d, hoy, moneda } from '../data/fechas'
import { Aviso, Button, FilaCampos, Input, Modal, Select, Textarea } from './ui'
import { horas } from './ModalCita'
import type { EventoCampo } from './ModalCita'
import type { NuevaSolicitud } from '../data/types'

/** Solicitud de cita que el dueño envía desde el portal. */
export function ModalSolicitud({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const datos = useDatos()
  const { user } = useAuth()
  const { toast } = useToast()
  const [v, setV] = useState({
    mascotaId: '',
    fecha: d(1),
    hora: '10:00',
    servicioId: '',
    motivo: '',
  })
  const [tocado, setTocado] = useState(false)

  const [abiertoAnterior, setAbiertoAnterior] = useState(abierto)
  if (abiertoAnterior !== abierto) {
    setAbiertoAnterior(abierto)
    if (abierto) {
      setTocado(false)
      setV({ mascotaId: '', fecha: d(1), hora: '10:00', servicioId: '', motivo: '' })
    }
  }

  const cambiar =
    (campo: 'mascotaId' | 'servicioId' | 'fecha' | 'hora' | 'motivo') =>
    (e: EventoCampo) =>
      setV((x) => ({ ...x, [campo]: e.target.value }))

  const mascotas = user?.propietarioId ? datos.mascotasDe(user.propietarioId) : []

  const errores: Record<string, string> = {}
  if (!v.mascotaId) errores.mascotaId = 'Elija la mascota.'
  if (v.motivo.trim().length < 8) errores.motivo = 'Cuéntenos brevemente qué necesita (mínimo 8 caracteres).'
  if (v.fecha < hoy) errores.fecha = 'La fecha no puede ser pasada.'

  function enviar() {
    setTocado(true)
    if (Object.keys(errores).length) return
    const payload: NuevaSolicitud = {
      propietarioId: user?.propietarioId ?? 0,
      mascotaId: Number(v.mascotaId),
      servicioId: v.servicioId ? Number(v.servicioId) : null,
      fecha: v.fecha,
      hora: v.hora,
      motivo: v.motivo.trim(),
    }
    datos.solicitarCita(payload)
    toast({
      titulo: 'Solicitud enviada',
      detalle: 'La recepción la confirmará a la brevedad.',
      tipo: 'exito',
    })
    alCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Solicitar una cita"
      descripcion="La recepción revisa la disponibilidad y le confirma desde este portal."
      pie={
        <>
          <Button variant="secondary" onClick={alCerrar}>
            Cancelar
          </Button>
          <Button onClick={enviar}>Enviar solicitud</Button>
        </>
      }
    >
      <div className="space-y-4">
        {mascotas.length === 0 ? (
          <Aviso tono="aviso" titulo="Sin mascotas registradas">
            Póngase en contacto con la recepción en el (01) 555-0142 para registrar a su mascota antes de agendar.
          </Aviso>
        ) : (
          <>
            <FilaCampos columnas={2}>
              <Select
                label="Mascota"
                value={v.mascotaId}
                onChange={cambiar('mascotaId')}
                error={tocado ? errores.mascotaId : undefined}
              >
                <option value="">Seleccione…</option>
                {mascotas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.especie})
                  </option>
                ))}
              </Select>
              <Select label="Motivo de la visita" value={v.servicioId} onChange={cambiar('servicioId')}>
                <option value="">Seleccione…</option>
                {datos.tarifario
                  .filter((s) => s.activo)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.concepto} — {moneda(s.precio)}
                    </option>
                  ))}
              </Select>
              <Input
                label="Fecha preferida"
                type="date"
                value={v.fecha}
                min={hoy}
                onChange={cambiar('fecha')}
                error={tocado ? errores.fecha : undefined}
              />
              <Select label="Horario preferido" value={v.hora} onChange={cambiar('hora')}>
                {horas.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </Select>
            </FilaCampos>
            <Textarea
              label="Cuéntanos qué necesita"
              requerido
              rows={3}
              value={v.motivo}
              onChange={cambiar('motivo')}
              error={tocado ? errores.motivo : undefined}
              placeholder="Ej. Rocky tiene la piel irritada desde hace unos días."
            />
            <Aviso tono="info">
              La cita queda como <strong>solicitud</strong> hasta que la recepción la confirme. Te avisaremos en este
              portal.
            </Aviso>
          </>
        )}
      </div>
    </Modal>
  )
}
