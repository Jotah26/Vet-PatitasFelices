import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../data/store'
import { d, fmtCorto, hoy, moneda, nombreMes, partes, sumarDias } from '../../data/fechas'
import { Button, PageHeader } from '../../components/ui'
import { CalendarIcon, MoneyIcon, PawIcon, PlusIcon, UsersIcon } from '../../components/icons'
import { Alertas, Bloque, Metricas, OcupacionSemanal, Ranking } from '../../components/Tablero'
import type { Alerta } from '../../components/Tablero'

export default function VistaAdmin() {
  const datos = useDatos()

  const { mes, ingresos, semana, ocupacion, porServicio, porVet, alertas, cuentasInactivas } = useMemo(() => {
    const p = partes(hoy)
    const desde = hoy.slice(0, 7)
    const pagosMes = datos.pagos.filter((x) => x.fecha.startsWith(desde))
    const diasSemana = Array.from({ length: 7 }, (_, i) => {
      const fecha = sumarDias(hoy, i)
      return {
        dia: new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
        total: datos.citas.filter((c) => c.fecha === fecha && c.estado !== 'Cancelada').length,
      }
    })
    const citasSemana = datos
      .citasEntre(sumarDias(hoy, -6), sumarDias(hoy, 6))
      .filter((c) => c.estado !== 'Cancelada')

    const porServicio = datos.tarifario
      .map((s) => ({
        etiqueta: s.concepto,
        valor: citasSemana
          .filter((c) => c.servicioId === s.id)
          .reduce((suma, c) => suma + (datos.servicio(c.servicioId)?.precio ?? 0), 0),
        extra: `${citasSemana.filter((c) => c.servicioId === s.id).length} citas`,
      }))
      .filter((x) => x.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)

    const vets = datos.usuarios.filter((u) => u.rol === 'vet')
    const porVet = vets
      .map((u) => {
        const suyas = citasSemana.filter((c) => c.vetId === u.id)
        const facturado = suyas.reduce((s, c) => s + (datos.servicio(c.servicioId)?.precio ?? 0), 0)
        return {
          etiqueta: u.nombre,
          valor: suyas.length,
          extra: suyas.length ? `facturado ${moneda(facturado)}` : 'sin citas',
        }
      })
      .sort((a, b) => b.valor - a.valor)

    const inactivas = datos.usuarios.filter((u) => u.estado === 'Inactivo')

    const lista: Alerta[] = [
      ...datos.stockBajo().map((m) => ({
        id: `st${m.id}`,
        titulo: `${m.nombre} por agotarse`,
        detalle: (
          <span>
            <span className={m.stock <= m.stockMin ? 'font-bold' : 'font-semibold'}>
              Stock: {m.stock}
            </span>{' '}
            · <span className="font-semibold">Stock mínimo: {m.stockMin}</span>
          </span>
        ),
        badge: 'Reponer stock',
        link: '/medicamentos',
        textoLink: 'Modificar stock',
        iconoLink: <PlusIcon className="h-3.5 w-3.5" />,
      })),
      ...datos.citas.some((c) => c.estado === 'Confirmada' && c.fecha === hoy)
        ? []
        : [
            {
              id: 'sc',
              titulo: 'Sin citas confirmadas para hoy',
              detalle: 'La agenda del día todavía no tiene citas confirmadas.',
              badge: 'Agenda',
              link: '/citas',
              textoLink: 'Abrir agenda',
            },
          ],
      ...datos.tarifario
        .filter((s) => !s.activo)
        .map((s) => ({
          id: `tf${s.id}`,
          titulo: `Servicio inactivo: ${s.concepto}`,
          detalle: 'Está oculto del tarifario y no se puede agendar.',
          badge: 'Tarifario',
          link: '/tarifario',
          textoLink: 'Revisar tarifario',
        })),
    ]

    return {
      mes: nombreMes(p.mes),
      ingresos: pagosMes.reduce((suma, x) => suma + Number(x.monto), 0),
      semana: diasSemana,
      ocupacion: citasSemana.length,
      porServicio,
      porVet,
      alertas: lista,
      cuentasInactivas: inactivas,
    }
  }, [datos])

  

  const resumen: [string, number][] = [
    ['Atenciones registradas', datos.consultas.length],
    ['Recetas emitidas', datos.recetas.length],
    ['Vacunas controladas', datos.vacunas.length],
    ['Solicitudes abiertas', datos.solicitudes.filter((s) => s.estado === 'Pendiente').length],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel administrativo"
        action={
          <div className="flex gap-2">
            <Link to="/tarifario">
              <Button variant="secondary" size="sm">
                Tarifario
              </Button>
            </Link>
            <Link to="/usuarios">
              <Button size="sm">Cuentas del personal</Button>
            </Link>
          </div>
        }
      />

      <Metricas
        items={[
          {
            icono: <MoneyIcon className="h-5 w-5" />,
            etiqueta: `Ingresos de ${mes}`,
            valor: moneda(ingresos),
            detalle: `${datos.pagos.filter((x) => x.fecha.startsWith(hoy.slice(0, 7))).length} cobros del mes`,
            acento: 'bg-emerald-100 text-emerald-700',
          },
          {
            icono: <CalendarIcon className="h-5 w-5" />,
            etiqueta: 'Citas ±3 días',
            valor: ocupacion,
            detalle: 'Agenda confirmada y atendida',
            acento: 'bg-sky-100 text-sky-700',
          },
          {
            icono: <PawIcon className="h-5 w-5" />,
            etiqueta: 'Pacientes',
            valor: datos.mascotas.length,
            detalle: `${datos.propietarios.length} familias registradas`,
            acento: 'bg-primary-100 text-primary-700',
          },
          {
            icono: <UsersIcon className="h-5 w-5" />,
            etiqueta: 'Personal activo',
            valor: datos.usuarios.filter((u) => u.estado === 'Activo' && u.rol !== 'propietario').length,
            detalle: cuentasInactivas.length
              ? `${cuentasInactivas.length} cuenta(s) inactiva(s)`
              : 'Todas las cuentas habilitadas',
            acento: 'bg-amber-100 text-amber-700',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Bloque
          titulo="Ocupación de la semana"
          descripcion="Citas por día, sin contar canceladas"
          className="xl:col-span-2"
        >
          <div className="px-5 pb-5">
            <OcupacionSemanal dias={semana} />
          </div>
        </Bloque>

        <Alertas
          titulo="Alertas de inventario"
          subtitulo="Medicamentos con stock mínimo"
          peligro
          alertas={alertas}
          accion={
            <Link to="/medicamentos" className="text-xs font-semibold text-primary-600">
              Ver todo
            </Link>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ranking titulo="Ingresos por servicio" subtitulo="Facturación de la semana" filas={porServicio} formato="moneda" />
        <Ranking titulo="Carga por veterinario" subtitulo="Citas asignadas en la semana" filas={porVet} clase="bg-sky-500" />
      </div>

      <Bloque
        titulo="Resumen del periodo"
        descripcion="Lectura rápida del estado de la clínica"
        accion={
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {fmtCorto(d(-30))} → {fmtCorto(d(30))}
          </span>
        }
      >
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          {resumen.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="bg-white px-5 py-4">
              <p className="text-xs font-medium text-slate-400">{etiqueta}</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{valor}</p>
            </div>
          ))}
        </div>
      </Bloque>

      {cuentasInactivas.length > 0 && (
        <Alertas
          titulo="Cuentas suspendidas"
          subtitulo="Personal sin acceso al sistema"
          peligro
          alertas={cuentasInactivas.map((u) => ({
            id: `cu${u.id}`,
            titulo: u.nombre,
            detalle: `${u.email} · rol ${u.rol}`,
            badge: 'Inactivo',
            link: '/usuarios',
            textoLink: 'Gestionar acceso',
          }))}
        />
      )}
    </div>
  )
}
