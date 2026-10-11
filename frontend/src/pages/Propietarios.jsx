import { useEffect, useState } from 'react'
import api, { mensajeError } from '../api.js'

const VACIO = { documento_identidad: '', nombres: '', apellidos: '', telefono: '', email: '', direccion: '' }

export default function Propietarios() {
  const [lista, setLista] = useState([])
  const [buscar, setBuscar] = useState('')
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')

  const cargar = () => api.get('/owners', { params: { buscar } }).then((r) => setLista(r.data))

  useEffect(() => { cargar() }, [buscar])

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      // Los campos opcionales vacíos se envían como null
      await api.post('/owners', { ...form, email: form.email || null, direccion: form.direccion || null })
      setForm(VACIO)
      cargar()
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const campo = (name, label, required = true) => (
    <input className="input input-bordered w-full" placeholder={label} required={required}
      value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
  )

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={guardar} className="card bg-base-100 shadow p-4 space-y-2">
        <h2 className="font-bold text-lg">Nuevo propietario</h2>
        {campo('documento_identidad', 'Documento de identidad')}
        {campo('nombres', 'Nombres')}
        {campo('apellidos', 'Apellidos')}
        {campo('telefono', 'Teléfono')}
        {campo('email', 'Email (opcional)', false)}
        {campo('direccion', 'Dirección (opcional)', false)}
        {error && <div className="alert alert-error text-sm">{error}</div>}
        <button className="btn btn-primary w-full">Guardar</button>
      </form>

      <div className="card bg-base-100 shadow p-4 md:col-span-2">
        <input className="input input-bordered w-full mb-3" placeholder="Buscar por nombre o documento..."
          value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        <table className="table table-zebra">
          <thead><tr><th>Documento</th><th>Nombre</th><th>Teléfono</th></tr></thead>
          <tbody>
            {lista.map((o) => (
              <tr key={o.id_propietario}>
                <td>{o.documento_identidad}</td>
                <td>{o.nombres} {o.apellidos}</td>
                <td>{o.telefono}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && <p className="text-center opacity-60 py-4">No hay propietarios registrados</p>}
      </div>
    </div>
  )
}
