import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDatos } from '../data/store'
import { fmtCorto, relativo } from '../data/fechas'
import { estados_cita, estados_consulta, estados_receta, estados_vacuna } from '../data/estados'
import { Badge, Button, Card, EstadoVacio } from '../components/ui'
import {
  CalendarIcon,
  ChevronLeftIcon,
  PawIcon,
  PencilIcon,
  PhoneIcon,
  PillIcon,
  PrescriptionIcon,
  StethoscopeIcon,
  SyringeIcon,
  UserIcon,
} from '../components/icons'
import type { IconProps } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import { htmlFicha, htmlReceta } from '../utils/impresion'
import { imprimir } from '../utils/descarga'
import { FileUpload, fotoComoArchivo } from '../components/FileUpload'
import { useToast } from '../components/Toast'
import { useCRUD } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import type { Mascota } from '../data/types'

type Pestana = 'resumen' | 'citas' | 'consultas' | 'vacunas' | 'recetas'

const pestanas: { clave: Pestana; etiqueta: string; Icono: (p: IconProps) => ReactNode }[] = [
  { clave: 'resumen', etiqueta: 'Resumen', Icono: PawIcon },
  { clave: 'citas', etiqueta: 'Citas', Icono: CalendarIcon },
  { clave: 'consultas', etiqueta: 'Consultas', Icono: StethoscopeIcon },
  { clave: 'vacunas', etiqueta: 'Vacunas', Icono: SyringeIcon },
  { clave: 'recetas', etiqueta: 'Recetas', Icono: PrescriptionIcon },
]

const vacia: Mascota = {
  id: 0,
  nombre: '',
  especie: 'Perro',
  raza: '',
  sexo: 'Macho',
  edad: '',
  color: '',
  peso: '',
  esterilizado: false,
  propietarioId: 0,
  antecedentes: '',
}

export default function FichaMascota() {
  const { id } = useParams()
  const navigate = useNavigate()
  const datos = useDatos()
  const { toast } = useToast()
  const [pestana, setPestana] = useState<Pestana>('resumen')

  const mascotaId = Number(id)
  const mascota = datos.mascota(mascotaId)
  const duenio = datos.duenioDe(mascotaId)

  const crud = useCRUD<Mascota>({
    etiqueta: 'mascota',
    vacio: () => mascota ?? vacia,
    alGuardar: (fila) => datos.actualizarMascota(mascotaId, fila),
    alBorrar: () => {
      datos.eliminarMascota(mascotaId)
      toast({ titulo: 'Paciente eliminado', tipo: 'exito' })
      navigate('/mascotas')
    },
  })

  const citas = useMemo(() => datos.citasDe(mascotaId), [datos, mascotaId])
  const consultas = useMemo(() => datos.consultasDe(mascotaId), [datos, mascotaId])
  const vacunas = useMemo(() => datos.vacunasDe(mascotaId), [datos, mascotaId])
  const recetas = useMemo(() => datos.recetasDe(mascotaId), [datos, mascotaId])

  if (!mascota) {
    return (
      <EstadoVacio
        icono={<PawIcon className="h-6 w-6" />}
        titulo="Paciente no encontrado"
        detalle="La ficha que buscas no existe o fue eliminada."
        accion={
          <Button size="sm" onClick={() => navigate('/mascotas')}>
            Volver al listado
          </Button>
        }
      />
    )
  }

  const proximaCita = citas
    .filter((c) => ['Pendiente', 'Confirmada', 'En sala'].includes(c.estado) && c.fecha >= datos.semanas.hoy)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0]

  const imprimirFicha = () => imprimir(htmlFicha(datos, mascota))

  const resumen: [string, string | number][] = [
    ['Edad', mascota.edad || '—'],
    ['Peso', mascota.peso || '—'],
    ['Consultas', consultas.length],
    ['Vacunas', vacunas.length],
  ]

  return (
    <div className="space-y-6">
      <Link
        to="/mascotas"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-primary-600"
      >
        <ChevronLeftIcon className="h-4 w-4" /> Volver a mascotas
      </Link>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <PetImage
            especie={mascota.especie}
            sexo={mascota.sexo}
            nombre={mascota.nombre}
            foto={mascota.foto}
            className="h-24 w-24 text-2xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{mascota.nombre}</h1>
              <Badge className="bg-slate-100 text-slate-600 capitalize">{mascota.sexo.toLowerCase()}</Badge>
              {mascota.esterilizado && <Badge className="bg-primary-100 text-primary-700">Esterilizado</Badge>}
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {mascota.especie}
              {mascota.raza ? ` · ${mascota.raza}` : ''}
              {mascota.color ? ` · ${mascota.color}` : ''}
            </p>
            {duenio && (
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400" /> {duenio.nombre}
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5 text-slate-400" /> {duenio.telefono}
                </span>
              </p>
            )}
            {mascota.antecedentes && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <strong>Antecedentes:</strong> {mascota.antecedentes}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={imprimirFicha}>
              <PawIcon className="h-4 w-4" /> Imprimir ficha
            </Button>
            <Button size="sm" onClick={() => crud.abrirEditar(mascota)}>
              <PencilIcon className="h-4 w-4" /> Editar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-4">
          {resumen.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="bg-white px-4 py-3">
              <p className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">{etiqueta}</p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{valor}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-200">
        {pestanas.map(({ clave, etiqueta, Icono }) => (
          <button
            key={clave}
            type="button"
            onClick={() => setPestana(clave)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              pestana === clave
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icono className="h-4 w-4" /> {etiqueta}
            {clave === 'citas' && citas.length > 0 && (
              <span className="text-xs text-slate-400">{citas.length}</span>
            )}
            {clave === 'consultas' && consultas.length > 0 && (
              <span className="text-xs text-slate-400">{consultas.length}</span>
            )}
          </button>
        ))}
      </div>

      {pestana === 'resumen' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Próxima cita</h2>
            {proximaCita ? (
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{proximaCita.motivo}</p>
                  <p className="text-xs text-slate-500">
                    {fmtCorto(proximaCita.fecha)} a las {proximaCita.hora} · {relativo(proximaCita.fecha)} ·{' '}
                    {datos.nombreVet(proximaCita.vetId)}
                  </p>
                </div>
                <Badge className={estados_cita[proximaCita.estado]}>{proximaCita.estado}</Badge>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin citas programadas.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Vacunas</h2>
            {vacunas.length === 0 ? (
              <p className="text-sm text-slate-400">Sin vacunas registradas.</p>
            ) : (
              <ul className="space-y-2">
                {vacunas.slice(0, 4).map((v) => {
                  const est = estados_vacuna[datos.estadoVacuna(v.proxima)]
                  return (
                    <li key={v.id} className="flex items-center gap-2.5 text-sm">
                      <SyringeIcon className="h-4 w-4 shrink-0 text-primary-500" />
                      <span className="min-w-0 flex-1 truncate text-slate-700">{v.nombre}</span>
                      <span className="shrink-0 text-xs text-slate-500">{fmtCorto(v.proxima)}</span>
                      <Badge className={est.color}>{est.label}</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Últimas consultas</h2>
            {consultas.length === 0 ? (
              <p className="text-sm text-slate-400">Sin consultas registradas.</p>
            ) : (
              <ul className="space-y-2">
                {consultas.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center gap-2.5 text-sm">
                    <StethoscopeIcon className="h-4 w-4 shrink-0 text-sky-500" />
                    <span className="min-w-0 flex-1 truncate text-slate-700">{c.diagnostico || c.tipo}</span>
                    <span className="shrink-0 text-xs text-slate-500">{fmtCorto(c.fecha)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-bold text-slate-800">Recetas vigentes</h2>
            {recetas.length === 0 ? (
              <p className="text-sm text-slate-400">Sin recetas emitidas.</p>
            ) : (
              <ul className="space-y-2">
                {recetas.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex items-center gap-2.5 text-sm">
                    <PrescriptionIcon className="h-4 w-4 shrink-0 text-primary-600" />
                    <span className="min-w-0 flex-1 truncate text-slate-700">
                      {r.items.map((i) => i.medicamento).join(', ')}
                    </span>
                    <Badge className={estados_receta[r.estado]}>{r.estado}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {pestana === 'citas' && (
        <Card className="overflow-hidden">
          {citas.length === 0 ? (
            <EstadoVacio
              icono={<CalendarIcon className="h-6 w-6" />}
              titulo="Sin citas"
              detalle="Este paciente no tiene citas registradas."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {[...citas]
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="w-24 shrink-0">
                      <p className="text-sm font-semibold text-slate-800">{fmtCorto(c.fecha)}</p>
                      <p className="text-xs text-slate-500">{c.hora}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-800">{c.motivo}</p>
                      <p className="text-xs text-slate-500">
                        {datos.nombreServicio(c.servicioId)} · {datos.nombreVet(c.vetId)}
                      </p>
                    </div>
                    <Badge className={estados_cita[c.estado]}>{c.estado}</Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      )}

      {pestana === 'consultas' && (
        <Card className="overflow-hidden">
          {consultas.length === 0 ? (
            <EstadoVacio
              icono={<StethoscopeIcon className="h-6 w-6" />}
              titulo="Sin consultas"
              detalle="Registre una atención desde la pantalla de Atención."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {consultas.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{c.tipo}</p>
                    <span className="text-xs text-slate-500">
                      {fmtCorto(c.fecha)} · {datos.nombreVet(c.vetId)}
                    </span>
                    <Badge className={`ml-auto ${estados_consulta[c.estado]}`}>{c.estado}</Badge>
                  </div>
                  {c.diagnostico && <p className="mt-1.5 text-sm text-slate-700">{c.diagnostico}</p>}
                  {c.tratamiento && <p className="mt-1 text-xs text-slate-600">Tratamiento: {c.tratamiento}</p>}
                  {c.recomendaciones && <p className="mt-1 text-xs text-slate-500">{c.recomendaciones}</p>}
                  {c.archivos.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {c.archivos.map((a, i) => (
                        <li key={`${a}-${i}`} className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {pestana === 'vacunas' && (
        <Card className="overflow-hidden">
          {vacunas.length === 0 ? (
            <EstadoVacio
              icono={<SyringeIcon className="h-6 w-6" />}
              titulo="Sin vacunas"
              detalle="Registre una aplicación desde Control de vacunas."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {vacunas.map((v) => {
                const est = estados_vacuna[datos.estadoVacuna(v.proxima)]
                return (
                  <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{v.nombre}</p>
                      <p className="text-xs text-slate-500">
                        Aplicada {fmtCorto(v.fecha)}
                        {v.lote ? ` · lote ${v.lote}` : ''}
                        {v.aplicadaPorId ? ` · ${datos.nombreVet(v.aplicadaPorId)}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">Próxima {fmtCorto(v.proxima)}</span>
                    <Badge className={est.color}>{est.label}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}

      {pestana === 'recetas' && (
        <Card className="overflow-hidden">
          {recetas.length === 0 ? (
            <EstadoVacio
              icono={<PrescriptionIcon className="h-6 w-6" />}
              titulo="Sin recetas"
              detalle="No se han emitido recetas para este paciente."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recetas.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{fmtCorto(r.fecha)}</p>
                    <span className="text-xs text-slate-500">{datos.nombreVet(r.vetId)}</span>
                    <Badge className={`ml-auto ${estados_receta[r.estado]}`}>{r.estado}</Badge>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {r.items.map((it, i) => (
                      <li key={`${it.medicamento}-${i}`} className="flex flex-wrap items-baseline gap-2 text-sm text-slate-700">
                        <PillIcon className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                        <span className="font-medium">{it.medicamento}</span>
                        <span className="text-xs text-slate-500">
                          {it.dosis} · {it.dias} d.
                        </span>
                      </li>
                    ))}
                  </ul>
                  {r.indicaciones && <p className="mt-2 text-xs text-slate-500">{r.indicaciones}</p>}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => imprimir(htmlReceta(datos.recetaImprimible(r)))}
                  >
                    <PawIcon className="h-4 w-4" /> Imprimir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {pestana === 'resumen' && (
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-slate-800">Foto y datos básicos</h2>
          <div className="flex flex-wrap items-center gap-4">
            <PetImage
              especie={mascota.especie}
              sexo={mascota.sexo}
              nombre={mascota.nombre}
              foto={mascota.foto}
              className="h-20 w-20 text-lg"
              anillo={false}
            />
            <FileUpload
              archivos={mascota.foto ? [fotoComoArchivo(mascota.foto)] : []}
              onChange={(xs) => datos.actualizarMascota(mascotaId, { foto: xs[0]?.dataUrl ?? '' })}
              aceptar="image/*"
              multiple={false}
              ayuda="JPG o PNG, máximo 1 MB."
            />
          </div>
        </Card>
      )}

      <FormularioModal
        crud={crud}
        titulo="Editar paciente"
        descripcion="Los cambios se reflejan en el portal del propietario."
        validar={(valores: ValoresFormulario): ErroresFormulario => {
          if (String(valores.nombre ?? '').trim()) return {}
          return { nombre: 'Ingrese el nombre.' }
        }}
      >
        {({ valores, cambiar, errores }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Nombre</span>
              <input
                value={String(valores.nombre ?? '')}
                onChange={cambiar('nombre')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
              {errores.nombre && <span className="mt-1 block text-xs text-rose-600">{errores.nombre}</span>}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Raza</span>
              <input
                value={String(valores.raza ?? '')}
                onChange={cambiar('raza')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-400"
              />
            </label>
          </div>
        )}
      </FormularioModal>

      <DialogoBorrado
        crud={crud}
        mensaje={`Se eliminará a ${mascota.nombre} y todo su historial clínico. Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
