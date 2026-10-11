import { useEffect, useState } from 'react'
import api, { mensajeError } from '../api.js'

const VACIO = { id_propietario: '', nombre: '', especie: 'PERRO', raza: '', sexo: 'MACHO', fecha_nacimiento: '', peso: '', esterilizado: false }

export default function Mascotas() {
  const [mascotas, setMascotas] = useState([])
  const [propietarios, setPropietarios] = useState([])
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')

  const cargar = () => api.get('/pets').then((r) => setMascotas(r.data))

  useEffect(() => {
    cargar()
    api.get('/owners').then((r) => setPropietarios(r.data))
  }, [])

  const nombreDueno = (id) => {
    const o = propietarios.find((p) => p.id_propietario === id)
    return o ? `${o.nombres} ${o.apellidos}` : id
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/pets', {
        ...form,
        id_propietario: Number(form.id_propietario),
        raza: form.raza || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        peso: form.peso ? Number(form.peso) : null,
      })
      setForm(VACIO)
      cargar()
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={guardar} className="card bg-base-100 shadow p-4 space-y-2">
        <h2 className="font-bold text-lg">Nueva mascota</h2>
        <select className="select select-bordered w-full" required value={form.id_propietario} onChange={set('id_propietario')}>
          <option value="">Selecciona el propietario</option>
          {propietarios.map((o) => (
            <option key={o.id_propietario} value={o.id_propietario}>{o.nombres} {o.apellidos} ({o.documento_identidad})</option>
          ))}
        </select>
        <input className="input input-bordered w-full" placeholder="Nombre" required value={form.nombre} onChange={set('nombre')} />
        <select className="select select-bordered w-full" value={form.especie} onChange={set('especie')}>
          {['PERRO', 'GATO', 'AVE', 'ROEDOR', 'OTRO'].map((e) => <option key={e}>{e}</option>)}
        </select>
        <input className="input input-bordered w-full" placeholder="Raza (opcional)" value={form.raza} onChange={set('raza')} />
        <select className="select select-bordered w-full" value={form.sexo} onChange={set('sexo')}>
          <option>MACHO</option><option>HEMBRA</option>
        </select>
        <label className="text-sm opacity-70">Fecha de nacimiento</label>
        <input type="date" className="input input-bordered w-full" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
        <input type="number" step="0.01" className="input input-bordered w-full" placeholder="Peso (kg)" value={form.peso} onChange={set('peso')} />
        <label className="label cursor-pointer gap-2">
          <input type="checkbox" className="checkbox" checked={form.esterilizado}
            onChange={(e) => setForm({ ...form, esterilizado: e.target.checked })} />
          Esterilizado
        </label>
        {error && <div className="alert alert-error text-sm">{error}</div>}
        <button className="btn btn-primary w-full">Guardar</button>
      </form>

      <div className="card bg-base-100 shadow p-4 md:col-span-2">
        <table className="table table-zebra">
          <thead><tr><th>Nombre</th><th>Especie</th><th>Sexo</th><th>Peso</th><th>Propietario</th></tr></thead>
          <tbody>
            {mascotas.map((m) => (
              <tr key={m.id_mascota}>
                <td>{m.nombre}</td>
                <td>{m.especie}</td>
                <td>{m.sexo}</td>
                <td>{m.peso ? `${m.peso} kg` : '-'}</td>
                <td>{nombreDueno(m.id_propietario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {mascotas.length === 0 && <p className="text-center opacity-60 py-4">No hay mascotas registradas</p>}
      </div>
    </div>
  )
}
