"""
Módulo de segurança: JWT, hash de senha e autenticação.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import get_settings
from app.core.supabase import get_supabase_admin

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependência FastAPI que valida JWT e retorna o perfil do usuário."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Busca perfil no Supabase
    client = get_supabase_admin()
    result = client.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise credentials_exception
    return result.data


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependência que exige perfil de administrador."""
    if current_user.get("tipo") != "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ação restrita a administradores."
        )
    return current_user


def check_plano(nivel: str, current_user: dict) -> None:
    """
    Verifica se o usuário tem plano suficiente para o nível do campeonato.
    Plano grátis: apenas bairro
    Plano básico: bairro + município + estado
    Plano premium: todos os níveis
    """
    niveis_gratis   = {"bairro"}
    niveis_basico   = {"bairro", "municipio", "estado"}
    niveis_premium  = {"bairro", "municipio", "estado", "pais", "continente"}

    plano = current_user.get("plano", "gratis")
    if plano == "gratis" and nivel not in niveis_gratis:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Nível '{nivel}' requer plano pago. Faça upgrade para continuar."
        )
    if plano == "basico" and nivel not in niveis_basico:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Nível '{nivel}' requer plano Premium."
        )
