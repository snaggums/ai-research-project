import type { Meta, StoryObj } from "@storybook/react-vite";

import { RecordSynthesisRequirementsNote } from "./record-synthesis-requirements-note";

const meta = {
  title: "Research Objects/Session/Record Synthesis Requirements Note",
  component: RecordSynthesisRequirementsNote,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-6"><Story /></div>],
} satisfies Meta<typeof RecordSynthesisRequirementsNote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
