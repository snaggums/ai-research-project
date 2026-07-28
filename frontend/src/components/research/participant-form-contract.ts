import { z } from "zod";

export const participantFormSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  email: z.string().trim().refine(
    (value) => !value || z.string().email().safeParse(value).success,
    "Enter a valid email address.",
  ),
  recordIds: z.array(z.string()),
  organization: z.string().trim(),
  role: z.string().trim(),
  researcherNotes: z.string().trim(),
});

export type ParticipantFormValues = z.infer<typeof participantFormSchema>;

export const emptyParticipantFormValues: ParticipantFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  recordIds: [],
  organization: "",
  role: "",
  researcherNotes: "",
};
