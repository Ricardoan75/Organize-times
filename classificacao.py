"""
Rotas de classificação e ranking global.
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.core.supabase import get_supabase_admin

router = APIRouter(prefix="/api/classificacao", tags=["Classificação & Ranking"])
client = get_supabase_admin()


@router.get("/campeonato/{campeonato_id}")
async def classificacao_campeonato(campeonato_id: str):
    """
    Retorna a tabela de classificação de um campeonato específico,
    ordenada por pontos → saldo de gols → gols marcados.
    """
    resp = (
        client.table("classificacao")
        .select("*, times(id, nome, escudo_url, bairros(nome))")
        .eq("campeonato_id", campeonato_id)
        .order("pontos", desc=True)
        .order("saldo_gols", desc=True)
        .order("gols_pro", desc=True)
        .execute()
    )
    # Adiciona posição manualmente (1-indexed)
    data = resp.data
    for i, row in enumerate(data):
        row["posicao"] = i + 1
    return data


@router.get("/ranking")
async def ranking_global(
    nivel: Optional[str] = Query(None, description="bairro|municipio|estado|pais|continente"),
    bairro_id: Optional[str] = None,
    municipio_id: Optional[str] = None,
    estado_id: Optional[str] = None,
    pais_id: Optional[str] = None,
    continente_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Ranking global de times: agrega pontos de todos os campeonatos
    e filtra por nível geográfico.
    Retorna os `limit` melhores times no filtro especificado.
    """
    # Usamos a view criada no SQL
    q = (
        client.table("vw_ranking_global")
        .select("*")
        .eq("posicao", 1)   # Apenas campeões de cada campeonato para ranking global
        .order("pontos", desc=True)
        .order("saldo_gols", desc=True)
        .limit(limit)
    )

    if nivel:
        q = q.eq("nivel", nivel)
    if bairro_id:
        q = q.eq("bairro_id", bairro_id)
    if municipio_id:
        q = q.eq("municipio_id", municipio_id)
    if estado_id:
        q = q.eq("estado_id", estado_id)
    if pais_id:
        q = q.eq("pais_id", pais_id)
    if continente_id:
        q = q.eq("continente_id", continente_id)

    return q.execute().data


@router.get("/melhor-por-nivel")
async def melhor_por_nivel():
    """
    Retorna o melhor time em cada nível geográfico (bairro, município, estado, país, continente).
    Usado no dashboard para exibição rápida.
    """
    niveis = ["bairro", "municipio", "estado", "pais", "continente"]
    resultado = {}

    for nivel in niveis:
        resp = (
            client.table("vw_ranking_global")
            .select("time_id, time, escudo_url, pontos, vitorias, saldo_gols, nivel")
            .eq("nivel", nivel)
            .order("pontos", desc=True)
            .order("saldo_gols", desc=True)
            .limit(1)
            .execute()
        )
        resultado[nivel] = resp.data[0] if resp.data else None

    return resultado
