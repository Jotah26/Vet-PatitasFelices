import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useDatos, dias_vacuna } from '../data/store'
import { useToast } from '../components/Toast'
import { d, diffDias, fmtCorto, hoy, sumarDias } from '../data/fechas'
import { tipos_atencion } from '../data/roles'
import {
  Aviso,
  Badge,
  Button,
  Card,
  CardHeader,
  EstadoVacio,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'
import { FileUpload } from '../components/FileUpload'
import { PetImage } from '../components/PetAvatar'
import { CheckIcon, DownloadIcon, PlusIcon, StethoscopeIcon, SyringeIcon, TrashIcon } from '../components/icons'
import { EditorReceta } from '../components/EditorReceta'
import { ModalConsulta } from '../components/ModalConsulta'
import type { ErroresFormulario } from '../hooks'
import type { Adjunto, Consulta, RecetaEmitida, TipoAtencion, VacunaAplicada } from '../data/types'

export default function AtencionVeterinaria() {
  const datos = useDatos()
  const { user } = useAuth()
  const { toast } = useToast()
  const navegar = useNavigate()

  const enSala = useMemo(() => datos.citasDeHoy().filter((c) => c.estado === 'En sala'), [datos])
  const pendientes = useMemo(
    () => datos.citasDeHoy().filter((c) => ['Pendiente', 'Confirmada'].includes(c.estado)),
    [datos],
  )

  const [consultaAbierta, setConsultaAbierta] = useState<Consulta | null>(null)
  const [mascotaId, setMascotaId] = useState('')
  const [tipo, setTipo] = useState<TipoAtencion>(tipos_atencion[0])
  const [diagnostico, setDiagnostico] = useState('')
  const [tratamiento, setTratamiento] = useState('')
  const [recomendaciones, setRecomendaciones] = useState('')
  const [proximaControl, setProximaControl] = useState(d(30))
  const [conControl, setConControl] = useState(true)
  const [vacunas, setVacunas] = useState<VacunaAplicada[]>([])
  const [receta, setReceta] = useState<RecetaEmitida | null>(null)
  const [archivos, setArchivos] = useState<Adjunto[]>([])
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [guardado, setGuardado] = useState(false)

  const [pacientePrevio, setPacientePrevio] = useState(mascotaId)
  if (pacientePrevio !== mascotaId) {
    setPacientePrevio(mascotaId)
    const cita = datos.citasDeHoy().find((c) => c.mascotaId === Number(mascotaId))
    const s = cita?.servicioId ? datos.servicio(cita.servicioId) : undefined
    setTipo(s?.concepto.includes('Vacun') ? 'Vacunación' : tipos_atencion[0])
  }

  const paciente = datos.mascota(Number(mascotaId))
  const historial = useMemo(() => (paciente ? datos.consultasDe(paciente.id) : []), [datos, paciente])
  const ultimaVacuna = useMemo(
    () => (paciente ? datos.vacunasDe(paciente.id).filter((v) => diffDias(v.proxima) <= 0).slice(-1)[0] : undefined),
    [datos, paciente],
  )

  const nombres_vacuna = Object.keys(dias_vacuna)
  const nombres_vacuna_todas = [...new Set([...nombres_vacuna, ...datos.vacunas.map((v) => v.nombre)])]

  function alternarVacuna(nombre: string) {
    setVacunas((xs) =>
      xs.some((x) => x.nombre === nombre)
        ? xs.filter((x) => x.nombre !== nombre)
        : [...xs, { nombre, lote: `L-${nombre.slice(0, 3).toUpperCase()}-26` }],
    )
  }

  function registrar() {
    const err: ErroresFormulario = {}
    if (!mascotaId) err.mascotaId = 'Seleccione el paciente.'
    if (diagnostico.trim().length < 4) err.diagnostico = 'Describa el diagnóstico.'
    if (!tratamiento.trim() && !receta?.items.length) err.tratamiento = 'Indique el tratamiento o emita una receta.'
    setErrores(err)
    if (Object.keys(err).length) return

    datos.registrarAtencion({
      mascotaId: Number(mascotaId),
      tipo,
      diagnostico: diagnostico.trim(),
      tratamiento: tratamiento.trim() || 'Tratamiento indicado en receta adjunta.',
      recomendaciones: recomendaciones.trim(),
      vacunas,
      receta,
      archivos,
      vetId: user?.id ?? 0,
      proximaControl: conControl ? proximaControl : null,
    })

    setGuardado(true)
    toast({
      titulo: 'Atención registrada',
      detalle: 'Se actualizó el historial, las vacunas y el portal del propietario.',
      tipo: 'exito',
    })

    setDiagnostico('')
    setTratamiento('')
    setRecomendaciones('')
    setVacunas([])
    setReceta(null)
    setArchivos([])
    setErrores({})
  }

  function reiniciar() {
    setGuardado(false)
    setMascotaId('')
    setTipo(tipos_atencion[0])
    setDiagnostico('')
    setTratamiento('')
    setRecomendaciones('')
    setVacunas([])
    setReceta(null)
    setArchivos([])
    setErrores({})
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de atención"
        subtitle="Diagnóstico, tratamiento, vacunas y receta en una sola ficha"
        action={
          datos.consultas.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => navegar('/historial')}>
              <DownloadIcon className="h-4 w-4" /> Ver historiales
            </Button>
          ) : null
        }
      />

      {guardado ? (
        <Card className="border-emerald-200 bg-emerald-50/60 p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Atención registrada correctamente</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
            Se guardó la consulta de <span className="font-semibold">{paciente?.nombre}</span>, se actualizó su
            historial, las vacunas aplicadas y el portal del propietario ya muestra la información.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {paciente && (
              <Button onClick={() => navegar(`/mascotas/${paciente.id}`)}>Ver ficha del paciente</Button>
            )}
            <Button variant="secondary" onClick={reiniciar}>
              Registrar otra atención
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Nueva consulta" subtitle={`Se registrará con la fecha de hoy (${fmtCorto(hoy)})`} />
            <div className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Paciente"
                  requerido
                  value={mascotaId}
                  onChange={(e) => setMascotaId(e.target.value)}
                  error={errores.mascotaId}
                >
                  <option value="">Seleccione una mascota…</option>
                  {datos.mascotas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} — {datos.nombrePropietario(m.propietarioId)} ({m.especie})
                    </option>
                  ))}
                </Select>
                <Select
                  label="Tipo de atención"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoAtencion)}
                >
                  {tipos_atencion.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>

              {paciente && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <PetImage
                    especie={paciente.especie}
                    sexo={paciente.sexo}
                    nombre={paciente.nombre}
                    foto={paciente.foto}
                    className="h-12 w-12"
                    anillo={false}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {paciente.nombre} · {paciente.sexo} · {paciente.peso || 'peso s/d'}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {paciente.raza || 'Sin raza registrada'} · {historial.length} consultas previas
                      {ultimaVacuna ? ` · última vacuna: ${ultimaVacuna.nombre}` : ''}
                    </p>
                  </div>
                  {historial[0] && (
                    <Badge className="bg-white text-slate-600">{historial[0].diagnostico}</Badge>
                  )}
                </div>
              )}

              <Textarea
                label="Diagnóstico"
                requerido
                rows={2}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                error={errores.diagnostico}
                placeholder="Ej. Dermatitis alérgica en lomo y abdomen"
              />

              <Textarea
                label="Tratamiento aplicado"
                rows={2}
                value={tratamiento}
                onChange={(e) => setTratamiento(e.target.value)}
                error={errores.tratamiento}
                placeholder="Ej. Antihistamínico IM, limpieza de la zona afectada"
              />

              <Textarea
                label="Recomendaciones para el propietario"
                rows={2}
                value={recomendaciones}
                onChange={(e) => setRecomendaciones(e.target.value)}
                placeholder="Ej. Evitar perfumes y lookout de garrapatas"
              />

              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <SyringeIcon className="h-4 w-4 text-sky-600" /> Vacunas aplicadas hoy
                  {vacunas.length > 0 && <Badge className="bg-sky-100 text-sky-700">{vacunas.length}</Badge>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {nombres_vacuna_todas.map((nombre) => {
                    const activo = vacunas.some((v) => v.nombre === nombre)
                    return (
                      <button
                        key={nombre}
                        type="button"
                        onClick={() => alternarVacuna(nombre)}
                        className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${activo
                            ? 'border-sky-300 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                      >
                        {activo ? (
                          <CheckIcon className="mr-1 inline h-3.5 w-3.5" />
                        ) : (
                          <PlusIcon className="mr-1 inline h-3.5 w-3.5" />
                        )}
                        {nombre}
                      </button>
                    )
                  })}
                </div>
                {vacunas.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Próxima dosis calculada:{' '}
                    {vacunas
                      .map((v) => `${v.nombre} (${fmtCorto(sumarDias(hoy, dias_vacuna[v.nombre] ?? 365))})`)
                      .join(' · ')}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    Receta médica
                    {receta?.items.length ? (
                      <Badge className="bg-emerald-100 text-emerald-700">{receta.items.length} ítems</Badge>
                    ) : null}
                  </p>
                  {receta && (
                    <Button size="sm" variant="ghost" onClick={() => setReceta(null)}>
                      <TrashIcon className="h-4 w-4" /> Quitar
                    </Button>
                  )}
                </div>
                {receta ? (
                  <EditorReceta
                    items={receta.items}
                    onChange={(items) => setReceta({ ...receta, items })}
                    medicamentos={datos.medicamentos}
                  />
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setReceta({ items: [] })}>
                    <PlusIcon className="h-4 w-4" /> Añadir medicamentos
                  </Button>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">Exámenes y adjuntos</p>
                <FileUpload archivos={archivos} onChange={setArchivos} />
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={conControl}
                    onChange={(e) => setConControl(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600"
                  />
                  Agendar control de seguimiento
                </label>
                {conControl && (
                  <Input
                    type="date"
                    value={proximaControl}
                    min={d(1)}
                    onChange={(e) => setProximaControl(e.target.value)}
                    className="w-44"
                  />
                )}
                <Button className="ml-auto" onClick={registrar} disabled={!mascotaId}>
                  <StethoscopeIcon className="h-4 w-4" /> Registrar atención
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Ahora en consulta" subtitle="Pacientes esperando atención" />
              {enSala.length === 0 ? (
                <EstadoVacio titulo="Sala despejada" detalle="No hay pacientes en consulta en este momento." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {enSala.map((c) => {
                    const m = datos.mascota(c.mascotaId)
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                        <PetImage
                          especie={m?.especie}
                          sexo={m?.sexo}
                          nombre={m?.nombre}
                          foto={m?.foto}
                          className="h-9 w-9 text-[10px]"
                          anillo={false}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {datos.nombreMascota(c.mascotaId)}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {c.hora} · {c.motivo}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => setMascotaId(String(c.mascotaId))}>
                          Atender
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Pendientes de hoy" subtitle="Aún no entraron a consulta" />
              {pendientes.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-slate-500">Sin citas pendientes.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendientes.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-11 shrink-0 text-sm font-bold text-slate-600">{c.hora}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {datos.nombreMascota(c.mascotaId)}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{c.motivo}</span>
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => setMascotaId(String(c.mascotaId))}>
                        Cargar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {paciente && historial.length > 0 && (
              <Card>
                <CardHeader
                  title="Historial del paciente"
                  subtitle={`${historial.length} consulta${historial.length === 1 ? '' : 's'} registrada${historial.length === 1 ? '' : 's'}`}
                  action={
                    <Button size="sm" variant="ghost" onClick={() => navegar(`/mascotas/${paciente.id}`)}>
                      Ver ficha
                    </Button>
                  }
                />
                <ul className="divide-y divide-slate-100">
                  {historial.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{c.diagnostico}</p>
                        <p className="truncate text-xs text-slate-500">
                          {fmtCorto(c.fecha)} · {c.tipo}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
                        onClick={() => setConsultaAbierta(c)}
                      >
                        Ver detalle
                      </Button>
                    </li>
                  ))}
                </ul>
                {historial.length > 5 && (
                  <p className="border-t border-slate-100 px-4 py-2.5 text-center text-xs text-slate-400">
                    y {historial.length - 5} consulta(s) anterior(es)
                  </p>
                )}
              </Card>
            )}

            {paciente && historial.length === 0 && (
              <Aviso tono="info" titulo="Primera atención de este paciente">
                Se creará la primera entrada de su historial clínico.
              </Aviso>
            )}

            {datos.stockBajo().length > 0 && (
              <Aviso tono="aviso" titulo="Faltan insumos">
                {datos.stockBajo().length} medicamento(s) en o por debajo del mínimo. Revise el inventario antes de
                emitir recetas.
              </Aviso>
            )}
          </div>
        </div>
      )}
      <ModalConsulta consulta={consultaAbierta} alCerrar={() => setConsultaAbierta(null)} />
    </div>
  )
}
