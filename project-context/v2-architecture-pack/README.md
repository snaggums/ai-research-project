# AIR V2 Architecture Pack

Status: Architecture, Figma Research Objects, Figma Page Templates, the
React/Storybook contract map, and implementation scopes I1-I8 are approved.
Sprint 8 is ready for review before Sprint 9.  
Version: 1.4  
Implementation boundary: Sprint 8 only

This pack translates the AIR V2 Functional Specification and the approved V2
clarifications into implementation artifacts. Figma remains the visual source
of truth, and the frozen Sky AIR design-system foundations remain authoritative.
Each implementation scope still requires its own approval.

## Documents

1. [V2 Domain Map](./01_DOMAIN_MAP.md) - canonical objects, ownership,
   relationships, provenance, lifecycles, and the V1-to-V2 migration contract.
2. [V2 Route Map](./02_ROUTE_MAP.md) - information architecture, route ownership,
   layouts, navigation, and future route reservations.
3. [Sprint 8 Research Object Inventory](./03_SPRINT_8_RESEARCH_OBJECT_INVENTORY.md)
   - the product components and states to design before the Sprint 8 vertical
   slice.
4. [Sprint 8 Page Template Inventory](./04_SPRINT_8_PAGE_TEMPLATE_INVENTORY.md)
   - responsive route compositions and their approval status before React
   implementation.
5. [React and Storybook Component Contract Map](./05_REACT_STORYBOOK_COMPONENT_CONTRACT_MAP.md)
   - current-code audit, Figma-to-React contracts, backend dependencies, and
   implementation approval scopes.

## Approved direction

- AIR V2 uses Project throughout the product interface and React contracts.
- Existing V1 Project data is preserved without deletion or duplication.
- Sessions and Participants have a many-to-many relationship.
- Sessions contain Documents and may identify one optional primary transcript.
- Transcript is the only supported Document type in Sprint 8.
- Evidence-backed AI artifacts are editable and retain provenance.
- AI artifact review progresses through AI Generated, Researcher Reviewed,
  Approved, and Superseded.
- Project and Session conversations persist and support Saved, Archived, and Deleted
  lifecycle states.
- Records are product-functionality workflow objects, not research source files,
  and retain generic names such as Record 1 and Record 2.
- Product Knowledge is cross-Project; Common Components exist independently of
  Projects.
- Sessions may relate explicitly to Records and Common Components.
- Requirements, Decision Log entries, and Action Items belong to or relate to at
  least one Record or Common Component.
- Relationships replace Research Impact Links; tags remain optional secondary
  metadata.
- Cross-cutting Knowledge is not a separate domain branch.
- Session Reports contain Session Information, Session Participants, Executive
  Summary, Requirements, Decisions, Action Items, Open Questions, Key Insights,
  and Detailed Notes, in that order.
- The promotion path is Transcript to Session Report to Researcher Review, then
  into Record/Common Component Product Knowledge.
- Participant metadata uses required first and last name plus optional email,
  Organization, role, related Records, and researcher notes.
- Implementation proceeds one sprint at a time and stops for review after
  Sprint 8.

## Delivery sequence

```text
Research Object Model
        |
        v
Research Object Components
        |
        v
Page Templates
        |
        v
React/Storybook contract map
        |
        v
Storybook components and page compositions
        |
        v
React routes and backend integration
        |
        v
Sprint 8 vertical slice
```

## Approval gates

1. Approve this architecture pack.
2. Design and approve Sprint 8 Research Object components in Figma.
3. Design and approve Sprint 8 page templates in Figma.
4. Normalize the approved components in Storybook and React.
5. Implement the Sprint 8 vertical slice and migration.
6. Run parity, accessibility, migration, API, component, and end-to-end checks.
7. Stop for review before beginning Sprint 9.
