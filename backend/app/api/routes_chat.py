from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service, project_service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["chat"])


@router.post("/projects/{project_id}/chat", response_model=ChatResponse)
def answer_project_question(project_id: str, payload: ChatRequest, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        return chat_service.answer_project_question(
            db=db,
            project_id=project_id,
            question=payload.question,
            limit=payload.limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
