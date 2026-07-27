import * as React from "react";
import { ChevronLeft, ChevronRight, Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  TranscriptReaderBlockValue,
  TranscriptTextSelectionValue,
} from "./transcript-coding-types";
import { TranscriptReaderBlock } from "./transcript-reader-block";
import { TranscriptSelectionToolbar } from "./transcript-selection-toolbar";

export type TranscriptReaderMode = "default" | "filter-results" | "manual-selection" | "review-suggestions";

export interface TranscriptReaderProps {
  activeHighlightId?: string;
  blocks: TranscriptReaderBlockValue[];
  className?: string;
  currentMatch?: number;
  focusHighlightId?: string;
  mode?: TranscriptReaderMode;
  onClearSelection?: () => void;
  onHighlight?: (selection: TranscriptTextSelectionValue) => void;
  onNextMatch?: () => void;
  onPreviousMatch?: () => void;
  onRemoveCode?: (highlightId: string, codeId: string) => void;
  onSelectBlock?: (blockId: string) => void;
  onSelectWithKeyboard?: () => void;
  totalMatches?: number;
}

interface PointerToolbarAnchor {
  left: number;
  placement: "above" | "below";
  top: number;
}

function closestExcerpt(node: Node | null) {
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.closest<HTMLElement>("[data-transcript-excerpt='true']") ?? null;
}

function offsetInside(container: HTMLElement, node: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(container);
  range.setEnd(node, offset);
  return range.toString().length;
}

function selectEntireBlock(
  block: TranscriptReaderBlockValue,
  method: "block" | "keyboard",
): TranscriptTextSelectionValue {
  return {
    blockId: block.id,
    endOffset: block.excerpt.length,
    location: block.location,
    method,
    speaker: block.speaker,
    startOffset: 0,
    text: block.excerpt,
  };
}

export function TranscriptReader({
  activeHighlightId,
  blocks,
  className,
  currentMatch = 0,
  focusHighlightId,
  mode = "default",
  onClearSelection,
  onHighlight,
  onNextMatch,
  onPreviousMatch,
  onRemoveCode,
  onSelectBlock,
  onSelectWithKeyboard,
  totalMatches = 0,
}: TranscriptReaderProps) {
  const filtering = mode === "filter-results" && totalMatches > 0;
  const readerRef = React.useRef<HTMLElement>(null);
  const selectionTriggerRef = React.useRef<HTMLButtonElement>(null);
  const blockRefs = React.useRef<Array<HTMLElement | null>>([]);
  const [keyboardSelectionActive, setKeyboardSelectionActive] = React.useState(false);
  const [keyboardFocusIndex, setKeyboardFocusIndex] = React.useState(0);
  const [activeSelection, setActiveSelection] = React.useState<TranscriptTextSelectionValue>();
  const [pointerToolbarAnchor, setPointerToolbarAnchor] = React.useState<PointerToolbarAnchor>();
  const focusHighlightIndex = focusHighlightId
    ? blocks.findIndex((block) => block.id === focusHighlightId)
    : -1;

  const clearPointerSelection = React.useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setPointerToolbarAnchor(undefined);
    setActiveSelection((current) => current?.method === "pointer" ? undefined : current);
  }, []);

  const clearActiveSelection = React.useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setKeyboardSelectionActive(false);
    setActiveSelection(undefined);
    setPointerToolbarAnchor(undefined);
    onClearSelection?.();
  }, [onClearSelection]);

  React.useEffect(() => {
    if (keyboardSelectionActive) blockRefs.current[keyboardFocusIndex]?.focus();
  }, [keyboardFocusIndex, keyboardSelectionActive]);

  React.useEffect(() => {
    if (!focusHighlightId || focusHighlightIndex < 0) return;
    const block = blockRefs.current[focusHighlightIndex];
    if (!block) return;
    block.scrollIntoView?.({ behavior: "smooth", block: "center" });
    block.focus();
  }, [focusHighlightId, focusHighlightIndex]);

  React.useEffect(() => {
    if (activeSelection?.method !== "pointer") return;

    function handlePointerDown(event: PointerEvent) {
      if (!readerRef.current?.contains(event.target as Node)) clearPointerSelection();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") clearActiveSelection();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSelection?.method, clearActiveSelection, clearPointerSelection]);

  React.useEffect(() => {
    if (!activeSelection || activeSelection.method === "pointer") return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      clearActiveSelection();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeSelection, clearActiveSelection]);

  function startKeyboardSelection() {
    const activeIndex = blocks.findIndex((block) => block.id === activeHighlightId);
    const firstMatchIndex = blocks.findIndex((block) => block.state === "filtered-match");
    const initialIndex = activeIndex >= 0 ? activeIndex : firstMatchIndex >= 0 ? firstMatchIndex : 0;

    clearPointerSelection();
    setActiveSelection(undefined);
    setKeyboardFocusIndex(initialIndex);
    setKeyboardSelectionActive(true);
    onSelectWithKeyboard?.();
  }

  function cancelKeyboardSelection() {
    setKeyboardSelectionActive(false);
    setActiveSelection(undefined);
    onClearSelection?.();
    selectionTriggerRef.current?.focus();
  }

  function moveKeyboardFocus(nextIndex: number) {
    setKeyboardFocusIndex(Math.max(0, Math.min(blocks.length - 1, nextIndex)));
  }

  function handleKeyboardSelection(event: React.KeyboardEvent<HTMLElement>, blockId: string, index: number) {
    if (!keyboardSelectionActive) {
      if (event.key === "Escape" && activeSelection?.method === "block" && activeSelection.blockId === blockId) {
        event.preventDefault();
        clearActiveSelection();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveKeyboardFocus(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveKeyboardFocus(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveKeyboardFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveKeyboardFocus(blocks.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveSelection(selectEntireBlock(blocks[index], "keyboard"));
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelKeyboardSelection();
    }
  }

  function capturePointerSelection() {
    const browserSelection = window.getSelection();
    if (!browserSelection || browserSelection.isCollapsed || browserSelection.rangeCount === 0) {
      clearPointerSelection();
      return;
    }

    const range = browserSelection.getRangeAt(0);
    const startExcerpt = closestExcerpt(range.startContainer);
    const endExcerpt = closestExcerpt(range.endContainer);
    if (!startExcerpt || startExcerpt !== endExcerpt) {
      clearPointerSelection();
      return;
    }

    const blockId = startExcerpt.dataset.blockId;
    const block = blocks.find((candidate) => candidate.id === blockId);
    if (!block || !blockId) {
      clearPointerSelection();
      return;
    }

    const rawText = range.toString();
    const leadingWhitespace = rawText.length - rawText.trimStart().length;
    const trailingWhitespace = rawText.length - rawText.trimEnd().length;
    const text = rawText.trim();
    if (!text) {
      clearPointerSelection();
      return;
    }

    const startOffset = offsetInside(startExcerpt, range.startContainer, range.startOffset) + leadingWhitespace;
    const endOffset = offsetInside(startExcerpt, range.endContainer, range.endOffset) - trailingWhitespace;
    const readerRect = readerRef.current?.getBoundingClientRect();
    const excerptRect = startExcerpt.getBoundingClientRect();
    const rangeRect = typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : excerptRect;
    const anchorRect = rangeRect.width || rangeRect.height ? rangeRect : excerptRect;
    const relativeLeft = readerRect ? anchorRect.left - readerRect.left + anchorRect.width / 2 : 96;
    const availableWidth = readerRect?.width ?? 192;
    const placement = readerRect && anchorRect.top - readerRect.top < 64 ? "below" : "above";

    setKeyboardSelectionActive(false);
    setActiveSelection({
      blockId,
      endOffset,
      location: block.location,
      method: "pointer",
      speaker: block.speaker,
      startOffset,
      text,
    });
    setPointerToolbarAnchor({
      left: Math.max(96, Math.min(availableWidth - 96, relativeLeft)),
      placement,
      top: readerRect
        ? (placement === "above" ? anchorRect.top : anchorRect.bottom) - readerRect.top
        : 0,
    });
  }

  function completeSelection(action?: (selection: TranscriptTextSelectionValue) => void) {
    if (!activeSelection) return;
    action?.(activeSelection);
    setKeyboardSelectionActive(false);
    setActiveSelection(undefined);
    setPointerToolbarAnchor(undefined);
    window.getSelection()?.removeAllRanges();
  }

  function selectionAlreadyHighlighted(selection: TranscriptTextSelectionValue) {
    const block = blocks.find((candidate) => candidate.id === selection.blockId);
    if (!block || selection.startOffset !== 0 || selection.endOffset !== block.excerpt.length) return false;
    if (block.highlighted !== undefined) return block.highlighted;
    return Boolean(block.codes?.length)
      || block.state === "accepted-coded"
      || block.state === "uncoded";
  }

  return (
    <section
      aria-labelledby="transcript-reader-title"
      className={cn(
        "relative grid content-start gap-6 rounded-[var(--air-radius-lg)] border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-surface)] p-8",
        className,
      )}
      onMouseUp={(event) => {
        if ((event.target as HTMLElement).closest("[data-selection-toolbar='true']")) return;
        capturePointerSelection();
      }}
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("[data-selection-toolbar='true']")) return;
        if (target.closest("[data-transcript-excerpt='true']")) {
          window.getSelection()?.removeAllRanges();
          setPointerToolbarAnchor(undefined);
          setActiveSelection((current) => current?.method === "pointer" ? undefined : current);
        } else {
          clearPointerSelection();
          if (!target.closest("[data-transcript-block='true']")) {
            setActiveSelection((current) => current?.method === "block" ? undefined : current);
          }
        }
      }}
      ref={readerRef}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="transcript-reader-title" className="text-xl font-semibold leading-7">Transcript</h3>
          <p className="mt-1 text-sm leading-5 text-[var(--air-color-text-secondary)]">
            Select text or click a passage to save a Highlight. Apply a Record code from Uncoded highlights.
          </p>
        </div>
        {onSelectWithKeyboard ? (
          <Button
            aria-pressed={keyboardSelectionActive}
            onClick={keyboardSelectionActive ? cancelKeyboardSelection : startKeyboardSelection}
            ref={selectionTriggerRef}
            size="small"
            variant="gray-subtle"
          >
            <Keyboard aria-hidden="true" className="h-4 w-4" />
            {keyboardSelectionActive ? "Cancel keyboard selection" : "Select with keyboard"}
          </Button>
        ) : null}
      </header>

      {keyboardSelectionActive ? (
        <p
          aria-live="polite"
          className="rounded-[var(--air-radius-md)] bg-[var(--air-color-status-information-bg)] px-3 py-2 text-sm text-[var(--air-color-status-information-text)]"
        >
          {activeSelection?.method === "keyboard"
            ? "Passage selected. Use Highlight, or press Escape to cancel."
            : "Keyboard selection active. Use Up and Down arrows to move, then press Enter or Space to select a passage. Press Escape to cancel."}
        </p>
      ) : null}

      {filtering ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--air-radius-md)] bg-[var(--air-color-bg-subtle)] px-3 py-2">
          <p className="text-sm font-medium" aria-live="polite">
            Match {currentMatch} of {totalMatches}
          </p>
          <div className="flex gap-2">
            <Button disabled={currentMatch <= 1} onClick={onPreviousMatch} size="small" variant="gray-subtle">
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Previous
            </Button>
            <Button disabled={currentMatch >= totalMatches} onClick={onNextMatch} size="small" variant="gray-subtle">
              Next
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2" aria-label="Transcript passages">
        {blocks.map((block, index) => {
          const inlineSelected = (activeSelection?.method === "keyboard" || activeSelection?.method === "block")
            && activeSelection.blockId === block.id;
          return (
            <div className="grid gap-2" key={block.id}>
              <TranscriptReaderBlock
                block={inlineSelected ? { ...block, state: "selection-active" } : block}
                onKeyDown={(event) => handleKeyboardSelection(event, block.id, index)}
                onRemoveCode={onRemoveCode ? (codeId) => onRemoveCode(block.id, codeId) : undefined}
                onSelect={keyboardSelectionActive || onHighlight ? () => {
                  setKeyboardFocusIndex(index);
                  setKeyboardSelectionActive(false);
                  setActiveSelection(selectEntireBlock(blocks[index], keyboardSelectionActive ? "keyboard" : "block"));
                  onSelectBlock?.(block.id);
                } : onSelectBlock}
                ref={(node) => {
                  blockRefs.current[index] = node;
                }}
                selected={inlineSelected || activeHighlightId === block.id}
              />
              {inlineSelected && onHighlight ? (
                <TranscriptSelectionToolbar
                  className="ml-6"
                  highlighted={selectionAlreadyHighlighted(activeSelection)}
                  onHighlight={() => completeSelection(onHighlight)}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {activeSelection?.method === "pointer" && pointerToolbarAnchor && onHighlight ? (
        <TranscriptSelectionToolbar
          className="absolute z-20"
          highlighted={selectionAlreadyHighlighted(activeSelection)}
          onHighlight={() => completeSelection(onHighlight)}
          style={{
            left: pointerToolbarAnchor.left,
            top: pointerToolbarAnchor.top,
            transform: pointerToolbarAnchor.placement === "above"
              ? "translate(-50%, calc(-100% - 8px))"
              : "translate(-50%, 8px)",
          }}
        />
      ) : null}
    </section>
  );
}
