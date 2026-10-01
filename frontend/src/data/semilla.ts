import { hoy, d } from './fechas'
import type {
  Cita,
  Consulta,
  Estado,
  Mascota,
  Medicamento,
  Pago,
  Propietario,
  Receta,
  Servicio,
  Solicitud,
  Usuario,
  Vacuna,
} from '../data/types'

/* Datos iniciales.

   Todas las fechas son relativas a hoy, dentro de una ventana corta: la agenda
   arranca ayer (d(-1)) y llega hasta las próximas fechas, y el historial clínico
   se mantiene en los últimos días. Así los datos de ejemplo siempre se ven
   vigentes, sin registros lejanos ni citas vencidas. */

const equipo: Usuario[] = [
  { id: 1, nombre: 'María Fernández', email: 'admin@patitasfelices.com', rol: 'admin', estado: 'Activo' },
  { id: 2, nombre: 'Dr. Luis Torres', email: 'vet@patitasfelices.com', rol: 'vet', estado: 'Activo' },
  { id: 3, nombre: 'Dra. Carmen Ríos', email: 'carmen.rios@patitasfelices.com', rol: 'vet', estado: 'Activo' },
  { id: 4, nombre: 'Dr. Andrés Vega', email: 'andres.vega@patitasfelices.com', rol: 'vet', estado: 'Activo' },
  { id: 5, nombre: 'Lucía Salazar', email: 'recepcion@patitasfelices.com', rol: 'recepcionista', estado: 'Activo' },
  { id: 6, nombre: 'Sofía Chávez', email: 'sofia.chavez@patitasfelices.com', rol: 'recepcionista', estado: 'Activo' },
  { id: 7, nombre: 'Jorge Paredes', email: 'asistente@patitasfelices.com', rol: 'asistente', estado: 'Activo' },
  { id: 8, nombre: 'Valeria Ruiz', email: 'valeria.ruiz@patitasfelices.com', rol: 'asistente', estado: 'Activo' },
]

const clientes: Usuario[] = [
  { id: 9, nombre: 'Ana Villanueva', email: 'ana.villanueva@gmail.com', rol: 'propietario', estado: 'Activo', propietarioId: 1 },
  { id: 10, nombre: 'Pedro Gutiérrez', email: 'pedro.gutierrez@gmail.com', rol: 'propietario', estado: 'Activo', propietarioId: 2 },
  { id: 11, nombre: 'Rosa Delgado', email: 'rosa.delgado@gmail.com', rol: 'propietario', estado: 'Activo', propietarioId: 3 },
  { id: 12, nombre: 'Carlos Mena', email: 'carlos.mena@gmail.com', rol: 'propietario', estado: 'Inactivo', propietarioId: 4 },
  { id: 13, nombre: 'Luz Huamán', email: 'luz.huaman@gmail.com', rol: 'propietario', estado: 'Activo', propietarioId: 5 },
]

const cuentas_demo: Record<string, number> = {
  'admin@patitasfelices.com': 1,
  'vet@patitasfelices.com': 2,
  'recepcion@patitasfelices.com': 5,
  'asistente@patitasfelices.com': 7,
  'propietario@gmail.com': 9,
}

const tarifario: Servicio[] = [
  { id: 1, concepto: 'Consulta general', descripcion: 'Evaluación clínica completa', precio: 45, duracion: 30, activo: true },
  { id: 2, concepto: 'Vacunación', descripcion: 'Aplicación de una dosis', precio: 35, duracion: 20, activo: true },
  { id: 3, concepto: 'Desparasitación', descripcion: 'Interna y/o externa', precio: 40, duracion: 20, activo: true },
  { id: 4, concepto: 'Control o seguimiento', descripcion: 'Revisión de tratamiento en curso', precio: 30, duracion: 20, activo: true },
  { id: 5, concepto: 'Profilaxis dental', descripcion: 'Limpieza con anestesia', precio: 120, duracion: 60, activo: true },
  { id: 6, concepto: 'Cirugía menor', descripcion: 'Procedimiento con anestesia local', precio: 350, duracion: 90, activo: true },
  { id: 7, concepto: 'Esterilización', descripcion: 'Cirugía con prequirúrgico incluido', precio: 280, duracion: 75, activo: true },
  { id: 8, concepto: 'Urgencia 24 h', descripcion: 'Atención fuera de horario', precio: 80, duracion: 30, activo: true },
  { id: 9, concepto: 'Radiografía', descripcion: 'Placa simple', precio: 60, duracion: 20, activo: true },
]

const propietarios: Propietario[] = [
  { id: 1, nombre: 'Ana Villanueva', dni: '42657381', telefono: '987 654 321', email: 'ana.villanueva@gmail.com', direccion: 'Av. La Marina 2138, San Miguel' },
  { id: 2, nombre: 'Pedro Gutiérrez', dni: '40511290', telefono: '966 203 114', email: 'pedro.gutierrez@gmail.com', direccion: 'Jr. Los Algarrobos 145, San Miguel' },
  { id: 3, nombre: 'Rosa Delgado', dni: '41287756', telefono: '999 881 247', email: 'rosa.delgado@gmail.com', direccion: 'Av. Universitaria 1980, San Miguel' },
  { id: 4, nombre: 'Carlos Mena', dni: '43820915', telefono: '955 330 287', email: 'carlos.mena@gmail.com', direccion: 'Calle Cápac Yupanqui 620, Magdalena' },
  { id: 5, nombre: 'Luz Huamán', dni: '45920738', telefono: '944 512 980', email: 'luz.huaman@gmail.com', direccion: 'Av. Elmer Faucett 120, San Miguel' },
]

const mascotas: Mascota[] = [
  { id: 1, nombre: 'Rocky', especie: 'Perro', raza: 'Mestizo', sexo: 'Macho', edad: '3 años', color: 'Marrón', peso: '18 kg', esterilizado: true, propietarioId: 1, antecedentes: 'Alergia estacional en primavera. Desparasitado cada 3 meses.' },
  { id: 2, nombre: 'Michi', especie: 'Gato', raza: 'Doméstico de pelo corto', sexo: 'Hembra', edad: '2 años', color: 'Negro', peso: '4.2 kg', esterilizado: true, propietarioId: 1, antecedentes: 'Sedentarismo leve, en control de peso.' },
  { id: 3, nombre: 'Thor', especie: 'Perro', raza: 'Golden Retriever', sexo: 'Macho', edad: '5 años', color: 'Dorado', peso: '31 kg', esterilizado: false, propietarioId: 2, antecedentes: 'Dermatitis alérgica en seguimiento. Evitar champús perfumados.' },
  { id: 4, nombre: 'Niebla', especie: 'Gato', raza: 'Siamés', sexo: 'Hembra', edad: '1 año', color: 'Cremoso', peso: '3.1 kg', esterilizado: false, propietarioId: 3, antecedentes: 'Sin antecedentes relevantes.' },
  { id: 5, nombre: 'Copito', especie: 'Perro', raza: 'Poodle', sexo: 'Macho', edad: '4 años', color: 'Blanco', peso: '6.5 kg', esterilizado: true, propietarioId: 3, antecedentes: 'Dermatitis leve por pulgas en 2025.' },
  { id: 6, nombre: 'Milú', especie: 'Perro', raza: 'Beagle', sexo: 'Macho', edad: '2 años', color: 'Tricolor', peso: '12 kg', esterilizado: false, propietarioId: 4, antecedentes: 'Cuidados intensivos respiratorios en septiembre.' },
  { id: 7, nombre: 'Canela', especie: 'Gato', raza: 'Angora turco', sexo: 'Hembra', edad: '6 meses', color: 'Blanco', peso: '2.4 kg', esterilizado: false, propietarioId: 5, antecedentes: 'Cría de la segunda camada de vacunas.' },
]

const citas: Cita[] = [
  /* Ayer: atenciones cerradas */
  { id: 1, fecha: d(-1), hora: '09:00', mascotaId: 1, servicioId: 2, vetId: 2, motivo: 'Control y vacuna antirrábica', estado: 'Atendida' },
  { id: 2, fecha: d(-1), hora: '10:30', mascotaId: 4, servicioId: 3, vetId: 3, motivo: 'Primera consulta y desparasitación', estado: 'Atendida' },
  { id: 3, fecha: d(-1), hora: '16:00', mascotaId: 6, servicioId: 4, vetId: 4, motivo: 'Control de infección respiratoria', estado: 'Cancelada' },

  /* Hoy: sala de espera en marcha */
  { id: 4, fecha: d(0), hora: '09:00', mascotaId: 2, servicioId: 4, vetId: 2, motivo: 'Control de peso mensual', estado: 'Atendida' },
  { id: 5, fecha: d(0), hora: '10:30', mascotaId: 4, servicioId: 4, vetId: 3, motivo: 'Control de la desparasitación', estado: 'Confirmada' },
  { id: 6, fecha: d(0), hora: '11:45', mascotaId: 6, servicioId: 1, vetId: 4, motivo: 'Revisión de la infección respiratoria', estado: 'En sala' },
  { id: 7, fecha: d(0), hora: '15:00', mascotaId: 3, servicioId: 4, vetId: 3, motivo: 'Seguimiento de tratamiento de piel', estado: 'Pendiente' },

  /* Próximos días */
  { id: 8, fecha: d(1), hora: '09:30', mascotaId: 7, servicioId: 7, vetId: 2, motivo: 'Esterilización — prequirúrgico', estado: 'Confirmada' },
  { id: 9, fecha: d(1), hora: '11:00', mascotaId: 1, servicioId: 1, vetId: 4, motivo: 'Revisión de reacción a la vacuna', estado: 'Pendiente' },
  { id: 10, fecha: d(2), hora: '10:00', mascotaId: 5, servicioId: 5, vetId: 3, motivo: 'Profilaxis dental', estado: 'Confirmada' },
  { id: 11, fecha: d(3), hora: '12:00', mascotaId: 6, servicioId: 4, vetId: 2, motivo: 'Segundo control de infección respiratoria', estado: 'Confirmada' },
  { id: 12, fecha: d(4), hora: '17:00', mascotaId: 7, servicioId: 3, vetId: 2, motivo: 'Desparasitación antes de la salida a la playa', estado: 'Pendiente' },
  { id: 13, fecha: d(6), hora: '09:00', mascotaId: 2, servicioId: 4, vetId: 3, motivo: 'Control de peso tras el cambio de dieta', estado: 'Confirmada' },
]

const solicitudes: Solicitud[] = [
  { id: 1, propietarioId: 2, mascotaId: 3, fecha: d(2), hora: '09:00', servicioId: 1, motivo: 'La piel de Thor sigue roja desde la última visita', estado: 'Pendiente', creada: d(-1) },
  { id: 2, propietarioId: 5, mascotaId: 7, fecha: d(4), hora: '11:30', servicioId: 2, motivo: 'Segunda dosis de la triple felina', estado: 'Pendiente', creada: d(-1) },
  { id: 3, propietarioId: 1, mascotaId: 2, fecha: d(1), hora: '18:00', servicioId: 4, motivo: 'Control de peso mensual de Michi', estado: 'Pendiente', creada: d(0) },
  { id: 4, propietarioId: 3, mascotaId: 4, fecha: d(9), hora: '10:00', servicioId: 4, motivo: 'Revisión de la desparasitación aplicada', estado: 'Aceptada', creada: d(-3), resuelta: d(-2) },
  { id: 5, propietarioId: 4, mascotaId: 6, fecha: d(5), hora: '15:00', servicioId: 1, motivo: 'Primera consulta por tos', estado: 'Rechazada', creada: d(-4), resuelta: d(-3), motivoRechazo: 'Ese horario ya está ocupado, se reagendó por teléfono' },
  { id: 6, propietarioId: 1, mascotaId: 1, fecha: d(3), hora: '17:30', servicioId: 9, motivo: 'Radiografía de cadera por cojera', estado: 'Rechazada', creada: d(-2), resuelta: d(-1), motivoRechazo: 'Ese horario está ocupado, se reagendó por teléfono' },
]

const consultas: Consulta[] = [
  { id: 1, mascotaId: 3, fecha: d(-1), vetId: 3, tipo: 'Control / seguimiento', diagnostico: 'Dermatitis alérgica', tratamiento: 'Apoquel 16 mg, 1 tableta cada 12 h por 14 días', recomendaciones: 'Evitar champús perfumados y el pasto del parque.', estado: 'En seguimiento', archivos: ['Radiografía de tórax — Thor.png', 'Receta 003.pdf'] },
  { id: 2, mascotaId: 6, fecha: d(-2), vetId: 2, tipo: 'Consulta general', diagnostico: 'Infección respiratoria leve', tratamiento: 'Amoxicilina + clavulánico 12.5 mg/kg cada 12 h por 7 días', recomendaciones: 'Reposo absoluto y control en 3 días.', estado: 'Completada', archivos: ['Hemograma — Milú.pdf'] },
  { id: 3, mascotaId: 1, fecha: d(-3), vetId: 2, tipo: 'Consulta general', diagnostico: 'Dermatitis por pulgas leve', tratamiento: 'Bravecto 250 mg, 1 tableta al mes', recomendaciones: 'Revisar la piel a los 15 días por la alergia estacional.', estado: 'Completada', archivos: [] },
  { id: 4, mascotaId: 2, fecha: d(-1), vetId: 3, tipo: 'Consulta general', diagnostico: 'Sobrepeso leve', tratamiento: 'Cambio de dieta a alimento light', recomendaciones: 'Control de peso en 7 días.', estado: 'Completada', archivos: [] },
  { id: 5, mascotaId: 5, fecha: d(-4), vetId: 4, tipo: 'Consulta general', diagnostico: 'Otitis externa leve', tratamiento: 'Gotas oticas, 2 ml cada 12 h por 5 días', recomendaciones: 'Secar el conducto auditivo tras el baño.', estado: 'Completada', archivos: [] },
  { id: 6, mascotaId: 7, fecha: d(-2), vetId: 2, tipo: 'Vacunación', diagnostico: 'Tercera dosis de la triple felina', tratamiento: 'Triple felina y antiparasitario interno', recomendaciones: 'Vigilar que no presente reacción en las próximas 24 horas.', estado: 'Completada', archivos: [] },
]

const vacunas: Vacuna[] = [
  { id: 1, mascotaId: 1, nombre: 'Antirrábica', fecha: d(-1), proxima: d(364), aplicadaPorId: 2, lote: 'RB-2291' },
  { id: 2, mascotaId: 3, nombre: 'Polivalente canina', fecha: d(-3), proxima: d(362), aplicadaPorId: 3, lote: 'PC-4412' },
  { id: 3, mascotaId: 7, nombre: 'Triple felina (3.ª dosis)', fecha: d(-2), proxima: d(19), aplicadaPorId: 2, lote: 'TF-8891' },
  { id: 4, mascotaId: 2, nombre: 'Triple felina (refuerzo)', fecha: d(-3), proxima: d(11), aplicadaPorId: 3, lote: 'TF-8871' },
  { id: 5, mascotaId: 4, nombre: 'Triple felina (2.ª dosis)', fecha: d(-4), proxima: d(-1), aplicadaPorId: 3, lote: 'TF-8870' },
  { id: 6, mascotaId: 5, nombre: 'Antirrábica', fecha: d(-4), proxima: d(361), aplicadaPorId: 2, lote: 'RB-2304' },
]

const recetas: Receta[] = [
  { id: 1, mascotaId: 3, fecha: d(-1), vetId: 3, consultaId: 1, items: [{ medicamento: 'Apoquel 16 mg', dosis: '1 tableta cada 12 h', dias: 14 }], estado: 'Dispensada' },
  { id: 2, mascotaId: 6, fecha: d(-2), vetId: 2, consultaId: 2, items: [{ medicamento: 'Amoxicilina + clavulánico 250 mg', dosis: '1 tableta cada 12 h', dias: 7 }, { medicamento: 'Expectorante jarabe', dosis: '5 ml cada 12 h', dias: 7 }], estado: 'Dispensada' },
  { id: 3, mascotaId: 2, fecha: d(-1), vetId: 3, consultaId: 4, items: [{ medicamento: 'Alimento light Royal Canin', dosis: '60 g diarios', dias: 30 }], estado: 'Emitida' },
]

const medicamentos: Medicamento[] = [
  { id: 1, nombre: 'Apoquel 16 mg', categoria: 'Antialérgico', presentacion: 'Caja x 10 tabletas', stock: 24, stockMin: 10, precio: 85 },
  { id: 2, nombre: 'Amoxicilina + clavulánico 250 mg', categoria: 'Antibiótico', presentacion: 'Frasco x 20 tabletas', stock: 8, stockMin: 12, precio: 49.5 },
  { id: 3, nombre: 'Ivermectina 1 %', categoria: 'Antiparasitario', presentacion: 'Frasco 50 ml', stock: 15, stockMin: 5, precio: 32 },
  { id: 4, nombre: 'Bravecto 250 mg', categoria: 'Antipulgas', presentacion: 'Caja x 1 tableta', stock: 12, stockMin: 4, precio: 96 },
  { id: 5, nombre: 'Suero fisiológico 500 ml', categoria: 'Insumo', presentacion: 'Bolsa', stock: 30, stockMin: 10, precio: 7.5 },
  { id: 6, nombre: 'Jeringas 5 ml', categoria: 'Insumo', presentacion: 'Caja x 50', stock: 3, stockMin: 10, precio: 22 },
  { id: 7, nombre: 'Triple felina', categoria: 'Vacuna', presentacion: 'Dosis x 1', stock: 18, stockMin: 6, precio: 55 },
  { id: 8, nombre: 'Antirrábica', categoria: 'Vacuna', presentacion: 'Dosis x 1', stock: 21, stockMin: 6, precio: 40 },
]

const pagos: Pago[] = [
  { id: 1, citaId: 1, fecha: d(-1), hora: '09:40', metodo: 'Yape', monto: 35, referencia: 'YP-884213' },
  { id: 2, fecha: d(0), hora: '10:05', metodo: 'Efectivo', monto: 45, referencia: null },
  { id: 3, fecha: d(0), hora: '12:30', metodo: 'Tarjeta', monto: 120, referencia: '**** 4417' },
  { id: 4, fecha: d(-1), hora: '11:50', metodo: 'Efectivo', monto: 40, referencia: null },
  { id: 5, fecha: d(-1), hora: '17:20', metodo: 'Efectivo', monto: 45, referencia: null },
  { id: 6, fecha: d(-2), hora: '10:05', metodo: 'Yape', monto: 40, referencia: 'YP-881900' },
  { id: 7, fecha: d(-2), hora: '16:45', metodo: 'Efectivo', monto: 30, referencia: null },
  { id: 8, fecha: d(-3), hora: '11:15', metodo: 'Transferencia', monto: 60, referencia: 'OP-4471' },
  { id: 9, fecha: d(-4), hora: '09:30', metodo: 'Tarjeta', monto: 120, referencia: '**** 9930' },
  { id: 10, fecha: d(-5), hora: '18:00', metodo: 'Yape', monto: 35, referencia: 'YP-880412' },
]

export function crearSemilla(): Estado {
  return {
    usuarios: [...equipo, ...clientes],
    cuentasDemo: cuentas_demo,
    tarifario: tarifario,
    propietarios: propietarios,
    mascotas: mascotas,
    citas: citas,
    solicitudes: solicitudes,
    consultas: consultas,
    vacunas: vacunas,
    recetas: recetas,
    medicamentos: medicamentos,
    pagos: pagos,
    archivos: [],
    recordatoriosEnviados: {},
    fechaInstalacion: hoy,
  }
}
