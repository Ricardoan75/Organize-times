"""
Rotas para gerenciamento de times.
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from app.core.supabase import get_supabase_admin
from app.core.security import get_current_user, require_admin
from app.schemas.schemas import TimeCreate, TimeUpdate

router = APIRouter(prefix="/api/times", tags=["Times"])
client = get_supabase_admin()

SELECT_TIMES = """
    *,
    bairros(
        nome,
        municipios(
            nome,
            estados(
                nome,
                paises(
                    nome,
                    continentes(nome)
                )
            )
        )
    )
"""


@router.get("/")
async def listar_times(
    bairro_id: Optional[str] = None,
    municipio_id: Optional[str] = None,
    estado_id: Optional[str] = None,
    pais_id: Optional[str] = None,
    continente_id: Optional[str] = None,
    busca: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Lista times com filtros hierárquicos e paginação."""
    offset = (page - 1) * limit
    q = client.table("times").select(SELECT_TIMES).eq("ativo", True).order("nome")

    if bairro_id:
        q = q.eq("bairro_id", bairro_id)
    if busca:
        q = q.ilike("nome", f"%{busca}%")

    q = q.range(offset, offset + limit - 1)
    return q.execute().data


@router.get("/{time_id}")
async def obter_time(time_id: str):
    resp = (
        client.table("times")
        .select(SELECT_TIMES)
        .eq("id", time_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Time não encontrado.")
    return resp.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def criar_time(data: TimeCreate, current_user: dict = Depends(get_current_user)):
    """Cria um novo time. Associa automaticamente ao usuário autenticado."""
    payload = data.model_dump()
    payload["proprietario_id"] = current_user["id"]
    # Converte UUID para string se necessário
    if payload.get("bairro_id"):
        payload["bairro_id"] = str(payload["bairro_id"])

    resp = client.table("times").insert(payload).execute()
    return resp.data[0]


@router.put("/{time_id}")
async def atualizar_time(
    time_id: str, data: TimeUpdate, current_user: dict = Depends(get_current_user)
):
    # Busca o time e verifica propriedade (ou se é admin)
    time_resp = client.table("times").select("proprietario_id").eq("id", time_id).single().execute()
    if not time_resp.data:
        raise HTTPException(status_code=404, detail="Time não encontrado.")

    eh_dono = time_resp.data["proprietario_id"] == current_user["id"]
    eh_admin = current_user.get("tipo") == "administrador"
    if not (eh_dono or eh_admin):
        raise HTTPException(status_code=403, detail="Sem permissão para editar este time.")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "bairro_id" in payload:
        payload["bairro_id"] = str(payload["bairro_id"])

    resp = client.table("times").update(payload).eq("id", time_id).execute()
    return resp.data[0]


@router.delete("/{time_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_time(time_id: str, _=Depends(require_admin)):
    """Soft-delete: marca o time como inativo."""
    client.table("times").update({"ativo": False}).eq("id", time_id).execute()
