import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { rol } from '../data/roles'
import { Button, Input } from '../components/ui'
import logo from '../../assets/img/logo.png'

export default function Setup() {
  const { setupAdministrator, user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [setupToken, setSetupToken] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to={rol(user.rol).home} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const result = await setupAdministrator({ name, email, password, setupToken })
    if (!result.ok) setError(result.error)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={logo} alt="Logo de Patitas Felices" className="h-16 w-16 rounded-2xl object-contain" />
          <div><p className="text-xl font-bold text-slate-900">Patitas Felices</p><p className="text-sm text-slate-500">Clínica veterinaria</p></div>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Configurar primera cuenta</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Este paso es solo para la instalación inicial. Creará la cuenta administradora; después podrá crear el resto del equipo desde Usuarios.</p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Input label="Nombre completo" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} requerido />
            <Input label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} requerido />
            <Input label="Contraseña" type="password" autoComplete="new-password" ayuda="Use al menos 12 caracteres." value={password} onChange={(e) => setPassword(e.target.value)} requerido />
            <Input label="Token de instalación" type="password" autoComplete="off" ayuda="Lo proporciona quien administra la instalación." value={setupToken} onChange={(e) => setSetupToken(e.target.value)} requerido />
            {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{error}</p>}
            <Button type="submit" className="w-full">Crear cuenta administradora</Button>
            <Link to="/login" className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700">Volver al inicio de sesión</Link>
          </form>
        </section>
      </div>
    </main>
  )
}
