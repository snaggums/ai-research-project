from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".txt", ".md", ".docx", ".pdf"}


def extract_text(file_path: str) -> str:
    path = Path(file_path)
    extension = path.suffix.lower()

    if extension not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ValueError(f"Unsupported file type. Upload one of: {supported}")

    if extension in {".txt", ".md"}:
        return path.read_text(encoding="utf-8", errors="replace").strip()

    if extension == ".docx":
        document = DocxDocument(path)
        return "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text).strip()

    reader = PdfReader(path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(page.strip() for page in pages if page.strip()).strip()
