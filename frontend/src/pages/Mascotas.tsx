import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../data/store'
import { useCRUD, useDebounce } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import {
  Badge,
  BotonIcono,
  Button,
  Card,
  EstadoVacio,
  FilaCampos,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon, UserIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import { FileUpload, fotoComoArchivo } from '../components/FileUpload'
import { especies, razas_por_especie, sexos } from '../data/roles'
import type { Especie, Sexo } from '../data/types'

type FiltroEspecie = 'todas' | Especie

const filtros: FiltroEspecie[] = ['todas', ...especies]

interface MascotaForm {
  id?: number
  nombre: string
  especie: Especie
  raza: string
  sexo: Sexo
  edad: string
  peso: string
  color: string
  propietarioId: string | number
  esterilizado: boolean
  antecedentes: string
  foto?: string
}

const vacio = (): MascotaForm => ({
  nombre: '',
  especie: 'Perro',
  raza: '',
  sexo: 'Macho',
  edad: '',
  peso: '',
  color: '',
  propietarioId: '',
  esterilizado: false,
  antecedentes: '',
  foto: '',
})

export default function Mascotas() {
  const datos = useDatos()
  const [texto, setTexto] = useState('')
  const [especie, setEspecie] = useState<FiltroEspecie>('todas')
  const consulta = useDebounce(texto, 200)

  const crud = useCRUD<MascotaForm>({
    etiqueta: 'mascota',
    vacio: vacio,
    alGuardar: (fila, esNuevo) => {
      const { id, propietarioId, ...resto } = fila
      const limpia = { ...resto, propietarioId: Number(propietarioId) }
      if (esNuevo) datos.crearMascota(limpia)
      else if (id != null) datos.actualizarMascota(id, limpia)
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarMascota(fila.id)
    },
  })

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.mascotas
      .filter((m) => (especie === 'todas' ? true : m.especie === especie))
      .filter((m) =>
        t
          ? `${m.nombre} ${m.raza ?? ''} ${datos.nombrePropietario(m.propietarioId)}`.toLowerCase().includes(t)
          : true,
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [datos, consulta, especie])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mascotas"
        subtitle="Pacientes de la clínica y sus datos de salud"
        action={
          <Button onClick={crud.abrirNuevo}>
            <PlusIcon className="h-4 w-4" /> Nueva mascota
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {filtros.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEspecie(e)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                especie === e ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar mascota, raza o familia…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<PetImage especie="Perro" nombre="?" className="h-8 w-8" anillo={false} />}
          titulo="Sin mascotas en esta vista"
          detalle="Ajuste el filtro o registre un paciente nuevo."
          accion={
            <Button size="sm" onClick={crud.abrirNuevo}>
              <PlusIcon className="h-4 w-4" /> Nueva mascota
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((m) => {
            const abiertas = datos.citas.filter(
              (c) => c.mascotaId === m.id && ['Pendiente', 'Confirmada', 'En sala'].includes(c.estado),
            ).length
            return (
              <li key={m.id}>
                <Card className="group flex h-full flex-col p-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/mascotas/${m.id}`} className="shrink-0">
                      <PetImage especie={m.especie} nombre={m.nombre} foto={m.foto} className="h-14 w-14 text-sm" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/mascotas/${m.id}`}
                        className="block truncate text-sm font-bold text-slate-900 hover:text-primary-600"
                      >
                        {m.nombre}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {m.especie}
                        {m.raza ? ` · ${m.raza}` : ''}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge className="bg-slate-100 text-slate-600 capitalize">{m.sexo?.toLowerCase()}</Badge>
                        {abiertas > 0 && <Badge className="bg-sky-100 text-sky-700">{abiertas} cita(s)</Badge>}
                        {m.esterilizado && <Badge className="bg-primary-100 text-primary-700">Esterilizado</Badge>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <BotonIcono label="Editar" onClick={() => crud.abrirEditar(m)}>
                        <PencilIcon className="h-4 w-4" />
                      </BotonIcono>
                      <BotonIcono
                        label="Eliminar"
                        className="hover:text-rose-600"
                        onClick={() => crud.pedirBorrado(m)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </BotonIcono>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{datos.nombrePropietario(m.propietarioId)}</span>
                    </span>
                    <span className="shrink-0">{m.edad || 'Edad s/d'}</span>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <FormularioModal
        crud={crud}
        titulo={crud.esNuevo ? 'Nueva mascota' : 'Editar mascota'}
        descripcion="La foto se guarda en el navegador del equipo; pesa menos de 1 MB."
        validar={(valores: ValoresFormulario) => {
          const errores: ErroresFormulario = {}
          if (!String(valores.nombre ?? '').trim()) errores.nombre = 'Ingrese el nombre.'
          if (!valores.propietarioId) errores.propietarioId = 'Seleccione la familia.'
          return errores
        }}
      >
        {({ valores, cambiar, errores }) => (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <PetImage
                especie={String(valores.especie ?? 'Perro') as Especie}
                nombre={String(valores.nombre ?? '')}
                foto={String(valores.foto ?? '')}
                className="h-16 w-16"
                anillo={false}
              />
              <FileUpload
                archivos={valores.foto ? [fotoComoArchivo(String(valores.foto))] : []}
                onChange={(xs) => cambiar('foto')(xs[0]?.dataUrl ?? '')}
                aceptar="image/*"
                multiple={false}
                ayuda="JPG o PNG, máximo 1 MB."
              />
            </div>

            <FilaCampos columnas={2}>
              <Input
                label="Nombre"
                requerido
                value={String(valores.nombre ?? '')}
                onChange={cambiar('nombre')}
                error={errores.nombre}
              />
              <Select
                label="Familia"
                requerido
                value={String(valores.propietarioId ?? '')}
                onChange={cambiar('propietarioId')}
                error={errores.propietarioId}
              >
                <option value="">Seleccione…</option>
                {datos.propietarios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · {p.dni}
                  </option>
                ))}
              </Select>
              <Select
                label="Especie"
                value={String(valores.especie ?? 'Perro')}
                onChange={cambiar('especie')}
              >
                {especies.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
              <Select label="Raza" value={String(valores.raza ?? '')} onChange={cambiar('raza')}>
                <option value="">Sin especificar</option>
                {(razas_por_especie[String(valores.especie ?? 'Perro') as Especie] ?? []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              <Select label="Sexo" value={String(valores.sexo ?? '')} onChange={cambiar('sexo')}>
                {sexos.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Input label="Edad" value={String(valores.edad ?? '')} onChange={cambiar('edad')} placeholder="3 años" />
              <Input label="Peso" value={String(valores.peso ?? '')} onChange={cambiar('peso')} placeholder="18 kg" />
              <Input label="Color" value={String(valores.color ?? '')} onChange={cambiar('color')} />
            </FilaCampos>

            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(valores.esterilizado)}
                onChange={cambiar('esterilizado')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Paciente esterilizado
            </label>

            <Textarea
              label="Antecedentes relevantes"
              rows={2}
              value={String(valores.antecedentes ?? '')}
              onChange={cambiar('antecedentes')}
              placeholder="Alergias, enfermedades crónicas, temperamento"
            />
          </div>
        )}
      </FormularioModal>

      <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar
            ? `Se eliminará a ${crud.porBorrar.nombre} y todo su historial clínico. Esta acción no se puede deshacer.`
            : ''
        }
      />
    </div>
  )
}
