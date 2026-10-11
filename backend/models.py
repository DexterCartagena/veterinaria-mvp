from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id_usuario = Column(Integer, primary_key=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)  # ADMINISTRADOR, VETERINARIO, RECEPCIONISTA
    activo = Column(Boolean, nullable=False, default=True)
    creado_en = Column(DateTime, nullable=False, default=datetime.utcnow)


class Owner(Base):
    __tablename__ = "owners"
    id_propietario = Column(Integer, primary_key=True)
    documento_identidad = Column(String(20), unique=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=False)
    email = Column(String(150))
    direccion = Column(String(200))
    creado_en = Column(DateTime, nullable=False, default=datetime.utcnow)
    mascotas = relationship("Pet", back_populates="propietario")


class Pet(Base):
    __tablename__ = "pets"
    id_mascota = Column(Integer, primary_key=True)
    id_propietario = Column(Integer, ForeignKey("owners.id_propietario"), nullable=False)
    nombre = Column(String(80), nullable=False)
    especie = Column(String(10), nullable=False)  # PERRO, GATO, AVE, ROEDOR, OTRO
    raza = Column(String(80))
    sexo = Column(String(6), nullable=False)  # MACHO, HEMBRA
    fecha_nacimiento = Column(Date)
    peso = Column(Numeric(5, 2))
    esterilizado = Column(Boolean, nullable=False, default=False)
    observaciones = Column(Text)
    propietario = relationship("Owner", back_populates="mascotas")
    consultas = relationship("Consultation", back_populates="mascota")


class Consultation(Base):
    __tablename__ = "consultations"
    id_consulta = Column(Integer, primary_key=True)
    id_mascota = Column(Integer, ForeignKey("pets.id_mascota"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("users.id_usuario"), nullable=False)
    fecha_hora = Column(DateTime, nullable=False, default=datetime.utcnow)
    motivo = Column(String(200), nullable=False)
    peso = Column(Numeric(5, 2))
    temperatura = Column(Numeric(4, 1))
    sintomas = Column(Text)
    diagnostico = Column(Text)
    costo = Column(Numeric(10, 2), nullable=False, default=0)
    estado = Column(String(12), nullable=False, default="EN_ATENCION")  # EN_ATENCION, FINALIZADA
    mascota = relationship("Pet", back_populates="consultas")
    tratamientos = relationship("Treatment", back_populates="consulta", cascade="all, delete-orphan")


class Treatment(Base):
    __tablename__ = "treatments"
    id_tratamiento = Column(Integer, primary_key=True)
    id_consulta = Column(Integer, ForeignKey("consultations.id_consulta", ondelete="CASCADE"), nullable=False)
    medicamento = Column(String(150), nullable=False)
    dosis = Column(String(50), nullable=False)
    frecuencia = Column(String(50), nullable=False)
    duracion_dias = Column(Integer, nullable=False)
    indicaciones = Column(Text)
    consulta = relationship("Consultation", back_populates="tratamientos")