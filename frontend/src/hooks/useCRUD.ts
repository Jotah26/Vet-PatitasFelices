import { useState } from 'react'
import { useToast } from '../components/Toast'

export type ValoresFormulario = Record<string, unknown>
export type ErroresFormulario = Record<string, string | null>
export type ValidarFormulario = (valores: ValoresFormulario) => ErroresFormulario

export interface CrudApi<T> {
  registro: T | null
  esNuevo: boolean
  abrirNuevo: () => void
  abrirEditar: (fila: T) => void
  cerrar: () => void
  porBorrar: T | null
  pedirBorrado: (registro: T | null) => void
  guardar: (valores: ValoresFormulario) => void
  confirmarBorrado: () => void
}

export function useCRUD<T extends object>({
  etiqueta,
  alGuardar,
  alBorrar,
  vacio,
  inicial,
}: {
  etiqueta: string
  alGuardar: (registro: T, esNuevo: boolean) => void
  alBorrar: (registro: T) => void
  vacio?: () => T
  /** Abre el modal ya en marcha: se usa en los formularios que nacen abiertos. */
  inicial?: T | null
}): CrudApi<T> {
  const [registro, setRegistro] = useState<T | null>(inicial ?? null)
  const [porBorrar, setPorBorrar] = useState<T | null>(null)
  const { toast } = useToast()

  const guardar = (valores: ValoresFormulario) => {
    const editando = (registro as { id?: number } | null)?.id != null
    alGuardar({ ...(registro ?? {}), ...valores } as T, !editando)
    setRegistro(null)
    toast({
      titulo: editando ? `${etiqueta} actualizada` : `${etiqueta} registrada`,
      detalle: editando ? undefined : 'Los cambios ya están guardados.',
      tipo: 'exito',
    })
  }

  const confirmarBorrado = () => {
    if (porBorrar) alBorrar(porBorrar)
    setPorBorrar(null)
    toast({ titulo: `${etiqueta} eliminada`, tipo: 'info' })
  }

  return {
    registro,
    esNuevo: (registro as { id?: number } | null)?.id == null,
    abrirNuevo: () => setRegistro(vacio ? vacio() : ({} as T)),
    abrirEditar: (fila) => setRegistro({ ...fila }),
    cerrar: () => setRegistro(null),
    porBorrar,
    pedirBorrado: setPorBorrar,
    guardar,
    confirmarBorrado,
  }
}
