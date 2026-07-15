import { describe, expect, it } from "vitest";

import {
  createParticipant,
  deleteParticipant,
  getParticipant,
  listParticipants,
  ParticipantApiError,
  updateParticipant,
} from "@/api/participants";

const payload = {
  first_name: "Taylor",
  last_name: "Nguyen",
  email: "taylor@example.com",
  organization: "Central",
  role: "Research participant",
  record_ids: ["record-1"],
  researcher_notes: "Prefers desktop checkout.",
};

describe("participant API contract", () => {
  it("lists and searches Project-scoped participants", async () => {
    expect(await listParticipants("alpha-project")).toHaveLength(4);
    const results = await listParticipants("alpha-project", "alex.morgan");
    expect(results.map((participant) => participant.id)).toEqual(["alex-morgan"]);
  });

  it("creates, updates, reads, and deletes a participant", async () => {
    const created = await createParticipant("alpha-project", payload);
    expect(created).toMatchObject({ id: "participant-1", project_id: "alpha-project", first_name: "Taylor" });

    const updated = await updateParticipant("alpha-project", created.id, { ...payload, role: "Facilitator" });
    expect(updated.role).toBe("Facilitator");
    expect((await getParticipant("alpha-project", created.id)).role).toBe("Facilitator");

    await deleteParticipant("alpha-project", created.id);
    await expect(getParticipant("alpha-project", created.id)).rejects.toMatchObject({ status: 404 });
  });

  it("preserves an actionable 404 status across the transport boundary", async () => {
    await expect(getParticipant("alpha-project", "not-here")).rejects.toBeInstanceOf(ParticipantApiError);
    await expect(getParticipant("alpha-project", "not-here")).rejects.toMatchObject({ status: 404 });
  });
});
