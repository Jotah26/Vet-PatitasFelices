import { useMemo, useState } from 'react'
import { useDatos } from '../data/store'
import { useAuth } from '../auth/AuthContext'
import { useCRUD, useDebounce } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import { claves_rol, roles } from '../data/roles'
import { Badge, BotonIcono, Button, Card, EstadoVacio, FilaCampos, Input, PageHeader, Select } from '../components/ui'
import { PencilIcon, PlusIcon, SearchIcon, ShieldIcon, TrashIcon, UsersIcon } from '../components/icons'
import { iniciales } from '../data/fechas'
import type { EstadoUsuario, RolClave, RolMeta, Usuario } from '../data/types'

interface UsuarioForm {
  id?: number
  nombre: string
  email: string
  rol: RolClave
  estado: EstadoUsuario
}

const vacio = (): UsuarioForm => ({ nombre: '', email: '', rol: 'asistente', estado: 'Activo' })

function rolDe(valor: unknown): RolMeta {
  return roles[valor as RolClave] ?? roles.asistente
}

export default function Usuarios() {
  const datos = useDatos()
  const { user } = useAuth()
  const [texto, setTexto] = useState('')
  const [filtroRol, setFiltroRol] = useState<RolClave | 'todos'>('todos')
  const consulta = useDebounce(texto, 200)

  const crud = useCRUD<UsuarioForm>({
    etiqueta: 'usuario',
    vacio: vacio,
    alGuardar: (fila, esNuevo) => {
      const { id, ...resto } = fila
      const limpio = { ...resto, email: fila.email.trim().toLowerCase() }
      if (esNuevo) datos.crearUsuario(limpio)
      else if (id != null) datos.actualizarUsuario(id, limpio)
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarUsuario(fila.id)
    },
  })

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.usuarios
    .filter((u) => u.rol !== 'propietario')
      .filter((u) => (filtroRol === 'todos' ? true : u.rol === filtroRol))
      .filter((u) => (t ? `${u.nombre} ${u.email}`.toLowerCase().includes(t) : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [datos.usuarios, consulta, filtroRol])

  const porRol = useMemo(
    () => claves_rol.filter((clave) => clave !== 'propietario').map((clave) => ({
      clave, total: datos.usuarios.filter((u) => u.rol === clave).length,
    })),
    [datos.usuarios],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios del equipo"
        subtitle="Acceso al sistema según el rol asignado"
        action={
          <Button onClick={crud.abrirNuevo}>
            <PlusIcon className="h-4 w-4" /> Nuevo usuario
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {porRol.map(({ clave, total }) => {
          const r = roles[clave]
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setFiltroRol(filtroRol === clave ? 'todos' : clave)}
              className={`rounded-xl border p-3 text-left transition ${
                filtroRol === clave
                  ? `${r.borde} ${r.suave} ring-2 ${r.anillo}`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className={`text-[11px] font-semibold tracking-wider uppercase ${r.texto}`}>{r.corto}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{total}</p>
            </button>
          )
        })}
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        {filtroRol !== 'todos' && (
          <button
            type="button"
            onClick={() => setFiltroRol('todos')}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Quitar filtro · {roles[filtroRol].corto}
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{lista.length} usuario(s)</span>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<UsersIcon className="h-6 w-6" />}
          titulo="Sin usuarios"
          detalle="Ajuste el filtro o registre a un nuevo integrante."
          accion={
            <Button size="sm" onClick={crud.abrirNuevo}>
              <PlusIcon className="h-4 w-4" /> Nuevo usuario
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {lista.map((u: Usuario) => {
              const r = rolDe(u.rol)
              const yoMismo = u.id === user?.id
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${r.color}`}
                  >
                    {iniciales(u.nombre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{u.nombre}</p>
                      {yoMismo && <Badge className="bg-primary-100 text-primary-700">Tú</Badge>}
                    </div>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                  </div>
                  <Badge className={r.color}>{r.corto}</Badge>
                  <Badge
                    className={
                      u.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {u.estado}
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    <BotonIcono label="Editar" onClick={() => crud.abrirEditar(u)}>
                      <PencilIcon className="h-4 w-4" />
                    </BotonIcono>
                    <BotonIcono
                      label={yoMismo ? 'No puede eliminarse a sí mismo' : 'Eliminar'}
                      className={yoMismo ? 'cursor-not-allowed opacity-40' : 'hover:text-rose-600'}
                      disabled={yoMismo}
                      onClick={() => !yoMismo && crud.pedirBorrado(u)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </BotonIcono>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <FormularioModal
        crud={crud}
        titulo={crud.esNuevo ? 'Nuevo usuario' : 'Editar usuario'}
        descripcion="El rol define los módulos visibles y las acciones permitidas."
        validar={(fila: ValoresFormulario) => {
          const errores: ErroresFormulario = {}
          const nombre = String(fila.nombre ?? '')
          const email = String(fila.email ?? '')
          const id = typeof fila.id === 'number' ? fila.id : undefined
          if (!nombre.trim()) errores.nombre = 'Ingrese el nombre.'
          if (!email.trim()) errores.email = 'Ingrese el correo.'
          else if (!/^\S+@\S+\.\S+$/.test(email)) errores.email = 'El correo no es válido.'
          else if (datos.usuarios.some((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== id))
            errores.email = 'Ya existe un usuario con ese correo.'
          return errores
        }}
      >
        {({ valores, cambiar, errores }) => {
          const r = rolDe(valores.rol)
          return (
            <div className="space-y-4">
              <FilaCampos columnas={2}>
                <Input
                  label="Nombre completo"
                  requerido
                  value={String(valores.nombre ?? '')}
                  onChange={cambiar('nombre')}
                  error={errores.nombre}
                />
                <Input
                  label="Correo"
                  type="email"
                  requerido
                  value={String(valores.email ?? '')}
                  onChange={cambiar('email')}
                  error={errores.email}
                />
              </FilaCampos>
              <Select label="Rol" value={String(valores.rol ?? 'asistente')} onChange={cambiar('rol')}>
                {claves_rol.map((clave) => (
                  <option key={clave} value={clave}>
                    {roles[clave].label}
                  </option>
                ))}
              </Select>
              <Select label="Estado" value={String(valores.estado ?? 'Activo')} onChange={cambiar('estado')}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </Select>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ShieldIcon className="h-4 w-4 text-slate-400" /> Permisos de {r.corto}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{r.resumen}.</p>
              </div>
            </div>
          )
        }}
      </FormularioModal>

      <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar ? `Se eliminará el acceso de ${crud.porBorrar.nombre} (${crud.porBorrar.email}). ¿Continuar?` : ''
        }
      />
    </div>
  )
}
