import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { SessionParticipantForm } from "@/components/research/session-participant-form";
import { recordOptions } from "@/mocks/fixtures/participants";

const eligibleParticipants = [
  { label: "Avery Chen", value: "avery-chen" },
  { label: "Jordan Moore", value: "jordan-moore" },
  { label: "Samira Patel", value: "samira-patel" },
  { label: "Marcus Reed", value: "marcus-reed" },
];

const meta = {
  title: "Research Objects/Session/Session Participant Form",
  component: SessionParticipantForm,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="mx-auto w-full max-w-[828px] p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
Assign an existing eligible Project participant to a Session, or create a new Project-scoped participant and assign them to the Session.

- Existing options exclude Project participants already assigned to the Session.
- Existing options are ordered alphabetically by participant last name.
- Existing and new participant paths are mutually exclusive.
- Selecting an existing participant disables the new-participant fields.
- The Project participant autocomplete filters eligible participants as the researcher types.
- Arrow keys navigate filtered results, Enter selects and fills the field, and Escape closes the list.
- [Approved Desktop Figma contract](https://www.figma.com/design/WPRxumvm6WB4WRFlfO3lbj/Sky-AIR-Design-System?node-id=1091-1686)
        `,
      },
    },
  },
  args: {
    eligibleParticipants,
    onCancel: fn(),
    onSelectedParticipantChange: fn(),
    onSubmitExisting: fn(),
    onSubmitNew: fn(),
    recordOptions,
  },
  argTypes: {
    eligibleParticipants: { control: false },
    onCancel: { control: false },
    onSelectedParticipantChange: { control: false },
    onSubmitExisting: { control: false },
    onSubmitNew: { control: false },
    recordOptions: { control: false },
  },
} satisfies Meta<typeof SessionParticipantForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pristine: Story = {
  parameters: {
    docs: {
      description: {
        story: "Neither path is selected. Researchers may choose an eligible Project participant or enter a new participant.",
      },
    },
  },
};

export const MenuOpen: Story = {
  parameters: {
    docs: {
      description: {
        story: "The full-width listbox contains only Project participants who are not already assigned to the Session.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const combobox = canvas.getByRole("combobox", { name: "Project participant" });
    await userEvent.click(combobox);
    const listbox = canvas.getByRole("listbox", { name: "Project participant" });
    await expect(listbox).toBeVisible();
    await expect(within(listbox).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Avery Chen",
      "Jordan Moore",
      "Samira Patel",
      "Marcus Reed",
    ]);
    await expect(combobox).toHaveAttribute("aria-expanded", "true");
    await expect(combobox).toHaveAttribute("aria-activedescendant");
  },
};

export const SearchResults: Story = {
  parameters: {
    docs: {
      description: {
        story: "Typing filters eligible Project participants and selecting a result fills the autocomplete.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const combobox = canvas.getByRole("combobox", { name: "Project participant" });
    await userEvent.type(combobox, "avery");
    const listbox = canvas.getByRole("listbox", { name: "Project participant" });
    await expect(within(listbox).getAllByRole("option")).toHaveLength(1);
    await userEvent.click(within(listbox).getByRole("option", { name: "Avery Chen" }));
    await expect(combobox).toHaveValue("Avery Chen");
  },
};

export const NoSearchResults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("combobox", { name: "Project participant" }), "missing");
    await expect(canvas.getByRole("status")).toHaveTextContent("No matching Project participants.");
  },
};

export const ExistingSelected: Story = {
  args: {
    defaultSelectedParticipantId: "avery-chen",
  },
  parameters: {
    docs: {
      description: {
        story: "Selecting an existing participant disables the new-participant path while preserving its entered values.",
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("New participant fields are unavailable while an existing participant is selected.")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: /First name/ })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Add participant" }));
    await expect(args.onSubmitExisting).toHaveBeenCalledWith("avery-chen");
    await expect(args.onSubmitNew).not.toHaveBeenCalled();
  },
};

export const NoAvailableParticipants: Story = {
  args: {
    eligibleParticipants: [],
  },
  parameters: {
    docs: {
      description: {
        story: "When every Project participant is already assigned, the selector is disabled and the new-participant path remains available.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "Project participant" })).toBeDisabled();
    await expect(canvas.getByText("All Project participants are already assigned to this Session.")).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: /First name/ })).toBeEnabled();
  },
};

export const ValidationError: Story = {
  parameters: {
    docs: {
      description: {
        story: "Submitting the empty new-participant path identifies both required name fields.",
      },
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add participant" }));
    await expect(canvas.getByText("Enter a first name.")).toBeVisible();
    await expect(canvas.getByText("Enter a last name.")).toBeVisible();
    await expect(args.onSubmitExisting).not.toHaveBeenCalled();
    await expect(args.onSubmitNew).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
  parameters: {
    docs: {
      description: {
        story: "All controls are unavailable while either participant path is being submitted.",
      },
    },
  },
};

export const RequestFailure: Story = {
  args: {
    submitError: "Check your connection and try again. Your entered details are still available.",
  },
  parameters: {
    docs: {
      description: {
        story: "A recoverable request failure keeps the researcher’s current selection or entered details available.",
      },
    },
  },
};
