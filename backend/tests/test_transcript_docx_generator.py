from __future__ import annotations

import json
import zipfile
from pathlib import Path

import pytest
from app.services.parsing_service import DOCX_TRANSCRIPT_PARSER, extract_transcript
from lxml import etree
from scripts.generate_transcript_docx import (
    DEFAULT_TEMPLATE,
    NS,
    TranscriptGenerationError,
    generate_transcript_docx,
    load_transcript_input,
)


SCRIPT_DIR = Path(__file__).resolve().parents[1] / "scripts"
EXAMPLE_INPUT = SCRIPT_DIR / "transcript_example.json"


def _make_asset_paths_absolute(raw: dict) -> None:
    raw["recording"]["marker"] = str(SCRIPT_DIR / raw["recording"]["marker"])
    for speaker in raw["speakers"].values():
        speaker["avatar"] = str(SCRIPT_DIR / speaker["avatar"])


def test_example_generates_air_compatible_transcript(tmp_path: Path) -> None:
    transcript_input = load_transcript_input(EXAMPLE_INPUT)
    output = tmp_path / "example.docx"

    generate_transcript_docx(transcript_input, DEFAULT_TEMPLATE, output)

    parsed = extract_transcript(str(output))
    assert parsed.parser_name == DOCX_TRANSCRIPT_PARSER
    assert parsed.metadata == {
        "session_title": "Session S001 - Meeting Recording",
        "session_date": "July 27, 2026, 10:00AM",
        "duration": "8m 42s",
        "source_turn_count": 11,
        "excluded_system_event_count": 2,
    }
    assert [(block.speaker, block.location) for block in parsed.blocks[:2]] == [
        ("Maya Chen", "0:00"),
        ("Elaine Montgomery", "0:34"),
    ]
    assert parsed.blocks[-1].location == "8:42"


def test_generator_preserves_template_package_and_accessible_images(
    tmp_path: Path,
) -> None:
    transcript_input = load_transcript_input(EXAMPLE_INPUT)
    output = tmp_path / "preservation.docx"
    generate_transcript_docx(transcript_input, DEFAULT_TEMPLATE, output)

    editable_parts = {"word/document.xml", "word/_rels/document.xml.rels"}
    with zipfile.ZipFile(DEFAULT_TEMPLATE) as template_package, zipfile.ZipFile(
        output
    ) as generated_package:
        template_entries = {
            name: template_package.read(name) for name in template_package.namelist()
        }
        generated_entries = {
            name: generated_package.read(name) for name in generated_package.namelist()
        }

    for name, payload in template_entries.items():
        if name not in editable_parts:
            assert generated_entries[name] == payload
    assert set(generated_entries) == set(template_entries)

    document_root = etree.fromstring(generated_entries["word/document.xml"])
    tables = document_root.xpath(".//w:body/w:tbl", namespaces=NS)
    drawing_properties = document_root.xpath(".//wp:docPr", namespaces=NS)
    assert len(tables) == 13
    assert len(drawing_properties) == 13
    assert len({value.get("id") for value in drawing_properties}) == 13
    descriptions = [value.get("descr") for value in drawing_properties]
    assert descriptions.count("Transcription event marker") == 2
    assert "Avatar for Maya Chen" in descriptions
    assert "Avatar for Elaine Montgomery" in descriptions
    document_xml = generated_entries["word/document.xml"]
    assert b"[Speaker name]" not in document_xml
    assert b"[Transcript excerpt]" not in document_xml


def test_input_validation_rejects_decreasing_timestamps(tmp_path: Path) -> None:
    raw = json.loads(EXAMPLE_INPUT.read_text(encoding="utf-8"))
    _make_asset_paths_absolute(raw)
    raw["turns"] = [raw["turns"][1], raw["turns"][0]]
    config = tmp_path / "invalid.json"
    config.write_text(json.dumps(raw), encoding="utf-8")

    with pytest.raises(TranscriptGenerationError, match="non-decreasing"):
        load_transcript_input(config)


def test_multiline_turn_text_survives_air_parsing(tmp_path: Path) -> None:
    raw = json.loads(EXAMPLE_INPUT.read_text(encoding="utf-8"))
    _make_asset_paths_absolute(raw)
    raw["turns"] = [
        {
            "speaker": "Maya Chen",
            "timestamp": "0:00",
            "text": "First line.\nSecond line.",
        }
    ]
    raw["session"].pop("duration")
    config = tmp_path / "multiline.json"
    config.write_text(json.dumps(raw), encoding="utf-8")
    transcript_input = load_transcript_input(config)
    output = tmp_path / "multiline.docx"

    generate_transcript_docx(transcript_input, DEFAULT_TEMPLATE, output)

    parsed = extract_transcript(str(output))
    assert parsed.metadata["duration"] == "0s"
    assert parsed.blocks[0].text == "First line.\nSecond line."
