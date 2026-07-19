import { FolderKanban, Library, MessageSquareText, Users } from "lucide-react";

import type { NavigationItem, ProjectNavigationItem } from "@/components/application/application-shell";

export const globalNavigationItems: NavigationItem[] = [
  { id: "projects", label: "Projects", href: "/projects", icon: FolderKanban },
  {
    id: "records",
    label: "Records",
    href: "/records",
    icon: Library,
    children: [
      { id: "record-1", label: "Record 1", href: "/records/record-1" },
      { id: "record-2", label: "Record 2", href: "/records/record-2" },
      { id: "record-3", label: "Record 3", href: "/records/record-3" },
    ],
  },
];

export function projectNavigationItems(projectId: string): NavigationItem<ProjectNavigationItem>[] {
  const root = `/projects/${projectId}`;
  return [
    { id: "overview", label: "Overview", href: `${root}/overview`, icon: FolderKanban },
    { id: "participants", label: "Participants", href: `${root}/participants`, icon: Users },
    { id: "sessions", label: "Sessions", href: `${root}/sessions`, icon: MessageSquareText },
    { id: "ask-project", label: "Ask this project", href: `${root}/ask`, icon: MessageSquareText },
  ];
}
