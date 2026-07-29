# Record Knowledge Promotion Contract

Status: Approved and implemented

This contract supersedes the generated Record Synthesis workflow as the
canonical source of Requirements, Decision Log entries, and Action Items in
Record Knowledge. Legacy synthesis runs remain preserved for audit and
compatibility, but they are not the Record Knowledge source of truth.

## Promotion rule

Approving a Session Report transactionally promotes every Requirement,
Decision, and Action Item into the Session's assigned Record. Titles,
summaries, ownership metadata, ordering, provenance, and evidence are copied
exactly as stored on the approved report. Open Questions and Key Insights
remain Session Report-only.

An unassigned Session may still have an approved report. If it is later
assigned to a Record, all of its approved report revisions are promoted in
revision order so the same current and superseded history is preserved.

Researcher Reviewed and AI Generated reports do not contribute. Promotion
does not merge, rewrite, consolidate, or deduplicate items. Identical items
from different Sessions remain distinct and retain their own lineage.

## Revision and preservation rule

Approved reports are immutable. Researchers create a revision before editing.
The previously promoted revision remains current until the new revision is
approved. That approval promotes the replacement items and marks the prior
revision's Record Knowledge items Superseded without deleting them.

Promotion batches are unique per Record and report revision, making approval
and backfill replay-safe. Approval and promotion commit in one transaction or
roll back together.

Projects, Sessions, source reports, and Record assignments with promoted
knowledge cannot be hard-deleted or reassigned. This protects the approved
historical record and its transcript evidence.

## Routes and API

- Canonical UI: `/records/:recordId?view=knowledge`
- Legacy `/records/:recordId/synthesis` redirects to the Knowledge view.
- `GET /api/records/{recordId}/knowledge`
- `GET /api/records/{recordId}/knowledge/sources`
- `GET /api/records/{recordId}/knowledge/items/{itemId}/evidence/{evidenceId}`

The Knowledge collection supports current-only or current-plus-superseded
history. Record search and Ask Record use promoted knowledge, not generated
synthesis items.

## Interface contract

Record Knowledge is organized into Requirements, Decision Log, and Action
items. Entries show Current or Superseded state, source Session, approved
report provenance, ownership when applicable, and supporting transcript
evidence. There are no per-item review controls and no Generate or Regenerate
action; report approval is the only promotion event.

Decision titles state the outcome that was decided. Generated titles use
direct outcome wording and do not use task framing such as "Decide how to
address ...".
