# AIR transcript DOCX generator

This utility converts a structured JSON transcript into a Word document that follows the packaged AIR template. It preserves the template's title, metadata, event-line, avatar, speaker, timestamp, transcript, spacing, and table patterns. Generated documents remain compatible with AIR's structured DOCX transcript parser.

## Run it

From the repository root:

```powershell
.\backend\.venv\Scripts\python.exe backend\scripts\generate_transcript_docx.py `
  --input backend\scripts\transcript_example.json `
  --output .tmp\transcript-generator\example-transcript.docx
```

The packaged template and example PNGs live in `backend/scripts/transcript_docx_assets/`. Pass `--template path\to\another-template.docx` only when it follows the same AIR structure. Existing output files are protected; add `--force` when replacement is intentional.

## JSON input

- `session.title`: Required. End it with `Meeting Recording` so AIR recognizes the structured transcript.
- `session.date`: Required display text for the session date and time.
- `session.duration`: Optional display text. If omitted, the final turn timestamp is converted to a duration.
- `recording.started_by` and `recording.stopped_by`: Required names for the event lines.
- `recording.marker`: Optional PNG. The packaged transcription marker is used when omitted.
- `speakers`: A map from each exact speaker name to a PNG avatar path.
- `turns`: One or more ordered objects containing `speaker`, `timestamp`, and `text`.

Timestamps accept `M:SS`, `MM:SS`, or `H:MM:SS` and must be non-decreasing. Asset paths are resolved relative to the JSON file. Only PNG assets are accepted so the template's package content types remain unchanged.

## Content brief for AI-generated transcripts

Codex can generate the transcript content as well as produce and verify the Word document. A useful brief includes:

1. Research objective and product or prototype being discussed.
2. Speaker names and roles, such as facilitator and Participant.
3. Target duration, turn count, or approximate word count.
4. Tasks, topics, findings, and facts that must appear.
5. Tone and realism level, including whether to include pauses, uncertainty, follow-up questions, or incomplete thoughts.
6. Anything to avoid, especially personal, confidential, medical, financial, or identifying information.
7. Whether the output must be explicitly labeled as synthetic.
8. Avatar PNG for every speaker and the person who starts and stops transcription.

Example request:

> Create a clearly synthetic 20-minute moderated usability interview. Maya Chen is the facilitator and Elaine Montgomery is the Participant. The study evaluates transcript upload and speaker identification in AIR. Include 18-24 turns, realistic but concise answers, two moments of confusion, one recovery, and timestamps throughout. Do not include real personal data. Return content in the generator's JSON format and then generate the DOCX.

ChatGPT is convenient when the main work is conversational drafting and repeated tone revisions. Codex is usually the better fit when the content must also be validated against repository terminology, converted with this utility, tested, and delivered as a verified project artifact. Either can draft the prose; the quality depends primarily on the specificity of the brief.
