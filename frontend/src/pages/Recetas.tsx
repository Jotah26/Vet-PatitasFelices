import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../data/store'
import { fmtCorto } from '../data/fechas'
import { useCRUD, useDebounce } from '../hooks'
import { estados_receta } from '../data/estados'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import { Badge, BotonIcono, Button, Card, EstadoVacio, FilaCampos, PageHeader, Select, Textarea } from '../components/ui'
import { PlusIcon, PrescriptionIcon, PrintIcon, SearchIcon, TrashIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import { EditorReceta } from '../components/EditorReceta'
import { imprimirReceta } from '../utils/impresion'
import type { EstadoReceta, ItemReceta } from '../data/types'

type Filtro = 'todas' | EstadoReceta

const filtros: [Filtro, string][] = [
  ['todas', 'Todas'],
  ['Emitida', 'Sin entregar'],
  ['Dispensada', 'Dispensadas'],
]

interface RecetaForm {
  id?: number
  mascotaId: string | number
  vetId: string | number
  items: ItemReceta[]
  indicaciones?: string
  estado: EstadoReceta
  fecha?: string
}

const vacio = (): RecetaForm => ({
  mascotaId: '',
  vetId: '',
  items: [],
  indicaciones: '',
  estado: 'Emitida',
})

export default function Recetas() {
  const datos = useDatos()
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const consulta = useDebounce(texto, 200)

  const crud = useCRUD<RecetaForm>({
    etiqueta: 'receta',
    vacio: vacio,
    alGuardar: (fila) => {
      datos.crearReceta({
        mascotaId: Number(fila.mascotaId),
        vetId: Number(fila.vetId) || 2,
        items: fila.items,
        indicaciones: String(fila.indicaciones ?? ''),
        estado: fila.estado,
      })
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarReceta(fila.id)
    },
  })

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.recetas
      .filter((r) => (filtro === 'todas' ? true : r.estado === filtro))
      .filter((r) =>
        t
          ? `${datos.nombreMascota(r.mascotaId)} ${r.items.map((i) => i.medicamento).join(' ')}`
              .toLowerCase()
              .includes(t)
          : true,
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [datos, consulta, filtro])

  const emitidas = datos.recetas.filter((r) => r.estado === 'Emitida').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recetas médicas"
        subtitle="Tratamientos indicados y control de entrega al propietario"
        action={
          <Button onClick={crud.abrirNuevo}>
            <PlusIcon className="h-4 w-4" /> Nueva receta
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex gap-1.5">
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
            placeholder="Buscar paciente o medicamento…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<PrescriptionIcon className="h-6 w-6" />}
          titulo="Sin recetas"
          detalle="Las recetas se emiten al registrar una atención o creando una nueva."
          accion={
            <Button size="sm" onClick={crud.abrirNuevo}>
              <PlusIcon className="h-4 w-4" /> Nueva receta
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {lista.map((r) => {
            const m = datos.mascota(r.mascotaId)
            return (
              <li key={r.id}>
                <Card className="flex h-full flex-col p-4">
                  <div className="flex items-start gap-3">
                    <PetImage
                      especie={m?.especie}
                      sexo={m?.sexo}
                      nombre={m?.nombre}
                      foto={m?.foto}
                      className="h-11 w-11"
                      anillo={false}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/mascotas/${r.mascotaId}`}
                        className="text-sm font-bold text-slate-900 hover:text-primary-600"
                      >
                        {m?.nombre}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {fmtCorto(r.fecha)} · {datos.nombreVet(r.vetId)}
                      </p>
                    </div>
                    <Badge className={estados_receta[r.estado]}>{r.estado}</Badge>
                  </div>

                  <ul className="mt-3 flex-1 space-y-1.5">
                    {r.items.map((it, i) => (
                      <li
                        key={`${it.medicamento}-${i}`}
                        className="flex items-baseline gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-slate-800">{it.medicamento}</span>
                        <span className="text-xs text-slate-500">
                          {it.dosis} · {it.dias} d.
                        </span>
                      </li>
                    ))}
                  </ul>

                  {r.indicaciones && <p className="mt-3 text-xs leading-relaxed text-slate-500">{r.indicaciones}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                    <Button size="sm" variant="secondary" onClick={() => imprimirReceta(datos.recetaImprimible(r))}>
                      <PrintIcon className="h-4 w-4" /> Imprimir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        datos.marcarReceta(r.id, r.estado === 'Dispensada' ? 'Emitida' : 'Dispensada')
                      }
                    >
                      {r.estado === 'Dispensada' ? 'Marcar como no entregada' : 'Marcar como dispensada'}
                    </Button>
                    <BotonIcono
                      label="Eliminar"
                      className="ml-auto hover:text-rose-600"
                      onClick={() => crud.pedirBorrado(r)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </BotonIcono>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        {emitidas} receta(s) pendientes de entrega · el propietario las ve en su portal
      </p>

      <FormularioModal
        crud={crud}
        titulo="Nueva receta"
        descripcion="Los medicamentos se descuentan del inventario al guardar la atención clínica."
        validar={(valores: ValoresFormulario) => {
          const errores: ErroresFormulario = {}
          if (!valores.mascotaId) errores.mascotaId = 'Seleccione la mascota.'
          if (!Array.isArray(valores.items) || valores.items.length === 0)
            errores.items = 'Agregue al menos un medicamento.'
          return errores
        }}
      >
        {({ valores, cambiar, errores }) => (
          <div className="space-y-4">
            <FilaCampos columnas={2}>
              <Select
                label="Mascota"
                requerido
                value={String(valores.mascotaId ?? '')}
                onChange={cambiar('mascotaId')}
                error={errores.mascotaId}
              >
                <option value="">Seleccione…</option>
                {datos.mascotas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {datos.nombrePropietario(m.propietarioId)}
                  </option>
                ))}
              </Select>
              <Select label="Veterinario" value={String(valores.vetId ?? '')} onChange={cambiar('vetId')}>
                <option value="">Sin asignar</option>
                {datos.usuarios
                  .filter((u) => u.rol === 'vet')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
              </Select>
            </FilaCampos>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Medicamentos</p>
              <EditorReceta
                items={Array.isArray(valores.items) ? (valores.items as ItemReceta[]) : []}
                onChange={(items) => cambiar('items')(items)}
                medicamentos={datos.medicamentos}
              />
              {errores.items && <p className="mt-1.5 text-xs font-medium text-rose-600">{errores.items}</p>}
            </div>

            <Textarea
              label="Indicaciones generales"
              rows={2}
              value={String(valores.indicaciones ?? '')}
              onChange={cambiar('indicaciones')}
              placeholder="Ej. Administrar con alimento, evitar el baño por 48 horas"
            />
          </div>
        )}
      </FormularioModal>

      <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar
            ? `Se eliminará la receta de ${datos.nombreMascota(Number(crud.porBorrar.mascotaId))} del ${fmtCorto(crud.porBorrar.fecha ?? '')}. ¿Continuar?`
            : ''
        }
      />
    </div>
  )
}
