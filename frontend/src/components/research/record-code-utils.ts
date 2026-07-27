import type {
  RecordCodeSortValue,
  RecordCodeSummaryValue,
} from "./record-code-types";

const codeNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function sortRecordCodeValues<T extends RecordCodeSummaryValue>(
  codes: T[],
  sort: RecordCodeSortValue,
) {
  return [...codes].sort((left, right) => {
    if (sort === "most-highlights") {
      return right.acceptedHighlightCount - left.acceptedHighlightCount;
    }
    if (sort === "most-sessions") {
      return right.eligibleSessionCount - left.eligibleSessionCount;
    }
    if (sort === "most-recent-evidence") {
      return Date.parse(right.latestEvidenceAt) - Date.parse(left.latestEvidenceAt);
    }
    const byName = codeNameCollator.compare(left.name, right.name);
    return sort === "name-desc" ? -byName : byName;
  });
}
