from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
import zipfile
from copy import deepcopy
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from lxml import etree


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ASSET_DIR = SCRIPT_DIR / "transcript_docx_assets"
DEFAULT_TEMPLATE = DEFAULT_ASSET_DIR / "sky_air_transcript_input_template.docx"
DEFAULT_EVENT_MARKER = DEFAULT_ASSET_DIR / "transcription_event_marker.png"

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}
W = f"{{{NS['w']}}}"
R = f"{{{NS['r']}}}"
PR = f"{{{NS['pr']}}}"
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
IMAGE_REL_TYPE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
)
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
TIMESTAMP_PATTERN = re.compile(r"^(?:(?P<hours>\d+):)?(?P<minutes>\d{1,2}):(?P<seconds>\d{2})$")


class TranscriptGenerationError(ValueError):
    pass


@dataclass(frozen=True)
class Turn:
    speaker: str
    timestamp: str
    timestamp_seconds: int
    text: str
    avatar_path: Path


@dataclass(frozen=True)
class TranscriptInput:
    title: str
    date_display: str
    duration: str
    started_by: str
    stopped_by: str
    event_marker_path: Path
    turns: tuple[Turn, ...]


def _require_nonempty(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise TranscriptGenerationError(f"{label} must be a non-empty string.")
    return value.strip()


def _parse_timestamp(value: Any, label: str) -> tuple[str, int]:
    timestamp = _require_nonempty(value, label)
    match = TIMESTAMP_PATTERN.fullmatch(timestamp)
    if match is None:
        raise TranscriptGenerationError(
            f"{label} must use M:SS, MM:SS, or H:MM:SS format."
        )
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes"))
    seconds = int(match.group("seconds"))
    if seconds > 59 or (match.group("hours") is not None and minutes > 59):
        raise TranscriptGenerationError(f"{label} contains an invalid time value.")
    return timestamp, hours * 3600 + minutes * 60 + seconds


def _format_duration(total_seconds: int) -> str:
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    parts: list[str] = []
    if hours:
        parts.append(f"{hours}h")
    if minutes or hours:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    return " ".join(parts)


def _resolve_png(base_dir: Path, value: Any, label: str) -> Path:
    raw_path = _require_nonempty(value, label)
    path = Path(raw_path)
    if not path.is_absolute():
        path = base_dir / path
    path = path.resolve()
    if path.suffix.lower() != ".png":
        raise TranscriptGenerationError(f"{label} must reference a PNG file.")
    if not path.is_file():
        raise TranscriptGenerationError(f"{label} does not exist: {path}")
    if not path.read_bytes().startswith(PNG_SIGNATURE):
        raise TranscriptGenerationError(f"{label} is not a valid PNG file: {path}")
    return path


def load_transcript_input(config_path: Path) -> TranscriptInput:
    try:
        raw = json.loads(config_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise TranscriptGenerationError(f"Could not read JSON input: {exc}") from exc
    if not isinstance(raw, dict):
        raise TranscriptGenerationError("The JSON root must be an object.")

    session = raw.get("session")
    recording = raw.get("recording")
    speakers = raw.get("speakers")
    raw_turns = raw.get("turns")
    if not isinstance(session, dict):
        raise TranscriptGenerationError("session must be an object.")
    if not isinstance(recording, dict):
        raise TranscriptGenerationError("recording must be an object.")
    if not isinstance(speakers, dict) or not speakers:
        raise TranscriptGenerationError("speakers must be a non-empty object.")
    if not isinstance(raw_turns, list) or not raw_turns:
        raise TranscriptGenerationError("turns must be a non-empty array.")

    title = _require_nonempty(session.get("title"), "session.title")
    if not title.casefold().endswith("meeting recording"):
        raise TranscriptGenerationError(
            "session.title must end with 'Meeting Recording' for AIR parser compatibility."
        )
    date_display = _require_nonempty(session.get("date"), "session.date")
    started_by = _require_nonempty(recording.get("started_by"), "recording.started_by")
    stopped_by = _require_nonempty(recording.get("stopped_by"), "recording.stopped_by")
    marker_value = recording.get("marker")
    marker_path = (
        DEFAULT_EVENT_MARKER
        if marker_value is None
        else _resolve_png(config_path.parent, marker_value, "recording.marker")
    )

    avatar_paths: dict[str, Path] = {}
    for speaker_name, speaker_config in speakers.items():
        name = _require_nonempty(speaker_name, "speakers key")
        if not isinstance(speaker_config, dict):
            raise TranscriptGenerationError(f"speakers.{name} must be an object.")
        avatar_paths[name] = _resolve_png(
            config_path.parent,
            speaker_config.get("avatar"),
            f"speakers.{name}.avatar",
        )

    turns: list[Turn] = []
    previous_seconds = -1
    for index, raw_turn in enumerate(raw_turns):
        label = f"turns[{index}]"
        if not isinstance(raw_turn, dict):
            raise TranscriptGenerationError(f"{label} must be an object.")
        speaker = _require_nonempty(raw_turn.get("speaker"), f"{label}.speaker")
        if speaker not in avatar_paths:
            raise TranscriptGenerationError(
                f"{label}.speaker has no matching entry in speakers: {speaker}"
            )
        timestamp, timestamp_seconds = _parse_timestamp(
            raw_turn.get("timestamp"), f"{label}.timestamp"
        )
        if timestamp_seconds < previous_seconds:
            raise TranscriptGenerationError("Turn timestamps must be non-decreasing.")
        text = _require_nonempty(raw_turn.get("text"), f"{label}.text")
        turns.append(
            Turn(speaker, timestamp, timestamp_seconds, text, avatar_paths[speaker])
        )
        previous_seconds = timestamp_seconds

    duration_value = session.get("duration")
    duration = (
        _format_duration(turns[-1].timestamp_seconds)
        if duration_value is None
        else _require_nonempty(duration_value, "session.duration")
    )
    return TranscriptInput(
        title=title,
        date_display=date_display,
        duration=duration,
        started_by=started_by,
        stopped_by=stopped_by,
        event_marker_path=marker_path,
        turns=tuple(turns),
    )


def _element_text(element: etree._Element) -> str:
    return "".join(element.xpath(".//w:t/text()", namespaces=NS))


def _set_run_text(run: etree._Element, text: str) -> None:
    run_properties = run.find("w:rPr", namespaces=NS)
    for child in list(run):
        if child is not run_properties:
            run.remove(child)
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = normalized.split("\n")
    for index, line in enumerate(lines):
        if index:
            etree.SubElement(run, f"{W}br")
        text_element = etree.SubElement(run, f"{W}t")
        text_element.text = line
        if line[:1].isspace() or line[-1:].isspace():
            text_element.set(XML_SPACE, "preserve")


def _set_paragraph_text(paragraph: etree._Element, text: str) -> None:
    runs = paragraph.findall("w:r", namespaces=NS)
    if not runs:
        runs = [etree.SubElement(paragraph, f"{W}r")]
    _set_run_text(runs[0], text)
    for run in runs[1:]:
        paragraph.remove(run)


def _content_cell_paragraphs(table: etree._Element) -> list[etree._Element]:
    rows = table.findall("w:tr", namespaces=NS)
    if not rows:
        raise TranscriptGenerationError("A template table has no row.")
    cells = rows[0].findall("w:tc", namespaces=NS)
    if len(cells) < 2:
        raise TranscriptGenerationError("A template table must have two cells.")
    return cells[-1].findall("w:p", namespaces=NS)


def _set_table_image(table: etree._Element, rel_id: str, alt_text: str) -> None:
    blips = table.xpath(".//a:blip", namespaces=NS)
    if not blips:
        raise TranscriptGenerationError("A template table is missing its inline image.")
    blips[0].set(f"{R}embed", rel_id)
    doc_properties = table.xpath(".//wp:docPr", namespaces=NS)
    if doc_properties:
        doc_properties[0].set("descr", alt_text)


def _configure_event_table(
    table: etree._Element,
    text: str,
    marker_rel_id: str,
) -> None:
    paragraphs = _content_cell_paragraphs(table)
    if not paragraphs:
        raise TranscriptGenerationError("An event table has no text paragraph.")
    _set_paragraph_text(paragraphs[0], text)
    _set_table_image(table, marker_rel_id, "Transcription event marker")


def _configure_turn_table(
    table: etree._Element,
    turn: Turn,
    avatar_rel_id: str,
) -> None:
    paragraphs = _content_cell_paragraphs(table)
    if len(paragraphs) < 2:
        raise TranscriptGenerationError("A turn table needs heading and body paragraphs.")
    heading_runs = paragraphs[0].findall("w:r", namespaces=NS)
    if len(heading_runs) < 2:
        raise TranscriptGenerationError("A turn heading needs speaker and timestamp runs.")
    _set_run_text(heading_runs[0], turn.speaker)
    _set_run_text(heading_runs[1], f"  {turn.timestamp}")
    for run in heading_runs[2:]:
        paragraphs[0].remove(run)
    _set_paragraph_text(paragraphs[1], turn.text)
    _set_table_image(table, avatar_rel_id, f"Avatar for {turn.speaker}")


class ImageRegistry:
    def __init__(
        self,
        package_entries: dict[str, bytes],
        relationships_root: etree._Element,
    ) -> None:
        self.package_entries = package_entries
        self.relationships_root = relationships_root
        self.added_parts: dict[str, bytes] = {}
        self.hash_to_rel_id: dict[str, str] = {}
        self.used_ids = {
            rel.get("Id")
            for rel in relationships_root.findall(f"{PR}Relationship")
            if rel.get("Id")
        }
        self.next_numeric_id = self._next_relationship_number()
        self.next_media_number = 1
        self._index_existing_images()

    def _next_relationship_number(self) -> int:
        numbers = []
        for rel_id in self.used_ids:
            match = re.fullmatch(r"rId(\d+)", rel_id)
            if match:
                numbers.append(int(match.group(1)))
        return max(numbers, default=0) + 1

    def _index_existing_images(self) -> None:
        for rel in self.relationships_root.findall(f"{PR}Relationship"):
            if rel.get("Type") != IMAGE_REL_TYPE:
                continue
            target = rel.get("Target")
            rel_id = rel.get("Id")
            if not target or not rel_id:
                continue
            package_path = str((Path("word") / target).as_posix())
            payload = self.package_entries.get(package_path)
            if payload is not None:
                self.hash_to_rel_id[hashlib.sha256(payload).hexdigest()] = rel_id

    def _new_relationship_id(self) -> str:
        while f"rId{self.next_numeric_id}" in self.used_ids:
            self.next_numeric_id += 1
        rel_id = f"rId{self.next_numeric_id}"
        self.used_ids.add(rel_id)
        self.next_numeric_id += 1
        return rel_id

    def _new_media_path(self) -> str:
        while True:
            path = f"word/media/air_image_{self.next_media_number}.png"
            self.next_media_number += 1
            if path not in self.package_entries and path not in self.added_parts:
                return path

    def register_png(self, path: Path) -> str:
        payload = path.read_bytes()
        digest = hashlib.sha256(payload).hexdigest()
        existing = self.hash_to_rel_id.get(digest)
        if existing is not None:
            return existing
        rel_id = self._new_relationship_id()
        package_path = self._new_media_path()
        relationship = etree.SubElement(
            self.relationships_root, f"{PR}Relationship"
        )
        relationship.set("Id", rel_id)
        relationship.set("Type", IMAGE_REL_TYPE)
        relationship.set("Target", package_path.removeprefix("word/"))
        self.added_parts[package_path] = payload
        self.hash_to_rel_id[digest] = rel_id
        return rel_id


def _renumber_drawing_properties(document_root: etree._Element) -> None:
    for index, properties in enumerate(
        document_root.xpath(".//wp:docPr", namespaces=NS), start=1
    ):
        properties.set("id", str(index))


def _find_template_tables(body: etree._Element):
    tables = body.findall("w:tbl", namespaces=NS)
    start_table = next(
        (table for table in tables if _element_text(table).casefold().endswith("started transcription")),
        None,
    )
    stop_table = next(
        (table for table in tables if _element_text(table).casefold().endswith("stopped transcription")),
        None,
    )
    if start_table is None or stop_table is None:
        raise TranscriptGenerationError(
            "The template must contain start and stop transcription tables."
        )
    children = list(body)
    start_index = children.index(start_table)
    stop_index = children.index(stop_table)
    turn_tables = [
        child
        for child in children[start_index + 1 : stop_index]
        if child.tag == f"{W}tbl"
    ]
    if not turn_tables:
        raise TranscriptGenerationError("The template must contain a speaker turn table.")
    return start_table, stop_table, turn_tables


def generate_transcript_docx(
    transcript: TranscriptInput,
    template_path: Path,
    output_path: Path,
    *,
    force: bool = False,
) -> None:
    template_path = template_path.resolve()
    output_path = output_path.resolve()
    if template_path == output_path:
        raise TranscriptGenerationError("Output must differ from the template path.")
    if not template_path.is_file():
        raise TranscriptGenerationError(f"Template does not exist: {template_path}")
    if output_path.exists() and not force:
        raise TranscriptGenerationError(
            f"Output already exists: {output_path}. Use --force to replace it."
        )

    with zipfile.ZipFile(template_path) as source_package:
        infos = source_package.infolist()
        entries = {info.filename: source_package.read(info.filename) for info in infos}
    required_parts = {"word/document.xml", "word/_rels/document.xml.rels"}
    missing = required_parts.difference(entries)
    if missing:
        raise TranscriptGenerationError(f"Template is missing DOCX parts: {sorted(missing)}")

    parser = etree.XMLParser(remove_blank_text=False, resolve_entities=False)
    document_root = etree.fromstring(entries["word/document.xml"], parser)
    relationships_root = etree.fromstring(
        entries["word/_rels/document.xml.rels"], parser
    )
    body = document_root.find("w:body", namespaces=NS)
    if body is None:
        raise TranscriptGenerationError("Template document.xml has no body.")

    start_table, stop_table, turn_tables = _find_template_tables(body)
    children = list(body)
    start_index = children.index(start_table)
    metadata_paragraphs = [
        child for child in children[:start_index] if child.tag == f"{W}p"
    ]
    if len(metadata_paragraphs) < 3:
        raise TranscriptGenerationError("Template needs title, date, and duration paragraphs.")
    _set_paragraph_text(metadata_paragraphs[0], transcript.title)
    _set_paragraph_text(metadata_paragraphs[1], transcript.date_display)
    _set_paragraph_text(metadata_paragraphs[2], transcript.duration)

    images = ImageRegistry(entries, relationships_root)
    marker_rel_id = images.register_png(transcript.event_marker_path)
    _configure_event_table(
        start_table,
        f"{transcript.started_by} started transcription",
        marker_rel_id,
    )
    _configure_event_table(
        stop_table,
        f"{transcript.stopped_by} stopped transcription",
        marker_rel_id,
    )

    turn_template = deepcopy(turn_tables[0])
    for table in turn_tables:
        body.remove(table)
    stop_index = list(body).index(stop_table)
    avatar_rel_ids: dict[Path, str] = {}
    for turn in transcript.turns:
        rel_id = avatar_rel_ids.get(turn.avatar_path)
        if rel_id is None:
            rel_id = images.register_png(turn.avatar_path)
            avatar_rel_ids[turn.avatar_path] = rel_id
        generated_table = deepcopy(turn_template)
        _configure_turn_table(generated_table, turn, rel_id)
        body.insert(stop_index, generated_table)
        stop_index += 1

    _renumber_drawing_properties(document_root)
    generated_document = etree.tostring(
        document_root, xml_declaration=True, encoding="UTF-8", standalone=True
    )
    generated_relationships = (
        etree.tostring(
            relationships_root,
            xml_declaration=True,
            encoding="UTF-8",
            standalone=True,
        )
        if images.added_parts
        else entries["word/_rels/document.xml.rels"]
    )
    visible_text = generated_document.decode("utf-8", errors="ignore")
    for placeholder in ("[Name]", "[Speaker name]", "[Transcript excerpt]"):
        if placeholder in visible_text:
            raise TranscriptGenerationError(f"Unresolved template placeholder: {placeholder}")

    replacements = {
        "word/document.xml": generated_document,
        "word/_rels/document.xml.rels": generated_relationships,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temp_name = tempfile.mkstemp(
        prefix=f".{output_path.stem}.", suffix=".docx", dir=output_path.parent
    )
    os.close(descriptor)
    temp_path = Path(temp_name)
    try:
        with zipfile.ZipFile(temp_path, "w") as output_package:
            for info in infos:
                output_package.writestr(info, replacements.get(info.filename, entries[info.filename]))
            for package_path, payload in images.added_parts.items():
                output_package.writestr(package_path, payload, compress_type=zipfile.ZIP_DEFLATED)
        with zipfile.ZipFile(temp_path) as validation_package:
            bad_part = validation_package.testzip()
            if bad_part is not None:
                raise TranscriptGenerationError(f"Generated DOCX failed ZIP validation: {bad_part}")
        os.replace(temp_path, output_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate an AIR-compatible Word transcript from JSON."
    )
    parser.add_argument("--input", required=True, type=Path, help="Transcript JSON path")
    parser.add_argument("--output", required=True, type=Path, help="Output DOCX path")
    parser.add_argument(
        "--template",
        type=Path,
        default=DEFAULT_TEMPLATE,
        help="DOCX template path (defaults to the packaged AIR template)",
    )
    parser.add_argument(
        "--force", action="store_true", help="Replace an existing output file"
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        transcript = load_transcript_input(args.input.resolve())
        generate_transcript_docx(
            transcript,
            args.template,
            args.output,
            force=args.force,
        )
    except TranscriptGenerationError as exc:
        print(f"Error: {exc}")
        return 2
    print(f"Generated {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
