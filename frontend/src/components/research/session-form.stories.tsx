import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { SessionForm } from "./session-form";
import { participants, sessions } from "@/mocks/fixtures/domain";

const participantOptions = participants.map(({ id, firstName, lastName, referenceId }) => ({ id, firstName, lastName, referenceId }));
const editValues = { title: sessions[0].title, type: sessions[0].type, date: "2026-07-08", time: "10:00", description: "Interview about the checkout workflow.", participantIds: sessions[0].participants.map(({ id }) => id) };
const meta = { title: "Research Objects/Session/Session Form", component: SessionForm, tags: ["autodocs"], decorators: [(Story) => <div className="mx-auto max-w-4xl p-6"><Story /></div>], args: { mode: "create", onSubmit: () => undefined, participants: participantOptions } } satisfies Meta<typeof SessionForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Create: Story = {};
export const CreateValidationErrors: Story = { play: async ({ canvasElement }) => { await userEvent.click(within(canvasElement).getByRole("button", { name: "Create session" })); } };
export const Edit: Story = { args: { defaultValues: editValues, mode: "edit" } };
export const Submitting: Story = { args: { isSubmitting: true } };
export const RequestFailure: Story = { args: { submitError: "Check your connection and try again. Your entered details are still available." } };
