import { describe, expect, it } from "vitest";

import { toSessionPayload } from "@/adapters/sessions";

describe("Session adapters", () => {
  it("submits an empty Record relationship when no Record is selected", () => {
    const payload = toSessionPayload({
      title: "Unassigned interview",
      type: "interview",
      date: "",
      time: "",
      description: "",
      recordId: "",
      participantIds: [],
    });

    expect(payload.related_record_ids).toEqual([]);
  });
});
