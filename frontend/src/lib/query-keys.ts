import type { EntityId } from "@/domain/types";

export const queryKeys = {
  projects: () => ["projects"] as const,
  project: (projectId: EntityId) => ["projects", projectId] as const,
  participants: (projectId: EntityId, search = "") =>
    ["projects", projectId, "participants", { search }] as const,
  participant: (projectId: EntityId, participantId: EntityId) =>
    ["projects", projectId, "participants", participantId] as const,
  sessions: (projectId: EntityId, search = "") =>
    ["projects", projectId, "sessions", { search }] as const,
  session: (projectId: EntityId, sessionId: EntityId) =>
    ["projects", projectId, "sessions", sessionId] as const,
  sessionDocuments: (projectId: EntityId, sessionId: EntityId) =>
    ["projects", projectId, "sessions", sessionId, "documents"] as const,
  sessionDocument: (projectId: EntityId, sessionId: EntityId, documentId: EntityId) =>
    ["projects", projectId, "sessions", sessionId, "documents", documentId] as const,
  transcriptContext: (projectId: EntityId, sessionId: EntityId, documentId: EntityId, resultId: EntityId) =>
    ["projects", projectId, "sessions", sessionId, "documents", documentId, "context", resultId] as const,
  sessionThemes: (projectId: EntityId, sessionId: EntityId) =>
    ["projects", projectId, "sessions", sessionId, "themes"] as const,
  sessionReport: (projectId: EntityId, sessionId: EntityId) =>
    ["projects", projectId, "sessions", sessionId, "report"] as const,
  sessionConversations: (projectId: EntityId, sessionId: EntityId) =>
    ["projects", projectId, "sessions", sessionId, "conversations"] as const,
  aiSettings: () => ["settings", "ai"] as const,
};
