import { useState } from 'react'
import Propietarios from './pages/Propietarios.jsx'
import Mascotas from './pages/Mascotas.jsx'
import NuevaConsulta from './pages/NuevaConsulta.jsx'
import Historial from './pages/Historial.jsx'

const PESTANAS = ['Propietarios', 'Mascotas', 'Nueva consulta', 'Historial']

export default function App() {
  const [pestana, setPestana] = useState('Propietarios')

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-primary text-primary-content shadow">
        <span className="text-xl font-bold px-4">🐾 Veterinaria MVP</span>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        <div role="tablist" className="tabs tabs-box mb-4">
          {PESTANAS.map((p) => (
            <button key={p} role="tab"
              className={`tab ${pestana === p ? 'tab-active' : ''}`}
              onClick={() => setPestana(p)}>
              {p}
            </button>
          ))}
        </div>

        {pestana === 'Propietarios' && <Propietarios />}
        {pestana === 'Mascotas' && <Mascotas />}
        {pestana === 'Nueva consulta' && <NuevaConsulta />}
        {pestana === 'Historial' && <Historial />}
      </div>
    </div>
  )
}
