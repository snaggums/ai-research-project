import type {
  RecordCatalogItem,
  RecordSynthesis as RecordSynthesisTransport,
  RecordSynthesisEligibility,
} from "@/api/types";
import type {
  RecordSummary,
  RecordSynthesis,
  RecordSynthesisScope,
} from "@/domain/types";

export function toRecordSummary(record: RecordCatalogItem): RecordSummary {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    relatedSessionCount: record.related_session_count,
    eligibleSessionCount: record.eligible_session_count,
    readiness: record.readiness,
    latestSynthesisAt: record.latest_synthesis_at ?? undefined,
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
