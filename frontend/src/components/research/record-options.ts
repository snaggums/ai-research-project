export const fixedRecordOptions = [
  { label: "Record 1", value: "record-1" },
  { label: "Record 2", value: "record-2" },
  { label: "Record 3", value: "record-3" },
] as const;

export type FixedRecordId = (typeof fixedRecordOptions)[number]["value"];
