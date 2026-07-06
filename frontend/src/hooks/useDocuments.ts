import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteDocument,
  getDocument,
  listProjectDocuments,
  retryDocumentProcessing,
  uploadProjectDocument,
} from "@/api/documents";

const documentsKey = (projectId: string) => ["documents", projectId];
const documentKey = (documentId: string | null) => ["document", documentId];

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: documentsKey(projectId),
    queryFn: () => listProjectDocuments(projectId),
    refetchInterval: (query) => {
      const documents = query.state.data;
      return documents?.some((document) => document.status === "uploaded" || document.status === "processing")
        ? 1500
        : false;
    },
  });
}

export function useDocument(documentId: string | null) {
  return useQuery({
    queryKey: documentKey(documentId),
    queryFn: () => getDocument(documentId as string),
    enabled: Boolean(documentId),
  });
}

export function useUploadDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadProjectDocument(projectId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(projectId) }),
  });
}

export function useRetryDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryDocumentProcessing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(projectId) }),
  });
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKey(projectId) }),
  });
}
