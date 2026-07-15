import type { Meta, StoryObj } from "@storybook/react-vite";

import { toSessionTheme } from "@/adapters/synthesis";
import { sessionThemeFixtures } from "@/mocks/fixtures/synthesis";
import { ThemeCard } from "./theme-card";

const meta = { title: "Research Objects/Synthesis/Theme Card", component: ThemeCard, tags: ["autodocs"], args: { theme: toSessionTheme(sessionThemeFixtures[0]) } } satisfies Meta<typeof ThemeCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AIGenerated: Story = {};
export const ResearcherReviewed: Story = { args: { theme: toSessionTheme(sessionThemeFixtures[1]) } };
export const Approved: Story = { args: { theme: toSessionTheme(sessionThemeFixtures[2]) } };
export const Rejected: Story = { args: { theme: { ...toSessionTheme(sessionThemeFixtures[0]), status: "rejected" } } };
export const Compact: Story = { args: { layout: "compact", theme: toSessionTheme(sessionThemeFixtures[1]) } };
