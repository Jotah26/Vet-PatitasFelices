import { useState } from 'react'
import { moneda } from '../data/fechas'
import { BotonIcono, Button, FilaCampos, Input, Select } from './ui'
import { CheckIcon, PlusIcon, TrashIcon } from './icons'
import type { ItemReceta, Medicamento } from '../data/types'

/** Agrega medicamentos del inventario a la receta que se está redactando. */
export function EditorReceta({
  items,
  onChange,
  medicamentos,
}: {
  items: ItemReceta[]
  onChange: (items: ItemReceta[]) => void
  medicamentos: Medicamento[]
}) {
  const [med, setMed] = useState('')
  const [dosis, setDosis] = useState('')
  const [dias, setDias] = useState('7')

  function agregar() {
    if (!med.trim()) return
    onChange([
      ...items,
      {
        medicamento: med.trim(),
        dosis: dosis.trim() || 'Según indicación',
        dias: Number(dias) || 7,
      },
    ])
    setMed('')
    setDosis('')
    setDias('7')
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((i, idx) => (
            <li
              key={`${i.medicamento}-${idx}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <CheckIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{i.medicamento}</span>
                <span className="block text-xs text-slate-500">
                  {i.dosis} · por {i.dias} días
                </span>
              </span>
              <BotonIcono
                label="Quitar"
                size="sm"
                className="text-slate-400 hover:text-rose-600"
                onClick={() => onChange(items.filter((_, j) => j !== idx))}
              >
                <TrashIcon className="h-4 w-4" />
              </BotonIcono>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          <PlusIcon className="h-3.5 w-3.5" /> Agregar medicamento
        </p>
        <div className="space-y-2">
          <Select value={med} onChange={(e) => setMed(e.target.value)}>
            <option value="">Seleccione del inventario…</option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.nombre}>
                {m.nombre} — {moneda(m.precio)}
              </option>
            ))}
          </Select>
          <FilaCampos columnas={2}>
            <Input value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Dosis: 1 tab / c 12 h" />
            <Input value={dias} onChange={(e) => setDias(e.target.value)} placeholder="Días" type="number" min="1" />
          </FilaCampos>
          <Button variant="secondary" className="w-full" onClick={agregar}>
            <PlusIcon className="h-4 w-4" /> Agregar a la receta
          </Button>
        </div>
      </div>
    </div>
  )
}
