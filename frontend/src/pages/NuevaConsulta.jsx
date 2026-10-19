import { useEffect, useState } from 'react'
import api, { mensajeError } from '../api.js'

const VACIO = { id_mascota: '', id_usuario: '', motivo: '', peso: '', temperatura: '', sintomas: '', diagnostico: '', costo: '' }
const TRAT_VACIO = { medicamento: '', dosis: '', frecuencia: '', duracion_dias: '', indicaciones: '' }

function Campo({ texto, requerido, className = '', children }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-sm">
        {texto} {requerido && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}

export default function NuevaConsulta() {
  const [mascotas, setMascotas] = useState([])
  const [veterinarios, setVeterinarios] = useState([])
  const [form, setForm] = useState(VACIO)
  const [tratamientos, setTratamientos] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.get('/pets').then((r) => setMascotas(r.data))
    api.get('/users').then((r) => setVeterinarios(r.data.filter((u) => u.rol !== 'RECEPCIONISTA' && u.activo)))
  }, [])

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  const cambiarTrat = (i, name, value) =>
    setTratamientos(tratamientos.map((t, j) => (j === i ? { ...t, [name]: value } : t)))

  const guardar = async (e) => {
    e.preventDefault()
    setMensaje(null)
    setGuardando(true)
    const numero = (v) => (v === '' ? null : Number(v))
    try {
      const { data } = await api.post('/consultations', {
        ...form,
        id_mascota: Number(form.id_mascota),
        id_usuario: Number(form.id_usuario),
        peso: numero(form.peso),
        temperatura: numero(form.temperatura),
        costo: numero(form.costo) ?? 0,
        tratamientos: tratamientos.map((t) => ({ ...t, duracion_dias: Number(t.duracion_dias), indicaciones: t.indicaciones || null })),
      })
      setMensaje({ clase: 'alert-success', texto: `Consulta #${data.id_consulta} registrada con ${data.tratamientos.length} tratamiento(s)` })
      setForm(VACIO)
      setTratamientos([])
    } catch (err) {
      setMensaje({ clase: 'alert-error', texto: mensajeError(err) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="card bg-base-100 shadow p-4 space-y-3">
      <h2 className="font-bold text-lg">Registrar consulta</h2>
      <p className="text-xs opacity-70">Los campos marcados con <span className="text-red-500">*</span> son obligatorios.</p>

      <div className="grid md:grid-cols-2 gap-2">
        <Campo texto="Mascota" requerido>
          <select className="select select-bordered w-full" required value={form.id_mascota} onChange={set('id_mascota')}>
            <option value="">Selecciona la mascota</option>
            {mascotas.map((m) => <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>)}
          </select>
        </Campo>
        <Campo texto="Veterinario" requerido>
          <select className="select select-bordered w-full" required value={form.id_usuario} onChange={set('id_usuario')}>
            <option value="">Veterinario que atiende</option>
            {veterinarios.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nombres} {u.apellidos}</option>)}
          </select>
        </Campo>
      </div>

      <Campo texto="Motivo" requerido>
        <input className="input input-bordered w-full" placeholder="Motivo de la consulta" required value={form.motivo} onChange={set('motivo')} />
      </Campo>

      <div className="grid grid-cols-3 gap-2">
        <Campo texto="Peso (kg)">
          <input type="number" step="0.01" className="input input-bordered w-full" placeholder="Peso (kg)" value={form.peso} onChange={set('peso')} />
        </Campo>
        <Campo texto="Temperatura (°C)">
          <input type="number" step="0.1" className="input input-bordered w-full" placeholder="Temperatura (°C)" value={form.temperatura} onChange={set('temperatura')} />
        </Campo>
        <Campo texto="Costo">
          <input type="number" step="0.01" className="input input-bordered w-full" placeholder="Costo" value={form.costo} onChange={set('costo')} />
        </Campo>
      </div>

      <Campo texto="Síntomas">
        <textarea className="textarea textarea-bordered w-full" placeholder="Síntomas" value={form.sintomas} onChange={set('sintomas')} />
      </Campo>
      <Campo texto="Diagnóstico">
        <textarea className="textarea textarea-bordered w-full" placeholder="Diagnóstico" value={form.diagnostico} onChange={set('diagnostico')} />
      </Campo>

      <div className="flex items-center justify-between">
        <h3 className="font-bold">Tratamientos</h3>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setTratamientos([...tratamientos, TRAT_VACIO])}>
          + Agregar tratamiento
        </button>
      </div>

      {tratamientos.map((t, i) => (
        <div key={i} className="grid md:grid-cols-6 gap-2 items-end bg-base-200 p-2 rounded">
          <Campo texto="Medicamento" requerido className="md:col-span-2">
            <input className="input input-bordered input-sm w-full" placeholder="Medicamento" required value={t.medicamento} onChange={(e) => cambiarTrat(i, 'medicamento', e.target.value)} />
          </Campo>
          <Campo texto="Dosis" requerido>
            <input className="input input-bordered input-sm w-full" placeholder="Dosis" required value={t.dosis} onChange={(e) => cambiarTrat(i, 'dosis', e.target.value)} />
          </Campo>
          <Campo texto="Frecuencia" requerido>
            <input className="input input-bordered input-sm w-full" placeholder="Frecuencia" required value={t.frecuencia} onChange={(e) => cambiarTrat(i, 'frecuencia', e.target.value)} />
          </Campo>
          <Campo texto="Días" requerido>
            <input type="number" min="1" className="input input-bordered input-sm w-full" placeholder="Días" required value={t.duracion_dias} onChange={(e) => cambiarTrat(i, 'duracion_dias', e.target.value)} />
          </Campo>
          <button type="button" className="btn btn-sm btn-ghost text-error" onClick={() => setTratamientos(tratamientos.filter((_, j) => j !== i))}>Quitar</button>
        </div>
      ))}

      {guardando && (
        <div className="alert alert-info text-sm">
          <span className="loading loading-spinner loading-sm"></span>
          Conectando con el servidor, puede tardar hasta 1 minuto la primera vez...
        </div>
      )}
      {mensaje && <div className={`alert ${mensaje.clase} text-sm`}>{mensaje.texto}</div>}
      <button className="btn btn-primary" disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar consulta'}
      </button>
    </form>
  )
}
