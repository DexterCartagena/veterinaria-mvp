import { lazy, Suspense, useEffect, useState } from 'react'
import api, { mensajeError } from '../api.js'

// El gráfico 3D se carga solo cuando se necesita, para que la app abra rápido
const PaseoSalud3D = lazy(() => import('../components/PaseoSalud3D.jsx'))

export default function Historial() {
  const [mascotas, setMascotas] = useState([])
  const [idMascota, setIdMascota] = useState('')
  const [consultas, setConsultas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { api.get('/pets').then((r) => setMascotas(r.data)) }, [])

  const cargar = (id) => {
    setIdMascota(id)
    setError('')
    if (!id) return setConsultas([])
    api.get(`/pets/${id}/historial`).then((r) => setConsultas(r.data))
  }

  const finalizar = async (idConsulta) => {
    try {
      await api.patch(`/consultations/${idConsulta}/finalizar`)
      cargar(idMascota)
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const mascota = mascotas.find((m) => m.id_mascota === Number(idMascota))

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow p-4">
        <select className="select select-bordered w-full" value={idMascota} onChange={(e) => cargar(e.target.value)}>
          <option value="">Selecciona una mascota para ver su historial clínico</option>
          {mascotas.map((m) => <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>)}
        </select>
        {mascota && (
          <p className="mt-2 text-sm opacity-70">
            {mascota.nombre} · {mascota.especie} · {mascota.sexo} · Peso actual: {mascota.peso ?? '-'} kg
          </p>
        )}
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}
      {idMascota && consultas.length === 0 && <p className="text-center opacity-60">Esta mascota aún no tiene consultas</p>}

      {consultas.length > 0 && (
        <Suspense fallback={<div className="text-center"><span className="loading loading-spinner"></span></div>}>
          <PaseoSalud3D consultas={consultas} mascota={mascota} />
        </Suspense>
      )}

      {consultas.map((c) => (
        <div key={c.id_consulta} className="card bg-base-100 shadow p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-bold">#{c.id_consulta} · {c.motivo}</h3>
              <p className="text-sm opacity-70">{new Date(c.fecha_hora + 'Z').toLocaleString()}</p>
            </div>
            <span className={`badge ${c.estado === 'FINALIZADA' ? 'badge-success' : 'badge-warning'}`}>{c.estado}</span>
          </div>
          <p className="mt-2 text-sm">
            Peso: {c.peso ?? '-'} kg · Temperatura: {c.temperatura ?? '-'} °C · Costo: {c.costo}
          </p>
          {c.diagnostico && <p className="text-sm"><b>Diagnóstico:</b> {c.diagnostico}</p>}
          {c.tratamientos.length > 0 && (
            <ul className="list-disc ml-6 mt-2 text-sm">
              {c.tratamientos.map((t) => (
                <li key={t.id_tratamiento}>{t.medicamento}: {t.dosis}, {t.frecuencia}, por {t.duracion_dias} días</li>
              ))}
            </ul>
          )}
          {c.estado === 'EN_ATENCION' && (
            <button className="btn btn-sm btn-success mt-3 self-start" onClick={() => finalizar(c.id_consulta)}>
              Finalizar consulta
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

