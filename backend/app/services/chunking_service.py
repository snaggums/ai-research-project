from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    text: str
    chunk_index: int
    start_char: int
    end_char: int


def chunk_text(text: str, max_chars: int = 2400, overlap_chars: int = 300) -> list[TextChunk]:
    clean_text = text.strip()
    if not clean_text:
        return []

    paragraphs = [paragraph.strip() for paragraph in clean_text.splitlines() if paragraph.strip()]
    if not paragraphs:
        paragraphs = [clean_text]

    chunks: list[TextChunk] = []
    current_parts: list[str] = []
    current_start = clean_text.find(paragraphs[0])

    for paragraph in paragraphs:
        candidate = "\n\n".join([*current_parts, paragraph]) if current_parts else paragraph
        if len(candidate) <= max_chars or not current_parts:
            current_parts.append(paragraph)
            continue

        chunk_body = "\n\n".join(current_parts)
        chunks.append(_build_chunk(clean_text, chunk_body, current_start, len(chunks)))
        overlap = chunk_body[-overlap_chars:].strip() if overlap_chars > 0 else ""
        current_parts = [part for part in [overlap, paragraph] if part]
        current_start = clean_text.find(current_parts[0], max(0, chunks[-1].end_char - overlap_chars))

    if current_parts:
        chunk_body = "\n\n".join(current_parts)
        chunks.append(_build_chunk(clean_text, chunk_body, current_start, len(chunks)))

    return chunks


def _build_chunk(source: str, text: str, start_hint: int, chunk_index: int) -> TextChunk:
    start_char = source.find(text, max(0, start_hint))
    if start_char == -1:
        start_char = max(0, start_hint)
    end_char = start_char + len(text)
    return TextChunk(text=text, chunk_index=chunk_index, start_char=start_char, end_char=end_char)
