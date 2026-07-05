# Export Specification

## MVP Export Formats

- Markdown
- CSV
- JSON

PDF, DOCX, and PowerPoint can come later.

## Markdown Findings Report

Include:

```text
# Project Findings Report

## Project Summary

## Key Themes

### Theme 1
Description
Confidence
Evidence count

#### Supporting Evidence
- Quote — Source document
- Why it supports the theme

#### Contradictory Evidence
- Quote — Source document
- Why it challenges the theme

## Suggested Next Steps
```

## CSV Export

One row per evidence quote.

Columns:

- project_name
- theme_title
- theme_description
- theme_confidence
- evidence_type
- quote
- reasoning
- relevance_score
- document_name
- chunk_id

## JSON Export

Structured project data:

```json
{
  "project": {},
  "documents": [],
  "themes": [
    {
      "id": "theme_id",
      "title": "Theme title",
      "description": "Theme description",
      "confidence": 0.9,
      "evidence": []
    }
  ]
}
```

## Export UX

Add an Export button on:

- Project overview
- Themes page
- Theme detail page

For MVP, exports can be downloaded directly from API endpoints.
