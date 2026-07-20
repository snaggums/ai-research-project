import * as React from "react";

import { InputField, type InputFieldProps } from "@/components/ui/input";

export type DateFieldProps = InputFieldProps;

const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ type = "date", ...props }, ref) => <InputField ref={ref} type={type} {...props} />,
);
DateField.displayName = "DateField";

export { DateField };
