import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import {
  emptyParticipantFormValues,
  participantFormSchema,
  type ParticipantFormValues,
} from "@/components/research/participant-form-contract";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MultiSelectField, type MultiSelectOption } from "@/components/ui/multi-select-field";
import { TextareaField } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type { ParticipantFormValues } from "@/components/research/participant-form-contract";

export interface ParticipantFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  defaultValues?: ParticipantFormValues;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onCancel?: () => void;
  onSubmit: (values: ParticipantFormValues) => void | Promise<void>;
  recordOptions?: MultiSelectOption[];
  showHeader?: boolean;
  submitError?: React.ReactNode;
}

export function ParticipantForm({
  className,
  defaultValues = emptyParticipantFormValues,
  isSubmitting = false,
  mode,
  onCancel,
  onSubmit,
  recordOptions = [],
  showHeader = true,
  submitError,
  ...props
}: ParticipantFormProps) {
  const {
    control,
    formState: { errors, isSubmitting: isFormSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ParticipantFormValues>({ defaultValues, resolver: zodResolver(participantFormSchema) });
  const pending = isSubmitting || isFormSubmitting;
  const isCreate = mode === "create";

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form
      className={cn(
        "grid w-full gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6",
        className,
      )}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      {showHeader ? (
        <div>
          <h2 className="text-xl font-semibold">{isCreate ? "Add participant" : "Edit participant"}</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--air-color-text-secondary)]">
            {isCreate
              ? "Add a Project-scoped participant. First and last name are required; contact and profile details are optional."
              : "Update this Project-scoped participant profile. Session memberships are managed from each Session."}
          </p>
        </div>
      ) : null}

      {submitError ? (
        <Alert
          message={submitError}
          size="large"
          title={isCreate ? "Participant could not be added" : "Participant could not be saved"}
          tone="error"
        />
      ) : null}

      <div className="grid items-start gap-4 md:grid-cols-2">
        <InputField
          autoComplete="given-name"
          disabled={pending}
          error={errors.firstName?.message}
          label="First name"
          placeholder="Enter a first name"
          required
          {...register("firstName")}
        />
        <InputField
          autoComplete="family-name"
          disabled={pending}
          error={errors.lastName?.message}
          label="Last name"
          placeholder="Enter a last name"
          required
          {...register("lastName")}
        />
        <InputField
          autoComplete="email"
          disabled={pending}
          error={errors.email?.message}
          label="Email address"
          optional
          placeholder="Enter an email address"
          type="email"
          {...register("email")}
        />
        <Controller
          control={control}
          name="recordIds"
          render={({ field }) => (
            <MultiSelectField
              disabled={pending}
              label="Record"
              onValueChange={field.onChange}
              options={recordOptions}
              placeholder="Select records"
              value={field.value}
            />
          )}
        />
        <InputField
          autoComplete="organization"
          disabled={pending}
          label="Organization"
          optional
          placeholder="Enter an organization"
          {...register("organization")}
        />
        <InputField
          autoComplete="organization-title"
          disabled={pending}
          label="Role"
          optional
          placeholder="Enter a role"
          {...register("role")}
        />
      </div>

      <TextareaField
        className="min-h-28"
        disabled={pending}
        label="Researcher notes"
        optional
        placeholder="Add internal context for the research team"
        {...register("researcherNotes")}
      />

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button disabled={pending} onClick={onCancel} size="small" type="button" variant="text">Cancel</Button>
        <Button disabled={pending} size="small" type="submit">
          {pending
            ? (isCreate ? "Adding…" : "Saving…")
            : (isCreate ? "Add participant" : "Save changes")}
        </Button>
      </div>
    </form>
  );
}
