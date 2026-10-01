import { useMemo } from 'react'
import { useCRUD } from '../hooks'
import { FormularioModal } from '../components/FormularioModal'
import type { CrudApi, ValoresFormulario } from '../hooks'
import { useAuth } from '../auth/AuthContext'
import { useDatos } from '../data/store'
import { especies, razas_por_especie, sexos } from '../data/roles'
import { FilaCampos, Input, Select, Textarea } from '../components/ui'
import { FileUpload, fotoComoArchivo } from '../components/FileUpload'
import { PetImage } from '../components/PetAvatar'
import type { Especie, Mascota, Sexo } from '../data/types'

type MascotaForm = Omit<Mascota, 'id' | 'propietarioId' | 'especie' | 'sexo'> & {
  especie: Especie
  sexo: Sexo | ''
}

const vacio = (): MascotaForm => ({
  nombre: '',
  especie: 'Perro',
  raza: '',
  sexo: '',
  edad: '',
  peso: '',
  color: '',
  foto: '',
  esterilizado: false,
  antecedentes: '',
})

/* =================== Portal: alta de mascota del dueño ============== */

export function ModalMascotaPortal({ alCerrar }: { alCerrar: () => void }) {
  const datos = useDatos()
  const { user } = useAuth()

  const crud = useCRUD<MascotaForm>({
    etiqueta: 'Mascota',
    vacio: vacio,
    inicial: vacio(),
    alGuardar: (fila) => {
      const { foto, ...resto } = fila
      datos.crearMascota({
        ...resto,
        sexo: (fila.sexo || 'Macho') as Sexo,
        propietarioId: user?.propietarioId ?? 0,
        ...(foto ? { foto: String(foto) } : {}),
      })
    },
    alBorrar: () => {},
  })

  const api = useMemo<CrudApi<MascotaForm>>(
    () => ({
      ...crud,
      cerrar: () => {
        crud.cerrar()
        alCerrar()
      },
      guardar: (valores: ValoresFormulario) => {
        crud.guardar(valores)
        alCerrar()
      },
    }),
    [crud, alCerrar],
  )

  return (
    <FormularioModal
      crud={api}
      titulo="Añadir mascota"
      descripcion="Registre los datos de su paciente para poder agendar citas."
      validar={(v) => {
        const errores: Record<string, string | null> = {}
        if (!String(v.nombre ?? '').trim()) errores.nombre = 'Ingrese el nombre.'
        if (!v.sexo) errores.sexo = 'Seleccione el sexo.'
        return errores
      }}
    >
      {({ valores, cambiar, errores }) => {
        const especie = (valores.especie as Especie) ?? 'Perro'
        const foto = String(valores.foto ?? '')
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <PetImage
                especie={especie}
                sexo={(valores.sexo as Sexo) ?? null}
                nombre={String(valores.nombre ?? '')}
                foto={foto || undefined}
                className="h-14 w-14 text-sm"
                anillo={false}
              />
              <div className="min-w-0 flex-1">
                <FileUpload
                  archivos={foto ? [fotoComoArchivo(foto)] : []}
                  onChange={(xs) => cambiar('foto')({ target: { value: xs[0]?.dataUrl ?? '' } })}
                  aceptar="image/*"
                  multiple={false}
                  ayuda="JPG o PNG, máximo 1 MB."
                />
              </div>
            </div>

            <FilaCampos>
              <Input
                label="Nombre"
                requerido
                value={String(valores.nombre ?? '')}
                onChange={cambiar('nombre')}
                error={errores.nombre}
              />
              <Select label="Especie" value={especie} onChange={cambiar('especie')}>
                {especies.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
              <Select label="Raza" value={String(valores.raza ?? '')} onChange={cambiar('raza')}>
                <option value="">Sin especificar</option>
                {razas_por_especie[especie].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              <Select
                label="Sexo"
                requerido
                value={String(valores.sexo ?? '')}
                onChange={cambiar('sexo')}
                error={errores.sexo}
              >
                <option value="">Seleccione</option>
                {sexos.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Input label="Edad" value={String(valores.edad ?? '')} onChange={cambiar('edad')} placeholder="3 años" />
              <Input label="Peso" value={String(valores.peso ?? '')} onChange={cambiar('peso')} placeholder="18 kg" />
              <Input label="Color" value={String(valores.color ?? '')} onChange={cambiar('color')} />
            </FilaCampos>

            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(valores.esterilizado)}
                  onChange={cambiar('esterilizado')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Paciente esterilizado
            </label>

            <Textarea
              label="Antecedentes relevantes"
              rows={2}
              value={String(valores.antecedentes ?? '')}
              onChange={cambiar('antecedentes')}
              placeholder="Alergias, enfermedades crónicas, temperamento"
            />
          </div>
        )
      }}
    </FormularioModal>
  )
}
