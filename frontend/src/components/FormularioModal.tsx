import { useState } from 'react'
import type { ReactNode } from 'react'
import { Formulario, Modal } from './ui'
import type { CrudApi, ErroresFormulario, ValoresFormulario, ValidarFormulario } from '../hooks/useCRUD'

export interface RenderPropsForm {
  valores: ValoresFormulario
  cambiar: (campo: string) => (e: unknown) => void
  errores: ErroresFormulario
}

export function FormularioModal<T extends object>({
  crud,
  titulo,
  descripcion,
  ancho,
  children,
  validar,
  extraPie,
}: {
  crud: CrudApi<T>
  titulo: ReactNode
  descripcion?: ReactNode
  ancho?: string
  children: ReactNode | ((p: RenderPropsForm) => ReactNode)
  validar?: ValidarFormulario
  extraPie?: ReactNode
}) {
  const [valores, setValores] = useState<ValoresFormulario>({})
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [sincronizado, setSincronizado] = useState<T | null>(null)
  const abierto = crud.registro !== null

  if (crud.registro !== sincronizado) {
    setSincronizado(crud.registro)
    if (crud.registro !== null) {
      setValores({ ...crud.registro } as ValoresFormulario)
      setErrores({})
    }
  }

  const cambiar =
    (campo: string) =>
    (e: unknown) => {
      const objetivo = e as { target?: { type?: string; value?: unknown; checked?: boolean } } | null
      const target = objetivo?.target
      const valor = !target ? e : target.type === 'checkbox' ? Boolean(target.checked) : target.value
      setValores((v) => ({ ...v, [campo]: valor }))
      setErrores((prev) => (prev[campo] ? { ...prev, [campo]: null } : prev))
    }

  function enviar() {
    const faltantes = validar?.(valores) ?? {}
    if (Object.keys(faltantes).length) {
      setErrores(faltantes)
      return
    }
    crud.guardar(valores)
  }

  return (
    <Modal
      abierto={abierto}
      alCerrar={crud.cerrar}
      titulo={titulo}
      descripcion={descripcion}
      ancho={ancho}
      pie={
        <>
          {extraPie}
          <BotonCancelar onClick={crud.cerrar} />
          <BotonGuardar onClick={enviar} esNuevo={crud.esNuevo} />
        </>
      }
    >
      <Formulario onSubmit={enviar}>
        {typeof children === 'function' ? children({ valores, cambiar, errores }) : children}
      </Formulario>
    </Modal>
  )
}

function BotonCancelar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      Cancelar
    </button>
  )
}

function BotonGuardar({ onClick, esNuevo }: { onClick: () => void; esNuevo: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700"
    >
      {esNuevo ? 'Registrar' : 'Guardar cambios'}
    </button>
  )
}
