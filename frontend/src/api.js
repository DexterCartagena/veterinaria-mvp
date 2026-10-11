import axios from 'axios'
 
// URL del backend: en local usa FastAPI en el puerto 8000; al desplegar se cambia con VITE_API_URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
})
 
// Convierte los errores de FastAPI en un texto legible
export function mensajeError(err) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc.at(-1)}: ${d.msg}`).join(' · ')
  return detail || 'No se pudo conectar con el servidor'
}
 
export default api