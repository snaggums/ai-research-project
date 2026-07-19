import * as React from "react";

import { SelectField, type SelectFieldProps } from "@/components/ui/select";
import { fixedRecordOptions } from "./record-options";

export interface RecordFieldProps extends Omit<SelectFieldProps, "label" | "options"> {
  label?: React.ReactNode;
}

export const RecordField = React.forwardRef<HTMLButtonElement, RecordFieldProps>(
  ({ label = "Record", optional = true, placeholder = "Select a record", required = false, ...props }, ref) => (
    <SelectField
      ref={ref}
      label={label}
      optional={optional}
      options={[{ label: "Select a record", value: "" }, ...fixedRecordOptions]}
      placeholder={placeholder}
      required={required}
      {...props}
    />
  ),
);
RecordField.displayName = "RecordField";
