from app.db.session import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.services import project_service, search_service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["search"])


@router.post("/projects/{project_id}/search", response_model=SearchResponse)
def search_project(project_id: str, payload: SearchRequest, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return SearchResponse(
        results=search_service.search_project_chunks(
            db=db,
            project_id=project_id,
            query=payload.query,
            limit=payload.limit,
        )
    )
