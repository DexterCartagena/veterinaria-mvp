# App de Integración — FastAPI + JWT + Frontend

Aplicación desacoplada con un backend REST en **FastAPI** protegido con **JWT** y un frontend web en **HTML + JavaScript (Fetch API)**.

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Inicia sesión y devuelve un token JWT |
| GET | `/api/v1/productos` | Lista los productos (público) |
| POST | `/api/v1/productos` | Crea un producto (requiere Bearer Token) |

## Cómo ejecutarlo
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- Documentación Swagger: http://127.0.0.1:8000/docs
- Frontend: abrir `frontend/index.html` en el navegador
- Usuario de prueba: `admin` / `123456`
