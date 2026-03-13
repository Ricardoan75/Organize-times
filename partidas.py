"""
Rotas para registro e gerenciamento de partidas.
A classificação é atualizada automaticamente via trigger no Supabase.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from app.core.supabase import get_supabase_admin
from app.core.security import get_current_user
from app.schemas.schemas import PartidaCreate, PartidaUpdate, PlacarUpdate

router = APIRouter(prefix="/api/partidas", tags=["Partidas"])
client = get_supabase_admin()

SELECT_PARTIDA = """
    *,
    campeonatos(nome, nivel),
    time_casa:times!partidas_time_casa_id_fkey(id, nome, escudo_url),
    time_fora:times!partidas_time_fora_id_fkey(id, nome, escudo_url)
"""


@router.get("/")
async def listar_partidas(
    campeonato_id: Optional[str] = None,
    time_id: Optional[str] = None,
    status_partida: Optional[str] = None,
):
    q = client.table("partidas").select(SELECT_PARTIDA).order("data_partida", desc=True)
    if campeonato_id:
        q = q.eq("campeonato_id", campeonato_id)
    if time_id:
        q = q.or_(f"time_casa_id.eq.{time_id},time_fora_id.eq.{time_id}")
    if status_partida:
        q = q.eq("status", status_partida)
    return q.execute().data


@router.get("/{partida_id}")
async def obter_partida(partida_id: str):
    resp = (
        client.table("partidas")
        .select(SELECT_PARTIDA)
        .eq("id", partida_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")
    return resp.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def criar_partida(data: PartidaCreate, current_user: dict = Depends(get_current_user)):
    """Agenda uma nova partida."""
    if str(data.time_casa_id) == str(data.time_fora_id):
        raise HTTPException(status_code=400, detail="Os times não podem ser iguais.")

    payload = {
        "campeonato_id": str(data.campeonato_id),
        "time_casa_id": str(data.time_casa_id),
        "time_fora_id": str(data.time_fora_id),
        "registrado_por": current_user["id"],
        "status": "agendada",
    }
    if data.data_partida:
        payload["data_partida"] = data.data_partida.isoformat()

    resp = client.table("partidas").insert(payload).execute()
    return resp.data[0]


@router.patch("/{partida_id}/placar")
async def registrar_placar(
    partida_id: str,
    placar: PlacarUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra o placar e marca a partida como finalizada.
    O trigger no Supabase atualizará automaticamente a classificação.
    """
    payload = {
        "gols_casa": placar.gols_casa,
        "gols_fora": placar.gols_fora,
        "status": "finalizada",
    }
    resp = client.table("partidas").update(payload).eq("id", partida_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")
    return resp.data[0]


@router.put("/{partida_id}")
async def atualizar_partida(
    partida_id: str,
    data: PartidaUpdate,
    current_user: dict = Depends(get_current_user)
):
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "data_partida" in payload:
        payload["data_partida"] = payload["data_partida"].isoformat()

    resp = client.table("partidas").update(payload).eq("id", partida_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Partida não encontrada.")
    return resp.data[0]


@router.delete("/{partida_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_partida(partida_id: str, _=Depends(get_current_user)):
    client.table("partidas").delete().eq("id", partida_id).execute()
