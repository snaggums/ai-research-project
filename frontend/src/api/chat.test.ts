import { askProjectQuestion } from "@/api/chat";

describe("Project chat API", () => {
  it("returns Session and transcript location metadata for citations", async () => {
    const response = await askProjectQuestion(
      "alpha-project",
      "What findings appeared across Sessions?",
    );

    expect(response.citations[0]).toMatchObject({
      context_result_id: "project-checkout-confirmation",
      document_id: "checkout-transcript",
      location: "00:08:42",
      session_id: "checkout-usability-test",
      session_title: "Checkout usability test",
      speaker: "Marcus",
    });
  });
});
