import type { ReactNode } from 'react'
import { Confirmacion } from './ui'
import type { CrudApi } from '../hooks/useCRUD'

/** Confirmación de borrado que se ata al estado de `useCRUD`. */
export function DialogoBorrado<T extends object>({
  crud,
  mensaje,
  nombre,
}: {
  crud: CrudApi<T>
  mensaje?: ReactNode
  nombre?: string
}) {
  return (
    <Confirmacion
      abierto={Boolean(crud.porBorrar)}
      alCerrar={() => crud.pedirBorrado(null)}
      alConfirmar={crud.confirmarBorrado}
      titulo="Confirmar eliminación"
      mensaje={mensaje ?? `Esta acción no se puede deshacer. ¿Eliminar ${nombre ?? 'el registro'}?`}
      confirmar="Sí, eliminar"
    />
  )
}
