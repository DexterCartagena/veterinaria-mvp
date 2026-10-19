import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'

// Distancia entre un poste (consulta) y el siguiente a lo largo del sendero
const ESPACIO = 3

const COLOR_ESTADO = { FINALIZADA: '#22c55e', EN_ATENCION: '#f59e0b' }
const COLOR_MASCOTA = { PERRO: '#a0522d', GATO: '#f97316', AVE: '#38bdf8', ROEDOR: '#d6d3d1', OTRO: '#a78bfa' }

// Un poste por consulta: la altura depende del peso y el color del estado
function Poste({ consulta, x, altura, activo, onHover }) {
  const color = COLOR_ESTADO[consulta.estado] ?? '#94a3b8'
  return (
    <mesh
      position={[x, altura / 2, -1.6]}
      castShadow
      onPointerOver={(e) => { e.stopPropagation(); onHover(consulta.id_consulta) }}
      onPointerOut={() => onHover(null)}
    >
      <cylinderGeometry args={[0.35, 0.35, altura, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={activo ? 0.5 : 0.1} />
    </mesh>
  )
}

// Mueve cada etiqueta (que está fuera del 3D, en HTML normal) encima de su poste en cada cuadro
function Proyector({ puntos, etiquetas }) {
  const v = useRef(new THREE.Vector3())
  useFrame(({ camera, size }) => {
    puntos.forEach((p, i) => {
      const el = etiquetas.current[i]
      if (!el) return
      v.current.set(...p).project(camera)
      const x = (v.current.x * 0.5 + 0.5) * size.width
      const y = (-v.current.y * 0.5 + 0.5) * size.height
      el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
    })
  })
  return null
}

// Figura sencilla del propietario
function Duenio({ piernas }) {
  return (
    <group>
      <mesh ref={(m) => (piernas.current[0] = m)} position={[0, 0.45, 0.15]} castShadow>
        <boxGeometry args={[0.18, 0.9, 0.18]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh ref={(m) => (piernas.current[1] = m)} position={[0, 0.45, -0.15]} castShadow>
        <boxGeometry args={[0.18, 0.9, 0.18]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.35, 0.9, 0.6]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#f1c27d" />
      </mesh>
      {/* Brazo que sostiene la correa */}
      <mesh position={[0.25, 1.25, 0.4]} rotation={[0, 0, -0.8]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshStandardMaterial color="#f1c27d" />
      </mesh>
    </group>
  )
}

// Figura sencilla de la mascota; las orejas cambian si es gato
function Mascota({ especie, patas, cola }) {
  const color = COLOR_MASCOTA[especie] ?? COLOR_MASCOTA.OTRO
  const patasPos = [[0.3, 0.15], [0.3, -0.15], [-0.3, 0.15], [-0.3, -0.15]]
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.9, 0.4, 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.55, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[0.12, -0.12].map((z) => (
        <mesh key={z} position={[0.55, 1.05, z]} castShadow>
          {especie === 'GATO' ? <coneGeometry args={[0.08, 0.2, 12]} /> : <sphereGeometry args={[0.09, 12, 12]} />}
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <mesh position={[0.78, 0.78, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {patasPos.map(([x, z], i) => (
        <mesh key={i} ref={(m) => (patas.current[i] = m)} position={[x, 0.15, z]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      <mesh ref={cola} position={[-0.55, 0.7, 0]} rotation={[0, 0, 0.8]} castShadow>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

// El dueño y la mascota caminan juntos por el sendero, de la primera a la última consulta
function Paseo({ especie, inicio, fin }) {
  const grupo = useRef()
  const piernas = useRef([])
  const patas = useRef([])
  const cola = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const largo = fin - inicio
    grupo.current.position.x = inicio + ((t * 1.2) % largo)
    grupo.current.position.y = Math.abs(Math.sin(t * 6)) * 0.05
    const paso = Math.sin(t * 6) * 0.5
    piernas.current.forEach((p, i) => p && (p.rotation.z = i % 2 ? paso : -paso))
    patas.current.forEach((p, i) => p && (p.rotation.z = i % 2 ? paso : -paso))
    if (cola.current) cola.current.rotation.x = Math.sin(t * 12) * 0.5
  })

  return (
    <group ref={grupo}>
      <group position={[0, 0, 0.6]}>
        <Duenio piernas={piernas} />
      </group>
      <group position={[1.4, 0, -0.4]}>
        <Mascota especie={especie} patas={patas} cola={cola} />
      </group>
      {/* Correa: de la mano del dueño al collar de la mascota */}
      <Line points={[[0.45, 1.0, 1.0], [1.2, 0.8, 0.2], [1.85, 0.75, -0.4]]} color="#7c2d12" lineWidth={2} />
    </group>
  )
}

function Arbol({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 12]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.8, 1.8, 16]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  )
}

export default function PaseoSalud3D({ consultas, mascota }) {
  // Ordenamos de la consulta más antigua a la más reciente
  const ordenadas = [...consultas].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  const pesoMax = Math.max(...ordenadas.map((c) => Number(c.peso) || 0), 1)
  const inicio = -ESPACIO
  const fin = ordenadas.length * ESPACIO
  const centro = (inicio + fin) / 2
  const largo = fin - inicio + 6
  const alturas = ordenadas.map((c) => 0.6 + ((Number(c.peso) || 0) / pesoMax) * 2.4)
  const puntos = ordenadas.map((c, i) => [i * ESPACIO, alturas[i] + 0.3, -1.6])
  const etiquetas = useRef([])
  const [activo, setActivo] = useState(null)

  return (
    <div className="card bg-base-100 shadow p-4">
      <h3 className="font-bold">Paseo de salud 3D de {mascota?.nombre}</h3>
      <p className="text-sm opacity-70">
        Cada poste es una consulta (de la más antigua a la más reciente). La altura representa el peso y el color el estado.
        Pasa el mouse sobre un poste para ver el detalle; arrastra para girar y usa la rueda para acercar.
      </p>
      <div className="relative h-96 mt-2 rounded-xl overflow-hidden bg-sky-100">
        <Canvas shadows camera={{ position: [centro - 2, 6, 10], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centro, 0, 0]} receiveShadow>
            <planeGeometry args={[largo + 10, 16]} />
            <meshStandardMaterial color="#86efac" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centro, 0.01, 0.3]} receiveShadow>
            <planeGeometry args={[largo, 2.4]} />
            <meshStandardMaterial color="#e7d3a7" />
          </mesh>
          {ordenadas.map((c, i) => (
            <Poste key={c.id_consulta} consulta={c} x={i * ESPACIO} altura={alturas[i]} activo={activo === c.id_consulta} onHover={setActivo} />
          ))}
          <Proyector puntos={puntos} etiquetas={etiquetas} />
          <Paseo especie={mascota?.especie} inicio={inicio - 1} fin={fin} />
          <Arbol position={[inicio - 2, 0, -4]} />
          <Arbol position={[centro + ESPACIO / 2, 0, -5.5]} />
          <Arbol position={[fin + 1, 0, -4]} />
          <Arbol position={[centro + 2, 0, 4.5]} />
          <OrbitControls target={[centro, 1, 0]} maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={30} />
        </Canvas>
        {ordenadas.map((c, i) => (
          <div
            key={c.id_consulta}
            ref={(el) => (etiquetas.current[i] = el)}
            className={`absolute top-0 left-0 pointer-events-none bg-base-100 rounded-lg shadow px-2 py-1 text-xs whitespace-nowrap ${activo === c.id_consulta ? 'z-10' : ''}`}
          >
            <b>#{c.id_consulta}</b> · {c.peso ?? '-'} kg
            {activo === c.id_consulta && (
              <div className="mt-1">
                <div>{new Date(c.fecha_hora + 'Z').toLocaleDateString()}</div>
                <div>Motivo: {c.motivo}</div>
                {c.diagnostico && <div>Diagnóstico: {c.diagnostico}</div>}
                <div>Estado: {c.estado}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-sm">
        <span className="flex items-center gap-1"><span className="badge badge-success badge-xs"></span> Finalizada</span>
        <span className="flex items-center gap-1"><span className="badge badge-warning badge-xs"></span> En atención</span>
      </div>
    </div>
  )
}
