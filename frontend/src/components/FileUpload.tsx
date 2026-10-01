import { useRef, useState } from 'react'
import { FileIcon, TrashIcon, UploadIcon } from './icons'
import { pesoArchivo } from '../data/fechas'
import { BotonIcono } from './ui'
import type { Adjunto } from '../data/types'

const maximo_bytes = 1024 * 1024

const tipos: Record<string, true> = {
  'image/png': true,
  'image/jpeg': true,
  'image/webp': true,
  'application/pdf': true,
}

function esImagen(tipo: string) {
  return tipo.startsWith('image/')
}

function leer(file: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result))
    lector.onerror = () => rechazar(new Error('No se pudo leer el archivo'))
    lector.readAsDataURL(file)
  })
}

/** Convierte un dataUrl ya guardado en la ficha en un "archivo" para FileUpload. */
export function fotoComoArchivo(dataUrl: string): Adjunto {
  return { id: 'foto', nombre: 'Foto del paciente', tipo: 'image/*', dataUrl }
}

export function FileUpload({
  archivos,
  onChange,
  ayuda = 'Radiografías, análisis o documentos. Máximo 1 MB por archivo.',
  aceptar = '.png,.jpg,.jpeg,.webp,.pdf',
  multiple = true,
}: {
  archivos: Adjunto[]
  onChange: (archivos: Adjunto[]) => void
  ayuda?: string
  aceptar?: string
  multiple?: boolean
}) {
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)

  async function agregar(lista: FileList | null) {
    setError('')
    if (!lista) return
    const aceptados: Adjunto[] = []
    for (const file of Array.from(lista)) {
      if (!tipos[file.type]) {
        setError(`"${file.name}" no es un formato admitido. Use PNG, JPG, WEBP o PDF.`)
        continue
      }
      if (file.size > maximo_bytes) {
        setError(`"${file.name}" pesa ${pesoArchivo(file.size)} y el máximo es 1 MB.`)
        continue
      }
      const dataUrl = await leer(file)
      aceptados.push({
        id: `${file.name}-${file.size}-${aceptados.length}`,
        nombre: file.name,
        tipo: file.type,
        tamano: file.size,
        dataUrl,
      })
    }
    if (aceptados.length) onChange([...archivos, ...aceptados])
  }

  function quitar(id: string | number) {
    onChange(archivos.filter((a) => a.id !== id))
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          void agregar(e.dataTransfer.files)
        }}
        className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          arrastrando ? 'border-primary-400 bg-primary-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm">
          <UploadIcon className="h-5 w-5" />
        </span>
        <p className="mt-2 text-sm font-semibold text-slate-700">Arrastre los archivos aquí</p>
        <p className="mt-0.5 text-xs text-slate-400">{ayuda}</p>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-400 hover:text-primary-700"
        >
          Seleccionar archivos
        </button>
        <input
          ref={input}
          type="file"
          accept={aceptar}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            void agregar(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>}

      {archivos.length > 0 && (
        <ul className="mt-3 space-y-2">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              {esImagen(a.tipo) ? (
                <img src={a.dataUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <FileIcon className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{a.nombre}</p>
                <p className="text-xs text-slate-400">{a.tamano ? pesoArchivo(a.tamano) : 'Foto actual'}</p>
              </div>
              <BotonIcono
                label="Quitar"
                size="sm"
                className="text-slate-400 hover:text-rose-600"
                onClick={() => quitar(a.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </BotonIcono>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
