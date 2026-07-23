import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { transcriptCodingCodes } from "@/mocks/fixtures/transcript-coding";
import { TranscriptCodePanel } from "./transcript-code-panel";

function StatefulTranscriptCodePanel({
  initialOpen = true,
  ...args
}: React.ComponentProps<typeof TranscriptCodePanel> & { initialOpen?: boolean }) {
  const [mode, setMode] = React.useState(args.mode ?? "apply");
  const [open, setOpen] = React.useState(initialOpen);
  const [availableCodes, setAvailableCodes] = React.useState(args.availableCodes);
  const [statusMessage, setStatusMessage] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) triggerRef.current?.focus();
  }, [open]);

  function closePanel(message = "") {
    setStatusMessage(message);
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="grid justify-items-start gap-3">
        {statusMessage ? <p aria-live="polite" className="text-sm text-[var(--air-color-text-secondary)]">{statusMessage}</p> : null}
        <button
          className="h-11 rounded-[var(--air-radius-md)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2"
          onClick={() => {
            setMode(args.mode ?? "apply");
            setOpen(true);
          }}
          ref={triggerRef}
          type="button"
        >
          Apply code
        </button>
      </div>
    );
  }

  return (
    <TranscriptCodePanel
      {...args}
      availableCodes={availableCodes}
      mode={mode}
      onApply={(codeIds) => {
        args.onApply?.(codeIds);
        closePanel(`${codeIds.length} ${codeIds.length === 1 ? "code" : "codes"} applied.`);
      }}
      onCancel={() => {
        args.onCancel?.();
        closePanel();
      }}
      onCreateCode={(value) => {
        const codeId = `code-${value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
        setAvailableCodes((current) => [...current, { id: codeId, name: value.name, description: value.description }]);
        args.onCreateCode?.(value);
        return codeId;
      }}
      onModeChange={(nextMode) => {
        setMode(nextMode);
        args.onModeChange?.(nextMode);
      }}
    />
  );
}

const meta = {
  title: "Research Objects/Transcript Coding/Apply Code Panel",
  component: TranscriptCodePanel,
  render: (args) => <StatefulTranscriptCodePanel {...args} />,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto w-[30rem] p-6"><Story /></div>],
  parameters: { docs: { description: { component: "Applies one or more existing codes to a Highlight or switches to the create-code form without losing the source selection." } } },
  args: { availableCodes: transcriptCodingCodes, onApply: fn(), onCancel: fn(), onCreateCode: fn(), onModeChange: fn(), onSelectedCodeIdsChange: fn() },
} satisfies Meta<typeof TranscriptCodePanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ApplyExisting: Story = {
  render: (args) => <StatefulTranscriptCodePanel {...args} initialOpen={false} />,
};
export const OpenFromTrigger: Story = {
  render: (args) => <StatefulTranscriptCodePanel {...args} initialOpen={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Apply code" }));
    await expect(canvas.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
  },
};
export const WithSelectedCodes: Story = { args: { defaultSelectedCodeIds: transcriptCodingCodes.slice(0, 2).map((code) => code.id) } };
export const CreateNewCode: Story = { args: { mode: "create" } };
export const CreateAndReturn: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create a new code" }));
    await expect(canvas.getByRole("heading", { name: "Create a new code" })).toBeInTheDocument();
    await userEvent.type(canvas.getByRole("textbox", { name: "Code name" }), "Checkout friction");
    await userEvent.type(canvas.getByRole("textbox", { name: "Description" }), "Barriers in the checkout flow.");
    await userEvent.click(canvas.getByRole("button", { name: "Back to apply code" }));
    await expect(canvas.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Create a new code" }));
    await expect(canvas.getByRole("textbox", { name: "Code name" })).toHaveValue("Checkout friction");
    await expect(canvas.getByRole("textbox", { name: "Description" })).toHaveValue("Barriers in the checkout flow.");
    await expect(args.onModeChange).toHaveBeenNthCalledWith(1, "create");
    await expect(args.onModeChange).toHaveBeenNthCalledWith(2, "apply");
    await expect(args.onModeChange).toHaveBeenNthCalledWith(3, "create");
  },
};
export const CancelClosesAndDiscards: Story = {
  args: { mode: "create" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "Code name" }), "Temporary draft");
    await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
    await expect(args.onCancel).toHaveBeenCalled();
    await expect(canvas.getByRole("button", { name: "Apply code" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Apply code" }));
    await expect(canvas.getByRole("textbox", { name: "Code name" })).toHaveValue("");
  },
};
export const CreateAndApply: Story = {
  args: { mode: "create" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "Code name" }), "Checkout friction");
    await userEvent.type(canvas.getByRole("textbox", { name: "Description" }), "Barriers in the checkout flow.");
    await userEvent.click(canvas.getByRole("button", { name: "Create code" }));
    await expect(args.onCreateCode).toHaveBeenCalledWith({ name: "Checkout friction", description: "Barriers in the checkout flow." });
    await expect(canvas.getByRole("heading", { name: "Apply code" })).toBeInTheDocument();
    await expect(canvas.getByRole("option", { name: /Checkout friction/ })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("button", { name: "Remove Checkout friction code" })).toBeInTheDocument();
    await expect(args.onApply).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(args.onApply).toHaveBeenCalledWith(["code-checkout-friction"]);
  },
};
export const SelectAndApply: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("option", { name: /Navigation terminology/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(args.onApply).toHaveBeenCalledWith(["code-navigation-terminology"]);
  },
};
