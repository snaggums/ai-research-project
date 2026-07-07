from app.api.routes_chat import router as chat_router
from app.api.routes_documents import router as documents_router
from app.api.routes_projects import router as projects_router
from app.api.routes_search import router as search_router
from app.api.routes_settings import router as settings_router
from app.api.routes_themes import router as themes_router
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(chat_router)
api_router.include_router(documents_router)
api_router.include_router(projects_router)
api_router.include_router(search_router)
api_router.include_router(settings_router)
api_router.include_router(themes_router)
