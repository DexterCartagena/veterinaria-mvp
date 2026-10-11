from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Usuarios ----------
class UserCreate(BaseModel):
    nombres: str
    apellidos: str
    email: str
    password: str = Field(min_length=6)
    rol: Literal["ADMINISTRADOR", "VETERINARIO", "RECEPCIONISTA"]


class UserOut(ORM):
    id_usuario: int
    nombres: str
    apellidos: str
    email: str
    rol: str
    activo: bool


# ---------- Propietarios ----------
class OwnerCreate(BaseModel):
    documento_identidad: str
    nombres: str
    apellidos: str
    telefono: str
    email: Optional[str] = None
    direccion: Optional[str] = None


class OwnerOut(OwnerCreate, ORM):
    id_propietario: int


# ---------- Mascotas ----------
class PetCreate(BaseModel):
    id_propietario: int
    nombre: str
    especie: Literal["PERRO", "GATO", "AVE", "ROEDOR", "OTRO"]
    raza: Optional[str] = None
    sexo: Literal["MACHO", "HEMBRA"]
    fecha_nacimiento: Optional[date] = None
    peso: Optional[float] = Field(default=None, gt=0)
    esterilizado: bool = False
    observaciones: Optional[str] = None


class PetOut(PetCreate, ORM):
    id_mascota: int


# ---------- Tratamientos ----------
class TreatmentCreate(BaseModel):
    medicamento: str
    dosis: str
    frecuencia: str
    duracion_dias: int = Field(gt=0)
    indicaciones: Optional[str] = None


class TreatmentOut(TreatmentCreate, ORM):
    id_tratamiento: int


# ---------- Consultas ----------
class ConsultationCreate(BaseModel):
    id_mascota: int
    id_usuario: int
    motivo: str
    peso: Optional[float] = Field(default=None, gt=0)
    temperatura: Optional[float] = None
    sintomas: Optional[str] = None
    diagnostico: Optional[str] = None
    costo: float = Field(default=0, ge=0)
    tratamientos: list[TreatmentCreate] = []


class ConsultationOut(ORM):
    id_consulta: int
    id_mascota: int
    id_usuario: int
    fecha_hora: datetime
    motivo: str
    peso: Optional[float]
    temperatura: Optional[float]
    sintomas: Optional[str]
    diagnostico: Optional[str]
    costo: float
    estado: str
    tratamientos: list[TreatmentOut]