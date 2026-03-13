"""
Cliente Supabase - singleton para toda a aplicação.
Usa a service key para operações administrativas.
"""
from supabase import create_client, Client
from app.core.config import get_settings

_client: Client | None = None
_admin_client: Client | None = None


def get_supabase() -> Client:
    """Retorna cliente Supabase com anon key (respeita RLS)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client


def get_supabase_admin() -> Client:
    """Retorna cliente Supabase com service key (ignora RLS - apenas backend)."""
    global _admin_client
    if _admin_client is None:
        settings = get_settings()
        _admin_client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
        )
    return _admin_client
