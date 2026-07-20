import axe from "axe-core";
import { render } from "@testing-library/react";

import { ParticipantForm } from "@/components/research/participant-form";
import { ParticipantListItem } from "@/components/research/participant-list-item";
import { ParticipantPicker } from "@/components/research/participant-picker";
import { jordanMoore, participantOptions, recordOptions } from "@/mocks/fixtures/participants";

describe("Participant components accessibility", () => {
  it("has no automated semantic violations in representative states", async () => {
    const { container } = render(
      <main className="grid gap-8">
        <ParticipantListItem
          href="#jordan-moore"
          onDelete={() => undefined}
          onEdit={() => undefined}
          participant={jordanMoore}
        />
        <ParticipantForm mode="create" onSubmit={() => undefined} recordOptions={recordOptions} />
        <ParticipantPicker
          onAddParticipant={() => undefined}
          onValueChange={() => undefined}
          participants={participantOptions}
          value={["jordan-moore", "avery-chen"]}
        />
      </main>,
    );

    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});

