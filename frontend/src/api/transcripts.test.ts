// @vitest-environment node

import { File as NodeFile } from "node:buffer";

import { deleteSessionTranscript, getTranscriptContext, listSessionTranscripts, retrySessionTranscript, searchSessionTranscript, setPrimaryTranscript, uploadSessionTranscript } from "./transcripts";

describe("Transcript API contract", () => {
  it("supports Session-scoped list, upload, retry, primary, search, context, and delete", async () => {
    const initial = await listSessionTranscripts("alpha-project", "mobile-checkout-test");
    expect(initial).toHaveLength(1);
    expect(initial[0].is_primary).toBe(true);

    const uploadFile = new NodeFile(["Hello"], "second-transcript.txt", { type: "text/plain" }) as unknown as File;
    const uploaded = await uploadSessionTranscript("alpha-project", "mobile-checkout-test", uploadFile);
    expect(uploaded).toMatchObject({ filename: "second-transcript.txt", session_id: "mobile-checkout-test", status: "processing" });
    expect((await retrySessionTranscript("alpha-project", "mobile-checkout-test", uploaded.id)).status).toBe("processing");
    expect((await setPrimaryTranscript("alpha-project", "mobile-checkout-test", uploaded.id)).is_primary).toBe(true);

    const search = await searchSessionTranscript("alpha-project", "mobile-checkout-test", "checkout-transcript", "navigation confusion");
    expect(search.results).toHaveLength(3);
    const context = await getTranscriptContext("alpha-project", "mobile-checkout-test", "checkout-transcript", search.results[0].id);
    expect(context.focused_passage_id).toBe("passage-2");
    expect(context.passages[0].speaker).toContain("Moderator");

    await deleteSessionTranscript("alpha-project", "mobile-checkout-test", uploaded.id);
    expect((await listSessionTranscripts("alpha-project", "mobile-checkout-test")).map(({ id }) => id)).not.toContain(uploaded.id);
  });
});
