import type { Meta, StoryObj } from "@storybook/react-vite";

import { toSessionReport } from "@/adapters/synthesis";
import { sessionReportFixture } from "@/mocks/fixtures/synthesis";
import { SessionReport } from "./session-report";

const report = toSessionReport(sessionReportFixture);
const meta = { title: "Research Objects/Synthesis/Session Report", component: SessionReport, tags: ["autodocs"], args: { report } } satisfies Meta<typeof SessionReport>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AIGenerated: Story = {};
export const ResearcherReviewed: Story = { args: { report: { ...report, status: "researcher-reviewed" } } };
export const Approved: Story = { args: { report: { ...report, status: "approved" } } };
export const Superseded: Story = { args: { report: { ...report, status: "superseded" } } };
export const Compact: Story = { args: { layout: "compact" } };
