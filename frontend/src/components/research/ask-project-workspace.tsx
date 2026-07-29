import {
  AskRecordWorkspace,
  type AskRecordAnswerParagraph,
  type AskRecordConversationTurn,
  type AskRecordSourceAvailability,
  type AskRecordWorkspaceProps,
  type AskRecordWorkspaceState,
} from "./ask-record-workspace";

export type AskProjectAnswerParagraph = AskRecordAnswerParagraph;
export type AskProjectConversationTurn = AskRecordConversationTurn;
export type AskProjectSourceAvailability = AskRecordSourceAvailability;
export type AskProjectWorkspaceState = AskRecordWorkspaceState;

export interface AskProjectWorkspaceProps
  extends Omit<
    AskRecordWorkspaceProps,
    "onOpenRelatedSessions" | "scope"
  > {
  onOpenSessions?: () => void;
}

export function AskProjectWorkspace({
  onOpenSessions,
  ...props
}: AskProjectWorkspaceProps) {
  return (
    <AskRecordWorkspace
      {...props}
      onOpenRelatedSessions={onOpenSessions}
      scope="project"
    />
  );
}
