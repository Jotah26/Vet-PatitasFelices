import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import VistaAdmin from '../pages/dashboard/VistaAdmin'
import VistaVeterinario from '../pages/dashboard/VistaVeterinario'
import VistaRecepcion from '../pages/dashboard/VistaRecepcion'
import VistaAsistente from '../pages/dashboard/VistaAsistente'
import { EstadoVacio } from '../components/ui'
import type { RolClave } from '../data/types'

const vistas: Partial<Record<RolClave, ComponentType>> = {
  admin: VistaAdmin,
  vet: VistaVeterinario,
  recepcionista: VistaRecepcion,
  asistente: VistaAsistente,
}

export default function Dashboard() {
  const { user } = useAuth()
  const Vista = user ? vistas[user.rol] : undefined

  if (!Vista) {
    return (
      <EstadoVacio
        titulo="Su perfil no tiene un panel asignado"
        detalle="El panel del propietario se encuentra en el portal del cliente."
        accion={
          <Link to="/portal" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
            Ir a mi portal
          </Link>
        }
      />
    )
  }

  return <Vista />
}
