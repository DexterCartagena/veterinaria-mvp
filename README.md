# 🐾 Sistema de Consultas Veterinarias

MVP de una clínica veterinaria para registrar propietarios, mascotas, consultas y tratamientos, y para ver el historial clínico de cada mascota con un gráfico 3D.

Proyecto final de **Tecnologías Informáticas**, de Dexter Cartagena.

## 🌐 Enlaces

| | |
|---|---|
| Aplicación (Vercel) | https://veterinaria-mvp.vercel.app |
| API (Render) | https://veterinaria-api-7i7u.onrender.com |
| Documentación de la API (Swagger) | https://veterinaria-api-7i7u.onrender.com/docs |

> La API usa el plan gratuito de Render, que se duerme tras unos minutos sin uso. La primera petición puede tardar cerca de un minuto en responder.

## ✨ Funcionalidades

- **Propietarios:** registro y búsqueda de dueños.
- **Mascotas:** registro de mascotas asociadas a su propietario.
- **Nueva consulta:** signos vitales, diagnóstico y tratamientos guardados en una sola transacción.
- **Historial clínico:** todas las consultas de una mascota, con el **Paseo de salud 3D**. Cada poste es una consulta: la altura representa el peso y el color el estado.
- **Alertas en Slack:** la API avisa al canal `#veterinaria-alertas` cuando se registra o se finaliza una consulta.

## 🛠️ Tecnologías

| Capa | Herramientas |
|---|---|
| Base de datos | Supabase (PostgreSQL) con RLS activo en las 5 tablas |
| Backend | Python, FastAPI, SQLAlchemy, psycopg2, desplegado en Render |
| Frontend | React, Vite, Tailwind CSS, DaisyUI, Axios, desplegado en Vercel |
| Gráfico 3D | Three.js, React Three Fiber, Drei |
| Colaboración | Slack (alertas), Comentera (revisión visual), Devin AI (Pull Request #1) |

## 🗂️ Modelo de datos

Cinco tablas relacionadas:

- `users`: usuarios del sistema (administrador, veterinario o recepcionista).
- `owners`: propietarios de las mascotas.
- `pets`: mascotas, cada una con su propietario.
- `consultations`: tabla central; une mascota y veterinario con los signos vitales y el diagnóstico.
- `treatments`: tratamientos indicados en cada consulta.

## 📁 Estructura del repositorio

```
veterinaria-mvp/
├── backend/            API en FastAPI
│   ├── main.py         rutas de la API
│   ├── models.py       tablas (SQLAlchemy)
│   ├── schemas.py      validación de datos (Pydantic)
│   ├── database.py     conexión a Supabase
│   ├── slack.py        envío de alertas a Slack
│   └── requirements.txt
└── frontend/           aplicación en React + Vite
    └── src/
        ├── pages/      Propietarios, Mascotas, NuevaConsulta, Historial
        ├── components/ PaseoSalud3D.jsx
        └── api.js      conexión con la API
```

## 🔌 Rutas de la API

Todas empiezan con `/api/v1`.

| Método | Ruta | Descripción |
|---|---|---|
| POST / GET | `/users` | Crear y listar usuarios |
| POST / GET | `/owners` | Crear y listar propietarios |
| POST / GET | `/pets` | Crear y listar mascotas |
| GET | `/pets/{id_mascota}/historial` | Historial clínico de una mascota |
| POST / GET | `/consultations` | Registrar y listar consultas |
| POST | `/consultations/{id_consulta}/treatments` | Agregar tratamientos a una consulta |
| PATCH | `/consultations/{id_consulta}/finalizar` | Finalizar una consulta |

## 💻 Cómo ejecutarlo en local

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # en Windows (en Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
```

Crea un archivo `backend/.env` con estas variables (este archivo **no** se sube a GitHub):

```
DATABASE_URL=postgresql+psycopg2://USUARIO:CONTRASEÑA@HOST:5432/postgres?sslmode=require
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...   # opcional
```

Luego inicia la API:

```bash
uvicorn main:app --reload
```

La documentación queda en http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Por defecto el frontend usa la API local (`http://127.0.0.1:8000/api/v1`). Para apuntar a otra, crea `frontend/.env` con `VITE_API_URL=<url de la API>/api/v1`.

## 🚀 Despliegue

- **Render (backend):** carpeta raíz `backend`, build `pip install -r requirements.txt`, inicio `uvicorn main:app --host 0.0.0.0 --port $PORT`. Variables: `DATABASE_URL`, `PYTHON_VERSION=3.12.7`, `SLACK_WEBHOOK_URL`.
- **Vercel (frontend):** carpeta raíz `frontend`, variable `VITE_API_URL=https://veterinaria-api-7i7u.onrender.com/api/v1`.

Cada `git push` a `main` vuelve a publicar automáticamente en Render y en Vercel.

## 👤 Autor

**Dexter Cartagena**, Tecnologías Informáticas, 2026.

