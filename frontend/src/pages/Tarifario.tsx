import { useMemo, useState } from 'react'
import { useDatos } from '../data/store'
import { hoy, moneda } from '../data/fechas'
import { useCRUD, useDebounce } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import { Badge, BotonIcono, Button, Card, EstadoVacio, FilaCampos, Input, PageHeader, Textarea } from '../components/ui'
import { MoneyIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/icons'

interface ServicioForm {
  id?: number
  concepto: string
  descripcion: string
  precio: string | number
  duracion: string | number
  activo: boolean
}

const vacio = (): ServicioForm => ({ concepto: '', descripcion: '', precio: '', duracion: '30', activo: true })

export default function Tarifario() {
  const datos = useDatos()
  const [texto, setTexto] = useState('')
  const [verTodos, setVerTodos] = useState(true)
  const consulta = useDebounce(texto, 200)
  const mes = hoy.slice(0, 7)

  const crud = useCRUD<ServicioForm>({
    etiqueta: 'servicio',
    vacio: vacio,
    alGuardar: (fila, esNuevo) => {
      const { id, precio, duracion, ...resto } = fila
      const cambios = { ...resto, precio: Number(precio) || 0, duracion: Number(duracion) || 30 }
      if (esNuevo) datos.crearServicio(cambios)
      else if (id != null) datos.actualizarServicio(id, cambios)
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarServicio(fila.id)
    },
  })

  const ingresos = useMemo(() => {
    const atendidas = datos.citas.filter((c) => c.fecha.startsWith(mes) && c.estado === 'Atendida')
    return datos.tarifario
      .map((s) => ({
        id: s.id,
        atenciones: atendidas.filter((c) => c.servicioId === s.id).length,
        facturado: atendidas.filter((c) => c.servicioId === s.id).length * s.precio,
      }))
      .filter((x) => x.atenciones > 0)
      .sort((a, b) => b.facturado - a.facturado)
  }, [datos.tarifario, datos.citas, mes])

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.tarifario
      .filter((s) => (verTodos ? true : s.activo))
      .filter((s) => (t ? `${s.concepto} ${s.descripcion}`.toLowerCase().includes(t) : true))
      .sort((a, b) => a.concepto.localeCompare(b.concepto))
  }, [datos.tarifario, consulta, verTodos])

  const total = ingresos.reduce((s, x) => s + x.facturado, 0)
  const promedio = lista.length ? Math.round(lista.reduce((s, x) => s + x.precio, 0) / lista.length) : 0

  function validar(valores: ValoresFormulario): ErroresFormulario {
    const errores: ErroresFormulario = {}
    const nombre = String(valores.concepto ?? '')
    const id = typeof valores.id === 'number' ? valores.id : undefined
    if (!nombre.trim()) errores.concepto = 'Escriba el nombre del servicio.'
    else if (datos.tarifario.some((s) => s.concepto.toLowerCase() === nombre.trim().toLowerCase() && s.id !== id))
      errores.concepto = 'Ya existe un servicio con ese nombre.'
    if (!valores.precio || Number(valores.precio) <= 0) errores.precio = 'Ingrese un precio mayor que cero.'
    return errores
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarifario"
        subtitle="Servicios, precios y duración de cada atención"
        action={
          <Button onClick={crud.abrirNuevo}>
            <PlusIcon className="h-4 w-4" /> Nuevo servicio
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Servicios activos</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{datos.tarifario.filter((s) => s.activo).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Precio promedio</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{moneda(promedio)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Facturado en el mes</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{moneda(total)}</p>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar servicio…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={verTodos}
            onChange={(e) => setVerTodos(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Mostrar inactivos
        </label>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<MoneyIcon className="h-6 w-6" />}
          titulo="Sin servicios"
          detalle="Cree el primer servicio para poder agendar citas."
          accion={
            <Button size="sm" onClick={crud.abrirNuevo}>
              <PlusIcon className="h-4 w-4" /> Nuevo servicio
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((s) => {
            const uso = ingresos.find((x) => x.id === s.id)
            return (
              <li key={s.id}>
                <Card className={`flex h-full flex-col p-4 ${s.activo ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{s.concepto}</h3>
                    <Badge className={s.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
                    {s.descripcion || 'Sin descripción.'}
                  </p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{moneda(s.precio)}</p>
                      <p className="text-[11px] text-slate-400">{s.duracion} min</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <BotonIcono label="Editar" onClick={() => crud.abrirEditar(s)}>
                        <PencilIcon className="h-4 w-4" />
                      </BotonIcono>
                      <BotonIcono label="Eliminar" className="hover:text-rose-600" onClick={() => crud.pedirBorrado(s)}>
                        <TrashIcon className="h-4 w-4" />
                      </BotonIcono>
                    </div>
                  </div>
                  {uso && (
                    <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                      {uso.atenciones} atenciones este mes · {moneda(uso.facturado)}
                    </p>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <FormularioModal
        crud={crud}
        titulo={crud.esNuevo ? 'Nuevo servicio' : 'Editar servicio'}
        descripcion="El precio se aplica al cobrar y al mostrar el detalle de la cita."
        validar={validar}
      >
        {({ valores, cambiar, errores }) => (
          <div className="space-y-4">
            <FilaCampos columnas={2}>
              <Input
                label="Concepto"
                requerido
                value={String(valores.concepto ?? '')}
                onChange={cambiar('concepto')}
                error={errores.concepto}
                placeholder="Consulta general"
              />
              <Input
                label="Precio (S/)"
                type="number"
                min="1"
                requerido
                value={String(valores.precio ?? '')}
                onChange={cambiar('precio')}
                error={errores.precio}
              />
            </FilaCampos>
            <FilaCampos columnas={2}>
              <Input
                label="Duración (min)"
                type="number"
                min="5"
                value={String(valores.duracion ?? '30')}
                onChange={cambiar('duracion')}
              />
              <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={valores.activo !== false}
                  onChange={(e) => cambiar('activo')(e)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600"
                />
                Servicio activo
              </label>
            </FilaCampos>
            <Textarea
              label="Descripción"
              rows={2}
              value={String(valores.descripcion ?? '')}
              onChange={cambiar('descripcion')}
              placeholder="Detalle que verá el propietario"
            />
          </div>
        )}
      </FormularioModal>

      <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar
            ? `Se eliminará "${crud.porBorrar.concepto}" del tarifario y no podrá volver a agendarse. ¿Continuar?`
            : ''
        }
      />
    </div>
  )
}
