import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useDatos } from '../data/store'
import { useToast } from '../components/Toast'
import { fmtCorto, relativo } from '../data/fechas'
import { useDebounce } from '../hooks'
import { Badge, Button, Card, EstadoVacio, PageHeader } from '../components/ui'
import { BellIcon, CalendarIcon, CheckIcon, RefreshIcon, SearchIcon, SendIcon, SyringeIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import type { ClaseRecordatorio } from '../data/types'

type Filtro = 'todos' | ClaseRecordatorio

const filtros: [Filtro, string][] = [
  ['todos', 'Todos'],
  ['vacuna', 'Vacunas'],
  ['cita', 'Citas'],
]

const tono = {
  vencido: { borde: 'border-rose-200', fondo: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700', texto: 'Vencido' },
  hoy: { borde: 'border-orange-200', fondo: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', texto: 'Hoy' },
  proximo: { borde: 'border-amber-200', fondo: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', texto: 'Próximo' },
  programado: { borde: 'border-sky-200', fondo: 'bg-sky-50', badge: 'bg-sky-100 text-sky-700', texto: 'Agendado' },
}

export default function Recordatorios() {
  const datos = useDatos()
  const { toast } = useToast()
  const [clase, setClase] = useState<Filtro>('todos')
  const [texto, setTexto] = useState('')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const consulta = useDebounce(texto, 200)

  const todos = datos.recordatorios

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return todos
      .filter((r) => (clase === 'todos' ? true : r.clase === clase))
      .filter((r) => (soloPendientes ? !r.enviado : true))
      .filter((r) =>
        t ? `${r.titulo} ${r.detalle} ${datos.nombreMascota(r.mascotaId)}`.toLowerCase().includes(t) : true,
      )
  }, [todos, clase, consulta, soloPendientes, datos])

  const conteo = {
    todos: todos.length,
    vacuna: todos.filter((r) => r.clase === 'vacuna').length,
    cita: todos.filter((r) => r.clase === 'cita').length,
    pendientes: todos.filter((r) => !r.enviado).length,
  }

  const tarjetas: { etiqueta: string; valor: number; icon: ReactNode; clase: string }[] = [
    { etiqueta: 'Total', valor: conteo.todos, icon: <BellIcon className="h-5 w-5" />, clase: 'bg-slate-100 text-slate-600' },
    { etiqueta: 'Por enviar', valor: conteo.pendientes, icon: <SendIcon className="h-5 w-5" />, clase: 'bg-amber-100 text-amber-700' },
    { etiqueta: 'Vacunas', valor: conteo.vacuna, icon: <SyringeIcon className="h-5 w-5" />, clase: 'bg-rose-100 text-rose-700' },
    { etiqueta: 'Citas', valor: conteo.cita, icon: <CalendarIcon className="h-5 w-5" />, clase: 'bg-sky-100 text-sky-700' },
  ]

  function alternar(clave: string, enviado: boolean, titulo: string, mascotaId: number) {
    datos.alternarRecordatorio(clave)
    if (!enviado) {
      toast({
        titulo: 'Recordatorio enviado',
        detalle: `Se notificó a ${datos.nombrePropietario(datos.mascota(mascotaId)?.propietarioId)} sobre ${titulo}.`,
        tipo: 'exito',
      })
    }
  }

  function enviarTodos() {
    const pendientes = todos.filter((r) => !r.enviado)
    pendientes.forEach((r) => datos.alternarRecordatorio(r.clave))
    toast({
      titulo: 'Envío completado',
      detalle: `${pendientes.length} recordatorio(s) marcados como enviados.`,
      tipo: 'exito',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recordatorios"
        subtitle="Avisos de vacunas y citas próximas, listos para enviar al propietario"
        action={
          <Button onClick={enviarTodos} disabled={conteo.pendientes === 0}>
            <SendIcon className="h-4 w-4" /> Enviar pendientes ({conteo.pendientes})
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {tarjetas.map((k) => (
          <Card key={k.etiqueta} className="flex items-center gap-3 p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.clase}`}>{k.icon}</span>
            <span>
              <span className="block text-2xl font-bold leading-none text-slate-800">{k.valor}</span>
              <span className="text-xs text-slate-500">{k.etiqueta}</span>
            </span>
          </Card>
        ))}
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex gap-1.5">
          {filtros.map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setClase(clave)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                clase === clave ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={soloPendientes}
            onChange={(e) => setSoloPendientes(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600"
          />
          Solo los que faltan enviar
        </label>
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar recordatorio…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<CheckIcon className="h-6 w-6" />}
          titulo="Nada pendiente por ahora"
          detalle="No hay vacunas ni citas próximas dentro del rango de aviso."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((r) => {
            const m = datos.mascota(r.mascotaId)
            const p = datos.propietario(m?.propietarioId)
            const tonoFila =
              r.dias < 0
                ? tono.vencido
                : r.dias === 0
                  ? tono.hoy
                  : r.clase === 'vacuna'
                    ? tono.proximo
                    : tono.programado
            return (
              <li key={r.clave}>
                <Card className={`flex h-full flex-col border p-4 ${tonoFila.borde} ${r.enviado ? 'opacity-70' : tonoFila.fondo}`}>
                  <div className="flex items-start gap-3">
                    <PetImage
                      especie={m?.especie}
                      sexo={m?.sexo}
                      nombre={m?.nombre}
                      foto={m?.foto}
                      className="h-10 w-10 text-xs"
                      anillo={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{r.titulo}</p>
                      <p className="truncate text-xs text-slate-500">
                        {m?.nombre} · {p?.nombre}
                      </p>
                    </div>
                    <Badge className={tonoFila.badge}>{r.enviado ? 'Enviado' : tonoFila.texto}</Badge>
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    {r.clase === 'vacuna' ? (
                      <SyringeIcon className="h-4 w-4 text-slate-400" />
                    ) : (
                      <CalendarIcon className="h-4 w-4 text-slate-400" />
                    )}
                    {fmtCorto(r.fecha)} · <span className="font-normal text-slate-500">{r.detalle}</span>
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3">
                    <span className="text-[11px] text-slate-400">{relativo(r.fecha)}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Link to={`/mascotas/${r.mascotaId}`}>
                        <Button size="sm" variant="ghost">
                          Ver ficha
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant={r.enviado ? 'ghost' : 'secondary'}
                        onClick={() => alternar(r.clave, r.enviado, r.titulo, r.mascotaId)}
                      >
                        {r.enviado ? (
                          <>
                            <RefreshIcon className="h-4 w-4" /> Reenviar
                          </>
                        ) : (
                          <>
                            <SendIcon className="h-4 w-4" /> Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        Los envíos quedan registrados en este navegador; en producción se enviarían por correo o WhatsApp.
      </p>
    </div>
  )
}
