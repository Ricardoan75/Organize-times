"""
Rotas para campeonatos e inscrição de times.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from app.core.supabase import get_supabase_admin
from app.core.security import get_current_user, require_admin, check_plano
from app.schemas.schemas import CampeonatoCreate, CampeonatoUpdate

router = APIRouter(prefix="/api/campeonatos", tags=["Campeonatos"])
client = get_supabase_admin()

SELECT_CAMP = """
    *,
    bairros(nome),
    municipios(nome),
    estados(nome),
    paises(nome),
    continentes(nome),
    campeonato_times(time_id, times(id, nome, escudo_url))
"""


@router.get("/")
async def listar_campeonatos(
    nivel: Optional[str] = None,
    status: Optional[str] = None,
    bairro_id: Optional[str] = None,
    municipio_id: Optional[str] = None,
    estado_id: Optional[str] = None,
    pais_id: Optional[str] = None,
):
    q = client.table("campeonatos").select(SELECT_CAMP).order("created_at", desc=True)
    if nivel:
        q = q.eq("nivel", nivel)
    if status:
        q = q.eq("status", status)
    if bairro_id:
        q = q.eq("bairro_id", bairro_id)
    if municipio_id:
        q = q.eq("municipio_id", municipio_id)
    if estado_id:
        q = q.eq("estado_id", estado_id)
    if pais_id:
        q = q.eq("pais_id", pais_id)
    return q.execute().data


@router.get("/{camp_id}")
async def obter_campeonato(camp_id: str):
    resp = (
        client.table("campeonatos")
        .select(SELECT_CAMP)
        .eq("id", camp_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado.")
    return resp.data


@router.post("/", status_code=status.HTTP_201_CREATED)
async def criar_campeonato(
    data: CampeonatoCreate,
    current_user: dict = Depends(get_current_user)
):
    """Cria campeonato. Verifica plano do usuário antes."""
    check_plano(data.nivel, current_user)

    payload = data.model_dump(exclude={"times_ids"})
    payload["criado_por"] = current_user["id"]
    # Converte UUIDs para string
    for field in ["bairro_id", "municipio_id", "estado_id", "pais_id", "continente_id"]:
        if payload.get(field):
            payload[field] = str(payload[field])
    if payload.get("data_inicio"):
        payload["data_inicio"] = str(payload["data_inicio"])
    if payload.get("data_fim"):
        payload["data_fim"] = str(payload["data_fim"])

    resp = client.table("campeonatos").insert(payload).execute()
    camp = resp.data[0]

    # Inscreve times, se fornecidos
    if data.times_ids:
        inscricoes = [
            {"campeonato_id": camp["id"], "time_id": str(tid)}
            for tid in data.times_ids
        ]
        client.table("campeonato_times").insert(inscricoes).execute()

    return camp


@router.put("/{camp_id}")
async def atualizar_campeonato(
    camp_id: str,
    data: CampeonatoUpdate,
    current_user: dict = Depends(get_current_user)
):
    camp = client.table("campeonatos").select("criado_por").eq("id", camp_id).single().execute()
    if not camp.data:
        raise HTTPException(status_code=404, detail="Campeonato não encontrado.")

    eh_criador = camp.data["criado_por"] == current_user["id"]
    eh_admin = current_user.get("tipo") == "administrador"
    if not (eh_criador or eh_admin):
        raise HTTPException(status_code=403, detail="Sem permissão.")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "data_inicio" in payload:
        payload["data_inicio"] = str(payload["data_inicio"])
    if "data_fim" in payload:
        payload["data_fim"] = str(payload["data_fim"])

    resp = client.table("campeonatos").update(payload).eq("id", camp_id).execute()
    return resp.data[0]


@router.post("/{camp_id}/times/{time_id}", status_code=status.HTTP_201_CREATED)
async def inscrever_time(camp_id: str, time_id: str, _=Depends(get_current_user)):
    """Inscreve um time em um campeonato."""
    try:
        resp = client.table("campeonato_times").insert(
            {"campeonato_id": camp_id, "time_id": time_id}
        ).execute()
        return resp.data[0]
    except Exception:
        raise HTTPException(status_code=400, detail="Time já inscrito ou dados inválidos.")


@router.delete("/{camp_id}/times/{time_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remover_time(camp_id: str, time_id: str, _=Depends(require_admin)):
    client.table("campeonato_times").delete().eq("campeonato_id", camp_id).eq("time_id", time_id).execute()
