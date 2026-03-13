"""
Rotas de autenticação: registro, login, perfil.
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.core.supabase import get_supabase_admin

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest):
    """Cadastra novo usuário no Supabase Auth e cria perfil."""
    client = get_supabase_admin()

    # Cria usuário no Auth do Supabase
    try:
        auth_resp = client.auth.admin.create_user({
            "email": data.email,
            "password": data.senha,
            "email_confirm": True,  # Confirma e-mail automaticamente (dev)
        })
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar usuário: {str(e)}"
        )

    user_id = auth_resp.user.id

    # Cria perfil na tabela profiles
    profile = {
        "id": user_id,
        "nome": data.nome,
        "email": data.email,
        "tipo": data.tipo,
        "plano": "gratis",
    }
    client.table("profiles").insert(profile).execute()

    token = create_access_token({"sub": user_id})
    return TokenResponse(access_token=token, user=profile)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Autentica usuário e retorna JWT."""
    client = get_supabase_admin()

    try:
        auth_resp = client.auth.sign_in_with_password({
            "email": data.email,
            "password": data.senha,
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )

    user_id = auth_resp.user.id

    # Busca perfil
    profile_resp = (
        client.table("profiles").select("*").eq("id", user_id).single().execute()
    )
    profile = profile_resp.data

    token = create_access_token({"sub": user_id})
    return TokenResponse(access_token=token, user=profile)
