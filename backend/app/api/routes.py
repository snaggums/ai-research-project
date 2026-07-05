from app.api.routes_projects import router as projects_router
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(projects_router)
