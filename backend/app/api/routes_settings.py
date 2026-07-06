from app.db.session import get_db
from app.schemas.settings import AISettingsRead, AISettingsTestResponse, AISettingsUpdate
from app.services import ai_settings_service
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/ai", response_model=AISettingsRead)
def get_ai_settings(db: Session = Depends(get_db)):
    return ai_settings_service.get_or_create_settings(db)


@router.put("/ai", response_model=AISettingsRead)
def update_ai_settings(payload: AISettingsUpdate, db: Session = Depends(get_db)):
    return ai_settings_service.update_settings(db, payload)


@router.post("/ai/test", response_model=AISettingsTestResponse)
def test_ai_settings(db: Session = Depends(get_db)):
    return ai_settings_service.test_settings(db)
