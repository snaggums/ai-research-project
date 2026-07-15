import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "@/components/ui/avatar";
import { MediaCard, ProfileCard, SimpleCard } from "@/components/ui/card";

describe("Card families", () => {
  it("renders a semantic simple card with optional action content", () => {
    render(<SimpleCard action={<button>Open study</button>} description="Study description" title="Study title" />);
    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("Study title");
    expect(screen.getByRole("button", { name: "Open study" })).toBeInTheDocument();
  });

  it("renders accessible media and exposes disabled state", () => {
    render(<MediaCard description="Study description" disabled mediaLabel="Study thumbnail" title="Study title" />);
    expect(screen.getByRole("article")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("img", { name: "Study thumbnail" })).toBeInTheDocument();
  });

  it("composes profile identity and menu content", () => {
    render(
      <ProfileCard
        avatar={<Avatar alt="Alex Brown" initials="AB" size="large" />}
        menuAction={<button>Profile actions</button>}
        subtitle="Researcher"
        title="Alex Brown"
      />,
    );
    expect(screen.getByRole("img", { name: "Alex Brown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profile actions" })).toBeInTheDocument();
  });
});
