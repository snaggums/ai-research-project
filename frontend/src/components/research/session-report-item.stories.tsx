import type { Meta, StoryObj } from "@storybook/react-vite";

import { toSessionReport } from "@/adapters/synthesis";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionReportItem } from "./session-report-item";

const report = toSessionReport(sessionReportFixture);
const meta = { title: "Research Objects/Synthesis/Session Report Item", component: SessionReportItem, tags: ["autodocs"], args: { item: report.items[0] } } satisfies Meta<typeof SessionReportItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Requirement: Story = {};
export const Decision: Story = { args: { item: report.items[1] } };
export const ActionItem: Story = { args: { item: report.items[2] } };
export const OpenQuestion: Story = { args: { item: report.items[3] } };
export const KeyInsight: Story = { args: { item: report.items[4] } };
export const Compact: Story = { args: { item: report.items[4], layout: "compact" } };
