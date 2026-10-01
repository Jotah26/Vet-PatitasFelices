import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './auth/AuthContext'
import { Layout } from './components/layout/LayoutInterno'
import { PortalLayout } from './components/layout/PortalLayout'
import { puede, roles } from './data/roles'
import { EstadoVacio, Button } from './components/ui'
import { ShieldIcon } from './components/icons'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Citas from './pages/Citas'
import Solicitudes from './pages/Solicitudes'
import AtencionVeterinaria from './pages/AtencionVeterinaria'
import Historial from './pages/Historial'
import Vacunas from './pages/Vacunas'
import Recetas from './pages/Recetas'
import Propietarios from './pages/Propietarios'
import Mascotas from './pages/Mascotas'
import FichaMascota from './pages/FichaMascota'
import Recordatorios from './pages/Recordatorios'
import Caja from './pages/Caja'
import Tarifario from './pages/Tarifario'
import Medicamentos from './pages/Medicamentos'
import Usuarios from './pages/Usuarios'
import PortalInicio from './pages/portal/PortalInicio'
import PortalCitas from './pages/portal/PortalCitas'
import PortalVacunas from './pages/portal/PortalVacunas'
import PortalRecetas from './pages/portal/PortalRecetas'
import PortalMascotas from './pages/portal/PortalMascotas'

function Indice() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={roles[user.rol].home} replace />
}

function Ruta({ permiso, children }: { permiso: string; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!puede(user.rol, permiso)) {
    return (
      <EstadoVacio
        icono={<ShieldIcon className="h-6 w-6" />}
        titulo="No tienes acceso a esta sección"
        detalle={`Tu rol de ${roles[user.rol].corto.toLowerCase()} no incluye el permiso "${permiso}".`}
      />
    )
  }
  return children
}

/* Todo el sistema interno (excluye al propietario, que usa el portal). */
function Interno() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (user.rol === 'propietario') return <Navigate to="/portal" replace />
  return <Layout />
}

/* Portal exclusivo del propietario. */
function Portal() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.rol !== 'propietario') return <Navigate to="/dashboard" replace />
  return <PortalLayout />
}

function NoEncontrado() {
  return (
    <EstadoVacio
      icono={<ShieldIcon className="h-6 w-6" />}
      titulo="Página no encontrada"
      detalle="La ruta que buscas no existe o fue movida."
      accion={
        <Button size="sm" onClick={() => window.history.back()}>
          Volver
        </Button>
      }
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Interno />}>
        <Route
          path="/dashboard"
          element={
            <Ruta permiso="inicio">
              <Dashboard />
            </Ruta>
          }
        />
        <Route
          path="/citas"
          element={
            <Ruta permiso="citas">
              <Citas />
            </Ruta>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <Ruta permiso="solicitudes">
              <Solicitudes />
            </Ruta>
          }
        />
        <Route
          path="/atencion"
          element={
            <Ruta permiso="atencion">
              <AtencionVeterinaria />
            </Ruta>
          }
        />
        <Route
          path="/historial"
          element={
            <Ruta permiso="historial">
              <Historial />
            </Ruta>
          }
        />
        <Route
          path="/vacunas"
          element={
            <Ruta permiso="vacunas">
              <Vacunas />
            </Ruta>
          }
        />
        <Route
          path="/recetas"
          element={
            <Ruta permiso="recetas">
              <Recetas />
            </Ruta>
          }
        />
        <Route
          path="/propietarios"
          element={
            <Ruta permiso="pacientes">
              <Propietarios />
            </Ruta>
          }
        />
        <Route
          path="/mascotas"
          element={
            <Ruta permiso="mascotas">
              <Mascotas />
            </Ruta>
          }
        />
        <Route
          path="/mascotas/:id"
          element={
            <Ruta permiso="mascotas">
              <FichaMascota />
            </Ruta>
          }
        />
        <Route
          path="/recordatorios"
          element={
            <Ruta permiso="recordatorios">
              <Recordatorios />
            </Ruta>
          }
        />
        <Route
          path="/caja"
          element={
            <Ruta permiso="caja">
              <Caja />
            </Ruta>
          }
        />
        <Route
          path="/tarifario"
          element={
            <Ruta permiso="tarifario">
              <Tarifario />
            </Ruta>
          }
        />
        <Route
          path="/medicamentos"
          element={
            <Ruta permiso="medicamentos">
              <Medicamentos />
            </Ruta>
          }
        />
        <Route
          path="/usuarios"
          element={
            <Ruta permiso="usuarios">
              <Usuarios />
            </Ruta>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>

      <Route element={<Portal />}>
        <Route path="/portal" element={<PortalInicio />} />
        <Route path="/portal/citas" element={<PortalCitas />} />
        <Route path="/portal/vacunas" element={<PortalVacunas />} />
        <Route path="/portal/recetas" element={<PortalRecetas />} />
        <Route path="/portal/mascotas" element={<PortalMascotas />} />
      </Route>

      <Route path="/" element={<Indice />} />
      <Route path="*" element={<Indice />} />
    </Routes>
  )
}
