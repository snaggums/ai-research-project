import type { Meta, StoryObj } from "@storybook/react-vite";

import { toSessionTheme } from "@/adapters/synthesis";
import { sessionThemeFixtures } from "@/mocks/fixtures/synthesis";
import { ThemeEvidenceDetail } from "./theme-evidence-detail";

const meta = { title: "Research Objects/Synthesis/Theme Evidence Detail", component: ThemeEvidenceDetail, tags: ["autodocs"], args: { contextHref: () => "#transcript-context", theme: toSessionTheme(sessionThemeFixtures[0]) } } satisfies Meta<typeof ThemeEvidenceDetail>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { layout: "compact" } };
