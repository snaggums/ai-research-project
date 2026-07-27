import * as React from "react";

import { Alert } from "@/components/ui/alert";

export const SESSION_RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION = "This Session can contribute after a Record is assigned and its latest Session Report is Researcher Reviewed or Approved with at least one evidence-linked Requirement, Decision, or Action Item.";

export interface RecordSynthesisRequirementsNoteProps
  extends Omit<React.ComponentProps<typeof Alert>, "message" | "size" | "title" | "tone"> {
  message?: React.ReactNode;
}

export function RecordSynthesisRequirementsNote({
  message = SESSION_RECORD_SYNTHESIS_REQUIREMENTS_DESCRIPTION,
  presentation = "full-bleed",
  ...props
}: RecordSynthesisRequirementsNoteProps) {
  return (
    <Alert
      message={message}
      presentation={presentation}
      size="large"
      title="Record synthesis requirements"
      tone="info"
      {...props}
    />
  );
}
