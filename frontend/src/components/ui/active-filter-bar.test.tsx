import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActiveFilterBar } from "@/components/ui/active-filter-bar";

describe("ActiveFilterBar", () => {
  it("renders removable filters and reports which filter was removed", async () => {
    const user = userEvent.setup();
    const onRemoveFilter = vi.fn();
    render(
      <ActiveFilterBar
        filters={[
          { id: "status", label: "Accepted coded highlights" },
          { id: "navigation", label: "Navigation terminology" },
        ]}
        onRemoveFilter={onRemoveFilter}
        resultSummary="2 of 3 highlights match the active filters."
      />,
    );

    expect(screen.getByRole("region", { name: "Active filters" })).toBeInTheDocument();
    expect(screen.getByText("2 of 3 highlights match the active filters.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accepted coded highlights" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Navigation terminology filter" }));
    expect(onRemoveFilter).toHaveBeenCalledWith("navigation");
  });

  it("does not render when there are no active filters", () => {
    render(<ActiveFilterBar filters={[]} />);
    expect(screen.queryByRole("region", { name: "Active filters" })).not.toBeInTheDocument();
  });
});
