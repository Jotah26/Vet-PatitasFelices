import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDatos } from '../data/store'
import { estados_consulta, estados_receta } from '../data/estados'
import { fmtCorto, relativo } from '../data/fechas'
import { abrirImagen, imprimir } from '../utils/descarga'
import { hojaConsulta } from '../utils/impresion'
import { Badge, Button, Modal } from './ui'
import { PetImage } from './PetAvatar'
import { CalendarIcon, ImageIcon, PrescriptionIcon, PrintIcon, StethoscopeIcon, SyringeIcon } from './icons'
import type { Consulta } from '../data/types'

function Seccion({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        <span className="text-slate-300">{icono}</span>
        {titulo}
      </p>
      {children}
    </section>
  )
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>
}

/** Ficha completa de una consulta del historial, con los datos que el store
 *  relaciona con ella: receta emitida, vacunas de esa fecha, adjuntos y la
 *  próxima cita agendada. */
export function ModalConsulta({ consulta, alCerrar }: { consulta: Consulta | null; alCerrar: () => void }) {
  const datos = useDatos()
  const navegar = useNavigate()

  const receta = useMemo(
    () => (consulta ? datos.recetas.find((r) => r.consultaId === consulta.id) : undefined),
    [datos, consulta],
  )

  const vacunas = useMemo(
    () => (consulta ? datos.vacunasDe(consulta.mascotaId).filter((v) => v.fecha === consulta.fecha) : []),
    [datos, consulta],
  )

  const proximaCita = useMemo(() => {
    if (!consulta) return undefined
    return datos
      .citasDe(consulta.mascotaId)
      .filter((c) => c.fecha > consulta.fecha && c.estado !== 'Cancelada')
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))[0]
  }, [datos, consulta])

  if (!consulta) return null

  const mascota = datos.mascota(consulta.mascotaId)
  const duenio = datos.duenioDe(consulta.mascotaId)

  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo="Detalle de atención"
      descripcion={`${fmtCorto(consulta.fecha)} · ${consulta.tipo} · ${datos.nombreVet(consulta.vetId)}`}
      ancho="max-w-2xl"
      pie={
        <>
          {mascota && (
            <Button variant="ghost" onClick={() => navegar(`/mascotas/${mascota.id}`)}>
              Ficha del paciente
            </Button>
          )}
          <Button variant="secondary" onClick={() => imprimir(hojaConsulta(datos, consulta))}>
            <PrintIcon className="h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={alCerrar}>Cerrar</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
          <PetImage
            especie={mascota?.especie}
            sexo={mascota?.sexo}
            nombre={mascota?.nombre}
            foto={mascota?.foto}
            className="h-12 w-12"
            anillo={false}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">
              {mascota?.nombre ?? 'Paciente no registrado'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {mascota
                ? `${mascota.especie} · ${mascota.raza || 'sin raza'} · ${mascota.sexo} · ${mascota.peso || 'peso s/d'}`
                : '—'}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Propietario</p>
            <p className="truncate text-xs font-medium text-slate-600">{duenio?.nombre ?? '—'}</p>
          </div>
          <Badge className={estados_consulta[consulta.estado]}>{consulta.estado}</Badge>
        </div>

        <Seccion icono={<StethoscopeIcon className="h-3.5 w-3.5" />} titulo="Diagnóstico">
          <p className="rounded-xl bg-white p-3 text-sm leading-relaxed font-semibold text-slate-900">
            {consulta.diagnostico || 'Sin diagnóstico registrado'}
          </p>
        </Seccion>

        <Seccion icono={<StethoscopeIcon className="h-3.5 w-3.5" />} titulo="Tratamiento">
          {consulta.tratamiento ? (
            <p className="rounded-xl bg-white p-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {consulta.tratamiento}
            </p>
          ) : (
            <Vacio>Sin tratamiento registrado</Vacio>
          )}
        </Seccion>

        <Seccion icono={<StethoscopeIcon className="h-3.5 w-3.5" />} titulo="Recomendaciones al propietario">
          {consulta.recomendaciones ? (
            <p className="rounded-xl bg-white p-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {consulta.recomendaciones}
            </p>
          ) : (
            <Vacio>Sin recomendaciones registradas</Vacio>
          )}
        </Seccion>

        <Seccion icono={<PrescriptionIcon className="h-3.5 w-3.5" />} titulo="Receta emitida">
          {receta ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ul className="divide-y divide-slate-100">
                {receta.items.map((item) => (
                  <li key={item.medicamento} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5">
                    <span className="text-sm font-semibold text-slate-800">{item.medicamento}</span>
                    <span className="text-xs text-slate-500">{item.dosis}</span>
                    <span className="ml-auto text-xs font-medium text-slate-400">{item.dias} días</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{fmtCorto(receta.fecha)}</p>
                <Badge className={estados_receta[receta.estado]}>{receta.estado}</Badge>
              </div>
            </div>
          ) : (
            <Vacio>No se emitió receta en esta atención</Vacio>
          )}
        </Seccion>

        <Seccion icono={<SyringeIcon className="h-3.5 w-3.5" />} titulo="Vacunas aplicadas">
          {vacunas.length ? (
            <ul className="flex flex-wrap gap-2">
              {vacunas.map((v) => (
                <li
                  key={v.id}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800"
                >
                  <span className="font-semibold">{v.nombre}</span>
                  <span className="ml-2 opacity-80">próxima: {fmtCorto(v.proxima)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio>No se registraron vacunas en esta fecha</Vacio>
          )}
        </Seccion>

        <Seccion icono={<ImageIcon className="h-3.5 w-3.5" />} titulo="Adjuntos">
          {consulta.archivos.length ? (
            <ul className="flex flex-wrap gap-2">
              {consulta.archivos.map((nombre, i) => {
                const archivo = datos.archivos.find((a) => a.id === consulta.archivoIds?.[i])
                return (
                  <li key={`${nombre}-${i}`}>
                    <button
                      type="button"
                      onClick={() => archivo?.dataUrl && abrirImagen(archivo.dataUrl, nombre)}
                      disabled={!archivo?.dataUrl}
                      title={archivo?.dataUrl ? 'Abrir adjunto' : 'Archivo no disponible en esta demo'}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {nombre}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Vacio>La consulta no tiene archivos</Vacio>
          )}
        </Seccion>

        <Seccion icono={<CalendarIcon className="h-3.5 w-3.5" />} titulo="Próximo control">
          {proximaCita ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3">
              <span className="text-sm font-semibold text-slate-800">
                {fmtCorto(proximaCita.fecha)} · {proximaCita.hora}
              </span>
              <span className="text-xs text-slate-500">{datos.nombreServicio(proximaCita.servicioId)}</span>
              <Badge className="ml-auto bg-slate-100 text-slate-500">{relativo(proximaCita.fecha)}</Badge>
            </div>
          ) : (
            <Vacio>No hay ninguna cita posterior agendada</Vacio>
          )}
        </Seccion>
      </div>
    </Modal>
  )
}