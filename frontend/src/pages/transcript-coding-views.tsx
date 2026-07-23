import * as React from "react";
import { Filter, List, RefreshCw, Rows3 } from "lucide-react";

import {
  TranscriptCodePanel,
  TranscriptCodeSuggestion,
  TranscriptCodingSummary,
  TranscriptHighlightFilters,
  TranscriptHighlightListItem,
  TranscriptReader,
  type TranscriptCodeValue,
  type TranscriptHighlightValue,
  type TranscriptReaderBlockValue,
  type TranscriptTextSelectionValue,
} from "@/components/research";
import { Alert } from "@/components/ui/alert";
import { ActiveFilterBar, type ActiveFilterValue } from "@/components/ui/active-filter-bar";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { TextareaField } from "@/components/ui/textarea";

export interface TranscriptCodingSuggestionValue {
  codeName: string;
  confidence?: number;
  description: string;
  evidence: Array<{
    id: string;
    excerpt: string;
    location: string;
    speaker?: string;
  }>;
  id: string;
  provenance?: string;
}

export type TranscriptCodingWorkspaceState =
  | "accepted-highlights"
  | "active-filters"
  | "apply-code"
  | "error"
  | "filtered-list"
  | "manual-selection"
  | "no-suggestions"
  | "processing"
  | "review-suggestions";

export interface TranscriptCodingWorkspaceViewProps {
  acceptedHighlights: TranscriptHighlightValue[];
  availableCodes: TranscriptCodeValue[];
  blocks: TranscriptReaderBlockValue[];
  className?: string;
  onAcceptSuggestion?: (suggestionId: string) => void;
  onApplyCodes?: (value: {
    codeIds: string[];
    highlightId: string;
    selection?: TranscriptTextSelectionValue;
  }) => void;
  onCreateCode?: (code: TranscriptCodeValue) => Promise<TranscriptCodeValue | void> | TranscriptCodeValue | void;
  onCreateHighlight?: (highlight: TranscriptHighlightValue, selection: TranscriptTextSelectionValue) => void;
  onDeleteHighlight?: (highlightId: string) => void;
  onEditCode?: (codeId: string, value?: { name: string; description: string }) => void;
  onEditSuggestion?: (suggestionId: string, value?: { codeName: string; description: string }) => void;
  onOpenHighlight?: (highlightId: string) => void;
  onRegenerate?: () => void;
  onRejectSuggestion?: (suggestionId: string) => void;
  onRemoveAcceptedCode?: (codeId: string, highlightIds: string[]) => void;
  onRemoveCode?: (highlightId: string, codeId: string) => void;
  onRouteStateChange?: (state: Partial<TranscriptCodingRouteState>) => void;
  routeState?: TranscriptCodingRouteState;
  state?: TranscriptCodingWorkspaceState;
  suggestions: TranscriptCodingSuggestionValue[];
}

export interface TranscriptCodingRouteState {
  codeIds: string[];
  highlightStatus: "all" | "accepted-coded" | "uncoded";
  panel: "accepted" | "suggestions";
  view: "transcript" | "list";
}

interface WorkspaceEditorValue {
  description: string;
  id: string;
  kind: "code" | "suggestion";
  name: string;
}

type RailPanel = "accepted" | "suggestions" | "uncoded";

function filterHighlightsByCodes(
  highlights: TranscriptHighlightValue[],
  codeIds: string[],
) {
  return highlights.filter((highlight) => codeIds.length === 0
    || highlight.codes.some((code) => codeIds.includes(code.id)));
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "code";
}

function evidenceFromSelection(
  selection: TranscriptTextSelectionValue,
  id: string,
  blocks: TranscriptReaderBlockValue[],
) {
  const block = blocks.find((candidate) => candidate.id === selection.blockId);
  return {
    blockId: selection.blockId,
    startChar: block?.startChar !== undefined ? block.startChar + selection.startOffset : undefined,
    endChar: block?.startChar !== undefined ? block.startChar + selection.endOffset : undefined,
    endOffset: selection.endOffset,
    excerpt: selection.text,
    id,
    location: selection.location,
    speaker: selection.speaker,
    startOffset: selection.startOffset,
  };
}

function selectionMatchesHighlight(
  selection: TranscriptTextSelectionValue,
  highlight: TranscriptHighlightValue,
  blocks: TranscriptReaderBlockValue[],
) {
  const block = blocks.find((candidate) => candidate.id === selection.blockId);
  if (
    block?.startChar !== undefined
    && highlight.evidence.startChar !== undefined
    && highlight.evidence.endChar !== undefined
  ) {
    return highlight.evidence.startChar === block.startChar + selection.startOffset
      && highlight.evidence.endChar === block.startChar + selection.endOffset;
  }
  return highlight.evidence.excerpt === selection.text
    && (!highlight.evidence.blockId || highlight.evidence.blockId === selection.blockId);
}

function selectionFromBlock(block: TranscriptReaderBlockValue): TranscriptTextSelectionValue {
  return {
    blockId: block.id,
    endOffset: block.excerpt.length,
    location: block.location,
    method: "keyboard",
    speaker: block.speaker,
    startOffset: 0,
    text: block.excerpt,
  };
}

export function TranscriptCodingWorkspaceView({
  acceptedHighlights,
  availableCodes,
  blocks,
  className,
  onAcceptSuggestion,
  onApplyCodes,
  onCreateCode,
  onCreateHighlight,
  onDeleteHighlight,
  onEditCode,
  onEditSuggestion,
  onOpenHighlight,
  onRegenerate,
  onRejectSuggestion,
  onRemoveAcceptedCode,
  onRemoveCode,
  onRouteStateChange,
  routeState,
  state = "review-suggestions",
  suggestions,
}: TranscriptCodingWorkspaceViewProps) {
  const [workspaceHighlights, setWorkspaceHighlights] = React.useState<TranscriptHighlightValue[]>(() =>
    acceptedHighlights.map((highlight) => ({
      ...highlight,
      codes: [...highlight.codes],
      evidence: { ...highlight.evidence },
    })),
  );
  const [workspaceCodes, setWorkspaceCodes] = React.useState<TranscriptCodeValue[]>(() =>
    availableCodes.map((code) => ({ ...code })),
  );
  const [workspaceSuggestions, setWorkspaceSuggestions] = React.useState<TranscriptCodingSuggestionValue[]>(() =>
    suggestions.map((suggestion) => ({ ...suggestion, evidence: suggestion.evidence.map((evidence) => ({ ...evidence })) })),
  );
  const defaultRailPanel: RailPanel = workspaceSuggestions.length > 0 ? "suggestions" : "accepted";
  const routeRailPanel: RailPanel | undefined = routeState
    ? routeState.panel === "suggestions"
      ? "suggestions"
      : routeState.highlightStatus === "uncoded"
        ? "uncoded"
        : "accepted"
    : undefined;
  const initialRailPanel: RailPanel = routeRailPanel
    ?? (state === "accepted-highlights" || state === "active-filters" || state === "filtered-list"
      ? "accepted"
      : defaultRailPanel);
  const [activeSuggestionId, setActiveSuggestionId] = React.useState<string | undefined>(workspaceSuggestions[0]?.id);
  const [activeReaderBlockId, setActiveReaderBlockId] = React.useState<string>();
  const [focusReaderBlockId, setFocusReaderBlockId] = React.useState<string>();
  const [pendingSelection, setPendingSelection] = React.useState<TranscriptTextSelectionValue | undefined>(() => {
    if (state !== "apply-code") return undefined;
    const block = blocks.find((candidate) => candidate.state === "selection-active") ?? blocks[0];
    return block ? selectionFromBlock(block) : undefined;
  });
  const [editingHighlightId, setEditingHighlightId] = React.useState<string>();
  const [selectedCodeIds, setSelectedCodeIds] = React.useState<string[]>([]);
  const [editor, setEditor] = React.useState<WorkspaceEditorValue>();
  const [rejectedCount, setRejectedCount] = React.useState(0);
  const nextManualHighlightId = React.useRef(1);
  const [panel, setPanel] = React.useState<RailPanel | "apply" | "edit" | "filters">(
    state === "apply-code"
          ? "apply"
          : initialRailPanel,
  );
  const previousRailPanel = React.useRef<RailPanel>(initialRailPanel);
  const [listView, setListView] = React.useState(
    routeState ? routeState.view === "list" : state === "filtered-list",
  );
  const initialFilterCodeIds =
    routeState?.codeIds
    ?? (state === "active-filters" || state === "filtered-list" ? [workspaceCodes[0]?.id].filter(Boolean) : []);
  const [filterCodeIds, setFilterCodeIds] = React.useState<string[]>(initialFilterCodeIds);
  const [appliedFilterCodeIds, setAppliedFilterCodeIds] = React.useState<string[]>(initialFilterCodeIds);
  const [codePanelMode, setCodePanelMode] = React.useState<"apply" | "create">("apply");
  const filterCodes = React.useMemo(() => {
    const values = new Map(workspaceCodes.map((code) => [code.name.toLocaleLowerCase(), code]));
    for (const suggestion of workspaceSuggestions) {
      const key = suggestion.codeName.toLocaleLowerCase();
      if (!values.has(key)) {
        values.set(key, {
          description: suggestion.description,
          id: `code-${slugify(suggestion.codeName)}`,
          name: suggestion.codeName,
        });
      }
    }
    return [...values.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [workspaceCodes, workspaceSuggestions]);
  const acceptedHighlightsOnly = React.useMemo(
    () => workspaceHighlights.filter((highlight) => highlight.codes.length > 0),
    [workspaceHighlights],
  );
  const uncodedHighlights = React.useMemo(
    () => workspaceHighlights.filter((highlight) => highlight.codes.length === 0),
    [workspaceHighlights],
  );
  const filteredAcceptedHighlights = React.useMemo(
    () => filterHighlightsByCodes(acceptedHighlightsOnly, appliedFilterCodeIds),
    [acceptedHighlightsOnly, appliedFilterCodeIds],
  );
  const draftFilteredAcceptedHighlights = React.useMemo(
    () => filterHighlightsByCodes(acceptedHighlightsOnly, filterCodeIds),
    [acceptedHighlightsOnly, filterCodeIds],
  );
  const filterNames = React.useMemo(
    () => new Set(appliedFilterCodeIds.flatMap((codeId) => {
      const code = filterCodes.find((candidate) => candidate.id === codeId);
      return code ? [code.name.toLocaleLowerCase()] : [];
    })),
    [appliedFilterCodeIds, filterCodes],
  );
  const draftFilterNames = React.useMemo(
    () => new Set(filterCodeIds.flatMap((codeId) => {
      const code = filterCodes.find((candidate) => candidate.id === codeId);
      return code ? [code.name.toLocaleLowerCase()] : [];
    })),
    [filterCodeIds, filterCodes],
  );
  const filteredSuggestions = React.useMemo(
    () => workspaceSuggestions.filter((suggestion) => filterNames.size === 0
      || filterNames.has(suggestion.codeName.toLocaleLowerCase())),
    [filterNames, workspaceSuggestions],
  );
  const draftFilteredSuggestions = React.useMemo(
    () => workspaceSuggestions.filter((suggestion) => draftFilterNames.size === 0
      || draftFilterNames.has(suggestion.codeName.toLocaleLowerCase())),
    [draftFilterNames, workspaceSuggestions],
  );
  const selectedSuggestion = filteredSuggestions.find((suggestion) => suggestion.id === activeSuggestionId)
    ?? filteredSuggestions[0];
  const activeFilterCount = appliedFilterCodeIds.length;
  const hasActiveFilters = activeFilterCount > 0;
  const activeFilters = React.useMemo<ActiveFilterValue[]>(() => {
    const values: ActiveFilterValue[] = [];
    for (const codeId of appliedFilterCodeIds) {
      const code = filterCodes.find((candidate) => candidate.id === codeId);
      if (code) values.push({ id: `code:${code.id}`, label: code.name });
    }
    return values;
  }, [appliedFilterCodeIds, filterCodes]);
  const visibleRailPanel: RailPanel = panel === "accepted" || panel === "suggestions" || panel === "uncoded"
    ? panel
    : previousRailPanel.current;
  const filtersApplyToVisiblePanel = visibleRailPanel !== "uncoded";
  const hasApplicableFilters = hasActiveFilters && filtersApplyToVisiblePanel;
  const activeSuggestion = visibleRailPanel === "suggestions" ? selectedSuggestion : undefined;
  const activeEvidenceIds = new Set(activeSuggestion?.evidence.map((evidence) => evidence.id));
  const filteredAcceptedEvidence = new Set(filteredAcceptedHighlights.map((highlight) => highlight.evidence.excerpt));
  const uncodedEvidence = new Set(uncodedHighlights.map((highlight) => highlight.evidence.excerpt));
  const readerBlocks = blocks.map((block) => {
    const blockHighlights = workspaceHighlights.filter((highlight) =>
      highlight.evidence.blockId === block.id || highlight.evidence.excerpt === block.excerpt,
    );
    const blockCodes = [...new Map(
      blockHighlights.flatMap((highlight) => highlight.codes).map((code) => [code.id, code]),
    ).values()];
    const baseState = blockHighlights.some((highlight) => highlight.codes.length > 0)
      ? "accepted-coded" as const
      : blockHighlights.length > 0
        ? "uncoded" as const
        : block.state;
    if (visibleRailPanel === "uncoded") {
      const matches = blockHighlights.some((highlight) => uncodedHighlights.includes(highlight))
        || uncodedEvidence.has(block.excerpt);
      return { ...block, codes: blockCodes, highlighted: blockHighlights.length > 0, state: matches ? "filtered-match" as const : "dimmed" as const };
    }
    if (visibleRailPanel === "accepted" && hasApplicableFilters) {
      const matches = blockHighlights.some((highlight) => filteredAcceptedHighlights.includes(highlight))
        || filteredAcceptedEvidence.has(block.excerpt);
      return { ...block, codes: blockCodes, highlighted: blockHighlights.length > 0, state: matches ? "filtered-match" as const : "dimmed" as const };
    }
    if (visibleRailPanel === "suggestions" && hasApplicableFilters && !activeSuggestion) {
      return { ...block, codes: blockCodes, highlighted: blockHighlights.length > 0, state: "dimmed" as const };
    }
    if (!activeSuggestion) return { ...block, codes: blockCodes, highlighted: blockHighlights.length > 0, state: baseState };
    const evidenceMatch = activeEvidenceIds.has(block.id.replace("reader-", "evidence-")) ||
      activeSuggestion.evidence.some((evidence) => evidence.excerpt === block.excerpt);
    return { ...block, codes: blockCodes, highlighted: blockHighlights.length > 0, state: evidenceMatch ? "filtered-match" as const : "dimmed" as const };
  });
  const summaryState = state === "processing" ? "processing" : state === "no-suggestions" ? "empty" : state === "error" ? "error" : "awaiting-review";
  const showReader = state !== "processing" && state !== "no-suggestions" && state !== "error";
  const acceptedCodeGroups = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        code: TranscriptCodeValue;
        highlights: TranscriptHighlightValue[];
      }
    >();
    for (const highlight of hasApplicableFilters ? filteredAcceptedHighlights : acceptedHighlightsOnly) {
      for (const code of highlight.codes) {
        if (hasApplicableFilters && !appliedFilterCodeIds.includes(code.id)) continue;
        const group = groups.get(code.id) ?? { code, highlights: [] };
        group.highlights.push(highlight);
        groups.set(code.id, group);
      }
    }
    return [...groups.values()];
  }, [acceptedHighlightsOnly, appliedFilterCodeIds, filteredAcceptedHighlights, hasApplicableFilters]);
  const filterResultCount = visibleRailPanel === "suggestions"
    ? draftFilteredSuggestions.length
    : draftFilteredAcceptedHighlights.length;
  const filterTotalCount = visibleRailPanel === "suggestions"
    ? workspaceSuggestions.length
    : acceptedHighlightsOnly.length;
  const filterResultNoun = visibleRailPanel === "suggestions" ? "suggestions" as const : "highlights" as const;
  const activeFilterResultCount = visibleRailPanel === "suggestions"
    ? filteredSuggestions.length
    : filteredAcceptedHighlights.length;
  const activeFilterTotalCount = visibleRailPanel === "suggestions"
    ? workspaceSuggestions.length
    : acceptedHighlightsOnly.length;
  const activeFilterResultNoun = visibleRailPanel === "suggestions" ? "suggestions" : "highlights";
  const visibleListHighlights = visibleRailPanel === "uncoded"
    ? uncodedHighlights
    : filteredAcceptedHighlights;

  React.useEffect(() => {
    if (workspaceSuggestions.length === 0 && panel === "suggestions") {
      previousRailPanel.current = "accepted";
      setPanel("accepted");
    }
  }, [panel, workspaceSuggestions.length]);

  React.useEffect(() => {
    setWorkspaceHighlights(acceptedHighlights.map((highlight) => ({
      ...highlight,
      codes: [...highlight.codes],
      evidence: { ...highlight.evidence },
    })));
  }, [acceptedHighlights]);

  React.useEffect(() => {
    setWorkspaceCodes(availableCodes.map((code) => ({ ...code })));
  }, [availableCodes]);

  React.useEffect(() => {
    setWorkspaceSuggestions(suggestions.map((suggestion) => ({
      ...suggestion,
      evidence: suggestion.evidence.map((evidence) => ({ ...evidence })),
    })));
  }, [suggestions]);

  React.useEffect(() => {
    if (!routeState) return;
    const nextPanel: RailPanel = routeState.panel === "suggestions"
      ? "suggestions"
      : routeState.highlightStatus === "uncoded"
        ? "uncoded"
        : "accepted";
    previousRailPanel.current = nextPanel;
    setPanel(nextPanel);
    setListView(routeState.view === "list");
    setFilterCodeIds(routeState.codeIds);
    setAppliedFilterCodeIds(routeState.codeIds);
  }, [routeState]);

  function showRail(nextPanel: RailPanel) {
    previousRailPanel.current = nextPanel;
    setPanel(nextPanel);
    onRouteStateChange?.({
      panel: nextPanel === "suggestions" ? "suggestions" : "accepted",
      highlightStatus: nextPanel === "uncoded" ? "uncoded" : nextPanel === "accepted" ? "accepted-coded" : "all",
    });
  }

  function showTransientPanel(nextPanel: "apply" | "filters") {
    if (panel === "accepted" || panel === "suggestions" || panel === "uncoded") previousRailPanel.current = panel;
    if (nextPanel === "filters") {
      setFilterCodeIds(appliedFilterCodeIds);
    }
    setPanel(nextPanel);
  }

  function clearFilters() {
    setFilterCodeIds([]);
    setAppliedFilterCodeIds([]);
    onRouteStateChange?.({ codeIds: [] });
  }

  function removeActiveFilter(filterId: string) {
    if (filterId.startsWith("code:")) {
      const codeId = filterId.slice("code:".length);
      setFilterCodeIds((current) => current.filter((value) => value !== codeId));
      setAppliedFilterCodeIds((current) => current.filter((value) => value !== codeId));
      onRouteStateChange?.({
        codeIds: appliedFilterCodeIds.filter((value) => value !== codeId),
      });
    }
  }

  function createManualHighlight(
    selection: TranscriptTextSelectionValue,
    codes: TranscriptCodeValue[],
  ) {
    const sequence = nextManualHighlightId.current++;
    const highlight: TranscriptHighlightValue = {
      codes,
      evidence: evidenceFromSelection(selection, `manual-evidence-${sequence}`, blocks),
      id: `manual-highlight-${sequence}`,
      provenance: "Researcher highlighted",
      status: codes.length > 0 ? "accepted" : "uncoded",
    };
    setWorkspaceHighlights((current) => [...current, highlight]);
    setActiveReaderBlockId(selection.blockId);
    onCreateHighlight?.(highlight, selection);
    return highlight;
  }

  function handleHighlight(selection: TranscriptTextSelectionValue) {
    const existingHighlight = workspaceHighlights.find((highlight) =>
      selectionMatchesHighlight(selection, highlight, blocks),
    );
    if (existingHighlight) {
      setActiveReaderBlockId(selection.blockId);
      setPendingSelection(undefined);
      showRail(existingHighlight.codes.length > 0 ? "accepted" : "uncoded");
      return;
    }
    createManualHighlight(selection, []);
    setPendingSelection(undefined);
    showRail("uncoded");
  }

  function handleApplyCodeSelection(selection: TranscriptTextSelectionValue) {
    const existingHighlight = workspaceHighlights.find((highlight) =>
      selectionMatchesHighlight(selection, highlight, blocks),
    );
    setPendingSelection(existingHighlight ? undefined : selection);
    setEditingHighlightId(existingHighlight?.id);
    setSelectedCodeIds(existingHighlight?.codes.map((code) => code.id) ?? []);
    setCodePanelMode("apply");
    showTransientPanel("apply");
  }

  function handleApplyCodes(codeIds: string[]) {
    const codes = workspaceCodes.filter((code) => codeIds.includes(code.id));
    if (editingHighlightId) {
      setWorkspaceHighlights((current) => current.map((highlight) =>
        highlight.id === editingHighlightId
          ? { ...highlight, codes, status: codes.length > 0 ? "accepted" : "uncoded" }
          : highlight,
      ));
      onApplyCodes?.({ codeIds, highlightId: editingHighlightId });
    } else if (pendingSelection) {
      const highlight = createManualHighlight(pendingSelection, codes);
      onApplyCodes?.({ codeIds, highlightId: highlight.id, selection: pendingSelection });
    } else {
      return;
    }
    setPendingSelection(undefined);
    setEditingHighlightId(undefined);
    setSelectedCodeIds([]);
    showRail(codes.length > 0 ? "accepted" : "uncoded");
  }

  async function handleCreateCode(value: { name: string; description: string }) {
    const matchingCode = workspaceCodes.find((code) =>
      code.name.toLocaleLowerCase() === value.name.toLocaleLowerCase(),
    );
    if (matchingCode) return matchingCode.id;
    const baseId = `code-${slugify(value.name)}`;
    let id = baseId;
    let suffix = 2;
    while (workspaceCodes.some((code) => code.id === id)) id = `${baseId}-${suffix++}`;
    const provisionalCode = { description: value.description, id, name: value.name };
    const persistedCode = await onCreateCode?.(provisionalCode);
    const code = persistedCode ?? provisionalCode;
    setWorkspaceCodes((current) => current.some((candidate) => candidate.id === code.id)
      ? current
      : [...current.filter((candidate) => candidate.id !== provisionalCode.id), code]);
    return code.id;
  }

  function handleDeleteHighlight(highlightId: string) {
    setWorkspaceHighlights((current) => current.filter((highlight) => highlight.id !== highlightId));
    onDeleteHighlight?.(highlightId);
  }

  function handleRemoveCode(highlightId: string, codeId: string) {
    const directMatch = workspaceHighlights.some((highlight) => highlight.id === highlightId);
    const matchingIds = directMatch
      ? [highlightId]
      : workspaceHighlights
          .filter((highlight) =>
            highlight.evidence.blockId === highlightId
            || blocks.find((block) => block.id === highlightId)?.excerpt === highlight.evidence.excerpt,
          )
          .map((highlight) => highlight.id);
    setWorkspaceHighlights((current) => current.map((highlight) => {
      if (!matchingIds.includes(highlight.id)) return highlight;
      const codes = highlight.codes.filter((code) => code.id !== codeId);
      return { ...highlight, codes, status: codes.length > 0 ? "accepted" : "uncoded" };
    }));
    for (const id of matchingIds) onRemoveCode?.(id, codeId);
  }

  function handleRemoveAcceptedCode(codeId: string, highlightIds: string[]) {
    setWorkspaceHighlights((current) => current.map((highlight) => {
      if (!highlightIds.includes(highlight.id)) return highlight;
      const codes = highlight.codes.filter((code) => code.id !== codeId);
      return { ...highlight, codes, status: codes.length > 0 ? "accepted" : "uncoded" };
    }));
    onRemoveAcceptedCode?.(codeId, highlightIds);
  }

  function openHighlightInTranscript(highlight: TranscriptHighlightValue) {
    const blockId = highlight.evidence.blockId
      ?? blocks.find((block) => block.excerpt === highlight.evidence.excerpt)?.id;
    setListView(false);
    onRouteStateChange?.({ view: "transcript" });
    setActiveReaderBlockId(blockId);
    setFocusReaderBlockId(undefined);
    requestAnimationFrame(() => setFocusReaderBlockId(blockId));
    showRail(highlight.codes.length > 0 ? "accepted" : "uncoded");
    onOpenHighlight?.(highlight.id);
  }

  function editHighlightCodes(highlight: TranscriptHighlightValue) {
    setEditingHighlightId(highlight.id);
    setPendingSelection(undefined);
    setSelectedCodeIds(highlight.codes.map((code) => code.id));
    setCodePanelMode("apply");
    showTransientPanel("apply");
  }

  function handleAcceptSuggestion(suggestion: TranscriptCodingSuggestionValue) {
    let code = workspaceCodes.find((candidate) =>
      candidate.name.toLocaleLowerCase() === suggestion.codeName.toLocaleLowerCase(),
    );
    if (!code) {
      const baseId = `code-${slugify(suggestion.codeName)}`;
      let id = baseId;
      let suffix = 2;
      while (workspaceCodes.some((candidate) => candidate.id === id)) id = `${baseId}-${suffix++}`;
      code = { description: suggestion.description, id, name: suggestion.codeName };
      setWorkspaceCodes((current) => [...current, code as TranscriptCodeValue]);
    }
    const acceptedCode = code;
    setWorkspaceHighlights((current) => {
      const next = current.map((highlight) => ({ ...highlight, codes: [...highlight.codes] }));
      for (const evidence of suggestion.evidence) {
        const existing = next.find((highlight) =>
          highlight.evidence.id === evidence.id || highlight.evidence.excerpt === evidence.excerpt,
        );
        if (existing) {
          if (!existing.codes.some((candidate) => candidate.id === acceptedCode.id)) {
            existing.codes.push(acceptedCode);
          }
          existing.status = "accepted";
        } else {
          next.push({
            codes: [acceptedCode],
            evidence: { ...evidence },
            id: `highlight-${suggestion.id}-${evidence.id}`,
            provenance: "Researcher accepted AI suggestion",
            status: "accepted",
          });
        }
      }
      return next;
    });
    setWorkspaceSuggestions((current) => current.filter((candidate) => candidate.id !== suggestion.id));
    setActiveSuggestionId((currentId) => {
      if (currentId !== suggestion.id) return currentId;
      return workspaceSuggestions.find((candidate) => candidate.id !== suggestion.id)?.id;
    });
    onAcceptSuggestion?.(suggestion.id);
    showRail("accepted");
  }

  function handleRejectSuggestion(suggestionId: string) {
    setWorkspaceSuggestions((current) => current.filter((suggestion) => suggestion.id !== suggestionId));
    setActiveSuggestionId((currentId) => {
      if (currentId !== suggestionId) return currentId;
      return workspaceSuggestions.find((suggestion) => suggestion.id !== suggestionId)?.id;
    });
    setRejectedCount((current) => current + 1);
    onRejectSuggestion?.(suggestionId);
  }

  function openSuggestionEditor(suggestion: TranscriptCodingSuggestionValue) {
    if (panel === "accepted" || panel === "suggestions" || panel === "uncoded") previousRailPanel.current = panel;
    setEditor({
      description: suggestion.description,
      id: suggestion.id,
      kind: "suggestion",
      name: suggestion.codeName,
    });
    setPanel("edit");
  }

  function openCodeEditor(code: TranscriptCodeValue) {
    if (panel === "accepted" || panel === "suggestions" || panel === "uncoded") previousRailPanel.current = panel;
    setEditor({
      description: code.description ?? "",
      id: code.id,
      kind: "code",
      name: code.name,
    });
    setPanel("edit");
  }

  function saveEditor() {
    if (!editor?.name.trim()) return;
    const name = editor.name.trim();
    const description = editor.description.trim();
    if (editor.kind === "suggestion") {
      setWorkspaceSuggestions((current) => current.map((suggestion) =>
        suggestion.id === editor.id ? { ...suggestion, codeName: name, description } : suggestion,
      ));
      onEditSuggestion?.(editor.id, { codeName: name, description });
    } else {
      setWorkspaceCodes((current) => current.map((code) =>
        code.id === editor.id ? { ...code, name, description } : code,
      ));
      setWorkspaceHighlights((current) => current.map((highlight) => ({
        ...highlight,
        codes: highlight.codes.map((code) => code.id === editor.id ? { ...code, name, description } : code),
      })));
      onEditCode?.(editor.id, { name, description });
    }
    setEditor(undefined);
    setPanel(previousRailPanel.current);
  }

  return (
    <section className={className} aria-labelledby="transcript-coding-heading">
      <div className="mx-auto grid max-w-[70rem] gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold leading-8" id="transcript-coding-heading">Transcript coding</h2>
            <p className="mt-1 text-base leading-6 text-[var(--air-color-text-secondary)]">
              Accept, edit, or reject each suggestion before using codes as filters.
            </p>
          </div>
          <Button onClick={onRegenerate} size="small" variant="gray-subtle">
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Regenerate
          </Button>
        </header>

        <TranscriptCodingSummary
          acceptedCount={acceptedHighlightsOnly.length}
          onAction={summaryState === "error" || summaryState === "empty" ? onRegenerate : undefined}
          rejectedCount={rejectedCount}
          state={summaryState}
          suggestionCount={workspaceSuggestions.length}
        />

        {state === "error" ? (
          <Alert
            message="Your existing accepted highlights and codes were not changed. Try generating suggestions again."
            size="large"
            title="Code suggestions could not be generated"
            tone="error"
          />
        ) : null}

        {showReader ? (
          <>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3" aria-label="Transcript coding controls">
                <div className="flex flex-wrap gap-2" aria-label="Transcript coding views">
                  <Button
                    aria-pressed={!listView}
                    onClick={() => {
                      setListView(false);
                      onRouteStateChange?.({ view: "transcript" });
                    }}
                    size="small"
                    variant={!listView ? "brand-subtle" : "text"}
                  >
                    <Rows3 aria-hidden="true" className="h-4 w-4" />Transcript
                  </Button>
                  <Button
                    aria-pressed={listView}
                    onClick={() => {
                      setListView(true);
                      onRouteStateChange?.({ view: "list" });
                    }}
                    size="small"
                    variant={listView ? "brand-subtle" : "text"}
                  >
                    <List aria-hidden="true" className="h-4 w-4" />Highlight list
                  </Button>
                </div>
                <Tabs
                  aria-label="Highlight status"
                  items={[
                    {
                      label: <span>Accepted highlights <span aria-hidden="true">({hasActiveFilters ? filteredAcceptedHighlights.length : acceptedHighlightsOnly.length})</span></span>,
                      value: "accepted",
                    },
                    {
                      label: <span>Suggestions <span aria-hidden="true">({hasActiveFilters ? filteredSuggestions.length : workspaceSuggestions.length})</span></span>,
                      value: "suggestions",
                    },
                    {
                      label: <span>Uncoded highlights <span aria-hidden="true">({uncodedHighlights.length})</span></span>,
                      value: "uncoded",
                    },
                  ]}
                  onValueChange={(value) => showRail(value as RailPanel)}
                  styleVariant="pill"
                  value={visibleRailPanel}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2" aria-label="Highlight filter toolbar">
                {hasApplicableFilters ? (
                  <Button onClick={clearFilters} size="small" variant="text">Clear filters</Button>
                ) : null}
                <Button
                  aria-expanded={panel === "filters"}
                  disabled={visibleRailPanel === "uncoded"}
                  onClick={() => showTransientPanel("filters")}
                  size="small"
                  title={visibleRailPanel === "uncoded" ? "Code filters do not apply to uncoded Highlights." : undefined}
                  variant={panel === "filters" || hasApplicableFilters ? "brand-subtle" : "gray-subtle"}
                >
                  <Filter aria-hidden="true" className="h-4 w-4" />Filter highlights
                  {hasApplicableFilters ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--air-color-bg-surface)] px-1.5 text-xs" aria-label={`${activeFilterCount} active filter criteria`}>
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              </div>

              <ActiveFilterBar
                filters={filtersApplyToVisiblePanel ? activeFilters : []}
                onRemoveFilter={removeActiveFilter}
                resultSummary={`${activeFilterResultCount} of ${activeFilterTotalCount} ${activeFilterResultNoun} match the active filters.`}
              />
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,44rem)_minmax(0,24.5rem)]">
              <div className="min-w-0">
                {listView ? (
                  <section aria-labelledby="highlight-results-heading" className="grid gap-4">
                    <header>
                      <h3 className="text-xl font-semibold" id="highlight-results-heading">Matching highlights</h3>
                    </header>
                    {visibleListHighlights.map((highlight) => (
                      <TranscriptHighlightListItem
                        highlight={highlight}
                        key={highlight.id}
                        onDelete={() => handleDeleteHighlight(highlight.id)}
                        onEditCodes={() => editHighlightCodes(highlight)}
                        onOpenInTranscript={() => openHighlightInTranscript(highlight)}
                        onRemoveCode={(codeId) => handleRemoveCode(highlight.id, codeId)}
                      />
                    ))}
                    {visibleListHighlights.length === 0 ? (
                      <div className="rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6">
                        <h4 className="font-semibold">No highlights match these filters</h4>
                        <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">
                          Clear filters or choose different accepted Codes.
                        </p>
                      </div>
                    ) : null}
                  </section>
                ) : (
                  <TranscriptReader
                    activeHighlightId={activeReaderBlockId}
                    blocks={readerBlocks}
                    focusHighlightId={focusReaderBlockId}
                    mode={state === "manual-selection" || state === "apply-code" ? "manual-selection" : activeSuggestion ? "review-suggestions" : hasApplicableFilters || visibleRailPanel === "uncoded" ? "filter-results" : "default"}
                    onApplyCode={handleApplyCodeSelection}
                    onClearSelection={() => {
                      setActiveReaderBlockId(undefined);
                      setFocusReaderBlockId(undefined);
                    }}
                    onHighlight={handleHighlight}
                    onRemoveCode={handleRemoveCode}
                    onSelectBlock={(blockId) => {
                      setActiveReaderBlockId(blockId);
                      const matchingSuggestion = filteredSuggestions.find((suggestion) =>
                        suggestion.evidence.some((evidence) => evidence.excerpt === blocks.find((block) => block.id === blockId)?.excerpt),
                      );
                      if (matchingSuggestion) setActiveSuggestionId(matchingSuggestion.id);
                    }}
                    onSelectWithKeyboard={() => undefined}
                  />
                )}
              </div>

              <aside className="grid min-w-0 gap-4" aria-label="Transcript coding side panel">
                {panel === "apply" ? (
                  <TranscriptCodePanel
                    availableCodes={workspaceCodes}
                    mode={codePanelMode}
                    onApply={handleApplyCodes}
                    onCancel={() => {
                      setPendingSelection(undefined);
                      setEditingHighlightId(undefined);
                      setSelectedCodeIds([]);
                      setCodePanelMode("apply");
                      setPanel(previousRailPanel.current);
                    }}
                    onCreateCode={handleCreateCode}
                    onModeChange={setCodePanelMode}
                    onSelectedCodeIdsChange={setSelectedCodeIds}
                    selectedCodeIds={selectedCodeIds}
                  />
                ) : panel === "edit" && editor ? (
                  <form
                    className="grid gap-4 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-6 shadow-[var(--air-shadow-overlay)]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEditor();
                    }}
                  >
                    <header>
                      <h3 className="text-xl font-semibold leading-7">
                        {editor.kind === "code" ? "Edit code" : "Edit code suggestion"}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">
                        {editor.kind === "code"
                          ? "Changes update every Highlight using this Code."
                          : "Revise the proposed code before accepting it."}
                      </p>
                    </header>
                    <InputField
                      label="Code name"
                      onChange={(event) => setEditor((current) => current ? { ...current, name: event.target.value } : current)}
                      required
                      value={editor.name}
                    />
                    <TextareaField
                      label="Description"
                      onChange={(event) => setEditor((current) => current ? { ...current, description: event.target.value } : current)}
                      value={editor.description}
                    />
                    <footer className="flex justify-end gap-2">
                      <Button
                        onClick={() => {
                          setEditor(undefined);
                          setPanel(previousRailPanel.current);
                        }}
                        size="small"
                        type="button"
                        variant="gray-subtle"
                      >
                        Cancel
                      </Button>
                      <Button disabled={!editor.name.trim()} size="small" type="submit" variant="brand">Save changes</Button>
                    </footer>
                  </form>
                ) : panel === "filters" ? (
                  <TranscriptHighlightFilters
                    availableCodes={filterCodes}
                    codeIds={filterCodeIds}
                    onApply={({ codeIds }) => {
                      setAppliedFilterCodeIds(codeIds);
                      onRouteStateChange?.({ codeIds });
                      setPanel(previousRailPanel.current);
                    }}
                    onClear={clearFilters}
                    onCodeIdsChange={setFilterCodeIds}
                    resultCount={filterResultCount}
                    resultNoun={filterResultNoun}
                    totalCount={filterTotalCount}
                  />
                ) : panel === "accepted" ? (
                  <section aria-labelledby="accepted-highlights-heading" className="grid gap-4">
                    <header>
                      <h3 className="text-xl font-semibold" id="accepted-highlights-heading">Accepted highlights</h3>
                      <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Researcher-approved coded Highlights.</p>
                    </header>
                    {acceptedCodeGroups.map(({ code, highlights }) => (
                      <TranscriptCodeSuggestion
                        codeName={code.name}
                        description={code.description ?? "Accepted Code"}
                        evidence={highlights.map((highlight) => highlight.evidence)}
                        key={code.id}
                        onDeleteHighlight={(evidenceId) => {
                          const highlight = highlights.find((item) => item.evidence.id === evidenceId);
                          if (highlight) handleDeleteHighlight(highlight.id);
                        }}
                        onEditCode={() => openCodeEditor(code)}
                        onRemoveAcceptedCode={() =>
                          handleRemoveAcceptedCode(code.id, highlights.map((highlight) => highlight.id))
                        }
                        onRemoveCode={(evidenceId) => {
                          const highlight = highlights.find((item) => item.evidence.id === evidenceId);
                          if (highlight) handleRemoveCode(highlight.id, code.id);
                        }}
                        provenance={highlights[0]?.provenance}
                        status="accepted"
                      />
                    ))}
                    {acceptedCodeGroups.length === 0 ? (
                      <p className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-sm text-[var(--air-color-text-secondary)]">
                        {hasApplicableFilters
                          ? "No accepted Highlights match these Code filters."
                          : "No accepted Highlights yet."}
                      </p>
                    ) : null}
                  </section>
                ) : panel === "uncoded" ? (
                  <section aria-labelledby="uncoded-highlights-heading" className="grid gap-4">
                    <header>
                      <h3 className="text-xl font-semibold" id="uncoded-highlights-heading">Uncoded highlights</h3>
                      <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Highlights saved without a Code.</p>
                    </header>
                    {uncodedHighlights.map((highlight) => (
                      <TranscriptCodeSuggestion
                        codeName="Uncoded highlight"
                        description="Saved for coding later."
                        evidence={[highlight.evidence]}
                        key={highlight.id}
                        onDeleteHighlight={() => handleDeleteHighlight(highlight.id)}
                        provenance={highlight.provenance}
                        status="uncoded"
                      />
                    ))}
                    {uncodedHighlights.length === 0 ? (
                      <p className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-sm text-[var(--air-color-text-secondary)]">
                        No uncoded Highlights yet.
                      </p>
                    ) : null}
                  </section>
                ) : (
                  <section aria-labelledby="suggestions-heading" className="grid gap-4">
                    <header>
                      <h3 className="text-xl font-semibold" id="suggestions-heading">Suggestions awaiting review</h3>
                      <p className="mt-1 text-sm text-[var(--air-color-text-secondary)]">Select a suggestion to locate its supporting passages.</p>
                    </header>
                    {filteredSuggestions.map((suggestion) => (
                      <TranscriptCodeSuggestion
                        {...suggestion}
                        key={suggestion.id}
                        onAccept={() => handleAcceptSuggestion(suggestion)}
                        onEdit={() => openSuggestionEditor(suggestion)}
                        onReject={() => handleRejectSuggestion(suggestion.id)}
                        onSelect={() => setActiveSuggestionId(suggestion.id)}
                        selected={suggestion.id === selectedSuggestion?.id}
                      />
                    ))}
                    {filteredSuggestions.length === 0 ? (
                      <p className="rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] p-4 text-sm text-[var(--air-color-text-secondary)]">
                        {hasApplicableFilters
                          ? "No Suggestions match these Code filters."
                          : "No Suggestions are awaiting review."}
                      </p>
                    ) : null}
                  </section>
                )}
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
