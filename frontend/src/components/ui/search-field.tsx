import * as React from "react";
import { Search } from "lucide-react";

import { InputField, type InputFieldProps } from "@/components/ui/input";

export interface SearchFieldProps extends InputFieldProps {
  showSearchIcon?: boolean;
}

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ leftIcon, showSearchIcon = true, type = "search", ...props }, ref) => (
    <InputField
      ref={ref}
      type={type}
      leftIcon={showSearchIcon ? leftIcon ?? <Search className="h-5 w-5" /> : undefined}
      {...props}
    />
  ),
);
SearchField.displayName = "SearchField";

export { SearchField };
