import {
  askRecord,
  generateRecordSynthesis,
  getLatestRecordSynthesis,
  getRecord,
  getRecordChatSources,
  getRecordKnowledge,
  getRecordKnowledgeEvidence,
  getRecordKnowledgeSources,
  getRecordTranscriptCodes,
  getRecordSynthesisEligibility,
  getRecordSynthesisEvidence,
  listRecords,
  listRecordSessions,
  RecordApiError,
  updateRecordSynthesisItem,
} from "./records";

describe("Record API contract", () => {
  it("loads the fixed catalog, detail, related Sessions, and automatic eligibility", async () => {
    expect((await listRecords()).map(({ name }) => name)).toEqual(["Medicare Fraud Documenter", "Medicaid Fraud Documenter", "Medicare Fraud Finder"]);
    expect((await getRecord("record-1")).readiness).toBe("up-to-date");
    expect((await listRecordSessions("record-1")).map(({ id }) => id)).toEqual(["mobile-checkout-test", "checkout-interview"]);
    expect((await getRecordSynthesisEligibility("record-1")).included_sessions).toHaveLength(2);
  });

  it("loads exact approved Record Knowledge, sources, and evidence", async () => {
    const knowledge = await getRecordKnowledge("record-1");
    expect(knowledge.items).not.toHaveLength(0);
    expect(knowledge.items.every((item) => item.status === "current")).toBe(true);
    const sources = await getRecordKnowledgeSources("record-1");
    expect(sources.sources.some((source) => source.included)).toBe(true);
    const item = knowledge.items[0];
    const evidence = await getRecordKnowledgeEvidence(
      "record-1",
      item.id,
      item.evidence_ids[0],
    );
    expect(evidence.item_title).toBe(item.title);
  });

  it("loads only Accepted codes with supporting Highlights across Sessions", async () => {
    const transcriptCodes = await getRecordTranscriptCodes("record-1");
    expect(transcriptCodes.accepted_code_count).toBe(22);
    expect(transcriptCodes.session_count).toBe(5);
    expect(transcriptCodes.codes).toHaveLength(22);
    expect(
      transcriptCodes.codes.every(
        (code) =>
          code.accepted_highlight_count > 0 &&
          code.evidence_groups.some((group) => group.highlights.length > 0),
      ),
    ).toBe(true);
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
