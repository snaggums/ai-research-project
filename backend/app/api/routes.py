from app.api.routes_documents import router as documents_router
from app.api.routes_projects import router as projects_router
from app.api.routes_search import router as search_router
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(documents_router)
api_router.include_router(projects_router)
api_router.include_router(search_router)
