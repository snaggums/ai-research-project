import { FolderKanban, Library } from "lucide-react";

import type { NavigationItem } from "@/components/application/application-shell";
import type {
  ProjectNavigationEntry,
  ProjectNavigationLink,
} from "@/components/application/project-navigation";

export const globalNavigationItems: NavigationItem[] = [
  { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
  {
    id: "records",
    label: "Records",
    href: "/records",
    icon: Library,
    children: [
      { id: "record-1", label: "Medicare Fraud Documenter", href: "/records/record-1" },
      { id: "record-2", label: "Medicaid Fraud Documenter", href: "/records/record-2" },
      { id: "record-3", label: "Medicare Fraud Finder", href: "/records/record-3" },
    ],
  },
];

export function projectNavigationItems(
  projectId: string,
  sessions: ProjectNavigationLink[] = [],
  records?: ProjectNavigationLink[],
): ProjectNavigationEntry[] {
  const root = `/projects/${projectId}`;
  const recordRoot = `${root}/records`;
  const resolvedRecords = records ?? [
    { id: "record-1", label: "Medicare Fraud Documenter", href: `${recordRoot}/record-1` },
    { id: "record-2", label: "Medicaid Fraud Documenter", href: `${recordRoot}/record-2` },
    { id: "record-3", label: "Medicare Fraud Finder", href: `${recordRoot}/record-3` },
  ];
  return [
    { id: "overview", label: "Overview", href: `${root}/overview`, type: "link" },
    { id: "participants", label: "Participants", href: `${root}/participants`, type: "link" },
    {
      id: "sessions",
      label: "Sessions",
      href: `${root}/sessions`,
      items: sessions,
      type: "group",
    },
    {
      id: "records",
      label: "Records",
      href: recordRoot,
      items: resolvedRecords,
      type: "group",
    },
    { id: "ask-project", label: "Ask this project", href: `${root}/ask`, type: "link" },
  ];
}
