import { createSession, deleteSession, getSession, listSessions, SessionApiError, updateSession } from "./sessions";

const payload = { title: "New interview", type: "interview" as const, starts_at: "2026-07-15T14:00:00.000Z", participant_ids: ["alex-morgan"], description: "Follow-up research." };

describe("session API contract", () => {
  it("lists and filters Project-scoped sessions and transcript names", async () => {
    expect(await listSessions("alpha-project")).toHaveLength(4);
    expect((await listSessions("alpha-project", { search: "mobile-checkout-session" })).map(({ id }) => id)).toEqual(["mobile-checkout-test"]);
    expect((await listSessions("alpha-project", { type: "focus-group" })).map(({ id }) => id)).toEqual(["navigation-focus-group"]);
    expect((await listSessions("alpha-project", { transcriptStatus: "failed" })).map(({ id }) => id)).toEqual(["checkout-working-session"]);
    expect((await listSessions("alpha-project", { recordId: "record-2" })).map(({ id }) => id)).toEqual(["navigation-focus-group", "checkout-working-session"]);
  });

  it("creates, updates, reads, and deletes a Session", async () => {
    const created = await createSession("alpha-project", payload);
    expect(created).toMatchObject({ id: "session-1", project_id: "alpha-project", participant_ids: ["alex-morgan"] });
    const updated = await updateSession("alpha-project", created.id, { ...payload, title: "Updated interview" });
    expect(updated.title).toBe("Updated interview");
    expect((await getSession("alpha-project", created.id)).title).toBe("Updated interview");
    await deleteSession("alpha-project", created.id);
    await expect(getSession("alpha-project", created.id)).rejects.toMatchObject({ status: 404 });
  });

  it("preserves an actionable 404 across the transport boundary", async () => {
    await expect(getSession("alpha-project", "not-here")).rejects.toBeInstanceOf(SessionApiError);
  });
});
