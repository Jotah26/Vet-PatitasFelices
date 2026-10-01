import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../data/store'
import { fmtCorto, hoy } from '../../data/fechas'
import { Button, PageHeader } from '../../components/ui'
import { PillIcon, PawIcon, StethoscopeIcon, SyringeIcon } from '../../components/icons'
import { Alertas, Bloque, FilaCita, Metricas } from '../../components/Tablero'

export default function VistaAsistente() {
  const datos = useDatos()

  const { enSala, espera, insumos, recientes } = useMemo(() => {
    const citasHoy = datos.citasDeHoy()
    return {
      enSala: citasHoy.filter((c) => c.estado === 'En sala'),
      espera: citasHoy.filter((c) => c.estado === 'Confirmada' || c.estado === 'Pendiente'),
      insumos: datos.stockBajo(),
      recientes: [...datos.consultas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5),
    }
  }, [datos])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistente veterinario"
      />

      <Metricas
        items={[
          {
            icono: <StethoscopeIcon className="h-5 w-5" />,
            etiqueta: 'En sala',
            valor: enSala.length,
            detalle: enSala.length ? 'Atendiéndose ahora' : 'Ninguna en consulta',
            acento: enSala.length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <PawIcon className="h-5 w-5" />,
            etiqueta: 'En espera',
            valor: espera.length,
            detalle: 'Pendientes de pasar a consulta',
            acento: 'bg-amber-100 text-amber-700',
          },
          {
            icono: <PillIcon className="h-5 w-5" />,
            etiqueta: 'Insumos por reponer',
            valor: insumos.length,
            detalle: insumos.length ? 'Stock en o bajo mínimo' : 'Inventario en nivel sano',
            acento: insumos.length ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <SyringeIcon className="h-5 w-5" />,
            etiqueta: 'Atenciones registradas',
            valor: datos.consultas.length,
            detalle: `${datos.consultas.filter((c) => c.fecha === hoy).length} hoy`,
            acento: 'bg-rose-100 text-rose-700',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Bloque titulo="Sala de espera" descripcion="Pacientes por atender, en orden de hora">
          {espera.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-slate-500">No hay nadie esperando.</p>
          ) : (
            <div className="space-y-1 p-3">
              {espera.map((c) => (
                <FilaCita
                  key={c.id}
                  cita={c}
                  datos={datos}
                  acento="bg-amber-50"
                  accion={
                    <Button size="sm" variant="secondary" onClick={() => datos.cambiarEstadoCita(c.id, 'En sala')}>
                      Llamar
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </Bloque>

        <Alertas
          titulo="Alertas de inventario"
          subtitulo="Medicamentos con stock mínimo"
          peligro
          alertas={insumos.map((m) => ({
            id: `in${m.id}`,
            titulo: m.nombre,
            detalle: `${m.stock} unidades en stock · mínimo ${m.stockMin}`,
            badge: 'Reponer',
          }))}
        >
        </Alertas>
      </div>

      <Bloque
        titulo="Últimas atenciones"
        descripcion="Registro clínico en solo lectura"
        accion={
          <Link to="/historial" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Ver historiales
          </Link>
        }
      >
        <ul className="divide-y divide-slate-100">
          {recientes.map((c) => (
            <li key={c.id}>
              <Link
                to={`/mascotas/${c.mascotaId}`}
                className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {datos.nombreMascota(c.mascotaId)} · {c.diagnostico}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {c.tipo} · {datos.nombreVet(c.vetId)} · {fmtCorto(c.fecha)}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-400">{c.estado}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Bloque>
    </div>
  )
}
