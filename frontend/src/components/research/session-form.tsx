import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { InputField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { TextareaField } from "@/components/ui/textarea";
import type { SessionType } from "@/domain/types";
import { cn } from "@/lib/utils";
import { ParticipantPicker, type ParticipantOption } from "./participant-picker";
import { RecordField } from "./record-field";
import { fixedRecordOptions } from "./record-options";
import { sessionTypeLabels } from "./session-presentation";

const sessionTypes = ["interview", "usability-test", "focus-group", "working-session", "design-critique", "other"] as const;
const sessionFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a session title."),
  type: z.enum(sessionTypes, { errorMap: () => ({ message: "Select a session type." }) }),
  date: z.string(),
  time: z.string(),
  description: z.string().trim(),
  recordId: z.enum(["", ...fixedRecordOptions.map((option) => option.value)] as [string, ...string[]]),
  participantIds: z.array(z.string()),
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;

const emptyValues: SessionFormValues = {
  title: "",
  type: "" as SessionType,
  date: "",
  time: "",
  description: "",
  recordId: "",
  participantIds: [],
};

export interface SessionFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  defaultValues?: SessionFormValues;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onAddParticipant?: () => void;
  onCancel?: () => void;
  onSubmit: (values: SessionFormValues) => void | Promise<void>;
  participants: ParticipantOption[];
  showHeader?: boolean;
  submitError?: React.ReactNode;
}

export function SessionForm({ className, defaultValues = emptyValues, isSubmitting = false, mode, onAddParticipant, onCancel, onSubmit, participants, showHeader = true, submitError, ...props }: SessionFormProps) {
  const { control, formState: { errors, isSubmitting: formSubmitting }, handleSubmit, register, reset } = useForm<SessionFormValues>({ defaultValues, resolver: zodResolver(sessionFormSchema) });
  const pending = isSubmitting || formSubmitting;
  const create = mode === "create";

  React.useEffect(() => reset(defaultValues), [defaultValues, reset]);

  return (
    <form className={cn("grid w-full gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6", className)} noValidate onSubmit={handleSubmit(onSubmit)} {...props}>
      {showHeader ? <header><h2 className="text-xl font-semibold">{create ? "Add session" : "Edit session"}</h2><p className="mt-1 text-sm leading-5 text-[var(--air-color-text-secondary)]">{create ? "Create a Session within this Project. Title and Session type are required." : "Update the Session details and participant assignments."}</p></header> : null}
      {submitError ? <Alert message={submitError} size="large" title={create ? "Session could not be added" : "Session could not be saved"} tone="error" /> : null}
      <InputField disabled={pending} error={errors.title?.message} label="Session title" placeholder="Enter a session title" required {...register("title")} />
      <div className="grid gap-4 md:grid-cols-2">
        <Controller control={control} name="type" render={({ field }) => <SelectField disabled={pending} error={errors.type?.message} label="Session type" onValueChange={field.onChange} options={sessionTypes.map((value) => ({ label: sessionTypeLabels[value], value }))} placeholder="Select a session type" required value={field.value} />} />
        <Controller control={control} name="recordId" render={({ field }) => <RecordField disabled={pending} onValueChange={field.onChange} value={field.value} />} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <DateField disabled={pending} label="Date" optional {...register("date")} />
        <InputField disabled={pending} label="Time" optional type="time" {...register("time")} />
      </div>
      <TextareaField className="min-h-28" disabled={pending} label="Description" optional placeholder="Add the research purpose or agenda" {...register("description")} />
      <Controller control={control} name="participantIds" render={({ field }) => <ParticipantPicker className="border-0 p-0" disabled={pending} onAddParticipant={onAddParticipant} onValueChange={field.onChange} participants={participants} value={field.value} />} />
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button disabled={pending} onClick={onCancel} size="small" type="button" variant="text">Cancel</Button>
        <Button disabled={pending} size="small" type="submit">{pending ? (create ? "Creating…" : "Saving…") : (create ? "Create session" : "Save changes")}</Button>
      </div>
    </form>
  );
}
