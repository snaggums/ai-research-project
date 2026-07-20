// @vitest-environment node

import {
  askSession,
  createSessionReportRevision,
  generateSessionReport,
  generateSessionThemes,
  getSessionConversation,
  getSessionReport,
  listSessionThemes,
  updateSessionReportStatus,
  updateSessionReport,
  updateSessionReportItem,
  updateSessionTheme,
} from "./synthesis";

describe("Session synthesis API contracts", () => {
  it("supports Session-scoped theme review without changing the V1 Project theme contract", async () => {
    const themes = await listSessionThemes("alpha-project", "mobile-checkout-test");
    expect(themes).toHaveLength(3);
    expect(themes[0].evidence[0].context_result_id).toBe("result-1");
    const reviewed = await updateSessionTheme("alpha-project", "mobile-checkout-test", themes[0].id, { status: "researcher-reviewed" });
    expect(reviewed.status).toBe("researcher-reviewed");
    expect((await generateSessionThemes("alpha-project", "mobile-checkout-test")).themes).toHaveLength(3);
  });

  it("supports report lifecycle actions and a new revision", async () => {
    const report = await getSessionReport("alpha-project", "mobile-checkout-test");
    expect(report?.items.map(({ type }) => type)).toEqual(["requirement", "decision", "action-item", "open-question", "key-insight"]);
    expect((await updateSessionReport("alpha-project", "mobile-checkout-test", { executive_summary: "Updated report summary" })).executive_summary).toBe("Updated report summary");
    expect((await updateSessionReportItem("alpha-project", "mobile-checkout-test", report!.items[0].id, { title: "Updated requirement" })).items[0].title).toBe("Updated requirement");
    expect((await updateSessionReportStatus("alpha-project", "mobile-checkout-test", "approved")).status).toBe("approved");
    expect((await createSessionReportRevision("alpha-project", "mobile-checkout-test")).status).toBe("ai-generated");
    expect((await generateSessionReport("alpha-project", "mobile-checkout-test")).report.status).toBe("ai-generated");
  });

  it("persists grounded Session conversation turns with transcript citations", async () => {
    expect((await getSessionConversation("alpha-project", "mobile-checkout-test")).turns).toHaveLength(0);
    const response = await askSession("alpha-project", "mobile-checkout-test", "What caused participants to lose confidence?");
    expect(response.conversation.turns).toHaveLength(2);
    expect(response.answer.citations[0]).toMatchObject({ document_id: "checkout-transcript", context_result_id: "result-1" });
  });
});
