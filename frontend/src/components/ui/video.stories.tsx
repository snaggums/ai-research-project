import type { Meta, StoryObj } from "@storybook/react-vite";

import { VideoPlayer } from "@/components/ui/video";

const meta = {
  title: "Tier 2/Video",
  component: VideoPlayer,
  tags: ["autodocs"],
  args: {
    defaultCurrentTime: 0,
    defaultMuted: false,
    defaultPlaying: false,
    duration: 330,
    label: "Project recording",
    showControls: true,
    showFullscreen: true,
    showSettings: true,
  },
  argTypes: {
    currentTime: { control: { min: 0, step: 1, type: "range" } },
    duration: { control: { min: 0, step: 1, type: "number" } },
    poster: { control: false },
  },
  parameters: { layout: "centered" },
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {};
export const Playing: Story = { args: { defaultPlaying: true } };
export const Muted: Story = { args: { defaultMuted: true } };
export const TwentyFivePercent: Story = { args: { defaultCurrentTime: 83 } };
export const FiftyPercent: Story = { args: { defaultCurrentTime: 165 } };
export const SeventyFivePercent: Story = { args: { defaultCurrentTime: 248 } };
export const Complete: Story = { args: { defaultCurrentTime: 330 } };
export const WithoutOptionalControls: Story = {
  args: { showFullscreen: false, showSettings: false },
};
export const WithoutControls: Story = { args: { showControls: false } };
