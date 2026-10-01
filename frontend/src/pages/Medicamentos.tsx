import { useMemo, useState } from 'react'
import { useDatos } from '../data/store'
import { useAuth } from '../auth/AuthContext'
import { useCRUD, useDebounce } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import { categorias_medicamento } from '../data/roles'
import { fmtCorto, moneda } from '../data/fechas'
import { Badge, BotonIcono, Button, Card, EstadoVacio, FilaCampos, Input, Modal, PageHeader, Select } from '../components/ui'
import { PencilIcon, PillIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon } from '../components/icons'
import type { CategoriaMedicamento, Medicamento } from '../data/types'

type Filtro = 'todos' | 'bajo' | 'proximo' | 'vencido'

const filtros: [Filtro, string][] = [
  ['todos', 'Todos'],
  ['bajo', 'Stock bajo'],
  ['proximo', 'Vencen en 30 días'],
  ['vencido', 'Vencidos'],
]

interface MedicamentoForm {
  id?: number
  nombre: string
  categoria: CategoriaMedicamento
  principioActivo?: string
  presentacion: string
  stock: string | number
  stockMin: string | number
  precio: string | number
  lote?: string
  vencimiento?: string
}

const vacio = (): MedicamentoForm => ({
  nombre: '',
  categoria: 'Antialérgico',
  principioActivo: '',
  presentacion: '',
  stock: 0,
  stockMin: 5,
  precio: 0,
  lote: '',
  vencimiento: '',
})

export default function Medicamentos() {
  const datos = useDatos()
  const { user } = useAuth()
  const soloLectura = user?.rol === 'vet' || user?.rol === 'asistente'
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [reponiendo, setReponiendo] = useState<Medicamento | null>(null)
  const [cantidad, setCantidad] = useState<string>('10')
  const [errorCantidad, setErrorCantidad] = useState('')
  const consulta = useDebounce(texto, 200)

  function reponer() {
    if (!reponiendo) return
    if (!(Number(cantidad) > 0)) {
      setErrorCantidad('Ingrese una cantidad mayor a cero.')
      return
    }
    datos.reponerMedicamento(reponiendo.id, Number(cantidad))
    setReponiendo(null)
  }

  const crud = useCRUD<MedicamentoForm>({
    etiqueta: 'medicamento',
    vacio: vacio,
    alGuardar: (fila, esNuevo) => {
      const { id, stock, stockMin, precio, ...resto } = fila
      const limpio = {
        ...resto,
        stock: Number(stock) || 0,
        stockMin: Number(stockMin) || 0,
        precio: Number(precio) || 0,
      }
      if (esNuevo) datos.crearMedicamento(limpio)
      else if (id != null) datos.actualizarMedicamento(id, limpio)
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarMedicamento(fila.id)
    },
  })

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.medicamentos
      .filter((m) => {
        if (filtro === 'bajo') return m.stock <= m.stockMin
        if (filtro === 'vencido') return Boolean(m.vencimiento) && m.vencimiento! < datos.semanas.hoy
        if (filtro === 'proximo')
          return Boolean(m.vencimiento) && m.vencimiento! >= datos.semanas.hoy && m.vencimiento! <= datos.semanas.mes
        return true
      })
      .filter((m) =>
        t ? `${m.nombre} ${m.principioActivo ?? ''} ${m.presentacion ?? ''}`.toLowerCase().includes(t) : true,
      )
      .sort((a, b) => a.stock - b.stock)
  }, [datos.medicamentos, datos.semanas, consulta, filtro])

  const bajo = datos.stockBajo()
  const valorInventario = datos.medicamentos.reduce((s, m) => s + m.stock * m.precio, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de medicamentos"
        subtitle={soloLectura ? 'Consulta de stock, lotes y vencimientos de la farmacia' : 'Stock, lotes y vencimientos de la farmacia'}
        action={
          soloLectura ? null : <Button onClick={crud.abrirNuevo}><PlusIcon className="h-4 w-4" /> Nuevo medicamento</Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Referencias activas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{datos.medicamentos.length}</p>
        </Card>
        <Card className={`p-4 ${bajo.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <p className="text-xs font-medium text-slate-500">Stock bajo mínimo</p>
          <p className={`mt-1 text-2xl font-bold ${bajo.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {bajo.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Valor del inventario</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{moneda(valorInventario)}</p>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {filtros.map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setFiltro(clave)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filtro === clave ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar medicamento…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<PillIcon className="h-6 w-6" />}
          titulo="Sin medicamentos en esta vista"
          detalle="Ajuste el filtro o registre un medicamento."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((m) => {
            const critico = m.stock <= m.stockMin
            const vencido = Boolean(m.vencimiento) && m.vencimiento! < datos.semanas.hoy
            const nivel = Math.min(100, (m.stock / Math.max(m.stockMin * 3, 1)) * 100)
            return (
              <li key={m.id}>
                <Card className={`flex h-full flex-col p-4 ${vencido ? 'border-rose-200 bg-rose-50/40' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        critico ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      <PillIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{m.nombre}</p>
                      <p className="truncate text-xs text-slate-500">
                        {m.principioActivo}
                        {m.presentacion ? ` · ${m.presentacion}` : ''}
                      </p>
                    </div>
                    {!soloLectura && <div className="flex shrink-0 items-center gap-0.5">
                      <BotonIcono label="Editar" onClick={() => crud.abrirEditar(m)}>
                        <PencilIcon className="h-4 w-4" />
                      </BotonIcono>
                      <BotonIcono label="Eliminar" className="hover:text-rose-600" onClick={() => crud.pedirBorrado(m)}>
                        <TrashIcon className="h-4 w-4" />
                      </BotonIcono>
                    </div>}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${critico ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${nivel}%` }}
                      />
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${critico ? 'text-amber-700' : 'text-slate-800'}`}>
                      {m.stock} u
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {critico && <Badge className="bg-amber-100 text-amber-700">Stock bajo mínimo ({m.stockMin})</Badge>}
                    {vencido && m.vencimiento && (
                      <Badge className="bg-rose-100 text-rose-700">Vencido {fmtCorto(m.vencimiento)}</Badge>
                    )}
                    {!vencido && m.vencimiento && m.vencimiento <= datos.semanas.mes && (
                      <Badge className="bg-orange-100 text-orange-700">Vence {fmtCorto(m.vencimiento)}</Badge>
                    )}
                    {m.lote && <Badge className="bg-slate-100 text-slate-600">Lote {m.lote}</Badge>}
                    <Badge className="bg-primary-100 text-primary-700">{moneda(m.precio)} / un.</Badge>
                  </div>

                  {!soloLectura && <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 self-start"
                    onClick={() => {
                      setReponiendo(m)
                      setCantidad('10')
                      setErrorCantidad('')
                    }}
                  >
                    <RefreshIcon className="h-4 w-4" /> Reponer stock
                  </Button>}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {!soloLectura && <FormularioModal
        crud={crud}
        titulo={crud.esNuevo ? 'Nuevo medicamento' : 'Editar medicamento'}
        descripcion="El stock se descuenta automáticamente al registrar una atención con receta."
        validar={(fila: ValoresFormulario) => {
          const errores: ErroresFormulario = {}
          if (!String(fila.nombre ?? '').trim()) errores.nombre = 'Ingrese el nombre comercial.'
          if (!String(fila.principioActivo ?? '').trim()) errores.principioActivo = 'Ingrese el principio activo.'
          if (Number(fila.precio) <= 0) errores.precio = 'Indique el precio de venta.'
          if (Number(fila.stock) < 0) errores.stock = 'El stock no puede ser negativo.'
          return errores
        }}
      >
        {({ valores, cambiar, errores }) => (
          <div className="space-y-4">
            <FilaCampos columnas={2}>
              <Input
                label="Nombre comercial"
                requerido
                value={String(valores.nombre ?? '')}
                onChange={cambiar('nombre')}
                error={errores.nombre}
              />
              <Select
                label="Categoría"
                requerido
                value={String(valores.categoria ?? 'Antialérgico')}
                onChange={cambiar('categoria')}
              >
                {categorias_medicamento.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FilaCampos>
            <FilaCampos columnas={2}>
              <Input
                label="Principio activo"
                requerido
                value={String(valores.principioActivo ?? '')}
                onChange={cambiar('principioActivo')}
                error={errores.principioActivo}
              />
              <Input
                label="Presentación"
                value={String(valores.presentacion ?? '')}
                onChange={cambiar('presentacion')}
                placeholder="Tableta 16 mg"
              />
            </FilaCampos>
            <FilaCampos columnas={2}>
              <Input
                label="Precio (S/)"
                type="number"
                step="0.01"
                requerido
                value={String(valores.precio ?? '')}
                onChange={cambiar('precio')}
                error={errores.precio}
              />
              <Input
                label="Stock"
                type="number"
                value={String(valores.stock ?? '')}
                onChange={cambiar('stock')}
                error={errores.stock}
              />
              <Input
                label="Stock mínimo"
                type="number"
                value={String(valores.stockMin ?? '')}
                onChange={cambiar('stockMin')}
              />
              <Input label="Lote" value={String(valores.lote ?? '')} onChange={cambiar('lote')} />
              <Input
                label="Vencimiento"
                type="date"
                value={String(valores.vencimiento ?? '')}
                onChange={cambiar('vencimiento')}
              />
            </FilaCampos>
          </div>
        )}
      </FormularioModal>}

      {!soloLectura && <Modal
        abierto={Boolean(reponiendo)}
        alCerrar={() => setReponiendo(null)}
        titulo={`Reponer ${reponiendo?.nombre ?? ''}`}
        descripcion="Ingresa las unidades que se incorporan al inventario."
        pie={
          <>
            <Button variant="secondary" onClick={() => setReponiendo(null)}>
              Cancelar
            </Button>
            <Button onClick={reponer}>Actualizar stock</Button>
          </>
        }
      >
        <Input
          label="Cantidad a reponer"
          type="number"
          requerido
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          error={errorCantidad}
          ayuda={reponiendo ? `Stock actual: ${reponiendo.stock} unidades` : ''}
        />
      </Modal>}

      {!soloLectura && <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar
            ? `Se eliminará ${crud.porBorrar.nombre} del inventario. Las recetas ya emitidas no se modificarán.`
            : ''
        }
      />}
    </div>
  )
}
