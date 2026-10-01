import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos, dias_vacuna } from '../data/store'
import { useAuth } from '../auth/AuthContext'
import { diffDias, fmtCorto, hoy, relativo, sumarDias } from '../data/fechas'
import { estados_vacuna } from '../data/estados'
import { useCRUD, useDebounce } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import { DialogoBorrado } from '../components/DialogoBorrado'
import type { ErroresFormulario, ValoresFormulario } from '../hooks'
import { Badge, BotonIcono, Button, Card, EstadoVacio, FilaCampos, Input, PageHeader, Select } from '../components/ui'
import { BellIcon, PlusIcon, SearchIcon, SyringeIcon, TrashIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import type { EstadoVacuna } from '../data/types'

type Filtro = 'todas' | 'vencidas' | 'proxima' | 'alDia'

const filtros: [Filtro, string][] = [
  ['todas', 'Todas'],
  ['vencidas', 'Vencidas'],
  ['proxima', 'Próximas'],
  ['alDia', 'Al día'],
]

interface VacunaForm {
  id?: number
  mascotaId: string | number
  nombre: string
  fecha: string
  lote?: string
  proxima: string
  aplicadaPorId?: string | number
}

const vacio = (): VacunaForm => ({
  mascotaId: '',
  nombre: 'Antirrábica',
  fecha: hoy,
  lote: '',
  proxima: '',
})

export default function Vacunas() {
  const datos = useDatos()
  const { user } = useAuth()
  const esVet = user?.rol === 'vet'
  const puedeRegistrar = user?.rol === 'admin' || esVet
  const puedeEliminar = user?.rol === 'admin'
  const [texto, setTexto] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const consulta = useDebounce(texto, 200)

  const crud = useCRUD<VacunaForm>({
    etiqueta: 'aplicación de vacuna',
    vacio: vacio,
    alGuardar: (fila) => {
      const nombre = String(fila.nombre ?? '')
      const fecha = String(fila.fecha ?? hoy)
      datos.registrarVacuna({
        mascotaId: Number(fila.mascotaId),
        nombre,
        fecha,
        lote: String(fila.lote ?? ''),
        aplicadaPorId: fila.aplicadaPorId ? Number(fila.aplicadaPorId) : undefined,
        proxima: String(fila.proxima || '') || sumarDias(fecha, dias_vacuna[nombre] ?? 365),
      })
    },
    alBorrar: (fila) => {
      if (fila.id != null) datos.eliminarVacuna(fila.id)
    },
  })

  const nombres = useMemo(
    () => [...new Set([...Object.keys(dias_vacuna), ...datos.vacunas.map((v) => v.nombre)])],
    [datos.vacunas],
  )

  // Un veterinario solo consulta y registra vacunas de pacientes que le fueron asignados.
  const pacientesPermitidos = useMemo(() => {
    if (!esVet || user == null) return datos.mascotas
    const ids = new Set([
      ...datos.citas.filter((c) => c.vetId === user.id).map((c) => c.mascotaId),
      ...datos.consultas.filter((c) => c.vetId === user.id).map((c) => c.mascotaId),
    ])
    return datos.mascotas.filter((m) => ids.has(m.id))
  }, [datos.citas, datos.consultas, datos.mascotas, esVet, user])
  const idsPermitidos = useMemo(() => new Set(pacientesPermitidos.map((m) => m.id)), [pacientesPermitidos])

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.vacunas
      .filter((v) => idsPermitidos.has(v.mascotaId))
      .filter((v) => {
        if (filtro === 'todas') return true
        const e = datos.estadoVacuna(v.proxima)
        if (filtro === 'vencidas') return e === 'vencida' || e === 'hoy'
        return e === filtro
      })
      .filter((v) =>
        t ? `${v.nombre} ${datos.nombreMascota(v.mascotaId)} ${v.lote ?? ''}`.toLowerCase().includes(t) : true,
      )
      .sort((a, b) => a.proxima.localeCompare(b.proxima))
  }, [datos, consulta, filtro])

  const resumen = useMemo(
    () => ({
      vencidas: datos.vacunas.filter((v) => {
        const e: EstadoVacuna = datos.estadoVacuna(v.proxima)
        return e === 'vencida' || e === 'hoy'
      }).length,
      proximas: datos.vacunas.filter((v) => datos.estadoVacuna(v.proxima) === 'proxima').length,
      alDia: datos.vacunas.filter((v) => datos.estadoVacuna(v.proxima) === 'alDia').length,
    }),
    [datos],
  )

  const tarjetas: [string, number, string][] = [
    ['Vencidas o hoy', resumen.vencidas, 'bg-rose-100 text-rose-700'],
    ['Próximas (30 días)', resumen.proximas, 'bg-amber-100 text-amber-700'],
    ['Al día', resumen.alDia, 'bg-emerald-100 text-emerald-700'],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de vacunas"
        subtitle="Aplicaciones registradas y próxima dosis de cada paciente"
        action={puedeRegistrar ? (
          <Button onClick={crud.abrirNuevo}>
            <PlusIcon className="h-4 w-4" /> Registrar aplicación
          </Button>
        ) : null}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {tarjetas.map(([etiqueta, valor, clase]) => (
          <Card key={etiqueta} className="flex items-center justify-between p-4">
            <span className="text-sm text-slate-600">{etiqueta}</span>
            <span className={`rounded-xl px-3 py-1 text-lg font-bold ${clase}`}>{valor}</span>
          </Card>
        ))}
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
            placeholder="Buscar vacuna, paciente o lote…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<SyringeIcon className="h-6 w-6" />}
          titulo="Sin vacunas en esta vista"
          detalle="Ajuste el filtro o registre una aplicación nueva."
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {lista.map((v) => {
              const m = datos.mascota(v.mascotaId)
              const est = estados_vacuna[datos.estadoVacuna(v.proxima)]
              const dias = diffDias(v.proxima)
              return (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <PetImage
                    especie={m?.especie}
                    sexo={m?.sexo}
                    nombre={m?.nombre}
                    foto={m?.foto}
                    className="h-10 w-10 text-xs"
                    anillo={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/mascotas/${v.mascotaId}`}
                        className="text-sm font-bold text-slate-900 hover:text-primary-600"
                      >
                        {m?.nombre}
                      </Link>
                      <span className="text-sm text-slate-700">· {v.nombre}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Aplicada {fmtCorto(v.fecha)} · próxima {fmtCorto(v.proxima)} ({relativo(v.proxima)})
                      {v.lote ? ` · lote ${v.lote}` : ''}
                      {v.aplicadaPorId ? ` · ${datos.nombreVet(v.aplicadaPorId)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dias <= 30 && (
                      <Badge
                        className={
                          dias < 0
                            ? 'bg-rose-100 text-rose-700'
                            : dias === 0
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                        }
                      >
                        <BellIcon className="mr-1 h-3.5 w-3.5" />
                        {dias < 0 ? `${Math.abs(dias)} d. vencida` : dias === 0 ? 'vence hoy' : `en ${dias} d.`}
                      </Badge>
                    )}
                    <Badge className={est.color}>{est.label}</Badge>
                    {puedeEliminar && <BotonIcono label="Eliminar" className="hover:text-rose-600" onClick={() => crud.pedirBorrado(v)}>
                      <TrashIcon className="h-4 w-4" />
                    </BotonIcono>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {puedeRegistrar && <FormularioModal
        crud={crud}
        titulo="Registrar aplicación de vacuna"
        descripcion="La próxima dosis se calcula automáticamente según el tipo de vacuna."
        validar={(valores: ValoresFormulario) => {
          const errores: ErroresFormulario = {}
          if (!valores.mascotaId) errores.mascotaId = 'Seleccione la mascota.'
          if (!String(valores.nombre ?? '').trim()) errores.nombre = 'Indique la vacuna.'
          if (!valores.fecha) errores.fecha = 'Indique la fecha de aplicación.'
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
                {pacientesPermitidos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {datos.nombrePropietario(m.propietarioId)}
                  </option>
                ))}
              </Select>
              <Select
                label="Vacuna"
                requerido
                value={String(valores.nombre ?? '')}
                onChange={cambiar('nombre')}
                error={errores.nombre}
              >
                <option value="">Seleccione…</option>
                {nombres.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
              <Input
                label="Fecha de aplicación"
                type="date"
                requerido
                value={String(valores.fecha ?? '')}
                onChange={cambiar('fecha')}
                error={errores.fecha}
              />
              <Input
                label="Próxima dosis"
                type="date"
                value={String(valores.proxima ?? '')}
                onChange={cambiar('proxima')}
                ayuda="Si lo deja vacío se calcula sola"
              />
            </FilaCampos>
            <FilaCampos columnas={2}>
              <Input label="Lote" value={String(valores.lote ?? '')} onChange={cambiar('lote')} placeholder="L-ANT-26" />
              <Select
                label="Aplicada por"
                value={String(valores.aplicadaPorId ?? '')}
                onChange={cambiar('aplicadaPorId')}
              >
                {!esVet && <option value="">Sin registrar</option>}
                {datos.usuarios
                  .filter((u) => u.rol === 'vet' && (!esVet || u.id === user?.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
              </Select>
            </FilaCampos>
            {crud.esNuevo && (
              <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                Las vacunas también se registran automáticamente al guardar una atención veterinaria.
              </p>
            )}
          </div>
        )}
      </FormularioModal>}

      {puedeEliminar && <DialogoBorrado
        crud={crud}
        mensaje={
          crud.porBorrar
            ? `Se eliminará el registro de ${crud.porBorrar.nombre} para ${datos.nombreMascota(Number(crud.porBorrar.mascotaId))}. ¿Continuar?`
            : ''
        }
      />}
    </div>
  )
}
