import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../data/store'
import { fmtCorto } from '../data/fechas'
import { useDebounce } from '../hooks'
import { estados_consulta } from '../data/estados'
import { Badge, Button, Card, EstadoVacio, PageHeader, Select } from '../components/ui'
import { FileIcon, PrintIcon, SearchIcon } from '../components/icons'
import { PetImage } from '../components/PetAvatar'
import { abrirImagen, imprimir } from '../utils/descarga'
import { hojaConsulta } from '../utils/impresion'
import type { Consulta, EstadoConsulta } from '../data/types'

type Filtro = 'todas' | EstadoConsulta

const filtros: [Filtro, string][] = [
  ['todas', 'Todas'],
  ['Completada', 'Completada'],
  ['En seguimiento', 'En seguimiento'],
]

export default function Historial() {
  const datos = useDatos()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<Filtro>('todas')
  const [mascotaId, setMascotaId] = useState('')
  const [abierta, setAbierta] = useState<number | null>(null)
  const consulta = useDebounce(texto, 200)

  const lista = useMemo(() => {
    const t = consulta.trim().toLowerCase()
    return datos.consultas
      .filter((c) => (estado === 'todas' ? true : c.estado === estado))
      .filter((c) => (mascotaId ? c.mascotaId === Number(mascotaId) : true))
      .filter((c) => {
        if (!t) return true
        const m = datos.mascota(c.mascotaId)
        return `${c.diagnostico} ${c.tratamiento} ${c.tipo} ${m?.nombre ?? ''} ${datos.nombreVet(c.vetId)}`
          .toLowerCase()
          .includes(t)
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [datos, consulta, estado, mascotaId])

  const enSeguimiento = datos.consultas.filter((c) => c.estado === 'En seguimiento').length

  function imprimirConsulta(c: Consulta) {
    imprimir(hojaConsulta(datos, c))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial clínico"
        subtitle="Todas las atenciones registradas de la clínica"
        action={
          <Badge className={enSeguimiento ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
            {enSeguimiento} en seguimiento
          </Badge>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar diagnóstico, paciente o veterinario…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="w-48">
          <Select value={mascotaId} onChange={(e) => setMascotaId(e.target.value)}>
            <option value="">Todas las mascotas</option>
            {datos.mascotas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </Select>
        </div>
        <div className="ml-auto flex gap-1.5">
          {filtros.map(([clave, etiqueta]) => (
            <button
              key={clave}
              type="button"
              onClick={() => setEstado(clave)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                estado === clave ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </Card>

      {lista.length === 0 ? (
        <EstadoVacio
          icono={<FileIcon className="h-6 w-6" />}
          titulo="Sin atenciones"
          detalle="No hay consultas que coincidan con el filtro."
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => {
            const m = datos.mascota(c.mascotaId)
            const abierto = abierta === c.id
            const campos: [string, string][] = [
              ['Tratamiento', c.tratamiento],
              ['Recomendaciones', c.recomendaciones || '—'],
              ['Estado', c.estado],
            ]
            return (
              <li key={c.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <PetImage
                      especie={m?.especie}
                      sexo={m?.sexo}
                      nombre={m?.nombre}
                      foto={m?.foto}
                      className="h-11 w-11"
                      anillo={false}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/mascotas/${c.mascotaId}`}
                          className="text-sm font-bold text-slate-900 hover:text-primary-600"
                        >
                          {m?.nombre}
                        </Link>
                        <Badge className={estados_consulta[c.estado]}>{c.estado}</Badge>
                      </div>
                      <p className="truncate text-sm text-slate-700">{c.diagnostico}</p>
                      <p className="text-xs text-slate-500">
                        {fmtCorto(c.fecha)} · {c.tipo} · {datos.nombreVet(c.vetId)}
                        {c.archivos.length ? ` · ${c.archivos.length} adjunto(s)` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setAbierta(abierto ? null : c.id)}>
                      {abierto ? 'Ocultar' : 'Ver detalle'}
                    </Button>
                  </div>

                  {abierto && (
                    <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {campos.map(([k, v]) => (
                          <div key={k} className="rounded-xl bg-white p-3">
                            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{k}</p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-700">{v}</p>
                          </div>
                        ))}
                      </div>

                      {c.archivos.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                            Adjuntos
                          </p>
                          <ul className="flex flex-wrap gap-2">
                            {c.archivos.map((nombre, i) => {
                              const archivo = datos.archivos.find((a) => a.id === c.archivoIds?.[i])
                              return (
                                <li key={`${nombre}-${i}`}>
                                  <button
                                    type="button"
                                    onClick={() => archivo?.dataUrl && abrirImagen(archivo.dataUrl, nombre)}
                                    disabled={!archivo?.dataUrl}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {nombre}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => imprimirConsulta(c)}>
                          <PrintIcon className="h-4 w-4" /> Imprimir historia
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-center text-xs text-slate-400">
        {lista.length} de {datos.consultas.length} atenciones registradas
      </p>
    </div>
  )
}