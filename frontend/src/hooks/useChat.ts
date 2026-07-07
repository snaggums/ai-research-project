import { useMutation } from "@tanstack/react-query";

import { askProjectQuestion } from "@/api/chat";

export function useProjectChat(projectId: string) {
  return useMutation({
    mutationFn: ({ question, limit = 6 }: { question: string; limit?: number }) =>
      askProjectQuestion(projectId, question, limit),
  });
}
