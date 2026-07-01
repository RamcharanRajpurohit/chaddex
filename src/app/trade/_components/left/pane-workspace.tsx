"use client";

import { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { TrendingRail } from "./trending-rail";

// fomo's left-column "Split" workspace (verified live via CDP): the token-list
// pane splits into up to 4 panes arranged as independent COLUMNS. "Split right"
// adds a new side-by-side column; "Split bottom" stacks a pane BELOW the current
// pane WITHIN its own column (same width — it does not span the whole rail); ✕
// closes a pane. Built on react-resizable-panels v4 (nested Groups): an OUTER
// horizontal Group of columns, each column an INNER vertical Group of stacked
// panes. Drag the dividers to resize. Capped at a 2×2 shape (≤2 cols, ≤2/col).
const MAX_COLS = 2;
const MAX_ROWS = 2; // panes stacked per column
let nextPaneId = 1;
let nextColId = 1;

// A column carries a STABLE id (never derived from its panes) so React/react-
// resizable-panels keep the column's identity — and its panes' local state
// (active filter, scroll) and drag-resize — when a pane is added or removed.
type Column = { id: number; panes: number[] };

export function PaneWorkspace({
  selected,
  onSelect,
  onColumnsChange,
  onCollapse,
}: {
  selected: string;
  onSelect: (mint: string) => void;
  /** Reports the number of SIDE-BY-SIDE columns so the terminal can size the left
      rail to (columns × single-pane width): each Split-right column keeps the full
      single-pane width instead of halving the existing one. Stacking panes in a
      column (Split bottom) doesn't change the column count, so it doesn't widen. */
  onColumnsChange?: (columns: number) => void;
  /** Collapse the whole left rail (fomo's «). Only forwarded to the pane when the
      workspace is a single unsplit feed — so the « control shows/works only then. */
  onCollapse?: () => void;
}) {
  // Each pane is just an id; they all drive the SAME selected token (clicking any
  // pane selects globally), matching fomo where panes are parallel views.
  const [cols, setCols] = useState<Column[]>(() => [{ id: 0, panes: [0] }]);

  const total = cols.reduce((n, c) => n + c.panes.length, 0);

  useEffect(() => {
    onColumnsChange?.(cols.length);
  }, [cols.length, onColumnsChange]);

  // Split right: add a NEW single-pane column beside the others (grows the rail
  // horizontally). Capped at 2 columns.
  const splitRight = () =>
    setCols((c) =>
      c.length >= MAX_COLS || total >= MAX_COLS * MAX_ROWS
        ? c
        : [...c, { id: nextColId++, panes: [nextPaneId++] }],
    );

  // Split bottom: add a pane BELOW within a SPECIFIC column (stacks vertically,
  // same width). Any column under the per-column cap can stack — so the 2×2 shape
  // is reachable regardless of split order.
  const splitBottom = (colId: number) =>
    setCols((c) =>
      c.map((col) =>
        col.id === colId && col.panes.length < MAX_ROWS
          ? { ...col, panes: [...col.panes, nextPaneId++] }
          : col,
      ),
    );

  // Close a pane by id; drop any column left empty. The last remaining pane can't
  // be closed (there's always at least one feed).
  const closePane = (paneId: number) =>
    setCols((c) => {
      if (c.reduce((n, col) => n + col.panes.length, 0) <= 1) return c;
      return c
        .map((col) => ({ ...col, panes: col.panes.filter((p) => p !== paneId) }))
        .filter((col) => col.panes.length > 0);
    });

  // A pane's footer offers "Split right" only while there's room for another
  // column; "Split bottom" only while its column is under the per-column cap.
  // `collapse` is passed only for the lone unsplit pane (drives the « control).
  const rail = (paneId: number, col: Column, collapse?: () => void) => (
    <TrendingRail
      selected={selected}
      onSelect={onSelect}
      canSplitRight={cols.length < MAX_COLS}
      canSplitBottom={col.panes.length < MAX_ROWS}
      onSplitRight={splitRight}
      onSplitBottom={() => splitBottom(col.id)}
      onClose={total > 1 ? () => closePane(paneId) : undefined}
      onCollapse={collapse}
    />
  );

  // One column → a vertical Group of its stacked panes.
  const renderColumn = (col: Column) => (
    <Group orientation="vertical" className="size-full">
      {col.panes.flatMap((paneId, i) => {
        const panel = (
          <Panel key={`p${paneId}`} className="term-scroll min-h-0" minSize="25%">
            {rail(paneId, col)}
          </Panel>
        );
        return i < col.panes.length - 1
          ? [
              panel,
              <Separator
                key={`s${paneId}`}
                className="h-px cursor-row-resize bg-border transition-colors hover:bg-border-strong data-[separator=active]:bg-green"
              />,
            ]
          : [panel];
      })}
    </Group>
  );

  // Single pane → render the rail directly (no resize chrome needed). Only here
  // does the « collapse control appear (a lone, unsplit feed).
  if (total === 1) {
    return rail(cols[0].panes[0], cols[0], onCollapse);
  }

  // Single column → skip the outer horizontal Group (no vertical dividers needed).
  if (cols.length === 1) {
    return renderColumn(cols[0]);
  }

  // Outer horizontal Group = columns; inner vertical Group = stacked panes.
  return (
    <Group orientation="horizontal" className="size-full">
      {cols.flatMap((col, i) => {
        const colPanel = (
          <Panel key={`c${col.id}`} className="term-scroll min-w-0" minSize="30%">
            {renderColumn(col)}
          </Panel>
        );
        return i < cols.length - 1
          ? [
              colPanel,
              <Separator
                key={`cs${col.id}`}
                className="w-px cursor-col-resize bg-border transition-colors hover:bg-border-strong data-[separator=active]:bg-green"
              />,
            ]
          : [colPanel];
      })}
    </Group>
  );
}
