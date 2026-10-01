import {
  CalendarIcon, DashboardIcon, IdCardIcon, PawIcon, StethoscopeIcon,
  InboxIcon, FileIcon, SyringeIcon, PrescriptionIcon, BellIcon,
  WalletIcon, SettingsIcon, UsersIcon, PillIcon,
} from '../components/icons'
import type { IconProps } from '../components/icons'
import { puede } from '../data/roles'
import type { RolClave } from '../data/types'

export interface ItemNav {
  to: string
  label: string
  icono: (p: IconProps) => React.JSX.Element
  /** Clave de permiso; se filtra contra `permisos`. */
  perm: string
}

export interface SeccionNav {
  id: string
  titulo: string
  items: ItemNav[]
}

const secciones: SeccionNav[] = [
  {
    id: 'agenda',
    titulo: 'Agenda',
    items: [
      { to: '/dashboard', label: 'Panel', icono: DashboardIcon, perm: 'inicio' },
      { to: '/citas', label: 'Citas', icono: CalendarIcon, perm: 'citas' },
      { to: '/solicitudes', label: 'Solicitudes', icono: InboxIcon, perm: 'solicitudes' },
    ],
  },
  {
    id: 'clinica',
    titulo: 'Clínica',
    items: [
      { to: '/atencion', label: 'Atención', icono: StethoscopeIcon, perm: 'atencion' },
      { to: '/historial', label: 'Historial', icono: FileIcon, perm: 'historial' },
      { to: '/vacunas', label: 'Vacunas', icono: SyringeIcon, perm: 'vacunas' },
      { to: '/recetas', label: 'Recetas', icono: PrescriptionIcon, perm: 'recetas' },
    ],
  },
  {
    id: 'pacientes',
    titulo: 'Pacientes',
    items: [
      { to: '/propietarios', label: 'Propietarios', icono: IdCardIcon, perm: 'pacientes' },
      { to: '/mascotas', label: 'Mascotas', icono: PawIcon, perm: 'mascotas' },
    ],
  },
  {
    id: 'gestion',
    titulo: 'Gestión',
    items: [
      { to: '/recordatorios', label: 'Recordatorios', icono: BellIcon, perm: 'recordatorios' },
      { to: '/caja', label: 'Caja', icono: WalletIcon, perm: 'caja' },
      { to: '/tarifario', label: 'Tarifario', icono: SettingsIcon, perm: 'tarifario' },
    ],
  },
  {
    id: 'admin',
    titulo: 'Administración',
    items: [
      { to: '/medicamentos', label: 'Medicamentos', icono: PillIcon, perm: 'medicamentos' },
      { to: '/usuarios', label: 'Usuarios', icono: UsersIcon, perm: 'usuarios' },
    ],
  },
]

export function seccionesDe(claveRol: RolClave): SeccionNav[] {
  return secciones.map((s) => ({ ...s, items: s.items.filter((i) => puede(claveRol, i.perm)) })).filter(
    (s) => s.items.length > 0,
  )
}

/* El propietario no usa el menú interno: ve solo su portal, con las mismas
 * secciones y el mismo aspecto, pero con sus propias rutas bajo /portal. */
const secciones_portal: SeccionNav[] = [
  {
    id: 'portal',
    titulo: 'Portal',
    items: [
      { to: '/portal', label: 'Inicio', icono: DashboardIcon, perm: 'portal' },
      { to: '/portal/mascotas', label: 'Mis mascotas', icono: PawIcon, perm: 'portal' },
    ],
  },
  {
    id: 'portal-agenda',
    titulo: 'Agenda',
    items: [{ to: '/portal/citas', label: 'Mis citas', icono: CalendarIcon, perm: 'portal' }],
  },
  {
    id: 'portal-salud',
    titulo: 'Salud',
    items: [
      { to: '/portal/vacunas', label: 'Vacunas', icono: SyringeIcon, perm: 'portal' },
      { to: '/portal/recetas', label: 'Recetas', icono: PrescriptionIcon, perm: 'portal' },
    ],
  },
]

export function seccionesPortal(): SeccionNav[] {
  return secciones_portal
}
