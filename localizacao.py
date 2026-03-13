"""
Rotas para gerenciamento de localização hierárquica:
Continentes → Países → Estados → Municípios → Bairros
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.supabase import get_supabase_admin
from app.core.security import get_current_user, require_admin
from app.schemas.schemas import (
    ContinenteCreate, PaisCreate, EstadoCreate, MunicipioCreate, BairroCreate
)

router = APIRouter(prefix="/api/localizacao", tags=["Localização"])
client = get_supabase_admin()


# ─────────────────────────────────────────────────────────────
# CONTINENTES
# ─────────────────────────────────────────────────────────────
@router.get("/continentes")
async def listar_continentes():
    resp = client.table("continentes").select("*").order("nome").execute()
    return resp.data


@router.post("/continentes", status_code=status.HTTP_201_CREATED)
async def criar_continente(data: ContinenteCreate, _=Depends(require_admin)):
    resp = client.table("continentes").insert({"nome": data.nome}).execute()
    return resp.data[0]


@router.delete("/continentes/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_continente(id: str, _=Depends(require_admin)):
    client.table("continentes").delete().eq("id", id).execute()


# ─────────────────────────────────────────────────────────────
# PAÍSES
# ─────────────────────────────────────────────────────────────
@router.get("/paises")
async def listar_paises(continente_id: str = None):
    q = client.table("paises").select("*, continentes(nome)").order("nome")
    if continente_id:
        q = q.eq("continente_id", continente_id)
    return q.execute().data


@router.post("/paises", status_code=status.HTTP_201_CREATED)
async def criar_pais(data: PaisCreate, _=Depends(require_admin)):
    resp = client.table("paises").insert(data.model_dump()).execute()
    return resp.data[0]


# ─────────────────────────────────────────────────────────────
# ESTADOS
# ─────────────────────────────────────────────────────────────
@router.get("/estados")
async def listar_estados(pais_id: str = None):
    q = client.table("estados").select("*, paises(nome)").order("nome")
    if pais_id:
        q = q.eq("pais_id", pais_id)
    return q.execute().data


@router.post("/estados", status_code=status.HTTP_201_CREATED)
async def criar_estado(data: EstadoCreate, _=Depends(require_admin)):
    resp = client.table("estados").insert(data.model_dump()).execute()
    return resp.data[0]


# ─────────────────────────────────────────────────────────────
# MUNICÍPIOS
# ─────────────────────────────────────────────────────────────
@router.get("/municipios")
async def listar_municipios(estado_id: str = None):
    q = client.table("municipios").select("*, estados(nome)").order("nome")
    if estado_id:
        q = q.eq("estado_id", estado_id)
    return q.execute().data


@router.post("/municipios", status_code=status.HTTP_201_CREATED)
async def criar_municipio(data: MunicipioCreate, _=Depends(require_admin)):
    resp = client.table("municipios").insert(data.model_dump()).execute()
    return resp.data[0]


# ─────────────────────────────────────────────────────────────
# BAIRROS
# ─────────────────────────────────────────────────────────────
@router.get("/bairros")
async def listar_bairros(municipio_id: str = None):
    q = client.table("bairros").select("*, municipios(nome)").order("nome")
    if municipio_id:
        q = q.eq("municipio_id", municipio_id)
    return q.execute().data


@router.post("/bairros", status_code=status.HTTP_201_CREATED)
async def criar_bairro(data: BairroCreate, _=Depends(require_admin)):
    resp = client.table("bairros").insert(data.model_dump()).execute()
    return resp.data[0]
