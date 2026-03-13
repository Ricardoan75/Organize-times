"""
ORGANIZE FUTEBOL GLOBAL
API Principal - FastAPI

Para rodar localmente:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Documentação disponível em:
    http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.routers import auth, localizacao, times, campeonatos, partidas, classificacao

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="API para organização e classificação de times de futebol",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(localizacao.router)
app.include_router(times.router)
app.include_router(campeonatos.router)
app.include_router(partidas.router)
app.include_router(classificacao.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
