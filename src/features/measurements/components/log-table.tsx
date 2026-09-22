import { useState } from "react";
import { PF_THRESHOLD } from "../utils/constants";
import { COLUMNS, PHASE_COLOR, PHASE_BG, PHASE_LABEL, type Phase } from "../utils/columns";
import type { MeasurementSummary, Reading, Stats } from "../api/measurements.types";

const COL_COUNT = 2 + COLUMNS.length;
const PAGE_SIZE = 100;

// Fixed heights keep the sticky offsets exact — a sticky row can't measure
// what's above it without becoming a client component.
// ponytail: if you change row padding or the type scale, update these three
// numbers. Upgrade path is useLayoutEffect measurement if it ever drifts.
const H_CHIP = 24; // phase-chip header row
const H_LABEL = 36; // column-label header row
const H_STAT = 36; // each summary row
const HEAD_H = H_CHIP + H_LABEL;
const STAT_TOP = [HEAD_H, HEAD_H + H_STAT, HEAD_H + 2 * H_STAT]; // 60 / 96 / 132

const HEADER_RULE = { boxShadow: "inset 0 -1px 0 var(--border)" };
const DIVIDER_RULE = { boxShadow: "inset 0 -1px 0 var(--border-soft)" };

// Consecutive columns that share a phase, e.g. the 3 voltage + 3 current
// columns — each becomes one chip spanning its group in the header's phase row.
function phaseGroups(): { phase: Phase; span: number }[] {
  const groups: { phase: Phase; span: number }[] = [];
  for (const c of COLUMNS) {
    if (!c.phase) continue;
    const last = groups[groups.length - 1];
    if (last && last.phase === c.phase) last.span++;
    else groups.push({ phase: c.phase, span: 1 });
  }
  return groups;
}

export interface LogTableProps {
  rows: Reading[];
  stats?: MeasurementSummary;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function LogTable({ rows, stats, loading, error, onRetry }: LogTableProps) {
  const groups = phaseGroups();
  const nonPhaseCount = COLUMNS.filter((c) => !c.phase).length;

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const clampedPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (clampedPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedRows = rows.slice(startIndex, endIndex);

  return (
    <>
      <div className="rounded-lg border border-border bg-surface">
        <div className="max-h-135 overflow-auto rounded-lg border border-border">
        <table className="min-w-full border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr>
              <th className="sticky top-0 z-30 bg-surface-2" style={{ height: H_CHIP }} colSpan={2}></th>
              {groups.map((g, i) => (
                <th key={i} className="sticky top-0 z-30 bg-surface-2 px-3.5 pt-1.5" style={{ height: H_CHIP }} colSpan={g.span}>
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide uppercase"
                    style={{ background: PHASE_BG[g.phase], color: PHASE_COLOR[g.phase] }}
                  >
                    {PHASE_LABEL[g.phase]}
                  </span>
                </th>
              ))}
              <th className="sticky top-0 z-30 bg-surface-2" style={{ height: H_CHIP }} colSpan={nonPhaseCount}></th>
            </tr>
            <tr>
              <th
                className="sticky z-30 whitespace-nowrap bg-surface-2 px-3.5 py-2.5 text-left font-mono text-[11.5px] font-semibold"
                style={{ top: H_CHIP, height: H_LABEL, ...HEADER_RULE }}
              >
                Date
              </th>
              <th
                className="sticky z-30 whitespace-nowrap bg-surface-2 px-3.5 py-2.5 text-left font-mono text-[11.5px] font-semibold"
                style={{ top: H_CHIP, height: H_LABEL, ...HEADER_RULE }}
              >
                Time
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="sticky z-30 whitespace-nowrap bg-surface-2 px-3.5 py-2.5 text-right font-mono text-[11.5px] font-semibold"
                  style={{ top: H_CHIP, height: H_LABEL, color: c.phase ? PHASE_COLOR[c.phase] : undefined, ...HEADER_RULE }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <StatRow label="Average Value" s={stats?.avg} top={STAT_TOP[0]} />
            <StatRow label="Maximum Value" s={stats?.max} top={STAT_TOP[1]} />
            <StatRow label="Minimum Value" s={stats?.min} top={STAT_TOP[2]} last />

            {error ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3.5 py-6 text-center text-[12.5px]" style={DIVIDER_RULE}>
                  <span style={{ color: "var(--alert)" }}>{error.message}</span>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="ml-3 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium hover:bg-border-soft"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="px-3.5 py-6 text-center text-text-dim" style={DIVIDER_RULE}>
                  No readings in this period.
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => <DataRow key={r.ts.toISOString()} r={r} />)
            )}
          </tbody>
        </table>
      </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3.5 py-2.5 text-[12px]">
          <span className="text-text-dim">
            Showing {startIndex + 1}-{Math.min(endIndex, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[11.5px] font-medium hover:bg-border-soft disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[11.5px] font-medium hover:bg-border-soft disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StatRow({ label, s, top, last }: { label: string; s: Stats | undefined; top: number; last?: boolean }) {
  const cellStyle = { top, height: H_STAT, ...(last ? HEADER_RULE : {}) };
  return (
    <tr className="font-semibold">
      <td
        className="sticky z-20 whitespace-nowrap bg-surface-2 px-3.5 py-2 text-left text-[11px] tracking-wide uppercase"
        style={cellStyle}
        colSpan={2}
      >
        {label}
      </td>
      {COLUMNS.map((c) => (
        <td
          key={c.key}
          className="sticky z-20 whitespace-nowrap bg-surface-2 px-3.5 py-2 text-right font-mono"
          style={{ ...cellStyle, color: c.phase ? PHASE_COLOR[c.phase] : undefined }}
        >
          {s === undefined ? <span className="text-text-dim">—</span> : c.key === "pf" ? <PfCell value={s.pf} /> : s[c.key].toFixed(c.digits)}
        </td>
      ))}
    </tr>
  );
}

function DataRow({ r }: { r: Reading }) {
  return (
    <tr className="hover:bg-white/2">
      <td className="whitespace-nowrap px-3.5 py-2 text-left text-text-secondary" style={DIVIDER_RULE}>
        {r.ts.toLocaleDateString()}
      </td>
      <td className="whitespace-nowrap px-3.5 py-2 text-left text-text-secondary" style={DIVIDER_RULE}>
        {r.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </td>
      {COLUMNS.map((c) => (
        <td
          key={c.key}
          className="whitespace-nowrap px-3.5 py-2 text-right font-mono"
          style={{ color: c.phase ? PHASE_COLOR[c.phase] : undefined, ...DIVIDER_RULE }}
        >
          {c.key === "pf" ? <PfCell value={r.pf} /> : r[c.key].toFixed(c.digits)}
        </td>
      ))}
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: COL_COUNT }).map((_, i) => (
        <td key={i} className="px-3.5 py-2" style={DIVIDER_RULE}>
          <div className="h-3 animate-pulse rounded bg-surface-2" />
        </td>
      ))}
    </tr>
  );
}

function PfCell({ value }: { value: number }) {
  const low = value < PF_THRESHOLD;
  return (
    <span className="inline-flex w-full items-center justify-end gap-1.5">
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: low ? "var(--warning)" : "var(--good)" }}
        aria-hidden="true"
      />
      {value.toFixed(3)}
    </span>
  );
}
