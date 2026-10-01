/* Tipos del dominio: entidades, estados y forma del store. */

/* ---------- Roles ---------- */

export type RolClave = 'admin' | 'vet' | 'recepcionista' | 'asistente' | 'propietario'

export interface RolMeta {
  label: string
  corto: string
  resumen: string
  color: string
  punto: string
  pastilla: string
  texto: string
  suave: string
  borde: string
  anillo: string
  barra: string
  home: string
}

/* ---------- Estados y catálogos cerrados ---------- */

export type EstadoUsuario = 'Activo' | 'Inactivo'
export type EstadoCita = 'Pendiente' | 'Confirmada' | 'En sala' | 'Atendida' | 'Cancelada'
export type EstadoSolicitud = 'Pendiente' | 'Aceptada' | 'Rechazada'
export type EstadoConsulta = 'Completada' | 'En seguimiento'
export type EstadoReceta = 'Emitida' | 'Dispensada'
export type EstadoVacuna = 'alDia' | 'proxima' | 'vencida' | 'hoy'
export type MetodoPago = 'Yape' | 'Efectivo' | 'Tarjeta' | 'Transferencia'
export type Especie = 'Perro' | 'Gato' | 'Ave' | 'Roedor' | 'Reptil' | 'Otro'
export type Sexo = 'Macho' | 'Hembra'
export type TipoAtencion =
  | 'Consulta general'
  | 'Vacunación'
  | 'Control / seguimiento'
  | 'Cirugía'
  | 'Urgencia'
  | 'Desparasitación'
export type CategoriaMedicamento =
  | 'Antialérgico'
  | 'Antibiótico'
  | 'Antiparasitario'
  | 'Antipulgas'
  | 'Insumo'
  | 'Vacuna'

/* Entidades. Los campos con `?` no los trae la semilla. */

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: RolClave
  estado: EstadoUsuario
  /** Solo en cuentas de tipo `propietario`: apunta a propietarios.id. */
  propietarioId?: number
}

export interface Propietario {
  id: number
  nombre: string
  dni: string
  telefono: string
  email: string
  direccion: string
}

export interface Mascota {
  id: number
  nombre: string
  especie: Especie
  raza: string
  sexo: Sexo
  edad: string
  color: string
  peso: string
  esterilizado: boolean
  propietarioId: number
  antecedentes: string
  /** Data URL. Solo existe si el usuario subió una foto. */
  foto?: string
}

/** El tarifario usa `concepto`, no `nombre`. */
export interface Servicio {
  id: number
  concepto: string
  descripcion: string
  precio: number
  duracion: number
  activo: boolean
}

export interface Cita {
  id: number
  fecha: string
  hora: string
  mascotaId: number
  servicioId: number
  vetId: number
  motivo: string
  estado: EstadoCita
  /** Los escribe el reducer de caja, no la semilla. */
  pagada?: boolean
  /** Los escribe `registrarAtencion`, no la semilla. */
  atendida?: boolean
  consultaId?: number
  /** Cómo entró la cita. El store lo rellena en las que nacen de una solicitud. */
  origen?: string
}

export interface Solicitud {
  id: number
  propietarioId: number
  mascotaId: number
  fecha: string
  hora: string
  /** El portal permite solicitar sin elegir servicio. */
  servicioId: number | null
  motivo: string
  estado: EstadoSolicitud
  creada: string
  resuelta?: string
  motivoRechazo?: string
  citaId?: number
}

export interface Consulta {
  id: number
  mascotaId: number
  fecha: string
  vetId: number
  tipo: TipoAtencion
  diagnostico: string
  tratamiento: string
  recomendaciones: string
  estado: EstadoConsulta
  /** Nombres de archivo, no los objetos. */
  archivos: string[]
  /** Los escribe `registrarAtencion`, no la semilla. */
  archivoIds?: number[]
}

/** `nombre` es texto libre: existen variantes como "Triple felina (1.ª dosis)". */
export interface Vacuna {
  id: number
  mascotaId: number
  nombre: string
  fecha: string
  proxima: string
  aplicadaPorId?: number
  lote?: string
}

export interface ItemReceta {
  medicamento: string
  dosis: string
  dias: number
}

export interface Receta {
  id: number
  mascotaId: number
  fecha: string
  vetId: number
  /** Solo si la receta nació de una atención; desde la página de recetas no hay consulta. */
  consultaId?: number
  items: ItemReceta[]
  estado: EstadoReceta
  /** La captura el formulario de recetas; la semilla no la trae. */
  indicaciones?: string
}

/** Una receta con los nombres ya resueltos, tal como la imprime el
 *  documento descargable. El store expone `recetaImprimible` para armarla. */
export interface RecetaImprimible {
  codigo: string
  fecha: string
  mascota: string
  propietario: string
  raza: string
  peso: string
  vet: string
  items: ItemReceta[]
}

export interface Medicamento {
  id: number
  nombre: string
  categoria: CategoriaMedicamento
  presentacion: string
  stock: number
  stockMin: number
  precio: number
  /** Los tres siguientes no están en ningún registro semilla. */
  principioActivo?: string
  lote?: string
  vencimiento?: string
}

export interface Pago {
  id: number
  citaId?: number
  fecha: string
  hora: string
  metodo: MetodoPago
  monto: number
  /** `null` en pagos en efectivo sin comprobante. */
  referencia: string | null
}

export interface Archivo {
  id: number
  consultaId: number
  fecha: string
  nombre: string
  tipo: string
  dataUrl: string
}

/** Un adjunto tal como lo maneja `FileUpload`: el id es de texto mientras el
 *  archivo no entra al store (allí el store le asigna un id numérico). */
export interface Adjunto {
  id: string | number
  nombre: string
  tipo: string
  dataUrl: string
  tamano?: number
  fecha?: string
}

/* ---------- Estado completo ---------- */

export interface Estado {
  usuarios: Usuario[]
  /** Correo de la cuenta demo -> id de usuario. */
  cuentasDemo: Record<string, number>
  tarifario: Servicio[]
  propietarios: Propietario[]
  mascotas: Mascota[]
  citas: Cita[]
  solicitudes: Solicitud[]
  consultas: Consulta[]
  vacunas: Vacuna[]
  recetas: Receta[]
  medicamentos: Medicamento[]
  pagos: Pago[]
  archivos: Archivo[]
  recordatoriosEnviados: Record<string, string>
  fechaInstalacion: string
}

/* ---------- Cargas de alta (el id lo pone el store) ---------- */

export type NuevaCita = Omit<Cita, 'id' | 'estado'> & { estado?: EstadoCita }
export type NuevaSolicitud = Omit<Solicitud, 'id' | 'estado' | 'creada'> & {
  estado?: EstadoSolicitud
  creada?: string
}
export type NuevaVacuna = Omit<Vacuna, 'id' | 'fecha'> & { fecha?: string }
export type NuevaReceta = Omit<Receta, 'id' | 'fecha' | 'estado'> & {
  fecha?: string
  estado?: EstadoReceta
}
export type NuevoPago = Omit<Pago, 'id' | 'fecha' | 'hora' | 'referencia'> & {
  fecha?: string
  hora?: string
  referencia?: string | null
}
export type NuevoServicio = Omit<Servicio, 'id' | 'activo'> & { activo?: boolean }

/* ---------- Atención veterinaria (la acción que hace la cascada) ---------- */

export interface VacunaAplicada {
  nombre: string
  lote?: string
  proxima?: string
}

export interface RecetaEmitida {
  items: ItemReceta[]
  indicaciones?: string
}

export interface PayloadAtencion {
  mascotaId: number
  tipo: TipoAtencion
  diagnostico: string
  tratamiento: string
  recomendaciones: string
  vacunas?: VacunaAplicada[]
  receta?: RecetaEmitida | null
  archivos?: Adjunto[]
  vetId: number
  /** Si viene informado, el store agenda además la cita de control. */
  proximaControl?: string | null
}

/* ---------- Recordatorios ---------- */

export type ClaseRecordatorio = 'vacuna' | 'cita'

export interface Recordatorio {
  clave: string
  clase: ClaseRecordatorio
  mascotaId: number
  titulo: string
  detalle: string
  fecha: string
  dias: number
  enviado: boolean
}

/* ---------- Acciones del reducer ---------- */

export type Accion =
  | { tipo: 'USUARIO_CREAR'; datos: Omit<Usuario, 'id'> }
  | { tipo: 'USUARIO_ACTUALIZAR'; datos: { id: number; cambios: Partial<Usuario> } }
  | { tipo: 'USUARIO_ELIMINAR'; datos: { id: number } }
  | { tipo: 'PROPIETARIO_CREAR'; datos: Omit<Propietario, 'id'> }
  | { tipo: 'PROPIETARIO_ACTUALIZAR'; datos: { id: number; cambios: Partial<Propietario> } }
  | { tipo: 'PROPIETARIO_ELIMINAR'; datos: { id: number } }
  | { tipo: 'MASCOTA_CREAR'; datos: Omit<Mascota, 'id'> }
  | { tipo: 'MASCOTA_ACTUALIZAR'; datos: { id: number; cambios: Partial<Mascota> } }
  | { tipo: 'MASCOTA_ELIMINAR'; datos: { id: number } }
  | { tipo: 'SERVICIO_CREAR'; datos: NuevoServicio }
  | { tipo: 'SERVICIO_ACTUALIZAR'; datos: { id: number; cambios: Partial<Servicio> } }
  | { tipo: 'SERVICIO_ELIMINAR'; datos: { id: number } }
  | { tipo: 'CITA_CREAR'; datos: NuevaCita }
  | { tipo: 'CITA_ACTUALIZAR'; datos: { id: number; cambios: Partial<Cita> } }
  | { tipo: 'CITA_ESTADO'; datos: { id: number; estado: EstadoCita } }
  | { tipo: 'CITA_ELIMINAR'; datos: { id: number } }
  | { tipo: 'SOLICITUD_CREAR'; datos: NuevaSolicitud }
  | { tipo: 'SOLICITUD_ACEPTAR'; datos: { id: number; vetId: number } }
  | { tipo: 'SOLICITUD_RECHAZAR'; datos: { id: number; motivo: string } }
  | { tipo: 'SOLICITUD_ELIMINAR'; datos: { id: number } }
  | { tipo: 'VACUNA_CREAR'; datos: NuevaVacuna }
  | { tipo: 'VACUNA_ELIMINAR'; datos: { id: number } }
  | { tipo: 'RECETA_CREAR'; datos: NuevaReceta }
  | { tipo: 'RECETA_ESTADO'; datos: { id: number; estado: EstadoReceta } }
  | { tipo: 'RECETA_ELIMINAR'; datos: { id: number } }
  | { tipo: 'MEDICAMENTO_CREAR'; datos: Omit<Medicamento, 'id'> }
  | { tipo: 'MEDICAMENTO_ACTUALIZAR'; datos: { id: number; cambios: Partial<Medicamento> } }
  | { tipo: 'MEDICAMENTO_ELIMINAR'; datos: { id: number } }
  | { tipo: 'MEDICAMENTO_REPONER'; datos: { id: number; cantidad: number } }
  | { tipo: 'PAGO_CREAR'; datos: NuevoPago }
  | { tipo: 'PAGO_ANULAR'; datos: { id: number; citaId?: number } }
  | { tipo: 'RECORDATORIO_ALTERNAR'; datos: { clave: string } }
  | { tipo: 'ARCHIVO_ELIMINAR'; datos: { id: number } }
  | { tipo: 'ATENCION_REGISTRAR'; datos: PayloadAtencion }
  | { tipo: 'RESTABLECER' }

/* ---------- API del store ---------- */

export interface DatosApi extends Estado {
  reiniciar: () => void

  /* Consultas por id. Devuelven `undefined` si no existe. */
  usuario: (id: number | null | undefined) => Usuario | undefined
  mascota: (id: number | null | undefined) => Mascota | undefined
  propietario: (id: number | null | undefined) => Propietario | undefined
  servicio: (id: number | null | undefined) => Servicio | undefined
  cita: (id: number | null | undefined) => Cita | undefined
  duenioDe: (mascotaId: number | null | undefined) => Propietario | undefined

  /* Nombres legibles, con "—" como reserva. */
  nombreMascota: (id: number | null | undefined) => string
  nombrePropietario: (id: number | null | undefined) => string
  nombreServicio: (id: number | null | undefined) => string
  nombreVet: (id: number | null | undefined) => string

  /* Listas por id. */
  mascotasDe: (propietarioId: number | null | undefined) => Mascota[]
  citasDe: (mascotaId: number) => Cita[]
  consultasDe: (mascotaId: number) => Consulta[]
  vacunasDe: (mascotaId: number) => Vacuna[]
  recetasDe: (mascotaId: number) => Receta[]

  /* Listas derivadas. */
  citasDeHoy: () => Cita[]
  citasEntre: (desde: string, hasta: string) => Cita[]
  pagoDe: (citaId: number) => Pago | undefined
  porCobrar: () => Cita[]
  stockBajo: () => Medicamento[]
  estadoVacuna: (proxima: string) => EstadoVacuna
  pagosDe: (desde: string, hasta: string) => Pago[]
  totalPagado: (pagos: Pago[]) => number
  /** Enriquece una receta con mascota, propietario y veterinario ya resueltos. */
  recetaImprimible: (receta: Receta) => RecetaImprimible

  /* Mutaciones. */
  registrarAtencion: (payload: PayloadAtencion) => void
  crearCita: (payload: NuevaCita) => void
  actualizarCita: (id: number, cambios: Partial<Cita>) => void
  cambiarEstadoCita: (id: number, estado: EstadoCita) => void
  cancelarCita: (id: number) => void
  solicitarCita: (payload: NuevaSolicitud) => void
  aceptarSolicitud: (id: number, vetId: number) => void
  rechazarSolicitud: (id: number, motivo: string) => void
  crearMascota: (payload: Omit<Mascota, 'id'>) => void
  actualizarMascota: (id: number, cambios: Partial<Mascota>) => void
  eliminarMascota: (id: number) => void
  crearPropietario: (payload: Omit<Propietario, 'id'>) => void
  actualizarPropietario: (id: number, cambios: Partial<Propietario>) => void
  eliminarPropietario: (id: number) => void
  crearUsuario: (payload: Omit<Usuario, 'id'>) => void
  actualizarUsuario: (id: number, cambios: Partial<Usuario>) => void
  eliminarUsuario: (id: number) => void
  crearServicio: (payload: NuevoServicio) => void
  actualizarServicio: (id: number, cambios: Partial<Servicio>) => void
  eliminarServicio: (id: number) => void
  crearMedicamento: (payload: Omit<Medicamento, 'id'>) => void
  actualizarMedicamento: (id: number, cambios: Partial<Medicamento>) => void
  eliminarMedicamento: (id: number) => void
  reponerMedicamento: (id: number, cantidad: number) => void
  registrarVacuna: (payload: NuevaVacuna) => void
  eliminarVacuna: (id: number) => void
  crearReceta: (payload: NuevaReceta) => void
  marcarReceta: (id: number, estado: EstadoReceta) => void
  eliminarReceta: (id: number) => void
  registrarPago: (payload: NuevoPago) => void
  anularPago: (id: number, citaId?: number) => void
  alternarRecordatorio: (clave: string) => void
  recordatorios: Recordatorio[]
  eliminarArchivo: (id: number) => void

  semanas: { hoy: string; manana: string; semana: string; mes: string }
}

/* ---------- Autenticación ---------- */

export type ResultadoLogin = { ok: false; error: string } | { ok: true; usuario: Usuario }

export interface AuthApi {
  user: Usuario | null
  perfil: RolMeta | null
  login: (email: string, contrasena: string) => ResultadoLogin
  logout: () => void
  esPropietario: boolean
}

/* ---------- Avisos ---------- */

export type TipoToast = 'exito' | 'error' | 'aviso' | 'info'

export interface ToastOpts {
  tipo?: TipoToast
  titulo: string
  detalle?: string
  ms?: number
}

export interface ToastApi {
  toast: (opts: ToastOpts) => string
  quitar: (id: string) => void
}
