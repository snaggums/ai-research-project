// @vitest-environment node

import { File as NodeFile } from "node:buffer";

import { deleteSessionTranscript, getTranscriptContext, getTranscriptDependencies, listSessionTranscripts, replaceSessionTranscript, searchSessionTranscript, uploadSessionTranscript } from "./transcripts";

describe("Transcript API contract", () => {
  it("prevents ordinary second uploads and supports the replacement lifecycle", async () => {
    const initial = await listSessionTranscripts("alpha-project", "mobile-checkout-test");
    expect(initial).toHaveLength(1);
    expect(initial[0].is_primary).toBe(true);

    const uploadFile = new NodeFile(["Hello"], "second-transcript.txt", { type: "text/plain" }) as unknown as File;
    await expect(uploadSessionTranscript("alpha-project", "mobile-checkout-test", uploadFile)).rejects.toMatchObject({
      code: "transcript_already_exists",
      status: 409,
    });
    const replacement = await replaceSessionTranscript(
      "alpha-project",
      "mobile-checkout-test",
      uploadFile,
      "replacement-request-1",
    );
    expect(replacement).toMatchObject({
      filename: "second-transcript.txt",
      is_primary: true,
      lifecycle_status: "active",
      session_id: "mobile-checkout-test",
      status: "complete",
    });

    const search = await searchSessionTranscript("alpha-project", "mobile-checkout-test", "checkout-transcript", "navigation confusion");
    expect(search.results).toHaveLength(3);
    expect(
      search.results.every((result) =>
        /(?<!\w)navigation confusion(?!\w)/i.test(`${result.speaker} ${result.excerpt}`),
      ),
    ).toBe(true);
    const context = await getTranscriptContext("alpha-project", "mobile-checkout-test", "checkout-transcript", search.results[0].id);
    expect(context.focused_passage_id).toBe("passage-2");
    expect(context.passages[0].speaker).toContain("Moderator");

    const dependencies = await getTranscriptDependencies("alpha-project", "mobile-checkout-test", replacement.id);
    expect(dependencies).toMatchObject({
      is_primary: true,
      retention_consequence: "preserve-lineage",
    });
    await deleteSessionTranscript("alpha-project", "mobile-checkout-test", replacement.id, dependencies.version);
    const tombstoned = (await listSessionTranscripts("alpha-project", "mobile-checkout-test"))
      .find(({ id }) => id === replacement.id);
    expect(tombstoned).toMatchObject({ is_primary: false, lifecycle_status: "tombstoned" });
  });
});
