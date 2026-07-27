import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ProjectNavigation,
  type ProjectNavigationEntry,
} from "./project-navigation";

const items: ProjectNavigationEntry[] = [
  { href: "/overview", id: "overview", label: "Overview", type: "link" },
  {
    href: "/sessions",
    id: "sessions",
    items: [
      { href: "/sessions/session-1", id: "session-1", label: "Session 1" },
      { href: "/sessions/session-2", id: "session-2", label: "Session 2" },
    ],
    label: "Sessions",
    type: "group",
  },
  {
    href: "/records",
    id: "records",
    items: [{ href: "/records/record-1", id: "record-1", label: "Record 1" }],
    label: "Records",
    type: "group",
  },
  { href: "/ask", id: "ask-project", label: "Ask this project", type: "link" },
];

describe("ProjectNavigation accessibility", () => {
  it("has no automated semantic violations in an expanded detail state", async () => {
    const { container } = render(
      <ProjectNavigation
        activeChildId="session-1"
        activeId="sessions"
        items={items}
      />,
    );

    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(result.violations).toEqual([]);
  });
});
