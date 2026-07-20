import type { Meta, StoryObj } from "@storybook/react-vite";

import { toTranscriptSearchResult } from "@/adapters/transcripts";
import { transcriptSearchFixtures } from "@/mocks/fixtures/transcripts";
import { TranscriptSearchResult } from "./transcript-search-result";

const meta = { title: "Research Objects/Transcript/Transcript Search Result", component: TranscriptSearchResult, tags: ["autodocs"], decorators: [(Story) => <div className="max-w-3xl p-6" onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><Story /></div>], args: { href: "#context", result: toTranscriptSearchResult(transcriptSearchFixtures[0]) } } satisfies Meta<typeof TranscriptSearchResult>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Compact: Story = { args: { layout: "compact" }, parameters: { viewport: { defaultViewport: "mobile1" } } };
