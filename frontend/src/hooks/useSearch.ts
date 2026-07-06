import { useMutation } from "@tanstack/react-query";

import { searchProject } from "@/api/search";

export function useProjectSearch(projectId: string) {
  return useMutation({
    mutationFn: ({ query, limit = 8 }: { query: string; limit?: number }) => searchProject(projectId, query, limit),
  });
}
