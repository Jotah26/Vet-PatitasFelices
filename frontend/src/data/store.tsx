import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { crearSemilla } from './semilla'
import { hoy, d, diffDias, horaActual, sumarDias } from './fechas'
import { useToast } from '../components/Toast'
import type {
  Accion,
  Archivo,
  Cita,
  Consulta,
  DatosApi,
  Estado,
  Pago,
  PayloadAtencion,
  Receta,
  Recordatorio,
  Servicio,
  Vacuna,
  EstadoVacuna,
} from '../data/types'

/* Se sube la versión cuando cambia la semilla: al abrir la app se descartan los
 * datos guardados con la versión anterior y se regeneran con las fechas al día. */
const clave_bd = 'pf_db_v3'

/** Días hasta la próxima dosis. Solo se detallan los nombres que no siguen
 *  el año por defecto. */
export const dias_vacuna: Record<string, number> = { Antirrábica: 365 }

function siguienteId(coleccion: { id: number }[]) {
  return coleccion.reduce((max, item) => Math.max(max, item.id ?? 0), 0) + 1
}

const colecciones = [
  'usuarios',
  'cuentasDemo',
  'tarifario',
  'propietarios',
  'mascotas',
  'citas',
  'solicitudes',
  'consultas',
  'vacunas',
  'recetas',
  'medicamentos',
  'pagos',
  'archivos',
] as const

function cargar(): Estado {
  try {
    const crudo = localStorage.getItem(clave_bd)
    if (!crudo) return crearSemilla()
    const guardado: unknown = JSON.parse(crudo)
    if (!guardado || typeof guardado !== 'object' || Array.isArray(guardado)) return crearSemilla()
    const base = crearSemilla()
    const migrado = { ...base, ...(guardado as Partial<Estado>) }
    for (const clave of colecciones) {
      if (!Array.isArray(migrado[clave])) {
        Object.assign(migrado, { [clave]: base[clave] })
      }
    }
    const enviados = migrado.recordatoriosEnviados
    if (!enviados || typeof enviados !== 'object' || Array.isArray(enviados)) {
      migrado.recordatoriosEnviados = {}
    }
    return migrado
  } catch {
    return crearSemilla()
  }
}

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    /* ---------- Usuarios ---------- */
    case 'USUARIO_CREAR':
      return {
        ...estado,
        usuarios: [...estado.usuarios, { id: siguienteId(estado.usuarios), ...accion.datos }],
      }
    case 'USUARIO_ACTUALIZAR':
      return {
        ...estado,
        usuarios: estado.usuarios.map((u) => (u.id === accion.datos.id ? { ...u, ...accion.datos.cambios } : u)),
      }
    case 'USUARIO_ELIMINAR':
      return { ...estado, usuarios: estado.usuarios.filter((u) => u.id !== accion.datos.id) }

    /* ---------- Propietarios ---------- */
    case 'PROPIETARIO_CREAR':
      return {
        ...estado,
        propietarios: [...estado.propietarios, { id: siguienteId(estado.propietarios), ...accion.datos }],
      }
    case 'PROPIETARIO_ACTUALIZAR':
      return {
        ...estado,
        propietarios: estado.propietarios.map((p) =>
          p.id === accion.datos.id ? { ...p, ...accion.datos.cambios } : p,
        ),
      }
    case 'PROPIETARIO_ELIMINAR':
      return {
        ...estado,
        propietarios: estado.propietarios.filter((p) => p.id !== accion.datos.id),
        mascotas: estado.mascotas.filter((m) => m.propietarioId !== accion.datos.id),
      }

    /* ---------- Mascotas ---------- */
    case 'MASCOTA_CREAR':
      return { ...estado, mascotas: [...estado.mascotas, { id: siguienteId(estado.mascotas), ...accion.datos }] }
    case 'MASCOTA_ACTUALIZAR':
      return {
        ...estado,
        mascotas: estado.mascotas.map((m) => (m.id === accion.datos.id ? { ...m, ...accion.datos.cambios } : m)),
      }
    case 'MASCOTA_ELIMINAR':
      return {
        ...estado,
        mascotas: estado.mascotas.filter((m) => m.id !== accion.datos.id),
        citas: estado.citas.filter((c) => c.mascotaId !== accion.datos.id),
        consultas: estado.consultas.filter((c) => c.mascotaId !== accion.datos.id),
        vacunas: estado.vacunas.filter((v) => v.mascotaId !== accion.datos.id),
        recetas: estado.recetas.filter((r) => r.mascotaId !== accion.datos.id),
      }

    /* ---------- Tarifario ---------- */
    case 'SERVICIO_CREAR':
      return {
        ...estado,
        tarifario: [...estado.tarifario, { id: siguienteId(estado.tarifario), activo: true, ...accion.datos }],
      }
    case 'SERVICIO_ACTUALIZAR':
      return {
        ...estado,
        tarifario: estado.tarifario.map((s) => (s.id === accion.datos.id ? { ...s, ...accion.datos.cambios } : s)),
      }
    case 'SERVICIO_ELIMINAR':
      return { ...estado, tarifario: estado.tarifario.filter((s) => s.id !== accion.datos.id) }

    /* ---------- Citas ---------- */
    case 'CITA_CREAR':
      return { ...estado, citas: [...estado.citas, { id: siguienteId(estado.citas), estado: 'Pendiente', ...accion.datos }] }
    case 'CITA_ACTUALIZAR':
      return {
        ...estado,
        citas: estado.citas.map((c) => (c.id === accion.datos.id ? { ...c, ...accion.datos.cambios } : c)),
      }
    case 'CITA_ESTADO':
      return {
        ...estado,
        citas: estado.citas.map((c) => (c.id === accion.datos.id ? { ...c, estado: accion.datos.estado } : c)),
      }
    case 'CITA_ELIMINAR':
      return { ...estado, citas: estado.citas.filter((c) => c.id !== accion.datos.id) }

    /* ---------- Solicitudes de cita (portal del dueño) ---------- */
    case 'SOLICITUD_CREAR':
      return {
        ...estado,
        solicitudes: [...estado.solicitudes, { id: siguienteId(estado.solicitudes), estado: 'Pendiente', creada: hoy, ...accion.datos }],
      }
    case 'SOLICITUD_ACEPTAR': {
        const solicitud = estado.solicitudes.find((s) => s.id === accion.datos.id)
        if (!solicitud) return estado
        const servicioPorDefecto =
          solicitud.servicioId ??
          estado.tarifario.find((s) => s.activo)?.id ??
          estado.tarifario[0]?.id ??
          0
        const cita: Cita = {
          id: siguienteId(estado.citas),
          fecha: solicitud.fecha,
          hora: solicitud.hora,
          mascotaId: solicitud.mascotaId,
          servicioId: servicioPorDefecto,
        vetId: accion.datos.vetId,
        motivo: solicitud.motivo,
        estado: 'Confirmada',
        origen: 'Portal del propietario',
      }
      return {
        ...estado,
        citas: [...estado.citas, cita],
        solicitudes: estado.solicitudes.map((s) =>
          s.id === accion.datos.id ? { ...s, estado: 'Aceptada', resuelta: hoy, citaId: cita.id } : s,
        ),
      }
    }
    case 'SOLICITUD_RECHAZAR':
      return {
        ...estado,
        solicitudes: estado.solicitudes.map((s) =>
          s.id === accion.datos.id ? { ...s, estado: 'Rechazada', resuelta: hoy, motivoRechazo: accion.datos.motivo } : s,
        ),
      }
    case 'SOLICITUD_ELIMINAR':
      return { ...estado, solicitudes: estado.solicitudes.filter((s) => s.id !== accion.datos.id) }

    /* ---------- Vacunas ---------- */
    case 'VACUNA_CREAR':
      return { ...estado, vacunas: [...estado.vacunas, { id: siguienteId(estado.vacunas), fecha: hoy, ...accion.datos }] }
    case 'VACUNA_ELIMINAR':
      return { ...estado, vacunas: estado.vacunas.filter((v) => v.id !== accion.datos.id) }

    /* ---------- Recetas ---------- */
    case 'RECETA_CREAR':
      return {
        ...estado,
        recetas: [...estado.recetas, { id: siguienteId(estado.recetas), fecha: hoy, estado: 'Emitida', ...accion.datos }],
      }
    case 'RECETA_ESTADO':
      return {
        ...estado,
        recetas: estado.recetas.map((r) => (r.id === accion.datos.id ? { ...r, estado: accion.datos.estado } : r)),
      }
    case 'RECETA_ELIMINAR':
      return { ...estado, recetas: estado.recetas.filter((r) => r.id !== accion.datos.id) }

    /* ---------- Inventario ---------- */
    case 'MEDICAMENTO_CREAR':
      return {
        ...estado,
        medicamentos: [...estado.medicamentos, { id: siguienteId(estado.medicamentos), ...accion.datos }],
      }
    case 'MEDICAMENTO_ACTUALIZAR':
      return {
        ...estado,
        medicamentos: estado.medicamentos.map((m) =>
          m.id === accion.datos.id ? { ...m, ...accion.datos.cambios } : m,
        ),
      }
    case 'MEDICAMENTO_ELIMINAR':
      return { ...estado, medicamentos: estado.medicamentos.filter((m) => m.id !== accion.datos.id) }
    case 'MEDICAMENTO_REPONER':
      return {
        ...estado,
        medicamentos: estado.medicamentos.map((m) =>
          m.id === accion.datos.id ? { ...m, stock: m.stock + accion.datos.cantidad } : m,
        ),
      }

    /* ---------- Caja ---------- */
      case 'PAGO_CREAR': {
        const nuevo: Pago = {
          id: siguienteId(estado.pagos),
          fecha: hoy,
          hora: horaActual(),
          referencia: null,
          ...accion.datos,
        }
      const citas =
        accion.datos.citaId != null
          ? estado.citas.map((c) => (c.id === accion.datos.citaId ? { ...c, pagada: true } : c))
          : estado.citas
      return { ...estado, pagos: [...estado.pagos, nuevo], citas }
    }
    case 'PAGO_ANULAR':
      return {
        ...estado,
        pagos: estado.pagos.filter((p) => p.id !== accion.datos.id),
        citas: estado.citas.map((c) => (c.id === accion.datos.citaId ? { ...c, pagada: false } : c)),
      }

    /* ---------- Recordatorios ---------- */
    case 'RECORDATORIO_ALTERNAR': {
      const enviados = { ...estado.recordatoriosEnviados }
      if (enviados[accion.datos.clave]) delete enviados[accion.datos.clave]
      else enviados[accion.datos.clave] = hoy
      return { ...estado, recordatoriosEnviados: enviados }
    }

    /* ---------- Archivos sueltos ---------- */
    case 'ARCHIVO_ELIMINAR':
      return { ...estado, archivos: estado.archivos.filter((a) => a.id !== accion.datos.id) }

    case 'RESTABLECER':
      return crearSemilla()

    default:
      return estado
  }
}

function registrarAtencion(estado: Estado, datos: PayloadAtencion): Estado {
  const {
    mascotaId, tipo, diagnostico, tratamiento, recomendaciones,
    vacunas = [], receta = null, archivos = [], vetId, proximaControl = null,
  } = datos

  const mascota = estado.mascotas.find((m) => m.id === mascotaId)
  if (!mascota) return estado

  const consultaId = siguienteId(estado.consultas)

  let archivosFinales = estado.archivos
  const archivosIds: number[] = []
  if (archivos.length) {
    let ultimo = siguienteId(archivosFinales)
    const nuevos: Archivo[] = archivos.map((a) => ({
      id: ultimo++,
      consultaId,
      fecha: hoy,
      nombre: a.nombre,
      tipo: a.tipo,
      dataUrl: a.dataUrl,
    }))
    archivosIds.push(...nuevos.map((a) => a.id))
    archivosFinales = [...archivosFinales, ...nuevos]
  }

  const consulta: Consulta = {
    id: consultaId,
    mascotaId,
    fecha: hoy,
    vetId,
    tipo,
    diagnostico,
    tratamiento,
    recomendaciones,
    estado: 'Completada',
    archivos: archivos.map((a) => a.nombre),
    archivoIds: archivosIds,
  }

  const baseVacuna = siguienteId(estado.vacunas)
  const vacunasCreadas: Vacuna[] = vacunas.map((v, i) => ({
    id: baseVacuna + i,
    mascotaId,
    fecha: hoy,
    aplicadaPorId: vetId,
    lote: v.lote ?? '—',
    nombre: v.nombre,
    proxima: v.proxima ?? sumarDias(hoy, dias_vacuna[v.nombre] ?? 365),
  }))

  const recetaConItems = receta && receta.items.length > 0
  const recetasFinales: Receta[] = recetaConItems
    ? [
        ...estado.recetas,
        {
          id: siguienteId(estado.recetas),
          mascotaId,
          fecha: hoy,
          vetId,
          consultaId,
            items: receta.items,
            indicaciones: receta.indicaciones,
            estado: 'Emitida',
        },
      ]
    : estado.recetas

  const medicamentosFinales = recetaConItems
    ? estado.medicamentos.map((med) => {
        const item = receta.items.find((i) => i.medicamento === med.nombre)
        return item ? { ...med, stock: Math.max(0, med.stock - 1) } : med
      })
    : estado.medicamentos

  const citasAtendidas = estado.citas.map((c) =>
    c.mascotaId === mascotaId && c.fecha === hoy && !c.atendida
      ? { ...c, atendida: true, estado: 'Atendida' as const, consultaId }
      : c,
  )

  const citasFinales: Cita[] = proximaControl
    ? [
        ...citasAtendidas,
        {
          id: siguienteId(estado.citas),
          fecha: proximaControl,
          hora: '09:00',
          mascotaId,
          servicioId: servicioControl(estado.tarifario),
          vetId,
          motivo: 'Control de seguimiento',
          estado: 'Confirmada',
          origen: 'Registro de atención',
        },
      ]
    : citasAtendidas

  return {
    ...estado,
    archivos: archivosFinales,
    consultas: [...estado.consultas, consulta],
    vacunas: [...estado.vacunas, ...vacunasCreadas],
    recetas: recetasFinales,
    medicamentos: medicamentosFinales,
    citas: citasFinales,
  }
}

function servicioControl(tarifario: Servicio[]): number {
  const control = tarifario.find((s) => s.concepto.toLowerCase().includes('control'))
  return (control ?? tarifario.find((s) => s.activo) ?? tarifario[0])?.id ?? 1
}

const Contexto = createContext<DatosApi | null>(null)

function reducerRaiz(estado: Estado, accion: Accion): Estado {
  return accion.tipo === 'ATENCION_REGISTRAR' ? registrarAtencion(estado, accion.datos) : reducer(estado, accion)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducerRaiz, undefined, cargar)
  const { toast } = useToast()
  const primerRender = useRef(true)

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    try {
      localStorage.setItem(clave_bd, JSON.stringify(estado))
    } catch {
      toast({
        tipo: 'error',
        titulo: 'Almacenamiento lleno',
        detalle: 'No se pudo guardar. Elimine algún archivo adjunto o reinicie los datos.',
      })
    }
  }, [estado, toast])

  const api = useMemo<DatosApi>(() => {
    const usuario = (id: number | null | undefined) => estado.usuarios.find((u) => u.id === id)
    const mascota = (id: number | null | undefined) => estado.mascotas.find((m) => m.id === id)
    const propietario = (id: number | null | undefined) => estado.propietarios.find((p) => p.id === id)
    const servicio = (id: number | null | undefined) => estado.tarifario.find((s) => s.id === id)
    const duenioDe = (mascotaId: number | null | undefined) => propietario(mascota(mascotaId)?.propietarioId)

    return {
      ...estado,
      reiniciar: () => dispatch({ tipo: 'RESTABLECER' }),

      usuario,
      mascota,
      propietario,
      servicio,
      cita: (id) => estado.citas.find((c) => c.id === id),
      duenioDe,
      nombreMascota: (id) => mascota(id)?.nombre ?? '—',
      nombrePropietario: (id) => propietario(id)?.nombre ?? '—',
      nombreServicio: (id) => servicio(id)?.concepto ?? '—',
      nombreVet: (id) => usuario(id)?.nombre ?? '—',

      mascotasDe: (propietarioId) => estado.mascotas.filter((m) => m.propietarioId === propietarioId),
      citasDe: (mascotaId) => estado.citas.filter((c) => c.mascotaId === mascotaId),
      consultasDe: (mascotaId) =>
        estado.consultas.filter((c) => c.mascotaId === mascotaId).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      vacunasDe: (mascotaId) =>
        estado.vacunas.filter((v) => v.mascotaId === mascotaId).sort((a, b) => a.proxima.localeCompare(b.proxima)),
      recetasDe: (mascotaId) =>
        estado.recetas.filter((r) => r.mascotaId === mascotaId).sort((a, b) => b.fecha.localeCompare(a.fecha)),

      citasDeHoy: () => estado.citas.filter((c) => c.fecha === hoy).sort((a, b) => a.hora.localeCompare(b.hora)),
      citasEntre: (desde, hasta) =>
        estado.citas
          .filter((c) => c.fecha >= desde && c.fecha <= hasta)
          .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)),

      pagoDe: (citaId) => estado.pagos.find((p) => p.citaId === citaId),
      porCobrar: () => estado.citas.filter((c) => c.estado === 'Atendida' && !estado.pagos.some((p) => p.citaId === c.id)),
      stockBajo: () => estado.medicamentos.filter((m) => m.stock <= m.stockMin),

      estadoVacuna: (proxima): EstadoVacuna => {
        const n = diffDias(proxima)
        if (n < 0) return 'vencida'
        if (n === 0) return 'hoy'
        if (n <= 30) return 'proxima'
        return 'alDia'
      },

      pagosDe: (desde, hasta) => estado.pagos.filter((p) => p.fecha >= desde && p.fecha <= hasta),
      totalPagado: (pagos) => pagos.reduce((suma, p) => suma + Number(p.monto), 0),

      recetaImprimible: (receta) => {
        const paciente = estado.mascotas.find((m) => m.id === receta.mascotaId)
        return {
          codigo: `REC-${String(receta.id).padStart(3, '0')}`,
          fecha: receta.fecha,
          mascota: paciente?.nombre ?? '—',
          propietario: duenioDe(receta.mascotaId)?.nombre ?? '—',
          raza: paciente?.raza ?? '—',
          peso: paciente?.peso ?? '—',
          vet: usuario(receta.vetId)?.nombre ?? '—',
          items: receta.items,
        }
      },

      registrarAtencion: (payload) => dispatch({ tipo: 'ATENCION_REGISTRAR', datos: payload }),

      crearCita: (payload) => dispatch({ tipo: 'CITA_CREAR', datos: payload }),
      cambiarEstadoCita: (id, estadoCita) => dispatch({ tipo: 'CITA_ESTADO', datos: { id, estado: estadoCita } }),
      actualizarCita: (id, cambios) => dispatch({ tipo: 'CITA_ACTUALIZAR', datos: { id, cambios } }),
      cancelarCita: (id) => dispatch({ tipo: 'CITA_ESTADO', datos: { id, estado: 'Cancelada' } }),

      solicitarCita: (payload) => dispatch({ tipo: 'SOLICITUD_CREAR', datos: payload }),
      aceptarSolicitud: (id, vetId) => dispatch({ tipo: 'SOLICITUD_ACEPTAR', datos: { id, vetId } }),
      rechazarSolicitud: (id, motivo) => dispatch({ tipo: 'SOLICITUD_RECHAZAR', datos: { id, motivo } }),

      crearMascota: (payload) => dispatch({ tipo: 'MASCOTA_CREAR', datos: payload }),
      actualizarMascota: (id, cambios) => dispatch({ tipo: 'MASCOTA_ACTUALIZAR', datos: { id, cambios } }),
      eliminarMascota: (id) => dispatch({ tipo: 'MASCOTA_ELIMINAR', datos: { id } }),

      crearPropietario: (payload) => dispatch({ tipo: 'PROPIETARIO_CREAR', datos: payload }),
      actualizarPropietario: (id, cambios) => dispatch({ tipo: 'PROPIETARIO_ACTUALIZAR', datos: { id, cambios } }),
      eliminarPropietario: (id) => dispatch({ tipo: 'PROPIETARIO_ELIMINAR', datos: { id } }),

      crearUsuario: (payload) => dispatch({ tipo: 'USUARIO_CREAR', datos: payload }),
      actualizarUsuario: (id, cambios) => dispatch({ tipo: 'USUARIO_ACTUALIZAR', datos: { id, cambios } }),
      eliminarUsuario: (id) => dispatch({ tipo: 'USUARIO_ELIMINAR', datos: { id } }),

      crearServicio: (payload) => dispatch({ tipo: 'SERVICIO_CREAR', datos: payload }),
      actualizarServicio: (id, cambios) => dispatch({ tipo: 'SERVICIO_ACTUALIZAR', datos: { id, cambios } }),
      eliminarServicio: (id) => dispatch({ tipo: 'SERVICIO_ELIMINAR', datos: { id } }),

      crearMedicamento: (payload) => dispatch({ tipo: 'MEDICAMENTO_CREAR', datos: payload }),
      actualizarMedicamento: (id, cambios) => dispatch({ tipo: 'MEDICAMENTO_ACTUALIZAR', datos: { id, cambios } }),
      eliminarMedicamento: (id) => dispatch({ tipo: 'MEDICAMENTO_ELIMINAR', datos: { id } }),
      reponerMedicamento: (id, cantidad) => dispatch({ tipo: 'MEDICAMENTO_REPONER', datos: { id, cantidad } }),

      registrarVacuna: (payload) => dispatch({ tipo: 'VACUNA_CREAR', datos: payload }),
      eliminarVacuna: (id) => dispatch({ tipo: 'VACUNA_ELIMINAR', datos: { id } }),

      crearReceta: (payload) => dispatch({ tipo: 'RECETA_CREAR', datos: payload }),
      marcarReceta: (id, estadoReceta) => dispatch({ tipo: 'RECETA_ESTADO', datos: { id, estado: estadoReceta } }),
      eliminarReceta: (id) => dispatch({ tipo: 'RECETA_ELIMINAR', datos: { id } }),

      registrarPago: (payload) => dispatch({ tipo: 'PAGO_CREAR', datos: payload }),
      anularPago: (id, citaId) => dispatch({ tipo: 'PAGO_ANULAR', datos: { id, citaId } }),

      alternarRecordatorio: (clave) => dispatch({ tipo: 'RECORDATORIO_ALTERNAR', datos: { clave } }),
    recordatorios: construirRecordatorios(estado),
      eliminarArchivo: (id) => dispatch({ tipo: 'ARCHIVO_ELIMINAR', datos: { id } }),

      semanas: { hoy: hoy, manana: d(1), semana: d(7), mes: d(30) },
    }
  }, [estado])

  return <Contexto.Provider value={api}>{children}</Contexto.Provider>
}

export function useDatos(): DatosApi {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useDatos debe usarse dentro de DataProvider')
  return ctx
}

/* ---------- Claves de recordatorio ---------- */
const claveVacuna = (v: Vacuna) => `v:${v.mascotaId}:${v.nombre}:${v.proxima}`
const claveCita = (c: Cita) => `c:${c.id}:${c.fecha}`

/* ---------- Lista de recordatorios derivada ---------- */
export function construirRecordatorios(estado: Estado): Recordatorio[] {
  const lista: Recordatorio[] = []

  for (const v of estado.vacunas) {
    if (!v.proxima) continue
    const n = diffDias(v.proxima)
    if (n > 30) continue
    lista.push({
      clave: claveVacuna(v),
      clase: 'vacuna',
      mascotaId: v.mascotaId,
      titulo: v.nombre,
      detalle:
        v.proxima === hoy
          ? 'La dosis vence hoy'
          : n < 0
            ? `Venció ${Math.abs(n)} días atrás`
            : `Vence en ${n} ${n === 1 ? 'día' : 'días'}`,
      fecha: v.proxima,
      dias: n,
      enviado: Boolean(estado.recordatoriosEnviados[claveVacuna(v)]),
    })
  }

  for (const c of estado.citas) {
    if (c.estado === 'Cancelada' || c.estado === 'Atendida') continue
    const n = diffDias(c.fecha)
    if (n < 0 || n > 10) continue
    lista.push({
      clave: claveCita(c),
      clase: 'cita',
      mascotaId: c.mascotaId,
      titulo: c.motivo,
      detalle: `${c.fecha === hoy ? 'Hoy' : n < 0 ? 'Atrasada' : `En ${n} ${n === 1 ? 'día' : 'días'}`} a las ${c.hora}`,
      fecha: c.fecha,
      dias: n,
      enviado: Boolean(estado.recordatoriosEnviados[claveCita(c)]),
    })
  }

  return lista.sort((a, b) => a.dias - b.dias)
}
