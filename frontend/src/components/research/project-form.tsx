import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a project name."),
  description: z.string().trim().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export interface ProjectFormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  defaultValues?: ProjectFormValues;
  isSubmitting?: boolean;
  mode: "create" | "edit";
  onCancel?: () => void;
  onSubmit: (values: ProjectFormValues) => void | Promise<void>;
  showHeader?: boolean;
  submitError?: React.ReactNode;
}

export function ProjectForm({
  className,
  defaultValues = { name: "", description: "" },
  isSubmitting = false,
  mode,
  onCancel,
  onSubmit,
  showHeader = true,
  submitError,
  ...props
}: ProjectFormProps) {
  const {
    formState: { errors, isSubmitting: isFormSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProjectFormValues>({
    defaultValues,
    resolver: zodResolver(projectFormSchema),
  });
  const pending = isSubmitting || isFormSubmitting;
  const isCreate = mode === "create";

  React.useEffect(() => {
    reset({ name: defaultValues.name, description: defaultValues.description ?? "" });
  }, [defaultValues.description, defaultValues.name, reset]);

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
          <h2 className="text-xl font-semibold">{isCreate ? "Create project" : "Edit project"}</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--air-color-text-secondary)]">
            {isCreate
              ? "Add the basic details now. Participants and sessions can be added after the project is created."
              : "Update the project details. Participants, sessions, and research artifacts are managed separately."}
          </p>
        </div>
      ) : null}

      {submitError ? (
        <Alert
          message={submitError}
          size="large"
          title={isCreate ? "Project could not be created" : "Project could not be saved"}
          tone="error"
        />
      ) : null}

      <InputField
        autoComplete="off"
        disabled={pending}
        error={errors.name?.message}
        label="Project name"
        placeholder="Enter a project name"
        required
        {...register("name")}
      />
      <TextareaField
        className="min-h-28"
        disabled={pending}
        label="Description"
        optional
        placeholder="Describe the research goals and scope"
        {...register("description")}
      />

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button disabled={pending} onClick={onCancel} size="small" type="button" variant="text">
          Cancel
        </Button>
        <Button disabled={pending} size="small" type="submit">
          {pending ? (isCreate ? "Creating…" : "Saving…") : (isCreate ? "Create project" : "Save changes")}
        </Button>
      </div>
    </form>
  );
}
