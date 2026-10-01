import { useEffect, useState } from 'react'

/** Devuelve el valor recién cuando deja de cambiar durante `ms`. */
export function useDebounce<T>(valor: T, ms = 250): T {
  const [diferido, setDiferido] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setDiferido(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return diferido
}
