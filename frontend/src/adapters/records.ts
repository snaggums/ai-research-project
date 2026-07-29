import type {
  RecordCatalogItem,
  RecordKnowledge as RecordKnowledgeTransport,
  RecordKnowledgeSources,
  RecordTranscriptCodes as RecordTranscriptCodesTransport,
  RecordSynthesis as RecordSynthesisTransport,
  RecordSynthesisEligibility,
} from "@/api/types";
import type {
  RecordSummary,
  RecordKnowledge,
  RecordSynthesis,
  RecordSynthesisScope,
} from "@/domain/types";
import type { RecordCodeDetailValue } from "@/components/research/record-code-types";

const recordCodeDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function toRecordSummary(record: RecordCatalogItem): RecordSummary {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    relatedSessionCount: record.related_session_count,
    eligibleSessionCount: record.eligible_session_count,
    readiness: record.readiness,
    latestSynthesisAt: record.latest_synthesis_at ?? undefined,
    approvedReportCount: record.approved_report_count ?? record.eligible_session_count,
    knowledgeItemCount: record.knowledge_item_count ?? 0,
    knowledgeUpdatedAt: record.knowledge_updated_at ?? undefined,
  };
}

export function toRecordKnowledge(knowledge: RecordKnowledgeTransport): RecordKnowledge {
  return {
    recordId: knowledge.record_id,
    totalCount: knowledge.total_count,
    knowledgeUpdatedAt: knowledge.knowledge_updated_at ?? undefined,
    items: knowledge.items.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      title: item.title,
      summary: item.summary,
      evidencePreview: item.evidence_preview,
      provenance: item.provenance,
      evidenceIds: item.evidence_ids,
      sourceProjectId: item.source_project_id,
      sourceSessionId: item.source_session_id,
      sourceSessionTitle: item.source_session_title,
      sourceReportId: item.source_report_id,
      sourceReportItemId: item.source_report_item_id,
      sourceReportUpdatedAt: item.source_report_updated_at,
      promotedAt: item.promoted_at,
      supersededAt: item.superseded_at ?? undefined,
      position: item.position,
      ownership: item.ownership
        ? {
            role: item.ownership.role,
            value: item.ownership.value ?? undefined,
            status: item.ownership.status,
            rationale: item.ownership.rationale ?? undefined,
          }
        : undefined,
    })),
  };
}

export function toRecordTranscriptCodes(
  value: RecordTranscriptCodesTransport,
): { codes: RecordCodeDetailValue[]; sessionCount: number } {
  return {
    sessionCount: value.session_count,
    codes: value.codes.map((code) => ({
      id: code.id,
      name: code.name,
      description: code.description ?? "",
      acceptedHighlightCount: code.accepted_highlight_count,
      sessionCount: code.session_count,
      latestEvidenceAt: code.latest_evidence_at,
      latestEvidenceLabel: recordCodeDateFormatter.format(
        new Date(code.latest_evidence_at),
      ),
      evidenceGroups: code.evidence_groups.map((group) => ({
        sessionId: group.session_id,
        sessionTitle: group.session_title,
        highlights: group.highlights.map((highlight) => ({
          id: highlight.id,
          projectId: highlight.project_id,
          projectName: highlight.project_name,
          sessionId: highlight.session_id,
          sessionTitle: highlight.session_title,
          excerpt: highlight.excerpt,
          speaker: highlight.speaker ?? "Unknown speaker",
          location: highlight.location ?? "Transcript passage",
        })),
      })),
    })),
  };
}

export function toRecordSynthesisScope(scope: RecordSynthesisEligibility): RecordSynthesisScope {
  return {
    recordId: scope.record_id,
    description: scope.description,
    minimumEligibleSessions: scope.minimum_eligible_sessions,
    includedSessions: scope.included_sessions.map((session) => ({
      id: session.id,
      title: session.title,
      reportId: session.report_id,
      reportStatus: session.report_status,
    })),
    excludedSessions: scope.excluded_sessions,
  };
}

export function toRecordKnowledgeScope(sources: RecordKnowledgeSources): RecordSynthesisScope {
  return {
    recordId: sources.record_id,
    description: sources.description,
    minimumEligibleSessions: 1,
    includedSessions: sources.sources
      .filter((source) => source.included && source.report_id)
      .map((source) => ({
        id: source.session_id,
        title: source.session_title,
        reportId: source.report_id!,
        reportStatus: "approved",
      })),
    excludedSessions: sources.sources
      .filter((source) => !source.included)
      .map((source) => ({
        id: source.session_id,
        title: source.session_title,
        reason: source.reason ?? "Session Report has not been approved",
      })),
  };
}

export function toRecordSynthesis(synthesis: RecordSynthesisTransport): RecordSynthesis {
  return {
    id: synthesis.id,
    recordId: synthesis.record_id,
    status: synthesis.status,
    generatedAt: synthesis.generated_at ?? undefined,
    sourceSessionCount: synthesis.source_session_count,
    sourceReportRevisionCount: synthesis.source_report_revision_count,
    provider: synthesis.provider ?? undefined,
    model: synthesis.model ?? undefined,
    promptVersion: synthesis.prompt_version ?? undefined,
    items: synthesis.items.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      title: item.title,
      summary: item.summary,
      evidencePreview: item.evidence_preview,
      sourceSessionCount: item.source_session_count,
      sourceReportItemCount: item.source_report_item_count,
      provenance: item.provenance,
      evidenceIds: item.evidence_ids,
    })),
    errorMessage: synthesis.error_message ?? undefined,
  };
}
