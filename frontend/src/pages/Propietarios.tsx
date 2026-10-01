import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../data/store'
import { useCRUD, useDebounce } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import { BotonIcono, Button, Card, EstadoVacio, FilaCampos, Input, PageHeader, Textarea } from '../components/ui'
import {
  IdCardIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
} from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import type { Propietario } from '../data/types'

type PropietarioForm = Omit<Propietario, 'id'> & { id?: number }

const vacio = (): PropietarioForm => ({ nombre: '', dni: '', telefono: '', email: '', direccion: '' })

export default function Propietarios() {
  const datos = useDatos()
  const [texto, setTexto] = useState('')
  const consulta = useDebounce(texto, 200)

  const crud = useCRUD<PropietarioForm>({
    etiqueta: 'propietario',
    vacio: vacio,
    alGuardar: (fila, esNuevo) => {
      const { id, ...datosFormulario } = fila
      if (esNuevo) datos.crearPropietario(datosFormulario)
      else if (id != null) datos.actualizarPropietario(id, datosFormulario)
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarPropietario(fila.id)
    },
  })

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.propietarios
      .filter((p) => (t ? `${p.nombre} ${p.dni} ${p.telefono} ${p.email}`.toLowerCase().includes(t) : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [datos.propietarios, consulta])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propietarios"
        subtitle="Familias registradas y sus datos de contacto"
        action={
          <Button onClick={crud.abrirNuevo}>
            <PlusIcon className="h-4 w-4" /> Nuevo propietario
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre, DNI o teléfono…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <span className="ml-auto text-xs text-slate-400">
          {lista.length} de {datos.propietarios.length} familias
        </span>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<IdCardIcon className="h-6 w-6" />}
          titulo="Sin propietarios"
          detalle="Registre a la familia para poder asociar sus mascotas."
          accion={
            <Button size="sm" onClick={crud.abrirNuevo}>
              <PlusIcon className="h-4 w-4" /> Nuevo propietario
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((p) => {
            const mascotas = datos.mascotasDe(p.id)
            return (
              <li key={p.id}>
                <Card className="flex h-full flex-col p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      <UserIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{p.nombre}</p>
                      <p className="truncate text-xs text-slate-500">DNI {p.dni}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <BotonIcono label="Editar" onClick={() => crud.abrirEditar(p)}>
                        <PencilIcon className="h-4 w-4" />
                      </BotonIcono>
                      <BotonIcono label="Eliminar" className="hover:text-rose-600" onClick={() => crud.pedirBorrado(p)}>
                        <TrashIcon className="h-4 w-4" />
                      </BotonIcono>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {p.telefono || 'Sin teléfono'}
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <IdCardIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {p.email || 'Sin correo'}
                    </p>
                    {p.direccion && (
                      <p className="flex items-start gap-2">
                        <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /> {p.direccion}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                      {mascotas.length === 1 ? '1 mascota' : `${mascotas.length} mascotas`}
                    </p>
                    {mascotas.length === 0 ? (
                      <p className="text-xs text-slate-400">Sin mascotas registradas.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-1.5">
                        {mascotas.map((m) => (
                          <li key={m.id}>
                            <Link
                              to={`/mascotas/${m.id}`}
                              className="flex items-center gap-1.5 rounded-lg bg-slate-50 py-1 pr-2.5 pl-1 text-xs font-medium text-slate-700 transition hover:bg-primary-50 hover:text-primary-700"
                            >
                              <PetImage
                                especie={m.especie}
                                sexo={m.sexo}
                                nombre={m.nombre}
                                foto={m.foto}
                                className="h-6 w-6 text-[8px]"
                                anillo={false}
                              />
                              {m.nombre}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <FormularioModal
        crud={crud}
        titulo={crud.esNuevo ? 'Nuevo propietario' : 'Editar propietario'}
        descripcion="Estos datos aparecen en la ficha del paciente y en el portal."
        validar={(fila) => {
          const errores: Record<string, string | null> = {}
          const nombre = String(fila.nombre ?? '')
          const dni = String(fila.dni ?? '')
          if (!nombre.trim()) errores.nombre = 'Ingrese el nombre completo.'
          if (!dni.trim()) errores.dni = 'Ingrese el DNI.'
          else if (datos.propietarios.some((p) => p.dni === dni.trim() && p.id !== fila.id))
            errores.dni = 'Ya existe un propietario con ese DNI.'
          return errores
        }}
      >
        {({ valores, cambiar, errores }) => (
          <div className="space-y-4">
            <FilaCampos columnas={2}>
              <Input
                label="Nombre completo"
                requerido
                value={String(valores.nombre ?? '')}
                onChange={cambiar('nombre')}
                error={errores.nombre}
              />
              <Input label="DNI" requerido value={String(valores.dni ?? '')} onChange={cambiar('dni')} error={errores.dni} />
            </FilaCampos>
            <FilaCampos columnas={2}>
              <Input
                label="Teléfono"
                value={String(valores.telefono ?? '')}
                onChange={cambiar('telefono')}
                placeholder="987 654 321"
              />
              <Input label="Correo" type="email" value={String(valores.email ?? '')} onChange={cambiar('email')} />
            </FilaCampos>
            <Textarea label="Dirección" rows={2} value={String(valores.direccion ?? '')} onChange={cambiar('direccion')} />
          </div>
        )}
      </FormularioModal>

      <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar
            ? `Se eliminará a ${crud.porBorrar.nombre} y sus ${datos.mascotasDe(crud.porBorrar.id).length} mascota(s) quedarán sin propietario. ¿Continuar?`
            : ''
        }
      />
    </div>
  )
}
