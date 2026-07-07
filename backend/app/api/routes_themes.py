from app.db.session import get_db
from app.schemas.theme import (
    ThemeCreate,
    ThemeEvidenceCreate,
    ThemeEvidenceRead,
    ThemeEvidenceUpdate,
    ThemeGenerateRequest,
    ThemeGenerateResponse,
    ThemeRead,
    ThemeUpdate,
)
from app.services import project_service, theme_service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["themes"])


@router.get("/projects/{project_id}/themes", response_model=list[ThemeRead])
def list_project_themes(project_id: str, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return theme_service.list_project_themes(db, project_id)


@router.post("/projects/{project_id}/themes/generate", response_model=ThemeGenerateResponse)
def generate_project_themes(
    project_id: str,
    payload: ThemeGenerateRequest | None = None,
    db: Session = Depends(get_db),
):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    request = payload or ThemeGenerateRequest()
    try:
        themes, provider, model, used_mock, message = theme_service.generate_project_themes(
            db=db,
            project_id=project_id,
            max_themes=request.max_themes,
            replace_existing=request.replace_existing,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ThemeGenerateResponse(
        themes=themes,
        provider=provider,
        model=model,
        used_mock=used_mock,
        message=message,
    )


@router.post("/projects/{project_id}/themes", response_model=ThemeRead, status_code=status.HTTP_201_CREATED)
def create_project_theme(project_id: str, payload: ThemeCreate, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    try:
        return theme_service.create_theme(db, project_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/themes/{theme_id}", response_model=ThemeRead)
def get_theme(theme_id: str, db: Session = Depends(get_db)):
    theme = theme_service.get_theme(db, theme_id)
    if theme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    return theme_service.theme_to_read(theme)


@router.patch("/themes/{theme_id}", response_model=ThemeRead)
def update_theme(theme_id: str, payload: ThemeUpdate, db: Session = Depends(get_db)):
    theme = theme_service.get_theme(db, theme_id)
    if theme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    return theme_service.update_theme(db, theme, payload)


@router.delete("/themes/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_theme(theme_id: str, db: Session = Depends(get_db)):
    theme = theme_service.get_theme(db, theme_id)
    if theme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    theme_service.delete_theme(db, theme)
    return None


@router.get("/themes/{theme_id}/evidence", response_model=list[ThemeEvidenceRead])
def list_theme_evidence(theme_id: str, db: Session = Depends(get_db)):
    theme = theme_service.get_theme(db, theme_id)
    if theme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    return theme_service.list_theme_evidence(db, theme_id)


@router.post("/themes/{theme_id}/evidence", response_model=ThemeEvidenceRead, status_code=status.HTTP_201_CREATED)
def add_theme_evidence(theme_id: str, payload: ThemeEvidenceCreate, db: Session = Depends(get_db)):
    theme = theme_service.get_theme(db, theme_id)
    if theme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    try:
        return theme_service.add_theme_evidence(db, theme, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/evidence/{evidence_id}", response_model=ThemeEvidenceRead)
def update_evidence(evidence_id: str, payload: ThemeEvidenceUpdate, db: Session = Depends(get_db)):
    evidence = theme_service.get_evidence(db, evidence_id)
    if evidence is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
    return theme_service.update_evidence(db, evidence, payload)


@router.delete("/evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidence(evidence_id: str, db: Session = Depends(get_db)):
    evidence = theme_service.get_evidence(db, evidence_id)
    if evidence is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
    theme_service.delete_evidence(db, evidence)
    return None
