export const fixedRecordOptions = [
  { label: "Medicare Fraud Documenter", value: "record-1" },
  { label: "Medicaid Fraud Documenter", value: "record-2" },
  { label: "Medicare Fraud Finder", value: "record-3" },
] as const;

export type FixedRecordId = (typeof fixedRecordOptions)[number]["value"];
