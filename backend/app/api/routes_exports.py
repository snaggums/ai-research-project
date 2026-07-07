from app.db.session import get_db
from app.services import export_service
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["exports"])


@router.get("/projects/{project_id}/exports/markdown")
def export_project_markdown(project_id: str, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    return _download_response(
        content=export_service.build_markdown_export(project),
        media_type="text/markdown; charset=utf-8",
        filename=export_service.filename_for_project(project, "md"),
    )


@router.get("/projects/{project_id}/exports/csv")
def export_project_csv(project_id: str, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    return _download_response(
        content=export_service.build_csv_export(project),
        media_type="text/csv; charset=utf-8",
        filename=export_service.filename_for_project(project, "csv"),
    )


@router.get("/projects/{project_id}/exports/json")
def export_project_json(project_id: str, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    return _download_response(
        content=export_service.build_json_export(project),
        media_type="application/json; charset=utf-8",
        filename=export_service.filename_for_project(project, "json"),
    )


def _get_project_or_404(db: Session, project_id: str):
    project = export_service.get_project_for_export(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _download_response(content: str, media_type: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
