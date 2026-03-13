"""
Schemas Pydantic para validação de dados de entrada e saída.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


# ─────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    tipo: str = Field(..., pattern="^(administrador|tecnico)$")


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ─────────────────────────────────────────────────────────────
# LOCALIZAÇÃO
# ─────────────────────────────────────────────────────────────
class ContinenteCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)


class PaisCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    continente_id: UUID


class EstadoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    sigla: Optional[str] = Field(None, max_length=5)
    pais_id: UUID


class MunicipioCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150)
    estado_id: UUID


class BairroCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150)
    municipio_id: UUID


# ─────────────────────────────────────────────────────────────
# TIMES
# ─────────────────────────────────────────────────────────────
class TimeCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    tecnico: Optional[str] = Field(None, max_length=200)
    bairro_id: Optional[UUID] = None
    escudo_url: Optional[str] = None


class TimeUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=200)
    tecnico: Optional[str] = None
    bairro_id: Optional[UUID] = None
    escudo_url: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# CAMPEONATOS
# ─────────────────────────────────────────────────────────────
class CampeonatoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=200)
    nivel: str = Field(..., pattern="^(bairro|municipio|estado|pais|continente)$")
    bairro_id: Optional[UUID] = None
    municipio_id: Optional[UUID] = None
    estado_id: Optional[UUID] = None
    pais_id: Optional[UUID] = None
    continente_id: Optional[UUID] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    times_ids: Optional[List[UUID]] = []


class CampeonatoUpdate(BaseModel):
    nome: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(planejado|em_andamento|finalizado)$")
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


# ─────────────────────────────────────────────────────────────
# PARTIDAS
# ─────────────────────────────────────────────────────────────
class PartidaCreate(BaseModel):
    campeonato_id: UUID
    time_casa_id: UUID
    time_fora_id: UUID
    data_partida: Optional[datetime] = None


class PartidaUpdate(BaseModel):
    gols_casa: Optional[int] = Field(None, ge=0)
    gols_fora: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(agendada|em_andamento|finalizada|cancelada)$")
    data_partida: Optional[datetime] = None


class PlacarUpdate(BaseModel):
    gols_casa: int = Field(..., ge=0)
    gols_fora: int = Field(..., ge=0)


# ─────────────────────────────────────────────────────────────
# RANKING
# ─────────────────────────────────────────────────────────────
class FiltroRanking(BaseModel):
    nivel: Optional[str] = None          # bairro, municipio, estado, pais, continente
    bairro_id: Optional[UUID] = None
    municipio_id: Optional[UUID] = None
    estado_id: Optional[UUID] = None
    pais_id: Optional[UUID] = None
    continente_id: Optional[UUID] = None
    campeonato_id: Optional[UUID] = None
