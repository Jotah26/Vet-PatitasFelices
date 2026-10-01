import type { Especie, Sexo } from '../data/types'

const tonosSexo: Record<Sexo, string> = {
  Macho: 'bg-sky-100 text-sky-700 ring-sky-200',
  Hembra: 'bg-pink-100 text-pink-700 ring-pink-200',
}

const tonos: Record<Especie, string> = {
  Perro: 'bg-sky-100 text-sky-700 ring-sky-200',
  Gato: 'bg-amber-100 text-amber-700 ring-amber-200',
  Ave: 'bg-orange-100 text-orange-700 ring-orange-200',
  Roedor: 'bg-rose-100 text-rose-700 ring-rose-200',
  Reptil: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Otro: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function tonoEspecie(especie: Especie | null | undefined): string {
  return tonos[especie ?? 'Otro'] ?? tonos.Otro
}

/** Macho en celeste, hembra en rosa. Sin sexo devuelve `null` para que el
 *  avatar recurra al color de la especie. */
export function tonoSexo(sexo: Sexo | null | undefined): string | null {
  return sexo ? tonosSexo[sexo] : null
}

/** Foto si la mascota tiene una; si no, las dos iniciales sobre el color de su
 *  sexo y, cuando no se conoce, sobre el color de su especie. */
export function PetImage({
  especie,
  sexo,
  nombre,
  foto,
  className = 'h-12 w-12 text-sm',
  anillo = true,
}: {
  especie?: Especie | null
  sexo?: Sexo | null
  nombre?: string | null
  foto?: string | null
  className?: string
  anillo?: boolean
}) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={`Foto de ${nombre ?? 'la mascota'}`}
        className={`shrink-0 rounded-full object-cover ${anillo ? 'ring-2 ring-white' : ''} ${className}`}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tonoSexo(sexo) ?? tonoEspecie(especie)} ${anillo ? 'ring-2 ring-white' : ''} ${className}`}
    >
      {String(nombre ?? '?').slice(0, 2).toUpperCase()}
    </span>
  )
}
