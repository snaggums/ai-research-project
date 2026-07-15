import type { SessionFilters } from "@/api/types";

export const emptySessionFilters: SessionFilters = {
  search: "",
  type: "",
  transcriptStatus: "",
  analysisStatus: "",
  date: "",
  recordId: "",
  commonComponentId: "",
};
