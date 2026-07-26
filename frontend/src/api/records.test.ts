import {
  askRecord,
  generateRecordSynthesis,
  getLatestRecordSynthesis,
  getRecord,
  getRecordChatSources,
  getRecordSynthesisEligibility,
  getRecordSynthesisEvidence,
  listRecords,
  listRecordSessions,
  RecordApiError,
  updateRecordSynthesisItem,
} from "./records";

describe("Record API contract", () => {
  it("loads the fixed catalog, detail, related Sessions, and automatic eligibility", async () => {
    expect((await listRecords()).map(({ name }) => name)).toEqual(["Record 1", "Record 2", "Record 3"]);
    expect((await getRecord("record-1")).readiness).toBe("ready");
    expect((await listRecordSessions("record-1")).map(({ id }) => id)).toEqual(["mobile-checkout-test", "checkout-interview"]);
    expect((await getRecordSynthesisEligibility("record-1")).included_sessions).toHaveLength(2);
  });

  it("reads, regenerates, reviews, and opens Record synthesis evidence", async () => {
    expect((await getLatestRecordSynthesis("record-1"))?.status).toBe("complete");
    const generated = await generateRecordSynthesis("record-3");
    expect(generated.status).toBe("complete");
    const reviewed = await updateRecordSynthesisItem("record-3", generated.items[0].id, "researcher-reviewed");
    expect(reviewed.status).toBe("researcher-reviewed");
    const evidence = await getRecordSynthesisEvidence("record-3", generated.items[0].id, generated.items[0].evidence_ids[0]);
    expect(evidence.context.focused_passage_id).toBe("passage-2");
  });

  it("loads Record chat sources and returns grounded transcript citations", async () => {
    const sources = await getRecordChatSources("record-1");
    expect(sources).toMatchObject({
      searchable: true,
      record_knowledge_available: true,
    });
    const response = await askRecord(
      "record-1",
      "What prevents participants from feeling confident after checkout?",
    );
    expect(response.status).toBe("answered");
    expect(response.answer).toContain("[1]");
    expect(response.citations[0]).toMatchObject({
      project_id: "alpha-project",
      session_id: "mobile-checkout-test",
      context_result_id: "result-1",
    });
  });

  it("preserves an actionable 404 for unknown fixed Records", async () => {
    await expect(getRecord("record-99")).rejects.toBeInstanceOf(RecordApiError);
  });
});
