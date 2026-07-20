import type {
  SessionConversation as SessionConversationApi,
  SessionReport as SessionReportApi,
  SessionTheme as SessionThemeApi,
  SessionThemeEvidence as SessionThemeEvidenceApi,
} from "@/api/types";
import type {
  SessionConversation,
  SessionReport,
  SessionTheme,
  ThemeEvidenceDetail,
} from "@/domain/types";

export function toThemeEvidence(value: SessionThemeEvidenceApi): ThemeEvidenceDetail {
  return {
    id: value.id,
    documentId: value.document_id,
    documentName: value.document_name,
    speaker: value.speaker,
    location: value.location,
    excerpt: value.excerpt,
    relevance: value.relevance,
    contextResultId: value.context_result_id,
  };
}

export function toSessionTheme(value: SessionThemeApi): SessionTheme {
  return {
    id: value.id,
    projectId: value.project_id,
    sessionId: value.session_id,
    name: value.name,
    summary: value.summary,
    status: value.status,
    confidence: value.confidence,
    sourceLabel: value.source_label,
    evidence: value.evidence.map(toThemeEvidence),
  };
}

export function toSessionReport(value: SessionReportApi): SessionReport {
  return {
    id: value.id,
    projectId: value.project_id,
    sessionId: value.session_id,
    status: value.status,
    sessionTitle: value.session_title,
    sessionType: value.session_type,
    sessionDate: value.session_date,
    durationMinutes: value.duration_minutes ?? undefined,
    participants: value.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      role: participant.role ?? undefined,
      organization: participant.organization ?? undefined,
      notes: participant.notes ?? undefined,
    })),
    executiveSummary: value.executive_summary,
    items: value.items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      summary: item.summary,
      provenance: item.provenance,
      evidence: item.evidence.map(toThemeEvidence),
    })),
    detailedNotes: value.detailed_notes,
    generatedAt: value.generated_at,
  };
}

export function toSessionConversation(value: SessionConversationApi): SessionConversation {
  return {
    id: value.id,
    projectId: value.project_id,
    sessionId: value.session_id,
    status: value.status,
    turns: value.turns.map((turn) => ({
      id: turn.id,
      role: turn.role,
      content: turn.content,
      createdAt: turn.created_at,
      citations: turn.citations.map((citation) => ({
        id: citation.id,
        documentId: citation.document_id,
        documentName: citation.document_name,
        speaker: citation.speaker,
        location: citation.location,
        excerpt: citation.excerpt,
        contextResultId: citation.context_result_id,
      })),
    })),
  };
}
