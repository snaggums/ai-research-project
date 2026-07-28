import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import {
  emptyParticipantFormValues,
  participantFormSchema,
  type ParticipantFormValues,
} from "@/components/research/participant-form-contract";
import { Alert } from "@/components/ui/alert";
import { AutocompleteField } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { MultiSelectField, type MultiSelectOption } from "@/components/ui/multi-select-field";
import type { SelectOption } from "@/components/ui/select";
import { TextareaField } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SessionParticipantFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  defaultSelectedParticipantId?: string;
  defaultValues?: ParticipantFormValues;
  eligibleParticipants: SelectOption[];
  existingParticipantHeadingLevel?: 2 | 3;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSelectedParticipantChange?: (participantId: string) => void;
  onSubmitExisting: (participantId: string) => void | Promise<void>;
  onSubmitNew: (values: ParticipantFormValues) => void | Promise<void>;
  recordOptions?: MultiSelectOption[];
  selectedParticipantId?: string;
  submitError?: React.ReactNode;
}

export function SessionParticipantForm({
  className,
  defaultSelectedParticipantId = "",
  defaultValues = emptyParticipantFormValues,
  eligibleParticipants,
  existingParticipantHeadingLevel = 2,
  isSubmitting = false,
  onCancel,
  onSelectedParticipantChange,
  onSubmitExisting,
  onSubmitNew,
  recordOptions = [],
  selectedParticipantId: controlledSelectedParticipantId,
  submitError,
  ...props
}: SessionParticipantFormProps) {
  const {
    control,
    formState: { errors, isSubmitting: isNewParticipantSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ParticipantFormValues>({
    defaultValues,
    resolver: zodResolver(participantFormSchema),
  });
  const [internalSelectedParticipantId, setInternalSelectedParticipantId] = React.useState(
    defaultSelectedParticipantId,
  );
  const [isExistingParticipantSubmitting, setIsExistingParticipantSubmitting] = React.useState(false);
  const selectedParticipantId = controlledSelectedParticipantId ?? internalSelectedParticipantId;
  const pending = isSubmitting || isNewParticipantSubmitting || isExistingParticipantSubmitting;
  const hasExistingParticipant = Boolean(selectedParticipantId);
  const hasEligibleParticipants = eligibleParticipants.length > 0;
  const newParticipantDisabled = pending || hasExistingParticipant;
  const ExistingParticipantHeading = existingParticipantHeadingLevel === 3 ? "h3" : "h2";
  const participantHint = hasExistingParticipant
    ? "New participant fields are unavailable while an existing participant is selected."
    : !hasEligibleParticipants
      ? "All Project participants are already assigned to this Session."
      : undefined;

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  React.useEffect(() => {
    if (controlledSelectedParticipantId === undefined) {
      setInternalSelectedParticipantId(defaultSelectedParticipantId);
    }
  }, [controlledSelectedParticipantId, defaultSelectedParticipantId]);

  function selectExistingParticipant(participantId: string) {
    if (controlledSelectedParticipantId === undefined) {
      setInternalSelectedParticipantId(participantId);
    }
    onSelectedParticipantChange?.(participantId);
  }

  async function submitExistingParticipant() {
    if (!selectedParticipantId) return;
    setIsExistingParticipantSubmitting(true);
    try {
      await onSubmitExisting(selectedParticipantId);
    } finally {
      setIsExistingParticipantSubmitting(false);
    }
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    if (selectedParticipantId) {
      event.preventDefault();
      void submitExistingParticipant();
      return;
    }

    void handleSubmit(onSubmitNew)(event);
  }

  return (
    <form
      className={cn(
        "grid w-full gap-5 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-5 md:p-6",
        className,
      )}
      noValidate
      onSubmit={submitForm}
      {...props}
    >
      {submitError ? (
        <Alert
          message={submitError}
          size="large"
          title="Participant could not be added"
          tone="error"
        />
      ) : null}

      <section aria-labelledby="existing-participant-heading" className="grid gap-4">
        <ExistingParticipantHeading id="existing-participant-heading" className="text-lg font-semibold">
          Add an existing participant
        </ExistingParticipantHeading>
        <AutocompleteField
          disabled={pending || !hasEligibleParticipants}
          hint={participantHint}
          label="Project participant"
          noResultsMessage="No matching Project participants."
          onValueChange={selectExistingParticipant}
          options={eligibleParticipants}
          placeholder="Search participants"
          value={selectedParticipantId}
        />
      </section>

      <div aria-label="Or add a new participant" className="flex items-center gap-2" role="separator">
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--air-color-border-default)]" />
        <span className="text-sm text-[var(--air-color-text-secondary)]">Or add a new participant</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--air-color-border-default)]" />
      </div>

      <fieldset className="grid gap-4 border-0 p-0" disabled={newParticipantDisabled}>
        <legend className="sr-only">New participant details</legend>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <InputField
            autoComplete="given-name"
            disabled={newParticipantDisabled}
            error={errors.firstName?.message}
            label="First name"
            placeholder="Enter a first name"
            required={!hasExistingParticipant}
            {...register("firstName")}
          />
          <InputField
            autoComplete="family-name"
            disabled={newParticipantDisabled}
            error={errors.lastName?.message}
            label="Last name"
            placeholder="Enter a last name"
            required={!hasExistingParticipant}
            {...register("lastName")}
          />
          <InputField
            autoComplete="email"
            disabled={newParticipantDisabled}
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
                disabled={newParticipantDisabled}
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
            disabled={newParticipantDisabled}
            label="Organization"
            optional
            placeholder="Enter an organization"
            {...register("organization")}
          />
          <InputField
            autoComplete="organization-title"
            disabled={newParticipantDisabled}
            label="Role"
            optional
            placeholder="Enter a role"
            {...register("role")}
          />
        </div>

        <TextareaField
          className="min-h-28"
          disabled={newParticipantDisabled}
          label="Researcher notes"
          optional
          placeholder="Add internal context for the research team"
          {...register("researcherNotes")}
        />
      </fieldset>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button disabled={pending} onClick={onCancel} size="small" type="button" variant="text">
          Cancel
        </Button>
        <Button disabled={pending} size="small" type="submit">
          {pending ? "Adding…" : "Add participant"}
        </Button>
      </div>
    </form>
  );
}
