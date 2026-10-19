from typing import List, Optional

import bcrypt
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from slack import enviar_alerta

# Crea las tablas en Supabase automáticamente si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Veterinaria - Consultas (Supabase DB)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 1. Usuarios
@app.post("/api/v1/users", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")
    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    new_user = models.User(**user.model_dump(exclude={"password"}), password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/v1/users", response_model=List[schemas.UserOut], tags=["Usuarios"])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# 2. Propietarios
@app.post("/api/v1/owners", response_model=schemas.OwnerOut, status_code=status.HTTP_201_CREATED, tags=["Propietarios"])
def create_owner(owner: schemas.OwnerCreate, db: Session = Depends(get_db)):
    if db.query(models.Owner).filter(models.Owner.documento_identidad == owner.documento_identidad).first():
        raise HTTPException(status_code=400, detail="Ya existe un propietario con ese documento")
    new_owner = models.Owner(**owner.model_dump())
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    return new_owner


@app.get("/api/v1/owners", response_model=List[schemas.OwnerOut], tags=["Propietarios"])
def list_owners(buscar: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Owner)
    if buscar:
        patron = f"%{buscar}%"
        query = query.filter(or_(
            models.Owner.nombres.ilike(patron),
            models.Owner.apellidos.ilike(patron),
            models.Owner.documento_identidad.ilike(patron),
        ))
    return query.order_by(models.Owner.apellidos).all()


# 3. Mascotas
@app.post("/api/v1/pets", response_model=schemas.PetOut, status_code=status.HTTP_201_CREATED, tags=["Mascotas"])
def create_pet(pet: schemas.PetCreate, db: Session = Depends(get_db)):
    if not db.get(models.Owner, pet.id_propietario):
        raise HTTPException(status_code=404, detail=f"Propietario con ID {pet.id_propietario} no encontrado")
    new_pet = models.Pet(**pet.model_dump())
    db.add(new_pet)
    db.commit()
    db.refresh(new_pet)
    return new_pet


@app.get("/api/v1/pets", response_model=List[schemas.PetOut], tags=["Mascotas"])
def list_pets(id_propietario: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Pet)
    if id_propietario:
        query = query.filter(models.Pet.id_propietario == id_propietario)
    return query.all()


@app.get("/api/v1/pets/{id_mascota}/historial", response_model=List[schemas.ConsultationOut], tags=["Mascotas"])
def pet_history(id_mascota: int, db: Session = Depends(get_db)):
    if not db.get(models.Pet, id_mascota):
        raise HTTPException(status_code=404, detail="Mascota no encontrada")
    return (db.query(models.Consultation)
            .filter(models.Consultation.id_mascota == id_mascota)
            .order_by(models.Consultation.fecha_hora.desc())
            .all())


# 4. Transacción de Consulta (equivalente al checkout de ventas)
@app.post("/api/v1/consultations", response_model=schemas.ConsultationOut, status_code=status.HTTP_201_CREATED, tags=["Consultas"])
def register_consultation(consulta_in: schemas.ConsultationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        # Validar que la mascota exista
        pet = db.get(models.Pet, consulta_in.id_mascota)
        if not pet:
            raise HTTPException(status_code=404, detail=f"Mascota con ID {consulta_in.id_mascota} no encontrada")

        # Validar que quien atiende sea un veterinario activo
        vet = db.get(models.User, consulta_in.id_usuario)
        if not vet or not vet.activo or vet.rol not in ("VETERINARIO", "ADMINISTRADOR"):
            raise HTTPException(status_code=403, detail="Solo un veterinario activo puede registrar consultas")

        # Registrar cabecera de la consulta
        db_consulta = models.Consultation(**consulta_in.model_dump(exclude={"tratamientos"}))
        db.add(db_consulta)
        db.flush()  # Obtiene db_consulta.id_consulta sin hacer commit definitivo

        # Registrar detalle de tratamientos
        for t in consulta_in.tratamientos:
            db.add(models.Treatment(id_consulta=db_consulta.id_consulta, **t.model_dump()))

        # Actualizar el peso de la mascota con el medido en la consulta
        if consulta_in.peso is not None:
            pet.peso = consulta_in.peso

        # Confirmar la transacción atómica
        db.commit()
        db.refresh(db_consulta)

        # Alerta en Slack (se envía en segundo plano para no hacer esperar al usuario)
        dueno = pet.propietario
        background_tasks.add_task(enviar_alerta, (
            f":stethoscope: *Nueva consulta #{db_consulta.id_consulta}*\n"
            f"Mascota: {pet.nombre} ({pet.especie}) · Dueño: {dueno.nombres} {dueno.apellidos}\n"
            f"Motivo: {db_consulta.motivo} · Peso: {db_consulta.peso or '-'} kg · Veterinario: {vet.nombres} {vet.apellidos}\n"
            f"Tratamientos: {len(consulta_in.tratamientos)}"
        ))
        return db_consulta

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la transacción: {str(e)}")


@app.get("/api/v1/consultations", response_model=List[schemas.ConsultationOut], tags=["Consultas"])
def list_consultations(estado: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Consultation)
    if estado:
        query = query.filter(models.Consultation.estado == estado)
    return query.order_by(models.Consultation.fecha_hora.desc()).all()


@app.post("/api/v1/consultations/{id_consulta}/treatments", response_model=schemas.ConsultationOut, status_code=status.HTTP_201_CREATED, tags=["Consultas"])
def add_treatment(id_consulta: int, tratamiento: schemas.TreatmentCreate, db: Session = Depends(get_db)):
    consulta = db.get(models.Consultation, id_consulta)
    if not consulta:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    if consulta.estado == "FINALIZADA":
        raise HTTPException(status_code=400, detail="La consulta está finalizada y no se puede modificar")
    db.add(models.Treatment(id_consulta=id_consulta, **tratamiento.model_dump()))
    db.commit()
    db.refresh(consulta)
    return consulta


@app.patch("/api/v1/consultations/{id_consulta}/finalizar", response_model=schemas.ConsultationOut, tags=["Consultas"])
def finish_consultation(id_consulta: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    consulta = db.get(models.Consultation, id_consulta)
    if not consulta:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    if consulta.estado == "FINALIZADA":
        raise HTTPException(status_code=400, detail="La consulta ya estaba finalizada")
    consulta.estado = "FINALIZADA"
    db.commit()
    db.refresh(consulta)
    background_tasks.add_task(enviar_alerta, (
        f":white_check_mark: *Consulta #{consulta.id_consulta} finalizada*\n"
        f"Mascota: {consulta.mascota.nombre} · Diagnóstico: {consulta.diagnostico or 'sin diagnóstico'} · Costo: {consulta.costo}"
    ))
    return consulta
