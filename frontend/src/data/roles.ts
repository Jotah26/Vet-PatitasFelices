import type { CategoriaMedicamento, Especie, RolClave, RolMeta, Sexo, TipoAtencion } from '../data/types'

const tono_rol: Pick<RolMeta, 'color' | 'punto' | 'pastilla' | 'texto' | 'suave' | 'borde' | 'anillo' | 'barra'> = {
  color: 'bg-primary-100 text-primary-700',
  punto: 'bg-primary-500',
  pastilla: 'bg-primary-600',
  texto: 'text-primary-700',
  suave: 'bg-primary-50',
  borde: 'border-primary-200',
  anillo: 'ring-primary-200',
  barra: 'from-primary-500 to-primary-700',
}

export const roles: Record<RolClave, RolMeta> = {
  admin: {
    label: 'Administrador',
    corto: 'Admin',
    resumen: 'Inventario, precios y cuentas del personal',
    ...tono_rol,
    home: '/dashboard',
  },
  vet: {
    label: 'Veterinario',
    corto: 'Veterinario',
    resumen: 'Diagnóstico, tratamientos, vacunas y recetas',
    ...tono_rol,
    home: '/dashboard',
  },
  recepcionista: {
    label: 'Recepcionista',
    corto: 'Recepción',
    resumen: 'Agenda de citas, registro de propietarios y cobros',
    ...tono_rol,
    home: '/dashboard',
  },
  asistente: {
    label: 'Asistente veterinario',
    corto: 'Asistente',
    resumen: 'Apoyo en la atención y control de insumos',
    ...tono_rol,
    home: '/dashboard',
  },
  propietario: {
    label: 'Propietario',
    corto: 'Propietario',
    resumen: 'Consulta el estado de sus mascotas',
    ...tono_rol,
    home: '/portal',
  },
}

export const claves_rol = Object.keys(roles) as RolClave[]

/** Acceso seguro a la ficha de un rol. */
export function rol(clave: RolClave | null | undefined): RolMeta {
  return (clave && roles[clave]) || roles.asistente
}

/* ---------- Permisos ---------- */

export const permisos: Record<RolClave, string[]> = {
  admin: [
    'inicio', 'usuarios', 'tarifario', 'medicamentos', 'caja', 'solicitudes', 'citas',
    'atencion', 'vacunas', 'pacientes', 'mascotas', 'historial', 'recetas', 'recordatorios',
  ],
  vet: ['inicio', 'atencion', 'vacunas', 'recetas', 'historial', 'citas', 'pacientes', 'mascotas', 'medicamentos', 'recordatorios'],
  recepcionista: ['inicio', 'citas', 'solicitudes', 'caja', 'pacientes', 'mascotas', 'historial', 'recetas', 'tarifario', 'recordatorios'],
  asistente: ['inicio', 'medicamentos', 'historial', 'citas', 'recordatorios'],
  propietario: ['portal'],
}

export function puede(claveRol: RolClave, permiso: string): boolean {
  return permisos[claveRol]?.includes(permiso) ?? false
}

/* ---------- Catálogos clínicos ---------- */

export const especies: Especie[] = ['Perro', 'Gato', 'Ave', 'Roedor', 'Reptil', 'Otro']

export const sexos: Sexo[] = ['Macho', 'Hembra']
export const categorias_medicamento: CategoriaMedicamento[] = [
  'Antialérgico',
  'Antibiótico',
  'Antiparasitario',
  'Antipulgas',
  'Insumo',
  'Vacuna',
]

export const razas_por_especie: Record<Especie, string[]> = {
  Perro: ['Mestizo', 'Golden Retriever', 'Poodle', 'Beagle', 'Bulldog', 'Schnauzer', 'Pastor Alemán', 'Chihuahua', 'Dálmata'],
  Gato: ['Doméstico de pelo corto', 'Siamés', 'Angora turco', 'Persa', 'Maine Coon', 'Bengalí', 'Ragdoll'],
  Ave: ['Periquito', 'Cacatúa', 'Loro', 'Canario'],
  Roedor: ['Hámster', 'Conejo', 'Cobaya', 'Rata'],
  Reptil: ['Iguana', 'Gecko', 'Tortuga', 'Serpiente'],
  Otro: ['Sin especificar'],
}

export const tipos_atencion: TipoAtencion[] = [
  'Consulta general',
  'Vacunación',
  'Control / seguimiento',
  'Cirugía',
  'Urgencia',
  'Desparasitación',
]
