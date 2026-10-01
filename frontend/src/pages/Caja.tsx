import { useMemo, useState } from 'react'
import { useDatos } from '../data/store'
import { useToast } from '../components/Toast'
import { fmtCorto, hoy, moneda, sumarDias } from '../data/fechas'
import { Badge, BotonIcono, Button, Card, EstadoVacio, FilaCampos, Input, Modal, PageHeader, Select } from '../components/ui'
import { CheckIcon, CloseIcon, MoneyIcon, PrintIcon, SearchIcon, WalletIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import { imprimir } from '../utils/descarga'
import { reciboHTML, pacienteDe } from '../utils/impresion'
import type { Cita, MetodoPago, Pago } from '../data/types'

const metodos: MetodoPago[] = ['Efectivo', 'Tarjeta', 'Yape', 'Transferencia']

type Rango = 'hoy' | 'semana' | 'mes' | 'todo'

const rangos: { clave: Rango; label: string }[] = [
  { clave: 'hoy', label: 'Hoy' },
  { clave: 'semana', label: 'Últimos 7 días' },
  { clave: 'mes', label: 'Este mes' },
  { clave: 'todo', label: 'Todo' },
]

export default function Caja() {
  const datos = useDatos()
  const { toast } = useToast()
  const [rango, setRango] = useState<Rango>('hoy')
  const [texto, setTexto] = useState('')
  const [cobrando, setCobrando] = useState<Cita | null>(null)
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo')
  const [monto, setMonto] = useState('')

  const porCobrar = useMemo(() => datos.porCobrar(), [datos])

  const pagos = useMemo(() => {
    const desde =
      rango === 'hoy'
        ? hoy
        : rango === 'semana'
          ? sumarDias(hoy, -6)
          : rango === 'mes'
            ? `${hoy.slice(0, 7)}-01`
            : '0000-01-01'
    const t = texto.trim().toLowerCase()
    return datos.pagos
      .filter((p) => p.fecha >= desde)
      .filter((p) =>
        t ? datos.nombreMascota(pacienteDe(datos, p)).toLowerCase().includes(t) || p.metodo.toLowerCase().includes(t) : true,
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [datos, rango, texto])

  const total = datos.totalPagado(pagos)
  const porMetodo = metodos.map((m) => ({
    metodo: m,
    total: datos.totalPagado(pagos.filter((p) => p.metodo === m)),
    n: pagos.filter((p) => p.metodo === m).length,
  })).filter((x) => x.n > 0)
  const pendienteTotal = porCobrar.reduce((s, c) => s + (datos.servicio(c.servicioId)?.precio ?? 0), 0)
  const mayorVenta = pagos.reduce<Pago | null>((a, p) => (Number(p.monto) > Number(a?.monto ?? 0) ? p : a), null)

  function abrirCobro(cita: Cita) {
    setCobrando(cita)
    setMetodo('Efectivo')
    setMonto(String(datos.servicio(cita.servicioId)?.precio ?? 0))
  }

  function confirmar() {
    if (!cobrando) return
    const valor = Number(monto)
    if (!valor || valor <= 0) return
    datos.registrarPago({ citaId: cobrando.id, monto: valor, metodo })
    toast({
      titulo: 'Pago registrado',
      detalle: `${moneda(valor)} por ${datos.nombreMascota(cobrando.mascotaId)}.`,
      tipo: 'exito',
    })
    setCobrando(null)
  }

  function anular(p: Pago) {
    datos.anularPago(p.id, p.citaId)
    toast({ titulo: 'Pago anulado', detalle: 'La atención vuelve a la lista de por cobrar.', tipo: 'info' })
  }

  const etiquetaRango = rangos.find((r) => r.clave === rango)?.label ?? ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caja"
        subtitle="Cobros del día y atenciones pendientes de pago"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              imprimir(reciboHTML({ datos, pagos, titulo: 'Reporte de cobros', rango: etiquetaRango }))
            }
            disabled={pagos.length === 0}
          >
            <PrintIcon className="h-4 w-4" /> Imprimir
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Cobrado · {etiquetaRango.toLowerCase()}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{moneda(total)}</p>
          <p className="text-[11px] text-slate-400">{pagos.length} transacciones</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Por cobrar</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">{moneda(pendienteTotal)}</p>
          <p className="text-[11px] text-slate-400">{porCobrar.length} atenciones</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Ticket promedio</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {moneda(pagos.length ? Math.round(total / pagos.length) : 0)}
          </p>
          <p className="text-[11px] text-slate-400">por atención</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Cobro más alto</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {mayorVenta ? moneda(mayorVenta.monto) : moneda(0)}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            {mayorVenta ? datos.nombreMascota(pacienteDe(datos, mayorVenta)) : 'sin cobros'}
          </p>
        </Card>
      </div>

      {porMetodo.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">Por método de pago</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {porMetodo.map((m) => (
              <div key={m.metodo} className="rounded-xl bg-slate-50 px-3.5 py-3">
                <p className="text-xs text-slate-500">{m.metodo}</p>
                <p className="mt-0.5 text-lg font-bold text-slate-800">{moneda(m.total)}</p>
                <p className="text-[11px] text-slate-400">
                  {total ? Math.round((m.total / total) * 100) : 0}% · {m.n} cobros
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <WalletIcon className="h-4 w-4 text-rose-600" /> Atenciones por cobrar
            </h3>
            {porCobrar.length > 0 && (
              <Badge className="ml-auto bg-rose-100 text-rose-700">{porCobrar.length}</Badge>
            )}
          </div>
          {porCobrar.length === 0 ? (
            <EstadoVacio
              icono={<CheckIcon className="h-6 w-6" />}
              titulo="Caja al día"
              detalle="No hay atenciones pendientes de cobro."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {porCobrar.map((c) => {
                const m = datos.mascota(c.mascotaId)
                const s = datos.servicio(c.servicioId)
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{m?.nombre}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {fmtCorto(c.fecha)} · {s?.concepto ?? 'Servicio'} ·{' '}
                        {datos.nombrePropietario(m?.propietarioId)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-slate-800">
                      {s ? moneda(s.precio) : '—'}
                    </span>
                    <Button size="sm" onClick={() => abrirCobro(c)}>
                      Cobrar
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MoneyIcon className="h-4 w-4 text-emerald-600" /> Cobros registrados
            </h3>
            <div className="ml-auto flex gap-1">
              {rangos.map((r) => (
                <button
                  key={r.clave}
                  type="button"
                  onClick={() => setRango(r.clave)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    rango === r.clave ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por paciente o método…"
                className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
          {pagos.length === 0 ? (
            <EstadoVacio titulo="Sin cobros en el periodo" detalle="Cambie el rango de fechas o registre un cobro." />
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {pagos.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {datos.nombreMascota(pacienteDe(datos, p))}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {fmtCorto(p.fecha)} · {p.metodo}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-emerald-600">{moneda(p.monto)}</span>
                  <BotonIcono label="Anular" className="hover:text-rose-600" onClick={() => anular(p)}>
                    <CloseIcon className="h-4 w-4" />
                  </BotonIcono>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        abierto={Boolean(cobrando)}
        alCerrar={() => setCobrando(null)}
        titulo="Registrar cobro"
        descripcion={
          cobrando
            ? `${datos.nombreMascota(cobrando.mascotaId)} · ${datos.nombreServicio(cobrando.servicioId)}`
            : ''
        }
        pie={
          <>
            <Button variant="secondary" onClick={() => setCobrando(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={!monto || Number(monto) <= 0}>
              Registrar pago
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FilaCampos columnas={2}>
            <Select
              label="Método de pago"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoPago)}
            >
              {metodos.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
            <Input label="Monto (S/)" type="number" min="1" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </FilaCampos>
          {cobrando && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">Precio del servicio</span>
              <button
                type="button"
                className="font-bold text-primary-600 hover:text-primary-700"
                onClick={() => setMonto(String(datos.servicio(cobrando.servicioId)?.precio ?? 0))}
              >
                {moneda(datos.servicio(cobrando.servicioId)?.precio ?? 0)}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}